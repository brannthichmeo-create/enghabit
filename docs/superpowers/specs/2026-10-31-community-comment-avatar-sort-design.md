# Thiết kế khung avatar và sắp xếp bình luận Cộng đồng

## Mục tiêu

Sửa lỗi hiển thị khung avatar trang trí trong danh sách bình luận tại màn Cộng đồng, đồng thời cho phép người dùng chuyển thứ tự bình luận giữa mới nhất lên đầu và cũ nhất lên đầu.

## Cơ chế hiển thị avatar

`Avatar` là thành phần duy nhất chịu trách nhiệm ghép ảnh đại diện và khung trang trí. Wrapper của component phải bao trọn kích thước thực tế của khung, trong khi phần ảnh đại diện giữ kích thước `AVATAR_BOX` hiện tại.

Công thức layout:

- Avatar hình tròn nội dung giữ kích thước md/lg/xl như hiện tại.
- Khi có khung trang trí, wrapper phải rộng và cao hơn ảnh theo đúng `AVATAR_FRAME_SCALE`.
- Ảnh đại diện và ảnh khung căn giữa trong wrapper.
- Huy hiệu cấp độ vẫn nằm ở góc phần avatar nội dung nhưng không làm thay đổi wrapper khung.

Không lặp lại việc vẽ khung trong `PostDetailView` hoặc các màn bình luận khác. Bình luận chỉ truyền `avatarDataUrl` và `avatarFrameUrl` vào `Avatar`, giống các màn dùng DTO người dùng khác.

## Layout bình luận

Mỗi dòng bình luận có hai cột:

- Cột trái là wrapper avatar đã tính kích thước khung đầy đủ và không tràn sang văn bản, tên hoặc nút xoá.
- Cột phải là khối nội dung dùng `min-w-0 flex-1` để tên và nội dung tự xuống dòng an toàn trên màn hình nhỏ.

Khung trang trí không che ảnh đại diện ở vùng trong và không được vượt ra ngoài wrapper đã cấp. Hai dòng bình luận liên tiếp giữ khoảng cách dọc đủ để khung không chạm nội dung của dòng kế tiếp.

## Sắp xếp bình luận

- Thứ tự mặc định khi mở chi tiết bài là mới nhất lên đầu.
- Thay đổi thứ tự chỉ ảnh hưởng đến thứ tự hiển thị trong dữ liệu chi tiết bài hiện tại; API không thay đổi contract và không cần truy vấn bổ sung.
- Một nút icon đặt cạnh tiêu đề “Bình luận (n)”.
- Khi đang mới nhất lên đầu, tooltip và nhãn truy cập mô tả hành động tiếp theo: chuyển sang cũ nhất lên đầu.
- Khi đang cũ nhất lên đầu, tooltip và nhãn truy cập mô tả hành động tiếp theo: chuyển sang mới nhất lên đầu.
- Không hiển thị chữ mô tả ngoài giao diện; dùng tooltip native `title`, có thể dùng tooltip component nếu ứng dụng đã có component chung phù hợp.
- Biểu tượng chỉ thay đổi hướng theo thứ tự hiện tại và phải hỗ trợ bàn phím, focus ring và trạng thái pressed tương ứng.

## Luồng dữ liệu và cập nhật

Backend đã cung cấp toàn bộ bình luận và trường thời gian `createdAt`; frontend đảo danh sách theo `createdAt` để đổi thứ tự:

- Mới nhất: giảm theo `createdAt`, rồi dùng `id` làm thứ tự phụ ổn định nếu hai bình luận trùng thời gian.
- Cũ nhất: tăng theo `createdAt`, dùng cùng thứ tự phụ ổn định theo chiều ngược lại phù hợp.

Sau khi thêm hoặc xoá bình luận, bộ cache vẫn giữ thứ tự đã chọn và danh sách được sắp lại theo cùng quy tắc.

## Đa ngôn ngữ và truy cập

Mọi nhãn mới đi qua `t()`:

- Tooltip mới nhất lên đầu/cũ nhất lên đầu.
- Nhãn truy cập cho nút chuyển thứ tự.

Không hiển thị chuỗi chỉ dành cho tooltip trong giao diện thường. Icon không dùng emoji hoặc ký tự Unicode thay cho icon hệ thống.

## Trường hợp lỗi

- Bình luận không có `createdAt` hợp lệ sẽ được xử lý theo thứ tự dữ liệu an toàn thay vì làm vỡ render.
- Không thay đổi hoặc xoá dữ liệu backend vì toggle chỉ là trạng thái hiển thị phía frontend.
- Nếu tải chi tiết bài thất bại, trạng thái bình luận và nút sắp xếp không được làm thay đổi cache khác.

## Kiểm tra

- Kiểm tra avatar có khung và không khung trong nhiều kích thước hiển thị bình luận.
- Kiểm tra khung không che avatar nội dung, không vượt sang tên, nội dung, nút xoá hoặc dòng kế tiếp.
- Kiểm tra desktop và mobile, gồm nội dung dài và tên dài.
- Kiểm tra toggle mới nhất/cũ nhất, trạng thái tooltip và thao tác bằng bàn phím.
- Sau khi thêm/xoá bình luận, thứ tự hiện tại vẫn được giữ.
- Chạy frontend typecheck và kiểm tra i18n.
