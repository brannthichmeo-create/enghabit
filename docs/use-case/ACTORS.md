# Actor của ENG//HABIT

Khảo sát ngày 20/09/2026. Actor chỉ được xác định khi có căn cứ trong mã nguồn, cơ sở dữ liệu
hoặc giao diện; căn cứ ghi ở từng mục.

## 1. Tổng hợp

| Actor ID | Tên | Tên tiếng Anh | Loại | Vai trò | Số use case trực tiếp | Kế thừa thêm |
|---|---|---|---|---|---|---|
| ACT-01 | Khách | Guest | Primary Actor | Người chưa đăng nhập | 4 | — |
| ACT-02 | Người dùng đã xác thực | Authenticated User | Generalization Actor (trừu tượng) | Bất kỳ ai đã đăng nhập, không phân biệt vai trò | 16 | — |
| ACT-03 | Người học | Learner | Primary Actor | Tài khoản `role = USER` | 44 | 16 |
| ACT-04 | Trưởng nhóm | Group Leader | Primary Actor (chuyên biệt hoá của Người học) | Người học có `group_members.role = LEADER` trong một nhóm cụ thể | 8 | 60 |
| ACT-05 | Quản trị viên | Administrator | Primary Actor | Tài khoản `role = ADMIN` | 25 | 16 |
| ACT-06 | Bộ lập lịch hệ thống | System Scheduler | Primary Actor (tác nhân thời gian) | Hai tiến trình cron chạy trong backend | 3 | — |
| ACT-07 | OneSignal | Push Notification Service | External System (Supporting Actor) | Dịch vụ gửi thông báo đẩy bên ngoài | 2 | — |

"Số use case trực tiếp" đếm association (kể cả actor phụ). "Kế thừa thêm" đếm use case nhận
qua quan hệ generalization từ actor cha.

## 2. Chi tiết từng actor

### ACT-01 — Khách (Guest)

- **Loại:** Primary Actor
- **Vai trò:** Người chưa đăng nhập
- **Mô tả:** Người truy cập ba màn công khai để tạo tài khoản, đăng nhập hoặc lấy lại quyền truy cập.
- **Chức năng được phép (association trực tiếp, 4):** UC-AUTH-01 Đăng ký tài khoản; UC-AUTH-02 Đăng nhập; UC-AUTH-03 Yêu cầu cấp lại mật khẩu; UC-AUTH-04 Đặt mật khẩu mới sau khi được duyệt
- **Căn cứ xác định:**
  - `fe/src/routes/AppRoutes.tsx`: `/login`, `/register`, `/forgot-password` bọc `PublicOnly`
  - `be/src/modules/auth/auth.routes.ts`: `/register`, `/login`, `/password-reset/*` không có `requireAuth`

### ACT-02 — Người dùng đã xác thực (Authenticated User)

- **Loại:** Generalization Actor (trừu tượng)
- **Vai trò:** Bất kỳ ai đã đăng nhập, không phân biệt vai trò
- **Mô tả:** Actor cha trừu tượng, gom các chức năng mà cả Người học lẫn Quản trị viên cùng dùng. Không có tài khoản nào "chỉ là" actor này.
- **Chức năng được phép (association trực tiếp, 16):** UC-AUTH-05 Đăng xuất; UC-AUTH-06 Cập nhật thông tin cá nhân; UC-AUTH-07 Quản lý ảnh đại diện; UC-AUTH-08 Đổi mật khẩu; UC-COM-01 Xem và tìm bài viết; UC-COM-02 Xem chi tiết bài viết; UC-COM-03 Đăng bài viết; UC-COM-04 Bình luận bài viết; UC-COM-05 Thả tim bài viết; UC-COM-06 Xoá bài viết; UC-COM-07 Xoá bình luận; UC-COM-08 Tải tệp đính kèm; UC-NOTI-01 Xem thông báo; UC-NOTI-02 Đánh dấu thông báo đã đọc; UC-NOTI-03 Xoá thông báo; UC-NOTI-06 Đăng ký thiết bị nhận thông báo đẩy
- **Căn cứ xác định:**
  - `auth.routes.ts`: `/me`, `/me/avatar`, `/me/change-password`, `/logout` chỉ cần `requireAuth`, không `requireRole`
  - `notification.routes.ts`: danh sách, đọc, xoá thông báo chỉ cần `requireAuth`
  - `app.ts`: `/community` gắn `requireFeature(COMMUNITY, { adminBypass: true })` — mở cho cả hai vai trò

### ACT-03 — Người học (Learner)

