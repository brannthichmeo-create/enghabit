# Kiến trúc hệ thống Enghabit

Tài liệu này giải thích **vì sao** hệ thống được tổ chức như hiện tại. Quy tắc bắt buộc khi viết code nằm ở [CLAUDE.md](../CLAUDE.md).

## 1. Ba quyết định thiết kế cốt lõi

### 1.1. ActivityLog là nguồn sự thật duy nhất

Mọi hoạt động học (học thẻ mới, ôn thẻ, kết thúc một phiên Học, check-in thói quen) đều ghi vào một bảng duy nhất `activity_logs`. Streak, XP và cấp độ, thống kê ngày/tuần/tháng, báo cáo, bảng xếp hạng, tiến độ mục tiêu, nhiệm vụ ngày và quyết định "hôm nay có cần nhắc không" — tất cả đều suy ra từ bảng này.

Ngược lại, những thao tác **không phải** học thì cố ý không ghi vào đây: luyện Cram, điểm danh nhận xu, mua vật phẩm, việc cần làm, đăng bài. Ghi vào là bấm một nút đủ giữ chuỗi ngày và mọi số liệu học tập sẽ sai.

**Lý do:** nếu mỗi module tự đếm số liệu riêng, khi số liệu hiển thị sai sẽ không biết nguồn nào đúng. Có một nguồn duy nhất thì việc debug rút gọn thành: soi `activity_logs`, thấy dữ liệu đúng thì lỗi nằm ở tầng đọc; thấy sai thì lỗi nằm ở tầng ghi.

`user_streaks` chỉ là **cache** để đọc nhanh, luôn tái tạo được từ `activity_logs` cộng các ngày đã bù trong `streak_freezes` bằng `db:recompute-streak`.

Cùng tinh thần, hệ thống **không lưu** các con số dẫn xuất khác: XP (tính từ số lượt theo loại), số dư xu (= `SUM(coin_transactions.amount)`), tiến độ mục tiêu và nhiệm vụ ngày (chấm lại mỗi lần đọc), trạng thái từng ngày của thói quen tự động (đếm `activity_logs` đúng loại, không chép sang `habit_check_ins`), số tim của bài đăng (đếm dòng). Mỗi bản sao dữ liệu là một chỗ có thể lệch.

### 1.2. Ngày học tính theo `local_date`, không theo UTC

`activity_logs` lưu cả `occurred_at` (UTC) lẫn `local_date` (DATE, theo timezone của user tại thời điểm ghi). Mọi phép group theo ngày dùng `local_date`.

**Lý do:** một user ở Việt Nam học lúc 23:30 ngày 10/03 thì theo UTC là 16:30 ngày 10/03 — trùng ngày. Nhưng học lúc 07:00 ngày 11/03 thì theo UTC là 00:00 ngày 11/03. Nếu group theo UTC, các mốc gần nửa đêm sẽ rơi sai ngày và streak đứt oan. Tính sẵn `local_date` một lần lúc ghi giúp query đơn giản, chạy nhanh, và ổn định kể cả khi user đổi múi giờ.

Xem `shared/src/date/local-date.ts` và `be/src/common/utils/db-date.ts`.

### 1.3. Domain logic đặt ở `shared/`, không ở `be/`

Thuật toán SM-2 (`shared/src/srs`), tính streak (`shared/src/streak`), XP và cấp độ (`shared/src/level`), nhiệm vụ ngày (`shared/src/rewards`), nhóm thẻ Yếu (`shared/src/study`) và điểm hiệu quả của báo cáo (`shared/src/report`) là logic thuần, không phụ thuộc DB hay platform.

**Lý do:** FE cần hiển thị "chuỗi hiện tại" và "lần ôn tới", BE cần tính chính thức. Nếu viết hai lần, hai bên sẽ lệch nhau sớm muộn. Đặt ở `shared/` thì chỉ có một định nghĩa, lại test được độc lập, không cần DB.

## 2. Luồng dữ liệu của một hành động học

Ví dụ user trả lời một thẻ ở màn Ôn tập:

