# Module `notifications` (+ cron nhắc nhở) — Thông báo và nhắc nhở học tập

> **Mã nguồn:** `be/src/modules/notifications/notification.service.ts`,
> `be/src/jobs/reminder.job.ts`, `be/src/jobs/onesignal.client.ts`,
> `shared/src/schemas/notification.schema.ts`
> **Màn hình:** chuông thông báo trên thanh trên cùng, `/notifications`; cấu hình nhắc ở `/profile`;
> quản trị: `/admin/announcements`
> **Cờ tính năng:** không có (cố ý)
> **Quyền:** danh sách thông báo và thiết bị push mở cho **cả hai vai trò**; cấu hình nhắc nhở và
> mốc nhắc chỉ `USER`

## 1. Vai trò

Nơi **duy nhất** sinh và lưu thông báo trong hệ thống (`createNotification`), cộng cấu hình
nhắc nhở của người học. Module quyết định **nội dung và lưu trữ**; **lịch gửi** do cron trong
`be/src/jobs` quyết định. OneSignal chỉ là kênh đẩy push.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `notifications` | Ghi (duy nhất) | `type`, `title`, `body`, `link`, `read_at`, `dedupe_key`; `@@unique([userId, dedupeKey])` |
| `notification_settings` | Ghi | Công tắc tổng `is_enabled`, `remind_streak_at_risk`, `remind_review_due` |
| `reminders` | Ghi | Nhiều mốc mỗi người (tối đa 10): `time_of_day` "HH:mm", `days_of_week` (ISO 1–7), `is_enabled`; `@@unique([userId, timeOfDay])` |
| `user_devices` | Ghi | `player_id` do OneSignal SDK cấp phía client |

## 3. Chức năng và cách hoạt động

### 3.1 Sinh thông báo — `createNotification(input)`

1. Có dòng cùng `(user_id, dedupe_key)` → trả `null`, không tạo.
2. Chưa có → tạo và trả bản ghi.

Mọi thông báo tự động phải có `dedupe_key` để cron chạy lại (15 phút/lượt) không tạo trùng.

### 3.2 Hộp thông báo — cả hai vai trò

`GET /notifications` (lọc chưa đọc, phân trang), `GET /notifications/unread-count`,
`PATCH /notifications/:id/read` (giữ mốc đọc lần đầu), `POST /notifications/read-all`,
`DELETE /notifications/:id`. Mọi truy vấn lọc theo chủ.

### 3.3 Cấu hình nhắc nhở — chỉ người học

- `GET`/`PUT /notifications/settings`: công tắc tổng và hai loại cảnh báo.
- `GET`/`POST /notifications/reminders`, `PATCH`/`DELETE /notifications/reminders/:id`: tối đa
  **10** mốc; hai mốc cùng giờ → 409.
- Mỗi người mới đăng ký có sẵn một mốc 20:00 cả tuần (do `auth` tạo).

### 3.4 Thiết bị push — `POST /notifications/devices`, `DELETE /notifications/devices/:playerId`

Upsert theo `player_id`: một thiết bị đăng nhập tài khoản khác thì chuyển chủ.

### 3.5 Cron nhắc nhở — `reminder.job.ts` (15 phút/lượt)

**Lượt 1 — mốc nhắc người dùng đặt:**

1. Lấy các `reminders` đang bật của người dùng **vai trò USER** có công tắc tổng bật.
2. Tính giờ địa phương bằng `Intl.DateTimeFormat` theo `users.timezone`; bỏ qua nếu hôm nay
   không thuộc `days_of_week` hoặc chưa rơi vào cửa sổ 15 phút sau `time_of_day`.
3. **Hôm nay đã có `activity_logs` → bỏ qua** (không nhắc người đang học).
4. Soạn nội dung theo việc đang tồn:
   - có thẻ cần ôn (khi `remind_review_due` bật **và** cờ `FLASHCARDS` bật) → "Bạn có N thẻ cần ôn hôm nay", link `/review`;
   - không, nhưng có chuỗi → "Bạn đang có chuỗi N ngày…";
   - không có gì → mời bắt đầu chuỗi mới. Ôn tập bị tắt thì link về `/`.
5. `dedupe_key = DAILY_REMINDER:<reminderId>:<ngày local>` — có `reminderId` để mốc 8:00 và
   20:00 là hai lời nhắc khác nhau.

