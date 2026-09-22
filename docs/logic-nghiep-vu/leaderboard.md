# Module `leaderboard` — Bảng xếp hạng

> **Mã nguồn:** `be/src/modules/leaderboard/leaderboard.service.ts`,
> `shared/src/schemas/leaderboard.schema.ts`
> **Màn hình:** `/leaderboard`
> **Cờ tính năng:** `LEADERBOARD` · **Quyền:** chỉ `USER`

## 1. Vai trò

So thứ hạng giữa người học theo tuần, tháng hoặc toàn thời gian. Không có bảng điểm riêng: mỗi
lần đọc gom `activity_logs` theo người rồi quy ra điểm bằng **đúng công thức XP** của cấp độ, để
"cấp độ nói một đằng, thứ hạng nói một nẻo" không thể xảy ra.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `activity_logs` | Đọc | Gom theo `(user_id, type)` trong khoảng |
| `users` | Đọc | Chỉ `role = USER` và `status = ACTIVE` |
| `user_streaks` | Đọc | Cột chuỗi ngày |
| `user_equipped_items` | Đọc (qua `shop.frame`) | Khung viền ảnh đại diện |

## 3. Chức năng và cách hoạt động — `GET /leaderboard?range=&metric=&limit=`

1. Mốc bắt đầu: `week` = thứ Hai tuần này, `month` = ngày 1, `all` = không giới hạn. "Tuần này"
   tính theo múi giờ của **người đang xem**; `local_date` của từng dòng là ngày của người ghi.
2. **Một** truy vấn `groupBy` cho mọi người học hợp lệ.
3. Mỗi người có hai con số: `xp` (`xpFromActivityCounts`) và `activities` (tổng lượt).
4. Sắp theo `metric`:
   - `xp`: XP giảm dần; hoà thì **ít** lượt hơn đứng trên (cùng điểm mà làm ít lượt là chọn việc nặng hơn).
   - `activities`: lượt giảm dần; hoà thì **nhiều** XP hơn đứng trên.
   - Cuối cùng chốt bằng `userId` để thứ tự ổn định giữa các lần tải.
5. Nạp tên, chuỗi, cấp độ (`statistics.getLevelsFor`, tính trên toàn bộ lịch sử) cho mọi người
   trong bảng; khung viền (`shop.getEquippedFrameUrls`) chỉ cho các dòng **sẽ hiện** (top
   `limit` + chính người xem).
6. Trả `entries` (top `limit`, mặc định 20, 3–50), `me` (chỉ khi người xem nằm ngoài top) và
   `totalRanked`.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `activity-logs` | đọc | `activity_logs` | Điểm xếp hạng |
| `statistics` | gọi đi | `getLevelsFor` | Cấp độ |
| `shop` | gọi đi | `getEquippedFrameUrls` | Khung viền ảnh đại diện (tắt Cửa hàng thì không hiện) |
| `admin` / `auth` | bị tác động | `users.role`, `users.status` | Khoá tài khoản hoặc nâng thành admin là rời bảng |
| `feature-flags` | bị chặn | `requireFeature(LEADERBOARD)` | |

## 5. Ảnh hưởng dây chuyền

Chỉ đọc. Nhận ảnh hưởng từ mọi lần ghi hoạt động học, từ việc khoá / đổi vai trò tài khoản, và
từ việc đổi khung viền (FE làm mới `leaderboardKeys` khi người dùng đổi khung).

## 6. Quy tắc bắt buộc giữ khi sửa

1. Không dựng bảng điểm riêng; dùng lại `xpFromActivityCounts`.
2. Chỉ xếp hạng `USER` đang `ACTIVE`.
3. Cấp độ và khung viền lấy theo lô cho cả trang, không truy vấn từng dòng.

## 7. Điểm cần lưu ý

- Cột chuỗi ngày đọc thẳng `user_streaks.current_streak`, không qua `displayStreak` — người đã
  đứt chuỗi mà chưa học lại vẫn hiện chuỗi cũ.
- Mỗi lần mở bảng là một lần gom toàn bộ `activity_logs` của khoảng; với "toàn thời gian" đây là
  truy vấn nặng nhất hệ thống khi dữ liệu lớn dần.