```text
FE: submitAnswerSchema.parse(input)        ← validate bằng schema dùng chung
 │
 ▼  POST /api/v1/study/answers  {token, rating}
BE: requireAuth → requireFeature(VOCABULARY) → requireRole(USER) → validateBody → study.controller
 │
 ▼
study.service.submitAnswer()
 ├─ decodeQuestionToken(token)             ← giải mã AES-GCM: thẻ nào, nguồn nào, đáp án
 ├─ kiểm quyền lại qua readableSetWhere    ← bộ có thể vừa bị chặn / chuyển riêng tư
 ├─ reviewCard(state, quality, today)      ← thuật toán SM-2 từ shared/
 │
 └─ prisma.$transaction:
      ├─ insert card_reviews               ← lịch sử; unique attempt_key chặn gửi trùng
      ├─ upsert user_vocab_progress        ← lịch ôn mới + bộ đếm đúng/sai
      └─ recordActivity({..., tx})         ← activity-log.service
            ├─ insert activity_logs        ← NGUỒN SỰ THẬT
            └─ applyActivity() + upsert user_streaks   ← cache streak
```

Điểm quan trọng: lịch sử, tiến độ và ghi log nằm **trong cùng một transaction**. Nếu không, có thể xảy ra cảnh tiến độ đã đổi nhưng streak chưa cập nhật — dữ liệu lệch mà không có cách phát hiện.

Hệ quả phụ cần biết: khi người gọi truyền `tx`, `recordActivity` **không** kiểm mục tiêu vừa đạt (đọc tiến độ trước khi commit sẽ ra số cũ). Hiện chỉ đường "kết thúc phiên Học" không truyền `tx`, nên thông báo đạt mục tiêu (và việc tự kết thúc mục tiêu chuỗi / cộng dồn khi đạt) chỉ chạy ở đó — xem `docs/logic-nghiep-vu/activity-logs.md`.

## 3. Tại sao mọi module phải gọi `recordActivity()`

`be/src/modules/activity-logs/activity-log.service.ts` là nơi **duy nhất** được phép insert vào `activity_logs` và cập nhật `user_streaks` (ngoại lệ duy nhất: job vật phẩm giữ chuỗi nối mạch chuỗi qua `applyFrozenDay`).

Nếu mỗi module tự insert, sẽ xuất hiện các biến thể: chỗ quên tính `local_date`, chỗ quên cập nhật streak, chỗ dùng timezone máy chủ thay vì timezone user. Gom về một hàm khiến những lỗi đó không thể xảy ra.

Hiện chỉ hai module gọi hàm này: `study` (mỗi câu trả lời và mỗi lần kết thúc phiên Học) và `habits` (check-in, kể cả check-in bù — truyền `localDate` của ngày được bù). `habits` ghi **tối đa một dòng `HABIT_CHECKIN` mỗi ngày** (`dedupeKey = HABIT_CHECKIN:<ngày>`) dù tích bao nhiêu thói quen: tích tay là việc app không kiểm được, mỗi lượt một dòng thì mười thói quen "abc" là 120 XP/ngày.

## 4. Phân lớp backend

```text
routes.ts       định tuyến + gắn middleware (validate, auth-guard, feature-guard)
controller.ts   đọc request, gọi service, trả response — KHÔNG chứa nghiệp vụ
service.ts      toàn bộ nghiệp vụ + truy cập DB qua Prisma
```

Lỗi được ném từ service dưới dạng `AppError`, và **chỉ có** `error-handler.ts` chuyển lỗi thành HTTP response. Nhờ vậy format lỗi đồng nhất trên toàn API và service không cần biết gì về HTTP.

## 5. Xác thực

- Access token: JWT ngắn hạn (15 phút), gửi qua header `Authorization`.
- Refresh token: chuỗi ngẫu nhiên dài hạn (30 ngày), **lưu hash** trong DB.
  - Web nhận qua cookie `httpOnly` → JavaScript không đọc được, giảm rủi ro XSS.
  - Mobile nhận trong body (không có cookie) → lưu ở SecureStore.
- Mỗi lần refresh sẽ thu hồi token cũ và cấp token mới (rotation).
- Đổi mật khẩu thu hồi toàn bộ refresh token đang hoạt động.

Lưu hash thay vì token thô để nếu DB bị lộ thì kẻ tấn công vẫn không đăng nhập được.

