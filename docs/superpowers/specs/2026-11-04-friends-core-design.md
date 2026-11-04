# Thiết kế tính năng Bạn bè — Giai đoạn lõi

Ngày: 2026-11-04

## Mục tiêu và phạm vi

Giai đoạn lõi bổ sung quan hệ bạn bè vào ENG//HABIT theo cơ chế lời mời hai chiều, trang quản lý bạn bè, modal hồ sơ người khác và bảng xếp hạng theo nhóm bạn bè.

Nhắn tin đầy đủ (chat realtime, ảnh/tệp, emoji và push) được tách sang Giai đoạn 2. Trong menu ba chấm của Giai đoạn lõi, hành động Nhắn tin chưa được kích hoạt. Không hiện nút nhắn tin gây hiểu sai chức năng; bổ sung sau khi module chat hoàn tất.

## Quyết định đã chốt

- Mỗi người chỉ thấy bạn bè ACTIVE của vai trò USER; tài khoản quản trị hoặc bị khoá không tham gia mạng bạn bè.
- Lời mời cần người nhận chấp nhận.
- Một quan hệ lưu một dòng duy nhất cho mỗi cặp người dùng và có trạng thái `PENDING` hoặc `ACCEPTED`. Từ chối, thu hồi và hủy kết bạn xoá dòng tương ứng thay vì giữ trạng thái lịch sử riêng trong module này.
- Mã công khai dài 8 ký tự, ký tự không dễ nhầm lẫn (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), unique và tạo ngẫu nhiên bằng `crypto.randomInt`/random bytes phía backend.
- Trang `/friends` chỉ dành cho người học. Nhãn sidebar, route và breadcrumb đều là `Bạn bè`.
- Có 4 tab: `Bạn hệ thống`, `Tìm bạn`, `Lời mời nhận`, `Đã gửi`.
- ID công khai chỉ hiện trong modal hồ sơ/chi tiết người dùng và câu trả lời tìm theo ID. Không đưa ID vào danh sách chung, bài viết, bình luận hoặc bảng xếp hạng.
- ID công khai được giữ nguyên sau khi tạo và không cho người dùng tự sửa trong phiên này.

## Mô hình dữ liệu

Thêm vào `User`:

- `publicId: String` unique với độ dài 8 ký tự.

Thêm model `Friendship`:

- `id: Int` tự tăng.
- `requesterId` là người gửi lời mời.
- `addresseeId` là người nhận lời mời.
- `pairKey` là chuỗi `<minUserId>:<maxUserId>` dùng cho unique DB của cặp.
- `status: FriendshipStatus` gồm `PENDING`, `ACCEPTED`.
- `createdAt`, `updatedAt`, `acceptedAt` nullable.
- Quan hệ tới hai dòng `User`.
- `@@unique([pairKey])`, không cho tạo hai dòng cho cùng một cặp bất kể chiều lời mời.

Không thêm quan hệ ACCEPTED đảo chiều. Khi truy vấn, luôn dùng điều kiện theo cả hai chiều:

```text
OR: requesterId = me, addresseeId = me
```

và cờ `status = ACCEPTED`. Khi gửi lời, service chuẩn hoá cặp theo ID nhỏ/lớn và dùng `pairKey` làm unique DB. Nếu cặp đã có dòng PENDING, thêm lời mời ngược sẽ trả 409 thay vì tạo dòng thứ hai; người nhận hiện tại mới là người duy nhất được chấp nhận dòng đó.

Từ chối là xoá dòng PENDING bởi người nhận. Thu hồi là xoá dòng PENDING bởi người gửi. Hủy kết bạn là xoá dòng ACCEPTED bởi một trong hai bên.

## API backend

Tất cả API `/friends` yêu cầu vai trò `USER` và chỉ truy cập quan hệ liên quan tới chính người gọi.

- `GET /friends`: danh sách bạn đã ACCEPTED, hỗ trợ `search` theo tên hiển thị.
- `GET /friends/requests/incoming`: lời mời đang nhận.
- `GET /friends/requests/outgoing`: lời mời đã gửi.
- `GET /friends/search?publicId=...`: tìm chính xác theo mã công khai và không trả người đang bị khoá.
- `GET /friends/users/:publicId/profile`: thông tin hồ sơ công khai và trạng thái quan hệ với người gọi.
- `POST /friends/requests/:publicId`: gửi lời mời.
- `POST /friends/requests/:id/accept`.
- `DELETE /friends/requests/:id`: người gửi thu hồi hoặc người nhận từ chối.
- `DELETE /friends/:userId`: hủy kết bạn.

Không trả 403 cho tài khoản/ID không có quyền xem; user không tồn tại, không ACTIVE hoặc không được phép xem trả 404.

DTO hồ sơ dùng chung:

