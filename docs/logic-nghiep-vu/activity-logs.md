# Module `activity-logs` — Nhật ký hoạt động học và chuỗi ngày

> **Mã nguồn:** `be/src/modules/activity-logs/activity-log.service.ts`,
> `shared/src/streak/streak.ts`, `be/prisma/scripts/recompute-streak.ts`
> **Màn hình:** không có màn riêng — kết quả hiện ở Tổng quan, thanh trên cùng, Báo cáo, Bảng xếp hạng
> **Cờ tính năng:** không có · **Endpoint:** không có (chỉ được module khác gọi)

## 1. Vai trò

Đây là **trục trung tâm** của cả hệ thống. Mọi hành động học được ghi thành một dòng trong
`activity_logs`, và mọi con số về việc học (chuỗi ngày, XP, cấp độ, thống kê, bảng xếp hạng,
tiến độ mục tiêu, nhiệm vụ ngày, nhắc nhở) đều **suy ra** từ bảng này.

Module không có router. Nó chỉ export hàm cho module khác gọi — và `recordActivity()` là
**lối duy nhất** được ghi vào `activity_logs` và `user_streaks`.

## 2. Dữ liệu

| Bảng | Quyền của module | Ghi chú |
| --- | --- | --- |
| `activity_logs` | Ghi (duy nhất) | Nguồn sự thật. Mỗi dòng: `type`, `ref_id`, `value`, `occurred_at` (UTC), `local_date` (DATE theo múi giờ người học), `dedupe_key` |
| `user_streaks` | Ghi (duy nhất, cùng job vật phẩm giữ chuỗi) | Cache dẫn xuất: `current_streak`, `longest_streak`, `last_active_date` |
| `streak_freezes` | Đọc | Ngày đã được vật phẩm bù — cần để dựng lại chuỗi |
| `goals` | Đọc (qua `goal.service.getProgress`), ghi (qua `finishGoal`) | Để chúc mừng mục tiêu vừa đạt và tự kết thúc mục tiêu có điểm đích |

Bốn loại hoạt động (`ActivityType`) và nơi sinh ra:

| Loại | Sinh bởi | Khi nào | XP |
| --- | --- | --- | --- |
| `VOCAB_LEARNED` | `study` | Trả lời một thẻ **chưa từng học** (Học hoặc Ôn tập) | 8 |
| `FLASHCARD_REVIEWED` | `study` | Trả lời một thẻ **đã có lịch ôn** | 4 |
| `QUIZ_COMPLETED` | `study` | Kết thúc một phiên Học (`dedupe_key = SESSION:<sessionKey>`) | 20 |
| `HABIT_CHECKIN` | `habits` | Check-in thói quen tự tích — **tối đa một dòng mỗi ngày** (`dedupe_key = HABIT_CHECKIN:<ngày>`), có thể mang ngày quá khứ | 12 |

Tên enum giữ theo thời module `lessons`/`quizzes` cũ vì `activity_logs` còn dữ liệu cũ mang
các giá trị này. `QUIZ_COMPLETED` giờ nghĩa là "hoàn thành một phiên Học".

## 3. Chức năng và cách hoạt động

### 3.1 `recordActivity(input)` — ghi một hoạt động

1. Lấy `occurredAt = now()` (UTC) và `today = toLocalDate(now, timezone)`.
2. `localDate = input.localDate ?? today`. Truyền `localDate` chỉ khi ghi bù (check-in thói
   quen cho ngày đã qua).
3. Trong **một transaction** (tự mở, hoặc dùng `tx` người gọi truyền vào):
   - Ghi một dòng `activity_logs`.
   - Nếu `localDate === today` → `updateStreak`: đọc `user_streaks`, gọi
     `applyActivity(previous, localDate)` của `shared/streak`, upsert lại nếu có thay đổi.
   - Nếu `localDate < today` (ghi bù) → `recomputeStreak`: đọc **toàn bộ** ngày có hoạt động
     cộng các ngày đã bù trong `streak_freezes`, chạy `computeStreak` rồi ghi đè cache. Ghi bù
     có thể vá một quãng đứt ở giữa nên không cộng dồn được.
