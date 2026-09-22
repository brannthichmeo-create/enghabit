# Module `goals` — Mục tiêu học tập

> **Mã nguồn:** `be/src/modules/goals/goal.service.ts`, `shared/src/goal/goal-deadline.ts`,
> `shared/src/goal/goal-forecast.ts`, `shared/src/report/report.ts` (`GOAL_ACTIVITY_TYPE`,
> `expectedForRange`), `shared/src/schemas/goal.schema.ts`
> **Màn hình:** `/goals`; tiến độ còn hiện ở Tổng quan và `/report`
> **Cờ tính năng:** `GOALS` · **Quyền:** chỉ `USER`

## 1. Vai trò

Người học đặt chỉ tiêu và theo dõi mình đã đạt bao nhiêu, kịp hạn hay không. Module **không
lưu tiến độ** — tiến độ luôn tính lại từ `ActivityLog` (hoặc từ chuỗi ngày) mỗi lần đọc.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `goals` | Ghi | `type`, `target_value`, `period` (DAILY / WEEKLY / TOTAL), `start_date`, `end_date` (hạn, tuỳ chọn), `status` (ACTIVE / COMPLETED / ARCHIVED), `paused_at` |
| `activity_logs` | Đọc | Đếm hoạt động trong kỳ |
| `user_streaks` | Đọc (qua `statistics.getStreak`) | Mục tiêu chuỗi ngày |
| `habits` | Đọc (FE) | `habits.goal_id` — thói quen phục vụ mục tiêu, xem `habits.md` |

## 3. Chức năng và cách hoạt động

### 3.1 Loại và chu kỳ

| `GoalType` | Đo bằng |
| --- | --- |
| `VOCAB_PER_DAY` | Đếm `VOCAB_LEARNED` |
| `MINUTES_PER_DAY` | Đếm `FLASHCARD_REVIEWED` |
| `LESSONS_PER_WEEK` | Đếm `QUIZ_COMPLETED` (một dòng mỗi phiên Học) |
| `STREAK_TARGET` | Chuỗi hiện tại (`displayStreak`), không cộng dồn |

Ba loại đếm được đi với cả ba chu kỳ: `DAILY` (mỗi ngày), `WEEKLY` (mỗi tuần), `TOTAL` (cộng
dồn từ ngày bắt đầu tới hạn, vd "1500 từ trước Tết"). `STREAK_TARGET` **không đi với `TOTAL`**
— schema chặn, vì "chuỗi 30 ngày" không có nghĩa "tổng 30 ngày chuỗi".

