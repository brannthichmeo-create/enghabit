# Thiết kế cắt ảnh đại diện thủ công

## Mục tiêu

Thay luồng tự cắt vuông trung tâm trong `AvatarPicker` bằng modal cắt ảnh thủ công. Người dùng chọn ảnh từ thiết bị, sau đó kéo và zoom ảnh trong khung tròn. Chỉ khi bấm “Lưu” mới tạo ảnh đại diện mới gửi lên backend.

## Luồng tương tác

1. Người dùng bấm nút “Đổi ảnh” hoặc “Tải ảnh lên”.
2. Trình duyệt chọn một ảnh JPG, PNG hoặc WebP.
3. Mở modal với:
   - vùng xem/cắt hình tròn;
   - thao tác kéo ảnh để đổi vùng cắt;
   - thanh zoom;
   - nút “Chọn ảnh khác”;
   - nút “Hủy”;
   - nút “Lưu”.
4. “Chọn ảnh khác” mở lại bộ chọn file mà không thay ảnh đang hiển thị cho tới khi một file mới được đọc thành công.
5. “Hủy” đóng modal và không thay đổi ảnh đại diện hiện tại.
6. “Lưu” tạo ảnh PNG vuông 256×256 với phần ngoài vòng tròn trong suốt, kiểm tra bằng quy tắc avatar chung rồi gọi API cập nhật.

## Triển khai

- Dùng thư viện crop chuyên dụng cho React để hỗ trợ kéo, zoom và lấy vùng crop đã chọn.
- Móc vào luồng hiện có của `AvatarPicker`, giữ nguyên hook cập nhật/xóa avatar và các thông báo lỗi/toast.
- Crop output luôn nằm trong kích thước hệ thống `AVATAR_DIMENSION` (256×256).
- Phần ngoài hình tròn trong suốt; phần giao diện hiển thị avatar vẫn dùng renderer tròn có sẵn.
- Giữ `parseImageDataUrl` làm lớp kiểm tra cuối cùng trước khi gọi API.

## Trạng thái và lỗi

- Ảnh chọn không đọc được: giữ modal đóng và báo lỗi trên màn hình picker.
- Hủy hoặc đóng modal không gửi mutation cập nhật avatar.
- Trong lúc lưu ảnh, vô hiệu hoá các hành động thay đổi vùng cắt và hiển thị trạng thái tải.
- Nếu tạo crop hoặc upload thất bại: giữ modal mở và hiển thị lỗi để người dùng có thể thử lại.

## Kiểm tra

- Bắt buộc kiểm tra `pnpm --filter @enghabit/fe typecheck`.
- Chạy `pnpm --filter @enghabit/fe check:i18n` vì toàn bộ nhãn mới đi qua `t()`.
- Kiểm tra tay luồng chọn ảnh, kéo, zoom, chọn ảnh khác, lưu và hủy trên màn hình profile.