## 6. Thông báo nhắc nhở

`be/src/jobs/reminder.job.ts` chạy cron mỗi 15 phút với ba lượt quét: (1) từng **mốc nhắc** người học tự đặt (bảng `reminders`, tối đa 10 mốc mỗi người, chọn được thứ trong tuần), (2) **cảnh báo chuỗi sắp đứt** lúc 21:30, (3) **giờ nhắc riêng của từng thói quen** (`habits.reminder_time`). Giờ tính **theo timezone của chính họ**. Hai lượt đầu bỏ qua người đã có hoạt động học hôm nay; lượt 3 chỉ im khi **chính thói quen đó** đã xong trong kỳ (hỏi `habitService.isHabitDoneThisPeriod`, không tự đếm `habit_check_ins` — thói quen tự động không có dòng nào ở đó).

Thông báo luôn **lưu vào bảng `notifications` trước** qua `createNotification()`, rồi mới đẩy push qua OneSignal — push có thể bị chặn hoặc bỏ lỡ, mở app lên vẫn phải thấy. OneSignal cũng có tính năng tự lên lịch, nhưng hệ thống **cố ý không dùng** — hai nguồn cùng lên lịch sẽ khiến user nhận trùng thông báo và rất khó truy nguyên.

Chống gửi lặp khi cron chạy lại nhờ ràng buộc unique `(user_id, dedupe_key)` của `notifications`, với khoá `DAILY_REMINDER:<reminderId>:<ngày local>`, `STREAK_AT_RISK:<ngày local>` và `DAILY_REMINDER:HABIT-<habitId>:<ngày local>` (tiền tố `HABIT-` để thói quen số 3 và mốc nhắc số 3 không dẫm lên nhau). Cột `notification_settings.last_sent_date` vẫn được ghi nhưng không còn dùng để chặn trùng.

Job thứ hai, `be/src/jobs/streak-freeze.job.ts` (30 phút/lượt), tự tiêu vật phẩm giữ chuỗi cho người bỏ lỡ đúng một ngày — là job chứ không phải nút bấm, vì hôm người dùng quên học cũng là hôm họ không mở app.

## 6b. Quan hệ giữa các module

Phần lớn liên kết giữa các module không đi qua lời gọi hàm mà qua **sáu chỗ dùng chung**: `activity_logs` (hoạt động học), `coin_transactions` (sổ cái xu, chung giữa `rewards` và `shop`), `notifications` (chỉ `createNotification` được ghi), `readableSetWhere` (quyền đọc bộ thẻ, dùng ở `library`, `study`, cron nhắc nhở và mở rộng bởi `groups`), cờ tính năng, và `admin_audit_logs` (nhật ký thao tác quản trị — chỉ `recordAdminAction` được ghi, gọi trong cùng transaction với thao tác chính, bảng chỉ thêm không sửa không xoá). Bản đồ phụ thuộc, ma trận tác động và logic từng module: `docs/logic-nghiep-vu/`.

## 7. Frontend

Mỗi feature ở `fe/src/features/<tên>/` gồm `api.ts` (gọi HTTP) → `hooks.ts` (TanStack Query) → `components/`. Component không gọi axios trực tiếp.

Các màn cần đồng bộ với nhau thì đọc **chung một khoá cache** thay vì giữ state riêng rồi đồng bộ (vd trang Việc cần làm, bảng thả xuống và huy hiệu sidebar cùng đọc `todoKeys.day(today)`). Thao tác làm đổi dữ liệu của feature khác thì làm mới cache của feature đó (vd trả lời thẻ làm mới `study`, `library`, `statistics`; đổi khung viền làm mới `community`, `leaderboard`, `groups`).

Route bọc guard theo vai trò (`Learner`, `Admin`) và theo cờ tính năng (`Gated`): tính năng tắt thì mục biến khỏi sidebar và gõ thẳng URL ra 404.

`apiClient` xử lý gắn token và tự refresh khi gặp 401, gom các request 401 đồng thời vào một lần refresh duy nhất — mỗi feature không phải lặp lại logic này.

Mỗi feature lớn được bọc `FeatureErrorBoundary` riêng để lỗi ở một phần không làm sập toàn bộ ứng dụng.