Tên enum giữ theo thiết kế ban đầu nên không nói đúng thứ được đo. Tên hiển thị ghép từ loại
và chu kỳ bằng `goalName(type, period)` ở `fe/src/shared/lib/labels.ts` ("Tổng số từ vựng
học", "Số lượt ôn tập mỗi tuần"…). Ánh xạ loại → loại hoạt động nằm ở `GOAL_ACTIVITY_TYPE`
trong `shared/report` — FE và BE dùng chung.

### 3.2 Tạo, sửa, xoá — `POST /goals`, `PATCH`/`DELETE /goals/:id`

- Hạn (`end_date`) không được ở quá khứ và phải từ ngày bắt đầu trở đi.
- `PATCH` chỉ sửa **chỉ tiêu và hạn** (đặt, đổi, bỏ). Không nhận `status` — kết thúc mục tiêu
  đi qua `/finish` (mục 3.3).
- Mục tiêu đã kết thúc (`COMPLETED`/`ARCHIVED`) không sửa được nữa → 400.
- Mục tiêu còn `ACTIVE` mà đã qua hạn hiện nhãn **Đã hết hạn** và nút **Gia hạn** — chính là
  `PATCH` đặt hạn mới.
- Chỉ chủ mục tiêu thao tác được; người khác nhận 404.

### 3.3 Kết thúc, tạm dừng — `POST /goals/:id/finish | pause | resume`

| Thao tác | Quy tắc |
| --- | --- |
| `finish` (`outcome`: `COMPLETED` = đã đạt, `ARCHIVED` = thôi theo dõi) | Chốt `end_date` về hôm nay nếu hạn còn ở phía trước hoặc chưa có hạn; hạn đã qua thì giữ. Mục tiêu chưa tới ngày bắt đầu không kết thúc được (xoá nó). **Không mở lại được** — muốn làm tiếp thì tạo mục tiêu mới |
| `pause` | Chỉ với mục tiêu đang trong hạn và chưa dừng. Ghi `paused_at = hôm nay` |
| `resume` | Xoá `paused_at`; hạn (nếu có) **lùi đúng số ngày đã dừng**. Dừng rồi tiếp tục trong cùng ngày là 0 ngày |

Mục tiêu tạm dừng không được đo, không được chúc mừng. Không tạm dừng được mục tiêu đã quá hạn:
dừng rồi tiếp tục sẽ thành một cách gia hạn vòng vèo.

Trang `/goals` tách hai khu: mục tiêu đang theo dõi và **Đã kết thúc** (mang nhãn Đã đạt /
Đã dừng cùng khoảng ngày từng theo dõi).

### 3.4 Tiến độ — `GET /goals/progress`

1. Lấy mục tiêu `ACTIVE`, **không tạm dừng**, **đang có hiệu lực** (`isGoalInEffect`: đã tới
   ngày bắt đầu, chưa qua hạn). Mục tiêu quá hạn bị loại ở BE, không chỉ ẩn trên giao diện.
2. Kỳ đo: hôm nay với `DAILY`, từ thứ Hai đầu tuần với `WEEKLY`, **từ ngày bắt đầu** với `TOTAL`.
3. Loại đếm được: `COUNT(activity_logs)` theo loại tương ứng trong kỳ, lọc theo `local_date`.
   `STREAK_TARGET`: gọi `statistics.getStreak`.
4. Trả `period`, `currentValue`, `completionRate` (trần 100%), `isCompleted`, và `forecast`
   (chỉ với `TOTAL`, còn lại null).

### 3.5 Dự báo — `forecastGoal` (`shared/goal/goal-forecast.ts`)

| Trường | Cách tính |
| --- | --- |
| `dailyPace` | Tổng đã làm ÷ số ngày từ ngày bắt đầu tới hôm nay (tính cả hôm nay), làm tròn 1 chữ số |
| `projectedDate` | Hôm nay + phần còn thiếu ÷ tốc độ. Null khi chưa có tiến độ nào |
| `requiredPerDay` | Phần còn thiếu ÷ số ngày còn lại tới hạn (tính cả hôm nay). Null khi không có hạn |
| `onTrack` | `projectedDate <= end_date`. Null khi không có hạn; chưa có tiến độ mà có hạn là `false` |

Tốc độ lấy trung bình từ ngày bắt đầu chứ không lấy "7 ngày gần nhất": mục tiêu mới tạo hai
hôm thì 7 ngày gần nhất phần lớn là lúc mục tiêu chưa tồn tại.

### 3.6 Thông báo đạt mục tiêu và tự hoàn thành

Không nằm trong module này: `activity-logs.recordActivity` gọi `getProgress` sau khi ghi hoạt
động và sinh `GOAL_ACHIEVED`. Khoá chống trùng theo kỳ (`<goalId>:<ngày>` hoặc
`<goalId>:<thứ Hai>`). Riêng mục tiêu **có điểm đích** — `STREAK_TARGET` và `TOTAL` — khoá là
`<goalId>:FINAL` và mục tiêu được **tự kết thúc** bằng `finishGoal(COMPLETED)` ngay sau thông
báo; để `ACTIVE` thì mỗi ngày học tiếp lại là một lần "Đã đạt mục tiêu!" mới. Xem hạn chế ở
`activity-logs.md`.

### 3.7 Mục tiêu trong Báo cáo

`statistics.getLearningReport` lấy mục tiêu `ACTIVE` giao với khoảng báo cáo và quy đổi chỉ
tiêu sang cả khoảng bằng `expectedForRange`: mục tiêu ngày × số ngày, mục tiêu tuần × số tuần
làm tròn lên, mục tiêu `TOTAL` **chia đều theo độ dài cả đời mục tiêu** ("1500 từ trong 100
ngày" xem một tuần thì chỉ tiêu là 105); mục tiêu chuỗi so với chuỗi dài nhất trong khoảng.
Mục tiêu `TOTAL` **không có hạn bị loại khỏi báo cáo** (`findGoalsOverlapping`) — không có độ
dài thì không chia được.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `statistics` | gọi đi | `getStreak` | Đo `STREAK_TARGET` |
| `statistics` | được đọc | `goals` | Báo cáo đối chiếu mục tiêu, điểm hiệu quả |
| `activity-logs` | được gọi | `getProgress`, `finishGoal` | Phát hiện mục tiêu vừa đạt, tự kết thúc mục tiêu có điểm đích |
| `notifications` | gián tiếp | `GOAL_ACHIEVED` | Qua `activity-logs` |
| `habits` | được tham chiếu | `habits.goal_id` | Thói quen gắn vào mục tiêu; chỉ gắn được mục tiêu `ACTIVE` của chính mình |
| `study`, `habits` | nguồn dữ liệu | `activity_logs` | Mọi tiến độ đến từ hai module này |
| `feature-flags` | bị chặn | `requireFeature(GOALS)` | |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Tạo / sửa mục tiêu | Tiến độ ở `/goals` và Tổng quan, danh sách mục tiêu và điểm hiệu quả ở `/report` |
| Hết hạn / tạm dừng | Không còn được đo, không còn được chúc mừng; báo cáo chỉ tính trong khoảng mục tiêu còn hiệu lực |
| Tiếp tục sau tạm dừng | Hạn lùi đúng số ngày đã dừng; dự báo tính lại theo hạn mới |
| Kết thúc | Rời khỏi tiến độ, báo cáo và ô chọn mục tiêu của thói quen; thói quen đã gắn vẫn giữ liên kết |
| Xoá mục tiêu | Không ảnh hưởng dữ liệu học; thói quen đã gắn về "không gắn mục tiêu"; thông báo cũ vẫn còn trong chuông |
| Người học học thêm | Tiến độ tự tăng ở lần đọc kế tiếp, không cần ghi gì vào `goals` |

## 6. Quy tắc bắt buộc giữ khi sửa

1. Không lưu tiến độ vào bảng — tính từ `activity_logs`.
2. Lọc mục tiêu hết hạn và tạm dừng ở BE (nó còn là nguồn của thông báo).
3. Ánh xạ loại mục tiêu → loại hoạt động chỉ nằm ở `shared/report`; dự báo chỉ ở `shared/goal`.
4. Kết thúc mục tiêu chỉ qua `finishGoal` — nó chốt hạn. `PATCH` đổi thẳng trạng thái là để lại
   mục tiêu "đã xong" mà không biết xong hôm nào.
5. Mục tiêu đã kết thúc là dòng lịch sử: không sửa, không mở lại.

## 7. Điểm cần lưu ý

- `MINUTES_PER_DAY` không đo phút mà đếm lượt ôn; hệ thống chưa ghi thời lượng học (chỉ có
  `card_reviews.response_ms` của từng câu).
- Thông báo `GOAL_ACHIEVED` (và việc tự kết thúc mục tiêu có điểm đích) chỉ chạy khi người gọi
  `recordActivity` không truyền `tx` (xem `activity-logs.md`).
- Mục tiêu ngày/tuần đạt trong kỳ vẫn giữ `ACTIVE` để kỳ sau đo tiếp — chỉ mục tiêu có điểm
  đích mới tự kết thúc.
- **Chưa làm:** trang Báo cáo vẫn chấm mục tiêu trong những ngày nó tạm dừng (`findGoalsOverlapping`
  không đọc `paused_at`), nên quãng tạm dừng kéo tỷ lệ đạt mục tiêu xuống.
- Báo cáo chỉ lấy mục tiêu `ACTIVE`: mục tiêu đã kết thúc không còn xuất hiện trong báo cáo của
  khoảng nó từng được theo dõi.