4. **Sau khi commit**, nếu transaction do chính hàm này mở (người gọi **không** truyền `tx`):
   gọi `notifyAchievedGoals` — đọc tiến độ mục tiêu và tạo thông báo `GOAL_ACHIEVED` cho mục
   tiêu vừa đạt. Lỗi ở bước này bị nuốt và chỉ ghi log.

Khoá chống trùng của thông báo đạt mục tiêu: `GOAL_ACHIEVED:<goalId>:<ngày>` với mục tiêu
ngày, `GOAL_ACHIEVED:<goalId>:<thứ Hai đầu tuần>` với mục tiêu tuần — mỗi kỳ chúc mừng một lần.
Mục tiêu **có điểm đích** (`STREAK_TARGET`, hoặc chu kỳ `TOTAL`) dùng `GOAL_ACHIEVED:<goalId>:FINAL`
và được tự kết thúc bằng `goal.service.finishGoal(COMPLETED)` ngay sau thông báo — để `ACTIVE`
thì mỗi ngày học tiếp lại là một lần chúc mừng mới.

### 3.2 Quy tắc chuỗi ngày (`shared/src/streak/streak.ts`)

| Hàm | Quy tắc |
| --- | --- |
| `applyActivity` | Cùng ngày → không đổi. Ngày kế tiếp → +1. Cách > 1 ngày → về 1. Ngày quá khứ → không đổi |
| `applyFrozenDay` | Chỉ nhận ngày liền sau `last_active_date`. Nối mạch, **không** cộng ngày |
| `computeStreak` | Dựng lại từ đầu: ngày học gọi `applyActivity`, ngày bù gọi `applyFrozenDay`. Ngày vừa học vừa bù tính là ngày học |
| `displayStreak` | Chuỗi hiển thị: không học hôm nay lẫn hôm qua thì hiện **0**, dù cache vẫn giữ số cũ |
| `freezableDate` | Ngày vật phẩm cứu được: chỉ khi `today - last_active_date = 2` (bỏ lỡ đúng một ngày) |

### 3.3 `recomputeStreak(tx, userId)` và script `recompute-streak`

Dùng chung cho hai chỗ: đường ghi bù ở trên và script chạy tay
`pnpm --filter @enghabit/be db:recompute-streak [-- <userId>]`. Chỉ có một bản cài đặt nên
hai đường không thể cho ra hai con số khác nhau.

Khi streak hiển thị sai: soi `activity_logs` trước (dòng có được ghi không, `local_date` có
đúng múi giờ không), đúng thì chạy script. **Không sửa tay** `user_streaks`.

### 3.4 `listActiveDates(userId, from?, to?)`

Danh sách ngày có hoạt động trong khoảng. Dùng cho thống kê và dựng lại chuỗi.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `study` | gọi vào | `recordActivity({..., tx})` | Mỗi câu trả lời Học/Ôn tập; kết thúc phiên Học (không truyền `tx`) |
| `habits` | gọi vào | `recordActivity({..., localDate, dedupeKey, tx})` | Check-in đầu tiên của mỗi ngày, kể cả check-in bù |
| `habits` | đọc bảng | `activity_logs` theo loại + `local_date` | Chấm thói quen tự động |
| `goals` | được gọi | `getProgress()`, `finishGoal()` | Đọc tiến độ để chúc mừng mục tiêu; tự kết thúc mục tiêu có điểm đích |
| `notifications` | được gọi | `createNotification()` | Sinh `GOAL_ACHIEVED` |
| `statistics` | đọc bảng | `activity_logs`, `user_streaks` | Tổng quan, streak, cấp độ, lịch, báo cáo |
| `leaderboard` | đọc bảng | `activity_logs` | Điểm xếp hạng |
| `rewards` | đọc/ghi bảng | `activity_logs` (đọc), `user_streaks` (ghi khi tiêu vật phẩm) | Nhiệm vụ ngày, cứu chuỗi |
| `feature-flags` | đọc bảng | `activity_logs` | Đếm người dùng gần đây của từng tính năng |
| `admin` | đọc bảng | `activity_logs`, `user_streaks` | Tổng quan hệ thống, chi tiết tài khoản |
| `groups` | đọc bảng | `_count.activityLogs`, `user_streaks` | Số hoạt động và chuỗi ở danh sách thành viên |
| Cron nhắc nhở | đọc bảng | `activity_logs` theo `local_date` | Hôm nay đã học thì không nhắc (lời nhắc thói quen xét riêng từng thói quen) |

