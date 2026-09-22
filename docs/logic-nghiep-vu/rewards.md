# Module `rewards` — Điểm danh, nhiệm vụ ngày, vật phẩm giữ chuỗi

> **Mã nguồn:** `be/src/modules/rewards/rewards.service.ts`, `be/src/jobs/streak-freeze.job.ts`,
> `shared/src/rewards/rewards.ts`, `shared/src/streak/streak.ts`
> **Màn hình:** khu phần thưởng trên trang Tổng quan (`/`); số xu trên thanh trên cùng
> **Cờ tính năng:** `REWARDS` (không có màn riêng). Tắt thì `SHOP` tắt theo
> **Quyền:** chỉ `USER`

## 1. Vai trò

Động viên người học quay lại mỗi ngày bằng **xu** — một đơn vị tách hẳn khỏi XP. Module là
**nguồn thu** xu duy nhất (điểm danh, nhiệm vụ) và giữ vật phẩm giữ chuỗi, thứ duy nhất ngoài
hoạt động học được phép tác động lên chuỗi ngày.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `coin_transactions` | Ghi (chung với `shop`) | **Sổ cái xu.** `amount` dương là thu, âm là chi. Số dư = `SUM(amount)`, không có cột số dư. `@@unique([userId, dedupeKey])` |
| `streak_freezes` | Ghi | Mỗi dòng một vật phẩm; `used_on_date` null = còn trong kho. `@@unique([userId, usedOnDate])` |
| `user_streaks` | Ghi (chỉ khi tiêu vật phẩm) | Qua `applyFrozenDay` |
| `activity_logs` | Đọc | Chấm tiến độ nhiệm vụ |

## 3. Chức năng và cách hoạt động

### 3.1 Tổng hợp — `GET /rewards`

Chạy song song: số dư xu, các `dedupe_key` đã nhận hôm nay, số lượt từng loại hoạt động hôm nay,
trạng thái kho vật phẩm. Tiến độ nhiệm vụ **không lưu ở đâu** — chấm lại mỗi lần đọc.

### 3.2 Điểm danh — `POST /rewards/check-in`

+**50 xu**, mỗi ngày local một lần. Ghi `coin_transactions` với
`dedupe_key = DAILY_CHECKIN:<ngày>`. Trùng khoá → 409 "Hôm nay bạn đã điểm danh rồi".

### 3.3 Nhiệm vụ ngày — `POST /rewards/missions/claim`

| Nhiệm vụ | Đếm loại hoạt động | Chỉ tiêu | Thưởng |
| --- | --- | --- | --- |
| `LEARN_VOCAB` — Học 5 từ mới | `VOCAB_LEARNED` | 5 | 20 xu |
| `REVIEW_FLASHCARDS` — Ôn 10 thẻ | `FLASHCARD_REVIEWED` | 10 | 20 xu |
| `DO_HABIT` — Check-in 1 thói quen | `HABIT_CHECKIN` | 1 | 20 xu |

`HABIT_CHECKIN` tối đa một dòng mỗi ngày và chỉ sinh từ thói quen **tự tích**; thói quen tự
động (bám theo hoạt động học) không làm được `DO_HABIT` — xem `habits.md`.

1. **Chấm lại** tiến độ từ `activity_logs` của hôm nay ở BE — không tin số FE gửi lên.
2. Chưa đạt → 400.
3. Ghi `+20` với `dedupe_key = MISSION:<id>:<ngày>`. Trùng khoá → 409.

### 3.4 Mua vật phẩm giữ chuỗi — `POST /rewards/streak-freeze/buy`

Trong **một transaction** có `SELECT ... FOR UPDATE` trên dòng `users`:

1. Kho đã có **3** vật phẩm chưa dùng → 400.
2. Số dư < **200** → 400 "Cần 200 xu, bạn mới có N".
3. Ghi `-200` (lý do `STREAK_FREEZE_PURCHASE`, khoá ngẫu nhiên vì mua lặp lại là hợp lệ) và tạo
   một dòng `streak_freezes`.

Khoá dòng là bắt buộc: không khoá thì hai lần bấm cùng lúc đều thấy đủ tiền và số dư thành âm.

### 3.5 Tự tiêu vật phẩm — job `streak-freeze.job.ts` (30 phút/lượt)

1. Chỉ xét người **còn vật phẩm chưa dùng**.
2. `consumeFreezeIfNeeded`: `freezableDate` trả ngày cần cứu khi người đó bỏ lỡ **đúng một ngày**
   (hôm qua) và chuỗi đang > 0. Nghỉ từ hai ngày thì chuỗi đã đứt, không cứu.
3. Ngày đó thực ra có `activity_logs` (cache lạc hậu) → không tiêu.
4. Transaction: gán `used_on_date` cho vật phẩm cũ nhất; `applyFrozenDay` đẩy
   `last_active_date` sang ngày được bù, **không cộng ngày** vào chuỗi.
5. Unique `(user_id, used_on_date)` chặn hai lượt quét cùng bù một ngày.

Là job chứ không phải nút bấm: hôm người dùng quên học cũng là hôm họ không mở app.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `activity-logs` | đọc | `activity_logs` | Tiến độ nhiệm vụ; kiểm ngày cần cứu có học không |
| `activity-logs` | ghi chung | `user_streaks` | Tiêu vật phẩm nối mạch chuỗi |
| `activity-logs` | được đọc | `streak_freezes` | `recomputeStreak` dựng lại chuỗi có tính ngày được bù |
| `statistics` | được đọc | `streak_freezes` | Báo cáo tính ngày được bù |
| `shop` | dùng chung | `coin_transactions` | Shop là **đầu ra** của xu; cùng quy ước khoá dòng và dòng âm |
| `study`, `habits` | nguồn dữ liệu | `activity_logs` | Làm nhiệm vụ bằng cách học |
| `feature-flags` | bị chặn | `requireFeature(REWARDS)`; `SHOP` phụ thuộc `REWARDS` | |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Điểm danh / nhận nhiệm vụ | Số dư xu ở thanh trên cùng, `/wallet`, khả năng mua ở `/shop`. **Không** đổi chuỗi, XP, thống kê |
| Mua vật phẩm giữ chuỗi | Số dư giảm 200; kho tăng 1 |
| Job tiêu vật phẩm | Chuỗi được giữ (cache `user_streaks`); ngày được bù xuất hiện ở báo cáo; cảnh báo chuỗi sắp đứt tối hôm đó vẫn tính theo chuỗi đã nối |
| Tắt `REWARDS` | `SHOP` tắt theo; số dư giữ nguyên trong sổ cái; job tiêu vật phẩm **vẫn chạy** (không kiểm cờ) |

FE sau khi nhận thưởng làm mới cache `rewards` và `statistics`.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Không ghi `ActivityLog`, không cộng XP.
2. Chống nhận trùng bằng unique `(user_id, dedupe_key)`, không đọc-rồi-ghi.
3. Kiểm số dư và ghi dòng trừ trong cùng transaction có khoá dòng `users`.
4. Tiến độ nhiệm vụ chấm lại ở BE lúc nhận thưởng.
5. Logic bù chuỗi chỉ ở `shared/streak/applyFrozenDay`.

## 7. Điểm cần lưu ý

- Job 30 phút/lượt: người mở app ngay đầu ngày có thể thấy chuỗi về 0 trước khi job kịp cứu.
- Tắt cờ `REWARDS` không dừng job tiêu vật phẩm — vật phẩm đã mua vẫn hoạt động (có thể là chủ ý).
- Tắt cờ `HABITS` vẫn để nhiệm vụ `DO_HABIT` hiện ra dù không làm được.
