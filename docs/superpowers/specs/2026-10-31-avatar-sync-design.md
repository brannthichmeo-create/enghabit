# Thiết kế đồng bộ avatar toàn hệ thống

## Mục tiêu

Đổi avatar tại trang cá nhân phải cập nhật ngay ở thanh điều hướng, trang cá nhân và các màn có nhiều người dùng. Avatar người khác cũng được làm mới gần real-time khi trang đang mở, không chỉ sau khi tải lại toàn bộ ứng dụng.

## Quy ước dữ liệu

- `avatarDataUrl` là nguồn ảnh đại diện của ảnh gốc người dùng trong DTO public.
- Các DTO hiển thị người dùng cộng đồng, bảng xếp hạng và thành viên nhóm đều bổ sung `avatarDataUrl`.
- Avatar của chính người dùng vẫn có thể cập nhật ngay qua auth store sau mutation thành công.

## Luồng cập nhật

1. Người dùng lưu avatar mới trong trang cá nhân.
2. Backend trả `PublicUser` mới và hook avatar ghi người dùng mới vào auth store.
3. Các query cache hiển thị người dùng được làm mới hoặc lấy lại khi trang quay lại foreground.
4. Các query danh sách đang mở gọi lại API định kỳ mỗi 30 giây để nhận avatar mới của người khác.
5. Backend dựng `avatarDataUrl` từ ảnh đã lưu trong các DTO cộng đồng, bảng xếp hạng và nhóm, cùng với khung avatar hiện có.

## Các màn cần cập nhật

- Sidebar và thanh điều hướng của chính người dùng.
- Trang cá nhân và xem hồ sơ.
- Bài viết và bình luận cộng đồng.
- Bảng xếp hạng (cả thẻ top và hàng ngoài top).
- Thành viên nhóm ở trang nhóm.
- Các màn quản trị hiển thị avatar người dùng nếu dùng cùng DTO.

## Hiển thị

- Tất cả nơi hiển thị avatar phải truyền cả `src={avatarDataUrl}` và `frameUrl` vào component chung `Avatar`.
- Không đọc avatar theo từng user hoặc tự ghép thêm query phụ.
- Để trình duyệt lấy ảnh mới khi cùng URL data được thay đổi, React cập nhật trực tiếp data URL mới trong DTO hoặc store; không cache ảnh qua endpoint riêng.

## Cơ chế cập nhật

- Dùng TanStack Query refetch interval 30 giây cho các màn danh sách có nhiều người dùng đang mở: cộng đồng, chi tiết cộng đồng, bảng xếp hạng và chi tiết nhóm.
- Dùng refetch khi cửa sổ lấy lại trạng thái focus theo cơ chế mặc định của TanStack Query.
- Mutation đổi hoặc gỡ avatar của chính user làm mới store ngay và invalidate các cache liên quan để các màn khác không phải chờ interval.
- Mục tiêu là gần real-time; không thêm WebSocket trong phạm vi này.

## Xử lý lỗi

- Nếu refresh danh sách thất bại, giữ dữ liệu cache hiện tại thay vì làm mất giao diện.
- Mutation avatar lỗi chỉ hiển thị lỗi tại picker; không xoá cache hoặc thay đổi avatar đang hiển thị.

## Kiểm tra

- Typecheck frontend và backend, build shared sau khi đổi schema.
- Kiểm tra đổi/gỡ avatar tại trang cá nhân cập nhật sidebar và hồ sơ ngay.
- Kiểm tra cộng đồng, nhóm và bảng xếp hạng nhận avatarDataUrl trong DTO và truyền đúng vào Avatar.
- Kiểm tra query đang mở làm mới sau khoảng polling.