**Lượt 2 — cảnh báo chuỗi sắp đứt lúc 21:30 giờ địa phương:**

1. Người dùng USER bật công tắc tổng và `remind_streak_at_risk`.
2. Trong cửa sổ 21:30–21:45, chuỗi > 0, hôm nay chưa học.
3. `dedupe_key = STREAK_AT_RISK:<ngày local>`, link `/learn`.

**Lượt 3 — giờ nhắc riêng của từng thói quen (`sendDueHabitReminders`):**

1. Cờ `HABITS` tắt → bỏ cả lượt.
2. Thói quen đang theo dõi (`is_active`), có `reminder_time`, của người dùng USER bật công tắc tổng.
3. Tới giờ theo múi giờ người học và hôm nay là ngày đến hạn (`isScheduledDay`).
4. **Chỉ im khi chính thói quen đó đã xong trong kỳ** (`habits.isHabitDoneThisPeriod`; thói quen
   hằng tuần là đủ số lần của tuần). Khác hai lượt trên: người đã học trong app vẫn được nhắc
   việc riêng họ tự đặt giờ.
5. Loại `DAILY_REMINDER`, tiêu đề "Đến giờ: <tên thói quen>", link `/habits`,
   `dedupe_key = DAILY_REMINDER:HABIT-<habitId>:<ngày local>` — tiền tố `HABIT-` để thói quen số
   3 và mốc nhắc số 3 không dẫm lên nhau.

**Gửi (`deliver`):** lưu thông báo **trước**; đã tồn tại thì dừng (không push lại). Lưu mới thì
đẩy push qua OneSignal tới các thiết bị (nếu có). OneSignal chưa cấu hình khoá thì chỉ ghi log;
một người gửi lỗi không làm dừng cả lượt quét.

### 3.6 Thông báo do quản trị viên gửi — `/admin/announcements`

`countAudience` hiện số người nhận trước khi gửi; `createAnnouncement` ghi hàng loạt
`ANNOUNCEMENT` tới tất cả hoặc theo vai trò, khoá `ANNOUNCEMENT:<timestamp>` (gửi hai lần là hai
thông báo — chủ ý của người gửi). Không đẩy push. Mỗi lần gửi ghi một dòng nhật ký thao tác
(`ANNOUNCEMENT_SENT`, kèm tiêu đề và số người nhận) — xem tab Nhật ký ở `admin.md`.

### 3.7 Các loại thông báo và nơi sinh ra

