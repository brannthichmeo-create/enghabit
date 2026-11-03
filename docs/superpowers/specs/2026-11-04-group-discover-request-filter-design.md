# Thiết kế bộ lọc yêu cầu ở Khám phá nhóm

## Mục tiêu

Thêm bộ lọc trạng thái yêu cầu vào tab Khám phá nhóm, nằm cạnh ô tìm kiếm và mặc định chọn `Tất cả`.

## Quy tắc nghiệp vụ

- Danh sách Khám phá chỉ chứa nhóm công khai, chưa tham gia và chưa bị chặn.
- Ba lựa chọn bộ lọc:
  - `Tất cả`: không áp dụng lọc trạng thái yêu cầu.
  - `Đã yêu cầu`: chỉ nhóm có ít nhất một `GroupJoinRequest` ở trạng thái `PENDING` của người xem.
  - `Chưa yêu cầu`: nhóm không có `GroupJoinRequest` ở trạng thái `PENDING` của người xem.
- Yêu cầu đã bị từ chối được xem là chưa yêu cầu cho tới khi người dùng gửi lại thành công và yêu cầu quay về `PENDING`.
- Bộ lọc được thực hiện ở backend trong truy vấn Prisma để kết quả phân trang không lệch khi nhóm thuộc trạng thái khác nhau.

## API

Mở rộng `groupSearchSchema` bằng tham số tuỳ chọn `requestStatus` với ba giá trị `ALL`, `REQUESTED`, `NOT_REQUESTED`.

Giá trị mặc định là `ALL`; frontend không cần gửi tham số khi chọn Tất cả.

## Frontend

- Đặt dropdown bên phải ô tìm kiếm.
- Dropdown sử dụng nhãn tiếng Việt và bản dịch tương ứng trong `en.ts`.
- Tham số lọc nằm trong cùng query key TanStack Query để đổi lựa chọn tự gọi lại dữ liệu.
- Khi không có kết quả, giữ Empty State hiện có; không thay đổi card hay luồng yêu cầu vào nhóm.

## Kiểm tra

- Backend typecheck.
- Frontend i18n check và typecheck.
- Xác nhận bộ lọc hoạt động ở cả ba trạng thái và pagination vẫn đúng.