- `publicId`, `id` nội bộ không rời API trừ trường hợp endpoint hiện tại đã dùng.
- tên, avatar, khung avatar nếu cửa hàng đang bật, ngày tham gia.
- cấp độ và tiến độ XP của người đó.
- chuỗi hiện tại và dài nhất; tổng hoạt động tháng hiện tại.
- trạng thái quan hệ với người xem: `NONE`, `INCOMING_PENDING`, `OUTGOING_PENDING`, `FRIENDS`.

## Frontend

### Mục Bạn bè và trang

Thêm `/friends` vào `Learner`, sidebar, `TRAILS` và i18n. Trang có `PageHeader`, tab URL hoặc query để quay lại đúng tab sau khi dialog thao tác; mặc định `?tab=friends` (hoặc tab đầu tiên nếu không có tham số).

- Bạn hệ thống: danh sách theo tên, avatar, cấp độ, chuỗi; ô tìm kiếm local client hay query tuỳ kích thước danh sách; menu ba chấm với thao tác Hủy kết bạn.
- Tìm bạn: ô nhập mã công khai, kết quả người dùng kèm avatar/tên/cấp độ và nút mở modal hoặc gửi lời mời.
- Lời mời nhận: danh sách người gửi với Chấp nhận/Từ chối.
- Đã gửi: danh sách người nhận với Thu hồi.

Các thao tác thay đổi quan hệ phải cập nhật cùng cache friends/requests/profile để bốn màn không lệch. Hủy kết bạn và từ chối/thu hồi dùng `useConfirm`, không dùng dialog trình duyệt.

### Modal trang cá nhân người khác

Tái dùng bản đọc của trang cá nhân thay vì mở route riêng. Modal chứa avatar, tên, mã công khai, ngày tham gia, cấp độ, chuỗi và tiến độ học tập. Không hiển thị biểu mẫu cập nhật, đổi mật khẩu, avatar, thiết lập nhắc nhở hoặc vật phẩm.

Các Avatar và tên người dùng là nút truy cập nhất quán ở:

- cộng đồng: bài viết và bình luận;
- bảng xếp hạng;
- trang Bạn bè và kết quả tìm bạn;
- nơi khác hiện `PostAuthor` hoặc người dùng có avatar trong tương lai.

Component trung tâm `UserProfileDialog` nhận `publicId`, đóng một chỗ logic tải profile và quan hệ.

### Bảng xếp hạng bạn bè

Mở rộng schema bảng xếp hạng `scope: 'all' | 'friends'`.

- Không thay đổi kết quả mặc định (`scope=all`).
- Khi `scope=friends`, backend lấy danh sách người có quan hệ ACCEPTED với người gọi rồi mới tính điểm và thứ hạng trong tập đó.
- Có thể chọn scope bạn bè từ nhóm tab cạnh tiêu chí/metric hiện có.
- Người dùng không có bạn nào thấy empty state riêng; không tạo danh sách rỗng khiến nhìn như không có điểm trong khoảng này.

Backend tính xếp hạng đúng nguyên logic hiện tại trong cùng service, không tạo nguồn thống kê thứ hai. Giới hạn `visibleIds` cho khung và người xem.

## Bảo mật và tính nhất quán

- Public ID không thể dùng để truy cập bất kỳ dữ liệu private ngoài DTO hồ sơ.
- Mọi truy vấn chặn tài khoản không ACTIVE, đúng quan hệ hai chiều và đúng định danh user.
- Không tự suy luận friendship ở frontend.
- Không ghi `ActivityLog` khi kết bạn/lời mời/hủy bạn.
- Không nhân quyền hay cấp XP cho hành động bạn bè.
- Friendship không thay đổi nguồn chuỗi: chuỗi của hồ sơ luôn lấy từ dữ liệu/streak hiện có theo cùng quy tắc leaderboard và profile.

## Kiểm thử

Backend cần test đóng vai trò module `friends` cạnh service:

- tạo mã public unique và không chứa ký tự dễ nhầm.
- gửi một lần, chặn duplicate/chieu ngược/quan hệ đã tồn tại.
- chấp nhận chỉ người nhận.
- thu hồi/từ chối/hủy bạn chỉ người tham gia thực hiện.
- tìm chính xác Public ID và trả 404 khi không ACTIVE hoặc không tồn tại.
- leaderboard `scope=friends` chỉ chứa bạn ACCEPTED và tính rank đúng metric/range.

Frontend cần test tối thiểu luồng:

- bốn tab và cập nhật URL.
- gửi/chấp nhận/từ chối/hủy bạn cập nhật cache liên quan.
- modal không xuất các control chỉnh sửa của tài khoản khác.
- avatar/tên các màn nguồn mở đúng modal.

Sau thay đổi UI chạy `pnpm --filter @enghabit/fe check:i18n` và `pnpm --filter @enghabit/fe typecheck`.

## Ngoài phạm vi giai đoạn lõi

- Chat 1-1.
- Realtime/WebSocket, trạng thái typing, presence.
- Emoji.
- Gửi ảnh/tệp.
- Push mới riêng cho chat.

Các phần này sẽ có spec riêng khi chuyển sang Giai đoạn 2 sau khi Giai đoạn lõi được nghiệm thu.
