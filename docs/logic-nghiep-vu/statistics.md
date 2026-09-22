# Module `statistics` — Tổng quan, chuỗi ngày, cấp độ, Báo cáo

> **Mã nguồn:** `be/src/modules/statistics/statistics.service.ts`, `shared/src/level/level.ts`,
> `shared/src/streak/streak.ts`, `shared/src/report/report.ts`
> **Màn hình:** `/` (Tổng quan), `/report` (Báo cáo); chuỗi và cấp độ trên thanh trên cùng
> **Cờ tính năng:** Tổng quan **không có cờ** (luôn chạy); riêng `/statistics/report` chịu `REPORT`
> **Quyền:** chỉ `USER`

## 1. Vai trò

Module **chỉ đọc**: biến `activity_logs` thành những con số người học nhìn thấy — chuỗi ngày,
XP, cấp độ, biểu đồ, lịch hoạt động và báo cáo có chấm điểm hiệu quả. Không có bảng tổng hợp:
mọi số tính trực tiếp lúc đọc để không bao giờ lệch với nguồn.

## 2. Dữ liệu

| Bảng | Quyền | Dùng cho |
| --- | --- | --- |
| `activity_logs` | Đọc | Mọi số liệu, gom theo `local_date` |
| `user_streaks` | Đọc | Chuỗi hiện tại/dài nhất (qua `displayStreak`) |
| `goals` | Đọc | Báo cáo đối chiếu mục tiêu |
| `streak_freezes` | Đọc | Báo cáo tính chuỗi trong khoảng có cả ngày được bù |

## 3. Chức năng và cách hoạt động

### 3.1 Tổng quan — `GET /statistics/summary?range=day|week|month`

- Khoảng: `day` = 7 ngày gần nhất (để có bối cảnh so sánh), `week` = từ thứ Hai, `month` = từ
  ngày 1.
- `getDailyStats` gom `activity_logs` theo `(local_date, type)` và **điền đủ ngày trống bằng 0**
  để biểu đồ liền mạch.
- Trả tổng theo 4 loại, tỷ lệ ngày có học, kèm chuỗi ngày.

### 3.2 Chuỗi ngày — `GET /statistics/streak`

Đọc cache `user_streaks` nhưng luôn đối chiếu với hôm nay: không học hôm nay lẫn hôm qua thì
`currentStreak = 0` dù cache còn số cũ. Trả thêm `isAlive` và `deadline` (ngày cuối phải học để
giữ chuỗi).

### 3.3 Cấp độ — `GET /statistics/level`

1. Gom **toàn bộ** `activity_logs` của người học theo loại.
2. `xpFromActivityCounts`: ôn thẻ 4, học thẻ mới 8, check-in thói quen 12 (tối đa một lần mỗi
   ngày, xem `habits.md`), hoàn thành phiên Học 20.
3. `levelFromXp`: lên cấp 2 cần 100 XP, mỗi cấp sau cần thêm 60 XP so với cấp trước; trần 200.

`getLevelsFor(userIds)` tính cấp của **nhiều người bằng một truy vấn** — dùng cho bảng xếp hạng,
diễn đàn và trang quản trị. Cấp độ luôn tính trên toàn bộ lịch sử, kể cả khi bảng xếp hạng đang
xem theo tuần.

### 3.4 Lịch hoạt động — `GET /statistics/calendar?months=`

Mỗi ngày một ô, đậm nhạt 4 mức theo **phân vị** (25/50/75%) của những ngày có học — một ngày
đột biến không kéo mọi ngày khác xuống mức nhạt nhất.

### 3.5 Báo cáo — `GET /statistics/report?from=&to=` (cờ `REPORT`)

1. Cắt mốc cuối về hôm nay; tối đa 366 ngày.
2. Tính song song: số liệu từng ngày của khoảng, của **kỳ liền trước cùng độ dài**, mục tiêu
   `ACTIVE` giao với khoảng, các ngày được vật phẩm bù trong khoảng.
3. Chuỗi dài nhất trong khoảng = `computeStreak(ngày học, ngày được bù)` — khớp cách tính chuỗi
   chính thức.
4. Mỗi mục tiêu: chỉ tiêu quy đổi sang cả khoảng (`expectedForRange`), so với số đạt được.
   Mục tiêu cộng dồn (`TOTAL`) chia chỉ tiêu theo độ dài cả đời mục tiêu; không có hạn thì bị
   loại khỏi báo cáo (xem `goals.md` §3.7).
5. Điểm hiệu quả (`effectivenessScore`): 60% tỷ lệ ngày có học + 40% tỷ lệ đạt mục tiêu (không
   có mục tiêu thì 100% theo tỷ lệ ngày có học). Xếp loại: ≥ 80 Xuất sắc, ≥ 60 Tốt, ≥ 40 Khá,
   còn lại Thấp.
6. Trả thêm ngày học nhiều nhất và XP của kỳ này, kỳ trước.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `activity-logs` | đọc | `activity_logs`, `user_streaks` | Nguồn của mọi con số |
| `goals` | được gọi / đọc | `getStreak` / bảng `goals` | Mục tiêu chuỗi ngày; báo cáo đối chiếu mục tiêu |
| `leaderboard` | được gọi | `getLevelsFor` | Cột cấp độ |
| `community` | được gọi | `getLevelsFor` | Cấp độ cạnh tên tác giả |
| `admin` | được gọi | `getDailyStats` | Biểu đồ 10 ngày ở chi tiết tài khoản |
| `rewards` | đọc chung | `streak_freezes` | Ngày được bù |
| `feature-flags` | bị chặn | `requireFeature(REPORT)` trên đúng route báo cáo | |

## 5. Ảnh hưởng dây chuyền

Module chỉ đọc nên không tự gây ảnh hưởng. Ngược lại, nó **nhận** ảnh hưởng từ:

- mọi lần ghi `activity_logs` (`study`, `habits`);
- job vật phẩm giữ chuỗi (đổi `user_streaks`, thêm ngày được bù vào báo cáo);
- thay đổi mục tiêu (`goals`);
- đổi múi giờ (`auth`) — "hôm nay" dịch theo;
- đổi hằng số `XP_PER_ACTIVITY` hoặc công thức cấp — cấp độ của **mọi người** đổi ngay ở lần
  đọc kế tiếp, vì XP không lưu ở đâu.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Không tạo bảng tổng hợp; tính trực tiếp từ `activity_logs`.
2. Gom theo `local_date`, không đổi múi giờ trong SQL.
3. XP chỉ tính bằng `xpFromActivityCounts` — bảng xếp hạng, báo cáo, cấp độ dùng chung.
4. Chuỗi hiển thị luôn qua `displayStreak`.
5. Cờ `REPORT` chỉ gắn trên `/statistics/report`; Tổng quan không được tắt.

## 7. Điểm cần lưu ý

- `getLevel` gom toàn bộ lịch sử mỗi lần đọc; ở quy mô vài trăm người là chấp nhận được, đây là
  trần mở rộng nếu số người tăng mạnh.
