# Implementation plan: Bạn bè — Giai đoạn lõi

## 1. Shared contract

- Thêm enum/schema Friendship và DTO friends/profile.
- Mở rộng leaderboard query bằng `scope: all | friends`.
- Export mọi type mới qua shared index.
- Xây `publicIdSchema` và schema input cho search/request.

## 2. Database

- Thêm `User.publicId` unique 8 ký tự.
- Thêm model `Friendship`, enum `FriendshipStatus`, relation hai chiều tới User và unique `pairKey`.
- Viết migration Prisma.
- Lưu ý seed và script tạo public ID cho toàn user hiện có qua migration/service bootstrap.

## 3. Backend module friends

- Scaffold routes → controller → service → schema.
- Chặn route bằng role USER ngay router.
- Triển khai danh sách bạn, lời mời nhận/gửi, tìm ID, xem profile, gửi lời mời, chấp nhận, từ chối, thu hồi, hủy kết bạn.
- Sinh public ID bằng crypto, retry khi collision.
- Mọi kiểm tra quan hệ dùng cặp `pairKey`, transaction và unique DB.

## 4. Public profile data

- DTO profile gồm avatar, khung avatar, tên, ngày tham gia, level/XP/streak, hoạt động tháng và friendship status.
- Không trả email, timezone, vật phẩm hoặc dữ liệu cài đặt private.
- Trả 404 cho user không tồn tại hoặc không ACTIVE/không thuộc USER.

## 5. Leaderboard friends

- Mở rộng shared schema và API query với scope.
- Lọc tập user trước khi group ActivityLog và xếp hạng.
- Không thay đổi mặc định all.

## 6. Frontend friends

- Scaffold feature friends với API, hooks, types và components.
- Thêm route `/friends`, sidebar và breadcrumb, i18n, learner guard, error boundary.
- Trang có URL tabs: friends, find, incoming, outgoing.
- Thêm dialog xác nhận hủy/từ chối/thu hồi; đồng bộ TanStack Query keys sau mỗi mutation.

## 7. UserProfileDialog

- Component dùng chung nhận publicId và hiển thị read-only profile.
- Nối avatar/tên trong community, comments và leaderboard.
- Tối thiểu modal biết mở từ friends/search cũng hoạt động.
- Các nút quan hệ gọi friends mutations và cập nhật dialog/list.

## 8. Leaderboard UI

- Thêm scope bạn bè không ảnh hưởng metric/range hiện có.
- Tạo empty state riêng khi chưa có bạn hoặc bạn bè chưa có điểm.

## 9. Verification

- Prisma format/generate và typecheck backend/shared/frontend.
- Bổ sung unit test service xung đột cặp và quyền thao tác.
- Chạy i18n và frontend typecheck.
- Chạy targeted typecheck/build để phát hiện import/export thiếu.