- **Loại:** Primary Actor
- **Vai trò:** Tài khoản `role = USER`
- **Mô tả:** Người dùng cuối: học từ vựng, ôn tập, theo dõi thói quen và mục tiêu, nhận thưởng, tham gia cộng đồng và nhóm lớp.
- **Chức năng được phép (association trực tiếp, 44):** UC-LIB-01 Tìm kiếm bộ thẻ công khai; UC-LIB-02 Xem bộ thẻ của tôi; UC-LIB-03 Xem chi tiết bộ thẻ; UC-LIB-04 Quản lý bộ thẻ của tôi; UC-LIB-05 Nhập bộ thẻ mới từ tệp; UC-LIB-06 Quản lý thẻ trong bộ; UC-LIB-07 Nhập thẻ từ tệp vào bộ; UC-LIB-08 Chia sẻ liên kết bộ thẻ; UC-LIB-09 Báo cáo vi phạm bộ thẻ; UC-STU-01 Học bộ thẻ; UC-STU-02 Ôn tập thẻ theo lịch; UC-STU-03 Ôn nhanh (Cram); UC-STU-06 Xem thống kê học và ôn; UC-STU-07 Xem lịch sử ôn tập; UC-HAB-01 Quản lý thói quen; UC-HAB-02 Check-in thói quen; UC-HAB-03 Check-in bù thói quen; UC-HAB-04 Xem lịch sử và tỷ lệ hoàn thành thói quen; UC-HAB-05 Quản lý mục tiêu; UC-HAB-06 Xem tiến độ mục tiêu; UC-STAT-01 Xem tổng quan học tập; UC-STAT-02 Xem báo cáo học tập; UC-STAT-03 Xem bảng xếp hạng; UC-REW-01 Điểm danh nhận xu; UC-REW-02 Nhận thưởng nhiệm vụ ngày; UC-REW-03 Mua vật phẩm giữ chuỗi; UC-SHOP-01 Xem và tìm vật phẩm; UC-SHOP-02 Mua vật phẩm; UC-SHOP-03 Đánh dấu yêu thích vật phẩm; UC-SHOP-04 Xem kho vật phẩm; UC-SHOP-05 Sử dụng hoặc bỏ dùng vật phẩm; UC-SHOP-06 Xem ví xu; UC-GRP-01 Xem nhóm của tôi; UC-GRP-02 Tìm nhóm công khai; UC-GRP-03 Tìm nhóm bằng mã; UC-GRP-04 Tạo nhóm; UC-GRP-05 Tham gia nhóm; UC-GRP-06 Rời nhóm; UC-GRP-07 Xem bảng tin nhóm; UC-GRP-08 Đăng bài trong nhóm; UC-GRP-09 Xem tài liệu nhóm; UC-GRP-10 Xem bộ thẻ của nhóm; UC-NOTI-04 Cấu hình nhắc nhở; UC-NOTI-05 Quản lý mốc nhắc học
- **Kế thừa từ actor cha (16):** UC-AUTH-05, UC-AUTH-06, UC-AUTH-07, UC-AUTH-08, UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-04, UC-COM-05, UC-COM-06, UC-COM-07, UC-COM-08, UC-NOTI-01, UC-NOTI-02, UC-NOTI-03, UC-NOTI-06
- **Căn cứ xác định:**
  - `be/prisma/schema.prisma`: `enum UserRole { USER ADMIN }`
  - Các router `library`, `study`, `habits`, `goals`, `statistics`, `rewards`, `shop`, `leaderboard` gắn `requireRole(UserRole.USER)`
  - `AppRoutes.tsx`: guard `Learner` / `Gated`; UI kiểm chứng bằng tài khoản seed `user@enghabit.com`

### ACT-04 — Trưởng nhóm (Group Leader)

