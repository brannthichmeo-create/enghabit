# Module `habits` — Thói quen học tập

> **Mã nguồn:** `be/src/modules/habits/habit.service.ts`, `shared/src/habit/habit-schedule.ts`,
> `shared/src/schemas/habit.schema.ts`
> **Màn hình:** `/habits`; thói quen cần làm hôm nay còn hiện ở Tổng quan, thói quen gắn mục
> tiêu hiện dưới thẻ mục tiêu ở `/goals`
> **Cờ tính năng:** `HABITS` · **Quyền:** chỉ `USER`

## 1. Vai trò

Cho người học đặt việc học lặp lại theo lịch và đánh dấu khi làm xong. Có hai kiểu:

- **Tự tích** — việc ngoài ứng dụng ("Nghe podcast 15 phút"). Người học bấm Check-in; check-in
  ghi `ActivityLog` nên giữ được chuỗi ngày và cộng XP. Đây là điểm khác cốt lõi với Việc cần
  làm (`todos`).
- **Tự động** (`auto_activity` có giá trị) — bám theo một loại hoạt động học trong app ("Ôn 20
  thẻ mỗi ngày"). Không có check-in: trạng thái chấm thẳng từ `activity_logs`, không lưu bản sao.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `habits` | Ghi | `name`, `frequency` (DAILY / WEEKLY / CUSTOM), `custom_days` (thứ ISO 1–7), `times_per_week`, `auto_activity`, `target_amount`, `min_amount`, `unit`, `reminder_time`, `is_active`, `goal_id` |
| `habit_check_ins` | Ghi | Chỉ thói quen tự tích. Mỗi thói quen mỗi ngày một dòng (`@@unique([habitId, localDate])`), kèm `amount`, `note` |
| `activity_logs` | Ghi (qua `recordActivity`) / Đọc | Ghi `HABIT_CHECKIN` tối đa **một dòng mỗi ngày**; đọc để chấm thói quen tự động |
| `goals` | Đọc | Kiểm mục tiêu được gắn |

## 3. Chức năng và cách hoạt động

### 3.1 Cấu hình một thói quen

| Trường | Quy tắc |
| --- | --- |
| `frequency` | `DAILY`: ngày nào cũng đến hạn. `CUSTOM`: chỉ các thứ trong `custom_days` (bắt buộc ≥ 1 thứ). `WEEKLY`: làm hôm nào trong tuần cũng được, đủ `times_per_week` lần (mặc định 1) là xong tuần |
| `auto_activity` | Null = tự tích. Hoặc `VOCAB_LEARNED` / `FLASHCARD_REVIEWED` / `QUIZ_COMPLETED` (`HABIT_AUTO_ACTIVITIES`). Không có `HABIT_CHECKIN` — tự hoàn thành vì chính nó được check-in là vòng lặp vô nghĩa |
| `target_amount` | Lượng mỗi lần (≤ 1000). Null = chỉ có làm / chưa làm. Thói quen tự động luôn có lượng, mặc định 1 |
| `min_amount` | Mức tối thiểu cho ngày bận, phải nhỏ hơn `target_amount` và chỉ đặt được khi có `target_amount` |
| `unit` | Đơn vị người dùng tự đặt ("phút", "trang"). Thói quen tự động có đơn vị cố định theo loại (từ / thẻ / phiên) |
| `goal_id` | Mục tiêu mà thói quen phục vụ. Chỉ gắn được mục tiêu `ACTIVE` của chính mình |
| `is_active` | `false` = **tạm dừng**: không nhắc, không check-in được, lịch sử giữ nguyên |

`normalizeConfig` dọn giá trị không còn nghĩa trước khi ghi (vd `times_per_week` của thói quen
hằng ngày, `unit` của thói quen tự động). Bộ số lượng kiểm bằng `habitAmountsError` ở cả schema
lẫn service — service kiểm lại trên bản **đã gộp** với dữ liệu cũ vì `PATCH` có thể chỉ gửi
một số.

### 3.2 Chấm một ngày — `habitDayLevel`

| Lượng đã làm | Mức |
| --- | --- |
| Không kèm lượng, hoặc ≥ `target_amount` | `FULL` — đã xong |
| ≥ `min_amount` | `MINIMUM` — đạt mức tối thiểu, **vẫn tính là đã làm** |
| Thấp hơn | null — có làm nhưng chưa đủ (chỉ gặp ở thói quen tự động) |

Thói quen tự động: lượng = số dòng `activity_logs` loại đó trong ngày. Mức tối thiểu tồn tại
để ngày bận không làm đứt mạch. Ở dải 7 ngày, đạt mức tối thiểu vẽ bằng **viền**, làm đủ thì
**tô kín** — khác nhau ở hình, không chỉ ở màu.

### 3.3 Danh sách — `GET /habits`

Trả mọi thói quen kèm `checkedInToday` (hôm nay đạt ít nhất mức tối thiểu), `todayAmount`,
`recentDays` (7 ngày gần nhất: `{date, amount, note, level}`) và `goal` (mục tiêu đang gắn).
`loadHabitDays` lấy lịch sử cả danh sách bằng **hai truy vấn**: `habit_check_ins` cho thói quen
tự tích, `groupBy` `activity_logs` theo loại và ngày cho thói quen tự động.

### 3.4 Tạo, sửa, xoá — `POST /habits`, `PATCH`/`DELETE /habits/:id`

- Chỉ chủ thói quen thao tác được; người khác nhận 404.
- Mọi trường tuỳ chọn nhận `null` để **xoá** khi sửa; bỏ trống (`undefined`) là "không đổi".
- Đang gắn một mục tiêu vừa kết thúc vẫn sửa tên được — chỉ kiểm mục tiêu khi **đổi** `goal_id`.
- Xoá thói quen cascade xoá `habit_check_ins`. **`activity_logs` giữ nguyên** — XP và chuỗi
  ngày đã tích luỹ không mất.

### 3.5 Check-in — `POST /habits/:id/check-in`

1. Kiểm quyền sở hữu.
2. Thói quen đang tạm dừng → 400. Thói quen tự động → 400 (nó tự đánh dấu khi học trong app).
3. `date = input.date ?? hôm nay` (theo múi giờ người học). `date > hôm nay` → 400; cách hôm
   nay **≥ 7 ngày** → 400. Giới hạn bù 7 ngày chặn việc dựng chuỗi dài bằng API.
4. `amount = input.amount ?? target_amount` — bỏ trống là làm đủ. Chưa đạt mức tối thiểu → 400.
5. Đã có check-in của thói quen này ngày đó → 409.
6. Trong **một transaction**: ghi `habit_check_ins` (kèm `amount`, `note`); nếu **ngày đó chưa
   có dòng `HABIT_CHECKIN` nào** thì `recordActivity(HABIT_CHECKIN, localDate = date,
   dedupeKey = HABIT_CHECKIN:<date>, tx)`.
7. Hai thói quen tích cùng lúc cùng ngày: bên chậm hơn dính trùng khoá `dedupe_key` (P2002),
   transaction huỷ, chạy lại thì thấy dòng của bên kia và bỏ qua. Trùng ở bảng check-in là bấm
   hai lần → 409.

**Mỗi ngày chỉ một dòng `HABIT_CHECKIN` dù tích bao nhiêu thói quen.** Tích tay là việc ứng
dụng không kiểm được: mỗi lượt một dòng thì tạo mười thói quen "abc" rồi tích là được 120 XP
mỗi ngày mà không học chữ nào. Một dòng mỗi ngày vẫn đủ giữ chuỗi và làm nhiệm vụ "Check-in 1
thói quen". Check-in bù mang `local_date` của **ngày được bù**, và `recordActivity` dựng lại
chuỗi từ đầu (xem `activity-logs.md`).

Giao diện: nút Check-in một chạm với thói quen không có lượng; có lượng thì mở hộp thoại nhập
lượng và ghi chú. Bấm ô ngày trong dải 7 ngày để check-in bù hoặc đọc lại ghi chú. Thói quen tự
động có nút Học ngay / Ôn ngay thay cho Check-in.

### 3.6 Lịch sử và tỷ lệ — `GET /habits/:id/check-ins`, `/completion-rate`

`check-ins` trả `{date, amount, note}` của thói quen tự tích. Tỷ lệ hoàn thành = số ngày đạt ít
nhất mức tối thiểu ÷ số lần **đến hạn** trong khoảng:

| Tần suất | Mẫu số |
| --- | --- |
| `DAILY` | Số ngày trong khoảng |
| `WEEKLY` | Số tuần (làm tròn lên) × `times_per_week` |
| `CUSTOM` | Số ngày trong khoảng rơi vào các thứ đã chọn |

`isScheduledDay`, `habitPeriodStart`, `isHabitPeriodDone` ở `shared/habit` là **một cách hiểu
duy nhất** cho dải 7 ngày ở FE, tỷ lệ ở BE và job nhắc nhở.

### 3.7 Nhắc theo giờ của thói quen

Job nhắc nhở có lượt quét thứ ba (`sendDueHabitReminders`): thói quen đang theo dõi có
`reminder_time`, tới giờ theo múi giờ người học, hôm nay là ngày đến hạn, và **chính thói quen
đó chưa xong trong kỳ** (`isHabitDoneThisPeriod` — thói quen hằng tuần là đủ số lần của tuần)
thì gửi `DAILY_REMINDER` "Đến giờ: <tên>". Khoá chống trùng `DAILY_REMINDER:HABIT-<id>:<ngày>`.
Khác lời nhắc chung: người đã học trong app vẫn được nhắc thói quen chưa làm. Công tắc tổng
tắt, tài khoản không phải `USER`, hoặc tính năng `HABITS` tắt thì im lặng.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `activity-logs` | gọi đi | `recordActivity` | Ghi `HABIT_CHECKIN` (một dòng mỗi ngày), cập nhật / dựng lại chuỗi |
| `activity-logs` | đọc bảng | `activity_logs` | Chấm thói quen tự động |
| `goals` | đọc | `goals` | Gắn thói quen vào mục tiêu `ACTIVE`; mục tiêu bị xoá thì `goal_id` về null |
| `rewards` | gián tiếp | `activity_logs` | Nhiệm vụ ngày "Check-in 1 thói quen" (+20 xu khi nhận) |
| `statistics`, `leaderboard` | gián tiếp | `activity_logs` | +12 XP mỗi ngày có check-in; cột "Thói quen" ở biểu đồ |
| `goals` | gián tiếp | Chuỗi ngày | Mục tiêu `STREAK_TARGET` tính theo chuỗi hiện tại |
| Cron nhắc nhở | gọi vào | `toSchedule`, `isHabitDoneThisPeriod` | Nhắc theo giờ của từng thói quen; lời nhắc chung im khi đã có hoạt động hôm nay |
| `feature-flags` | bị chặn | `requireFeature(HABITS)` | |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Check-in đầu tiên trong ngày | Chuỗi +1 nếu là hoạt động đầu tiên trong ngày; +12 XP; hoàn thành nhiệm vụ `DO_HABIT`; lời nhắc chung im tới hết ngày |
| Check-in thứ hai trở đi trong ngày | Chỉ ghi `habit_check_ins`; không thêm XP, không đổi chuỗi |
| Check-in bù | Có thể **vá** một quãng đứt → chuỗi dài ra (nếu ngày đó chưa có `HABIT_CHECKIN`); báo cáo và lịch hoạt động đổi ở ngày đó |
| Học trong app | Thói quen tự động cùng loại tự đạt; lời nhắc của nó im |
| Tạm dừng | Không nhắc, không check-in; lịch sử giữ nguyên |
| Xoá thói quen | Mất lịch sử check-in và tỷ lệ; XP, chuỗi, thống kê không đổi |
| Tắt `HABITS` | API trả 404, lời nhắc thói quen dừng; nhiệm vụ `DO_HABIT` vẫn hiện nhưng không làm được |

FE sau check-in làm mới cache `habits` và `statistics`.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Check-in và `activity_logs` cùng một transaction.
2. Mỗi ngày tối đa một dòng `HABIT_CHECKIN` (`dedupeKey = HABIT_CHECKIN:<date>`).
3. Thói quen tự động không có check-in và không lưu bản sao — chấm từ `activity_logs`.
4. Check-in bù phải truyền `localDate` là ngày được bù; giữ giới hạn bù 7 ngày, cấm ngày tương lai.
5. Lịch đến hạn và cách chấm ngày chỉ nằm ở `shared/habit`.
6. Mọi truy vấn lọc theo chủ thói quen; không phải của mình → 404.

## 7. Điểm cần lưu ý

- Tắt tính năng Thói quen không ẩn nhiệm vụ `DO_HABIT` ở khu phần thưởng.
- Thói quen tự động không sinh `HABIT_CHECKIN`, nên không làm được nhiệm vụ `DO_HABIT` — nhiệm
  vụ đó chỉ dành cho việc ngoài app.
- Số "Check-in thói quen" ở thống kê và báo cáo là số **ngày** có tích tay, không phải số lượt
  tích.
- Sau check-in, FE không làm mới cache `rewards` và `goals`, nên hai chỗ đó có thể trễ tới lần
  tải lại kế tiếp.
- Ngày cũ (trước quy tắc một dòng mỗi ngày) có thể mang vài dòng `HABIT_CHECKIN` không khoá;
  service tìm theo loại + ngày nên không ghi thêm vào những ngày đó.