## 5. Ảnh hưởng dây chuyền

Một dòng `activity_logs` mới làm thay đổi đồng thời:

- Chuỗi ngày (cache `user_streaks`) — ngay trong transaction.
- XP, cấp độ — ở mọi nơi hiện cấp độ (trang cá nhân, thanh trên cùng, bài đăng Cộng đồng, bảng xếp hạng).
- Thứ hạng trong tuần/tháng/toàn thời gian.
- Tiến độ mục tiêu và nhiệm vụ ngày (tính lại lúc đọc).
- Biểu đồ Tổng quan, lịch hoạt động, Báo cáo.
- Cron nhắc nhở: người đó im lặng tới hết ngày local.
- Job vật phẩm giữ chuỗi: không cần cứu ngày hôm qua nữa.

Hệ quả thiết kế: **module nào không phải hoạt động học thì tuyệt đối không ghi bảng này**.
`rewards`, `shop`, `todos`, `community`, `groups` đều cố ý không ghi — ghi vào là bấm một nút
đủ giữ chuỗi và mọi số liệu học tập sẽ sai.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Chỉ `recordActivity` ghi `activity_logs` và cập nhật `user_streaks` (ngoại lệ duy nhất:
   `rewards.consumeFreezeIfNeeded` ghi `user_streaks` qua `applyFrozenDay`).
2. Ghi hoạt động cùng transaction với thao tác nghiệp vụ đi kèm (tiến độ SRS, bản ghi
   check-in) — lệch là dữ liệu sai mà không cách nào phát hiện.
3. Mọi phép gom theo ngày dùng `local_date`, không đổi múi giờ trong SQL.
4. `recomputeStreak` phải đọc cả `streak_freezes`.
5. Thêm loại hoạt động mới phải thêm ở cả `schema.prisma`, `shared/constants/enums.ts` và
   `XP_PER_ACTIVITY` của `shared/level`.

## 7. Điểm cần lưu ý (phát hiện khi rà soát 21/09/2026)

- **Thông báo "Đã đạt mục tiêu" gần như chỉ bắn khi kết thúc phiên Học.** `notifyAchievedGoals`
  chỉ chạy khi người gọi không truyền `tx`. Hiện `study.submitAnswer` và `habits.checkIn` đều
  truyền `tx`; chỉ `study.finishSession` không truyền. Người chỉ dùng Ôn tập hoặc Thói quen sẽ
  không bao giờ nhận `GOAL_ACHIEVED`, dù trang Mục tiêu vẫn hiện đúng tiến độ. Chú thích trong
  code ("để lần ghi hoạt động kế tiếp phát hiện") không đúng với hiện trạng. Từ khi có mục tiêu
  có điểm đích, hệ quả nặng thêm: mục tiêu chuỗi và mục tiêu cộng dồn của những người này cũng
  không tự chuyển sang `COMPLETED` — họ phải tự bấm Kết thúc.
- Cache `current_streak` chỉ đổi khi có hoạt động mới hoặc vật phẩm được dùng. Chỗ nào đọc
  thẳng cột này mà không qua `displayStreak` sẽ hiện chuỗi đã đứt như còn sống — xem mục lưu ý
  của `leaderboard`, `groups`, `notifications`.