- **Loại:** Primary Actor (chuyên biệt hoá của Người học)
- **Vai trò:** Người học có `group_members.role = LEADER` trong một nhóm cụ thể
- **Mô tả:** Vai trò theo TỪNG nhóm, không phải vai trò hệ thống. Kế thừa mọi chức năng của Người học và có thêm quyền điều hành nhóm.
- **Chức năng được phép (association trực tiếp, 8):** UC-GRP-11 Cập nhật cài đặt nhóm; UC-GRP-12 Xoá nhóm; UC-GRP-13 Duyệt yêu cầu tham gia nhóm; UC-GRP-14 Thêm thành viên; UC-GRP-15 Xoá thành viên; UC-GRP-16 Phân quyền trưởng nhóm; UC-GRP-17 Chia sẻ bộ thẻ vào nhóm; UC-GRP-18 Gỡ bộ thẻ khỏi nhóm
- **Kế thừa từ actor cha (60):** UC-LIB-01, UC-LIB-02, UC-LIB-03, UC-LIB-04, UC-LIB-05, UC-LIB-06, UC-LIB-07, UC-LIB-08, UC-LIB-09, UC-STU-01, UC-STU-02, UC-STU-03, UC-STU-06, UC-STU-07, UC-HAB-01, UC-HAB-02, UC-HAB-03, UC-HAB-04, UC-HAB-05, UC-HAB-06, UC-STAT-01, UC-STAT-02, UC-STAT-03, UC-REW-01, UC-REW-02, UC-REW-03, UC-SHOP-01, UC-SHOP-02, UC-SHOP-03, UC-SHOP-04, UC-SHOP-05, UC-SHOP-06, UC-GRP-01, UC-GRP-02, UC-GRP-03, UC-GRP-04, UC-GRP-05, UC-GRP-06, UC-GRP-07, UC-GRP-08, UC-GRP-09, UC-GRP-10, UC-NOTI-04, UC-NOTI-05, UC-AUTH-05, UC-AUTH-06, UC-AUTH-07, UC-AUTH-08, UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-04, UC-COM-05, UC-COM-06, UC-COM-07, UC-COM-08, UC-NOTI-01, UC-NOTI-02, UC-NOTI-03, UC-NOTI-06
- **Căn cứ xác định:**
  - `schema.prisma`: `enum GroupMemberRole { LEADER MEMBER }`
  - `group.service.ts`: `assertLeader()` chặn sửa nhóm, xoá nhóm, duyệt yêu cầu, quản lý thành viên, chia sẻ bộ thẻ
  - UI `/groups/:id` với tài khoản trưởng nhóm: tab Thành viên, Yêu cầu, Cài đặt, nút Chia sẻ bộ thẻ vào nhóm

### ACT-05 — Quản trị viên (Administrator)

- **Loại:** Primary Actor
- **Vai trò:** Tài khoản `role = ADMIN`
- **Mô tả:** Người vận hành hệ thống. KHÔNG dùng chức năng học tập, streak, XP, xu, nhắc nhở, nhóm lớp.
- **Chức năng được phép (association trực tiếp, 25):** UC-ADM-01 Xem tổng quan hệ thống; UC-ADM-02 Tìm kiếm và lọc tài khoản; UC-ADM-03 Xem chi tiết tài khoản; UC-ADM-04 Thay đổi vai trò tài khoản; UC-ADM-05 Khoá hoặc mở khoá tài khoản; UC-ADM-06 Xoá tài khoản; UC-ADM-07 Xử lý yêu cầu cấp lại mật khẩu; UC-ADM-08 Xem nhật ký xử lý yêu cầu; UC-ADM-09 Xem lượt truy cập; UC-ADM-10 Quản lý chủ đề hệ thống; UC-ADM-11 Quản lý từ vựng hệ thống; UC-ADM-12 Xem báo cáo vi phạm bộ thẻ; UC-ADM-13 Xem chi tiết bộ thẻ bị báo cáo; UC-ADM-14 Chặn bộ thẻ; UC-ADM-15 Mở chặn bộ thẻ; UC-ADM-16 Bỏ qua báo cáo vi phạm; UC-ADM-17 Tìm kiếm và lọc nhóm; UC-ADM-18 Xem chi tiết nhóm; UC-ADM-19 Gửi cảnh báo vi phạm tới nhóm; UC-ADM-20 Chặn nhóm; UC-ADM-21 Mở chặn nhóm; UC-ADM-22 Quản lý loại vật phẩm; UC-ADM-23 Quản lý vật phẩm; UC-ADM-24 Bật hoặc tắt tính năng; UC-ADM-25 Gửi thông báo tới người dùng
- **Kế thừa từ actor cha (16):** UC-AUTH-05, UC-AUTH-06, UC-AUTH-07, UC-AUTH-08, UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-04, UC-COM-05, UC-COM-06, UC-COM-07, UC-COM-08, UC-NOTI-01, UC-NOTI-02, UC-NOTI-03, UC-NOTI-06
- **Căn cứ xác định:**
  - `admin.routes.ts`: `adminRoutes.use(requireAuth, requireRole(UserRole.ADMIN))`
  - `topic.routes.ts`: `requireRole(UserRole.ADMIN)`
  - UI kiểm chứng bằng `admin@enghabit.com`: đăng nhập vào thẳng `/admin`; mở `/library`, `/groups` bị đẩy về `/admin`

### ACT-06 — Bộ lập lịch hệ thống (System Scheduler)

- **Loại:** Primary Actor (tác nhân thời gian)
- **Vai trò:** Hai tiến trình cron chạy trong backend
- **Mô tả:** Tự khởi động use case theo lịch: nhắc học mỗi 15 phút, dùng vật phẩm giữ chuỗi mỗi 30 phút. Không đăng nhập.
- **Chức năng được phép (association trực tiếp, 3):** UC-REW-04 Tự động dùng vật phẩm giữ chuỗi; UC-NOTI-07 Gửi lời nhắc học; UC-NOTI-08 Cảnh báo chuỗi sắp đứt
- **Căn cứ xác định:**
  - `be/src/jobs/reminder.job.ts`: `cron.schedule('*/15 * * * *')`
  - `be/src/jobs/streak-freeze.job.ts`: `cron.schedule('*/30 * * * *')`