| Loại | Sinh bởi | Khoá chống trùng |
| --- | --- | --- |
| `DAILY_REMINDER` | Cron nhắc nhở | `DAILY_REMINDER:<reminderId>:<ngày>`; nhắc thói quen: `DAILY_REMINDER:HABIT-<habitId>:<ngày>` |
| `STREAK_AT_RISK` | Cron nhắc nhở | `STREAK_AT_RISK:<ngày>` |
| `GOAL_ACHIEVED` | `activity-logs` | `GOAL_ACHIEVED:<goalId>:<ngày hoặc đầu tuần>`; mục tiêu chuỗi và cộng dồn: `GOAL_ACHIEVED:<goalId>:FINAL` |
| `ANNOUNCEMENT` | Quản trị viên | `ANNOUNCEMENT:<timestamp>` |
| `PASSWORD_RESET_REQUEST` | `auth` → mọi admin | `PASSWORD_RESET_REQUEST:<requestId>` |
| `STUDY_SET_REPORTED` | `library` → mọi admin | `STUDY_SET_REPORTED:<reportId>` |
| `STUDY_SET_BLOCKED`, `STUDY_SET_UNBLOCKED` | `admin` (kiểm duyệt) → chủ bộ | kèm timestamp |
| `STUDY_SET_REPORT_RESOLVED` | `admin` (kiểm duyệt) → người báo cáo | `…:<reportId>` |
| `GROUP_JOIN_REQUEST` | `groups` → mọi trưởng nhóm | kèm timestamp |
| `GROUP_JOIN_APPROVED`, `GROUP_JOIN_REJECTED` | `groups` → người xin / người được thêm | kèm timestamp |
| `GROUP_STUDY_SET_SHARED` | `groups` → mọi thành viên | `…:<groupId>:<setId>` |
| `GROUP_WARNING`, `GROUP_BLOCKED`, `GROUP_UNBLOCKED` | `admin` (nhóm) → mọi thành viên | kèm timestamp |
| `MENTIONED` | `community` | `MENTIONED:POST:<postId>:<userId>` hoặc `MENTIONED:COMMENT:<commentId>:<userId>` |
| `REVIEW_DUE`, `MISTAKES_PENDING` | **Không ai sinh** | Giữ trong enum để đọc được thông báo cũ |

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `activity-logs`, `auth`, `library`, `groups`, `community`, `admin` | gọi vào | `createNotification` | Xem bảng 3.7 |
| `study` | được gọi (bởi cron) | `countDueCards` | Số thẻ cần ôn trong lời nhắc |
| `feature-flags` | được gọi (bởi cron) | `isEnabled(FLASHCARDS)`, `isEnabled(HABITS)` | Không nhắc ôn khi Ôn tập tắt; không nhắc thói quen khi Thói quen tắt |
| `habits` | được gọi (bởi cron) | `toSchedule`, `isHabitDoneThisPeriod` | Lượt 3: thói quen đến hạn và chưa xong trong kỳ |
| `admin` | gọi đi | `recordAdminAction` | Ghi nhật ký khi quản trị viên gửi thông báo |
| `activity-logs` | đọc | `activity_logs` theo `local_date` | Đã học hôm nay thì im lặng |
| `auth` | dùng dữ liệu | `users.timezone`, `users.role`, mốc nhắc mặc định | |
| OneSignal | gọi ra ngoài | `sendPush` | Kênh push, không tự lên lịch |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Tắt công tắc tổng | Mọi mốc nhắc và cảnh báo chuỗi im lặng; thông báo do module khác sinh (nhóm, mục tiêu…) **vẫn tới** |
| Người học có hoạt động đầu tiên trong ngày | Lượt 1 và 2 bỏ qua họ tới hết ngày local; lượt 3 vẫn nhắc thói quen chưa xong |
| Thói quen xong trong kỳ / tạm dừng | Lượt 3 im với thói quen đó |
| Đổi múi giờ | Giờ nhắc dịch theo giờ địa phương mới |
| Nâng tài khoản lên quản trị | Cron bỏ qua (lọc `role = USER` ở job, không ở chỗ tạo cấu hình) |
| Tắt `FLASHCARDS` | Lời nhắc không nhắc ôn thẻ và trỏ về `/` |

## 6. Quy tắc bắt buộc giữ khi sửa

1. Chỉ `createNotification` sinh thông báo; job và module khác không tự ghi bảng.
2. Thông báo lưu DB trước, push sau.
3. Lịch gửi chỉ do `be/src/jobs`; không dùng lịch của OneSignal.
4. Mọi thông báo tự động có `dedupe_key`; lời nhắc học phải có `reminderId`.
5. Không nhắc người đã học hôm nay (lời nhắc thói quen xét theo chính thói quen đó).
6. Query boolean dùng `z.preprocess`, không `z.coerce.boolean()`.

## 7. Điểm cần lưu ý (phát hiện khi rà soát)

- **Cảnh báo chuỗi sắp đứt đọc cache `current_streak`**, không qua `displayStreak`. Người đã đứt
  chuỗi từ hai ngày trước (không có vật phẩm) vẫn nhận "Chuỗi N ngày sắp đứt" dù chuỗi hiển thị
  là 0. Lời nhắc hằng ngày ("Bạn đang có chuỗi N ngày") cùng vấn đề.
- Link của cảnh báo chuỗi luôn là `/learn`, kể cả khi cờ `LEARN` đang tắt (lời nhắc hằng ngày đã
  xử lý trường hợp này, cảnh báo chuỗi thì chưa).
- `notification_settings.last_sent_date` vẫn được ghi sau mỗi lần gửi nhưng **không ai đọc** —
  việc chống trùng đã chuyển sang `dedupe_key`.
- `createNotification` kiểm tồn tại rồi mới ghi (đọc-rồi-ghi); hai lượt gọi đồng thời cùng khoá
  sẽ vấp unique và ném lỗi thay vì trả `null`.
- Cron xử lý tuần tự từng mốc nhắc; số người dùng tăng mạnh thì một lượt có thể dài quá 15 phút.