### ACT-07 — OneSignal (Push Notification Service)

- **Loại:** External System (Supporting Actor)
- **Vai trò:** Dịch vụ gửi thông báo đẩy bên ngoài
- **Mô tả:** Chỉ là kênh gửi. Không tự lên lịch. Nhận yêu cầu gửi từ Bộ lập lịch hệ thống.
- **Chức năng được phép (association trực tiếp, 2):** UC-NOTI-07 Gửi lời nhắc học; UC-NOTI-08 Cảnh báo chuỗi sắp đứt
- **Căn cứ xác định:**
  - `be/src/jobs/onesignal.client.ts`: `POST https://onesignal.com/api/v1/notifications`
  - `be/.env.example`: `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` (trống ở môi trường dev đã khảo sát)

## 3. Quan hệ kế thừa giữa actor

| Actor con | Actor cha | Căn cứ |
|---|---|---|
| Người học | Người dùng đã xác thực | Người học dùng được mọi chức năng chỉ cần `requireAuth` |
| Quản trị viên | Người dùng đã xác thực | Quản trị viên dùng được mọi chức năng chỉ cần `requireAuth` (UI: Trang cá nhân, Thông báo, Cộng đồng) |
| Trưởng nhóm | Người học | Trưởng nhóm là một dòng `group_members` của một Người học; `assertLeader` chỉ cộng thêm quyền |

**Người dùng đã xác thực** là actor trừu tượng: không tài khoản nào "chỉ là" actor này. Nó tồn
tại để các chức năng dùng chung (tài khoản cá nhân, cộng đồng, thông báo) chỉ vẽ một lần thay vì
nối hai lần tới Người học và Quản trị viên.

**Trưởng nhóm** là vai trò theo từng nhóm. Một người có thể là trưởng nhóm ở nhóm A và thành viên
thường ở nhóm B cùng lúc.

## 4. Quyền hạn theo vai trò hệ thống

Hệ thống có đúng hai vai trò lưu trong `users.role`: `USER` và `ADMIN` (`enum UserRole`).

| Nhóm chức năng | Người học (USER) | Quản trị viên (ADMIN) | Ghi chú |
|---|---|---|---|
| Tài khoản cá nhân (UC-AUTH-05…08) | Có | Có | Chung — gắn với actor cha |
| Cộng đồng (UC-COM-*) | Có | Có | Chung. Quản trị viên xoá được mọi bài và bình luận |
| Xem, đọc, xoá thông báo (UC-NOTI-01…03) | Có | Có | Chung |
| Đăng ký thiết bị push (UC-NOTI-06) | Có | Có | Chung — chỉ có API |
| Cấu hình nhắc nhở, mốc nhắc (UC-NOTI-04, 05) | Có | **Không** | API chặn `requireRole(USER)` |
| Thư viện, Học, Ôn tập, Thói quen, Mục tiêu, Thống kê, Phần thưởng, Cửa hàng | Có | **Không** | API chặn `requireRole(USER)` |
| Nhóm lớp (UC-GRP-*) | Có | **Không** | Chỉ chặn ở giao diện — API không có `requireRole(USER)` |
| Khu quản trị (UC-ADM-*) | **Không** | Có | API chặn `requireRole(ADMIN)` |

- **Chức năng chung hai vai trò:** UC-AUTH-05, UC-AUTH-06, UC-AUTH-07, UC-AUTH-08, UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-04, UC-COM-05, UC-COM-06, UC-COM-07, UC-COM-08, UC-NOTI-01, UC-NOTI-02, UC-NOTI-03, UC-NOTI-06.
- **Chỉ Người học:** 44 use case; cộng 8 use case khi là Trưởng nhóm.
- **Chỉ Quản trị viên:** 25 use case (UC-ADM-01…25).
- **Chỉ Khách:** UC-AUTH-01…04. Người đã đăng nhập mở các màn này bị đẩy về trang chủ.

## 5. Ứng viên đã xem xét nhưng KHÔNG coi là actor

| Ứng viên | Lý do loại |
|---|---|
| MySQL / Aiven | Hạ tầng lưu trữ, không trao đổi nghiệp vụ với hệ thống. |
| Render, Vercel | Nền tảng triển khai. |
| Clipboard trình duyệt | Chỉ là phương tiện của UC-LIB-08. |
| Nhà phát triển chạy script bảo trì | Công việc vận hành, không phải nghiệp vụ (xem `README.md` mục phạm vi). |
| Thành viên nhóm (`GroupMemberRole.MEMBER`) | Không có quyền nào ngoài quyền của Người học là thành viên — gộp vào Người học. |
