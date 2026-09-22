# Module `admin` — Khu quản trị hệ thống

> **Mã nguồn:** `be/src/modules/admin/` (`admin.routes.ts`, `admin.service.ts`,
> `admin-group.service.ts`, `admin-study-set.service.ts`, `admin-shop.service.ts`,
> `admin-audit.service.ts`), `shared/src/constants/admin-audit.ts`,
> `fe/src/features/admin/components/AdminLogTabs.tsx`
> **Màn hình:** `/admin`, `/admin/users`, `/admin/requests`, `/admin/access`, `/admin/content`,
> `/admin/content/:id`, `/admin/study-sets`, `/admin/groups`, `/admin/shop`, `/admin/features`,
> `/admin/announcements`; mỗi màn quản lý có tab **Nhật ký** (`?tab=log`)
> **Cờ tính năng:** không có · **Quyền:** mọi route `/admin/*` qua `requireAuth` + `requireRole(ADMIN)`

## 1. Vai trò

Quản trị viên **vận hành hệ thống, không phải người học**: không có streak, XP, xu, nhắc nhở học.
Đăng nhập bằng tài khoản `ADMIN` là vào thẳng `/admin`. Module này phần lớn là **lớp điều phối**:
nhiều màn gọi lại service của module sở hữu dữ liệu (`auth`, `topics`, `notifications`,
`feature-flags`, `shop`) thay vì tự viết nghiệp vụ thứ hai.

## 2. Dữ liệu

Module sở hữu đúng một bảng — `admin_audit_logs` (nhật ký thao tác, mục 3.11). Ngoài ra nó đọc
gần như mọi bảng và ghi vào:

| Bảng | Ghi gì |
| --- | --- |
| `admin_audit_logs` | Chỉ thêm: `actor_id`, `actor_name`, `action`, `target_type`, `target_id`, `target_label`, `changes` (JSON), `note`, `created_at` |
| `users`, `refresh_tokens` | Vai trò, trạng thái khoá, xoá tài khoản; thu hồi token khi khoá |
| `topics`, `vocabularies` | Bộ Hệ thống (`owner_id` null); `blocked_*` của bộ người học |
| `study_set_reports` | Bỏ qua / khép báo cáo |
| `groups` | `blocked_*` |
| `shop_item_types`, `shop_items`, `shop_item_images` | Danh mục cửa hàng |
| `feature_flags` | Qua `feature.service.setEnabled` |
| `password_reset_requests` | Qua `password-reset.service` |
| `notifications` | Qua `createNotification` / `createAnnouncement` |

## 3. Chức năng và cách hoạt động

### 3.1 Tổng quan hệ thống — `GET /admin/overview`

Quy mô người dùng (tổng, quản trị viên, bị khoá, mới 7/30 ngày), người **hoạt động** 1/7/30 ngày
(người có `activity_logs`), tỷ lệ giữ chân 7 ngày, cơ cấu hoạt động theo 4 loại, hoạt động 30 ngày
theo `local_date`, top 5 người học, kho nội dung (số bộ, số thẻ), lượt đăng nhập và thất bại
7 ngày, phiên đang mở (refresh token còn hạn), uptime, phiên bản Node, kết nối DB (`SELECT 1`).

Giao diện đọc từ trên xuống theo thứ tự việc của người vận hành:

1. **Hệ thống có ổn không** — huy hiệu database ở tiêu đề và **một dải bốn con số**: Người dùng,
   Hoạt động 7 ngày, Học trong 24 giờ, Phiên đang mở.
2. **Có gì cần xử lý** — thẻ **Việc cần xử lý** gồm yêu cầu cấp lại mật khẩu chờ duyệt, báo cáo bộ
   thẻ chờ xử lý, đăng nhập thất bại 7 ngày; mỗi dòng dẫn thẳng tới màn xử lý và chuyển sang
   trạng thái "đã xong" khi hàng chờ trống. Hai hàng chờ lấy số từ **chính API danh sách** của màn
   xử lý (`pageSize = 1`, đọc `total`) — không có endpoint đếm riêng nên không lệch được.
3. **Người học dùng thế nào** — xu hướng 30 ngày, cơ cấu hoạt động, người học tích cực nhất, số
   liệu tra cứu (quản trị viên, mới 30 ngày, bị khoá, kho nội dung).

### 3.2 Tài khoản — `/admin/users`

| Endpoint | Quy tắc |
| --- | --- |
| `GET /admin/users` | Tìm theo tên, tên tài khoản, email; lọc vai trò, trạng thái; sắp xếp; phân trang |
| `GET /admin/users/:id` | Hồ sơ + số hoạt động theo loại, chuỗi, số thói quen/mục tiêu, phiên đang mở, biểu đồ 10 ngày (`statistics.getDailyStats` theo múi giờ **của người được xem**), 30 sự kiện gần nhất (trộn đăng nhập và hoạt động) |
| `PATCH /admin/users/:id/role` | Không tự bỏ quyền mình; không hạ quyền **admin hoạt động cuối cùng** |
| `PATCH /admin/users/:id/status` | Không tự khoá mình; không khoá admin cuối cùng. Khoá → **thu hồi mọi refresh token** |
| `DELETE /admin/users/:id` | Không tự xoá; không xoá admin cuối cùng. **Xoá cứng**, cascade |

Không có endpoint đặt mật khẩu hộ người dùng (đã gỡ, không thêm lại).

### 3.3 Yêu cầu cấp lại mật khẩu — `/admin/requests`

Nối route vào `auth/password-reset.service`: tab Yêu cầu (chờ lâu nhất lên đầu), tab Nhật ký (vừa
xử lý lên đầu), duyệt, từ chối kèm lý do. Chi tiết ở `auth.md` mục 3.6.

### 3.4 Lượt truy cập — `/admin/access`

`GET /admin/access/overview?days=1..90` (lượt đăng nhập thành công/thất bại theo ngày, phiên đang
mở) và `GET /admin/access/logs` (nhật ký kèm IP, user-agent, lọc thành công/thất bại). Nguồn duy
nhất là `login_events`, gom theo **ngày giờ máy chủ** (sự kiện kỹ thuật, không phải "ngày học").

### 3.5 Nội dung học tập — `/admin/content`, `/admin/content/:id`

Đọc qua `/topics` (chỉ bộ Hệ thống), ghi qua `/admin/topics` và `/admin/vocabulary`. Mọi thao tác
kiểm `owner_id` null — quản trị viên không sửa được bộ người học.

- Danh sách hiện **y như Thư viện** của người học (cùng `StudySetCard`, tác giả luôn là "Hệ
  thống"), có ô tìm theo tên/mô tả lọc ngay trên máy. Bấm một bộ mở `/admin/content/:id` để sửa
  bộ, thêm/sửa/xoá thẻ, xoá bộ.
- Bộ Hệ thống **luôn công khai**: biểu mẫu dùng chung với Thư viện ở chế độ `publicOnly` (không có
  lựa chọn chế độ), backend ghi `visibility = PUBLIC` tường minh lúc tạo.
- Đây là CÙNG dòng `topics` người học đọc ở tab Khám phá — sửa ở đây là bên đó đổi ngay, không có
  bản sao nào để đồng bộ. Chi tiết ở `library.md` mục 3.6.

### 3.6 Kiểm duyệt bộ thẻ — `/admin/study-sets`

| Endpoint | Quy tắc |
| --- | --- |
| `GET /admin/study-set-reports` | Danh sách báo cáo theo trạng thái |
| `GET /admin/study-sets/:id` | Xem bộ và thẻ |
| `POST /admin/study-set-reports/:id/dismiss` | Chỉ báo cáo đang chờ; `DISMISSED`, nhả `pending_key`; báo người báo cáo |
| `POST /admin/study-sets/:id/block` | **Bắt buộc lý do**. Không chặn bộ Hệ thống. Transaction: đặt `blocked_*` và khép **mọi** báo cáo đang chờ của bộ (`RESOLVED`). Báo chủ bộ `STUDY_SET_BLOCKED` và từng người báo cáo |
| `POST /admin/study-sets/:id/unblock` | Xoá `blocked_*`; báo chủ bộ `STUDY_SET_UNBLOCKED` |

Không có xoá bộ thẻ phía quản trị.

### 3.7 Quản lý nhóm — `/admin/groups`

Chỉ ba việc: **xem** (danh sách, chi tiết, trưởng nhóm, số yêu cầu chờ, bài gần nhất), **cảnh báo**
(`GROUP_WARNING` tới mọi thành viên), **chặn / mở chặn** (bắt buộc lý do; báo mọi thành viên).
Không xoá nhóm, không đọc bài, không duyệt yêu cầu vào nhóm.

### 3.8 Cửa hàng — `/admin/shop`

CRUD loại, vật phẩm, ảnh. Không xoá được loại còn vật phẩm, hay vật phẩm đã có người mua — chỉ tắt
`is_active`. Không chịu cờ `SHOP`. Chi tiết ở `shop.md`.

### 3.9 Tính năng — `/admin/features`

Nối vào `feature.service`. Chi tiết ở `feature-flags.md`.

### 3.10 Gửi thông báo — `/admin/announcements`

Xem trước số người nhận, gửi tới tất cả hoặc theo vai trò. Chi tiết ở `notifications.md`.

### 3.11 Nhật ký thao tác — tab **Nhật ký** trong từng màn quản lý

Mọi thao tác ghi của quản trị viên được ghi lại: ai, lúc nào, làm gì, trên đối tượng nào, đổi
trường nào từ giá trị nào sang giá trị nào.

**Ghi — `recordAdminAction` (`admin-audit.service.ts`)**, nơi duy nhất ghi bảng:

1. Service của từng module gọi ngay sau lệnh ghi chính, **trong cùng transaction** khi được
   (truyền `tx`). Thao tác xoá ghi **trước** lệnh xoá — xoá xong không còn tên để chụp.
2. Chụp **tên** lúc thao tác: `actor_name` = "Tên (@username)", `target_label` = tên đối tượng.
   Tài khoản quản trị bị xoá sau đó thì `actor_id` về null nhưng tên vẫn còn.
3. `target_type` suy ra từ `action` qua `AUDIT_ACTION_TARGET` — chỗ gọi không tự truyền, nên không
   có dòng "xoá vật phẩm" mà loại lại là "chủ đề".
4. `changes` chỉ chứa trường **thật sự đổi** (`diffFields`; không có gì đổi thì không ghi dòng
   nào). Tạo mới ghi "trống → giá trị" (`createdFields`). Giá trị ép về kiểu nguyên thuỷ, chuỗi dài
   cắt còn 300 ký tự; không bao giờ ghi blob — ảnh vật phẩm chỉ ghi có / không có ảnh
   (`image: { from: false, to: true }`).
5. `action` và `target_type` là **chuỗi**, danh mục nằm trong mã nguồn — thêm thao tác mới không
   phải migrate enum; FE có nhánh mặc định cho giá trị lạ.

**Đọc** — hai route, không có sửa hay xoá (kể cả với quản trị viên):

| Endpoint | Quy tắc |
| --- | --- |
| `GET /admin/audit-logs?targetTypes=TOPIC,VOCABULARY&actorId=&page=&pageSize=` | Mới nhất trước (`created_at`, rồi `id`); `targetTypes` nhận nhiều loại, cách nhau bằng dấu phẩy |
| `GET /admin/audit-logs/actors?targetTypes=` | Người đã có thao tác trên đúng các loại đó — cho ô lọc "Người thực hiện" |

**Giao diện** — không có màn riêng. `AdminLogTabs` bọc nội dung mỗi màn quản lý thành hai tab
(Quản lý / Nhật ký), tab nằm trên URL (`?tab=log`) để nút Quay lại và liên kết dán cho đồng nghiệp
về đúng tab. Ở tab Nhật ký, nút ở tiêu đề (Tạo bộ thẻ, Thêm loại…) bị ẩn (`useAdminLogTab`) vì hộp
thoại nó mở nằm trong tab Quản lý.

| Màn | Loại đối tượng | Thao tác được ghi |
| --- | --- | --- |
| Tài khoản | `USER` | Đổi vai trò, khoá, mở khoá, xoá |
| Nội dung học tập | `TOPIC`, `VOCABULARY` | Tạo, sửa, xoá bộ và thẻ |
| Kiểm duyệt bộ thẻ | `STUDY_SET`, `STUDY_SET_REPORT` | Chặn, mở chặn, bỏ qua báo cáo |
| Quản lý nhóm | `GROUP` | Cảnh báo, chặn, mở chặn |
| Quản lý cửa hàng | `SHOP_TYPE`, `SHOP_ITEM` | Tạo, sửa, xoá loại và vật phẩm; thay / xoá ảnh |
| Quản lý tính năng | `FEATURE` | Bật, tắt |
| Gửi thông báo | `ANNOUNCEMENT` | Gửi (kèm đối tượng nhận và số người nhận) |
| Cộng đồng (chỉ quản trị viên thấy tab) | `POST`, `COMMENT` | Xoá bài / bình luận **của người khác** |

`RESET_REQUEST` (duyệt / từ chối yêu cầu cấp lại mật khẩu) cũng được ghi, nhưng màn Quản lý yêu cầu
giữ tab Nhật ký riêng của nó — đọc thẳng bảng `password_reset_requests`.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `auth` | gọi đi | `password-reset.service`, `toPublicUser` | Duyệt yêu cầu, hiển thị hồ sơ |
| `statistics` | gọi đi | `getDailyStats` | Biểu đồ ở chi tiết tài khoản |
| `topics` | gọi đi | `topic.service` | Bộ Hệ thống |
| `library` (FE) | dùng lại | `StudySetCard`, `StudySetFormDialog`, `CardFormView` | Màn Nội dung học tập hiện như Thư viện |
| `topics`, `auth`, `notifications`, `feature-flags`, `community` | được gọi | `recordAdminAction` | Mỗi module tự ghi nhật ký thao tác của quản trị viên trong service của nó |
| `notifications` | gọi đi | `createNotification`, `createAnnouncement`, `countAudience` | Mọi thông báo quản trị |
| `feature-flags` | gọi đi | `listForAdmin`, `setEnabled` | Bật/tắt tính năng |
| `groups` | gọi đi | `toBlockInfo` | Hiển thị trạng thái chặn |
| `shop` | gọi đi | `imageUrlFor`, `getEquippedFrameUrls` | Danh mục cửa hàng |
| `library`, `study` | tác động | `topics.blocked_at` | Chặn bộ thẻ ẩn nó khỏi mọi người trừ chủ |
| `community` | tác động | Quyền xoá mọi bài, `adminBypass` | Kiểm duyệt diễn đàn |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Khoá tài khoản | Cắt mọi phiên; không đăng nhập được; bộ công khai của họ biến khỏi Khám phá; rời bảng xếp hạng; dữ liệu học giữ nguyên |
| Đổi vai trò USER → ADMIN | Mất quyền mọi API học tập (`requireRole(USER)`), rời bảng xếp hạng, cron không nhắc nữa; hiệu lực ở access token kế tiếp (≤ 15 phút) |
| Xoá tài khoản | Cascade: thói quen, mục tiêu, việc cần làm, `activity_logs`, streak, tiến độ SRS, sổ cái xu, vật phẩm, thông báo, bài đăng, bình luận, **bộ thẻ họ sở hữu** (kéo theo tiến độ của mọi người học bộ đó). Giữ lại: `login_events` (user_id → null), nhóm họ tạo (`created_by_id` → null) |
| Chặn bộ thẻ | Bộ biến khỏi Thư viện, Ôn tập, số thẻ tới hạn, lời nhắc, lịch sử ôn của mọi người trừ chủ; nhóm đang chia sẻ bộ cũng ẩn nó |
| Chặn nhóm | Mọi nội dung nhóm khoá với mọi thành viên (xem `groups.md`) |
| Sửa / xoá thẻ bộ Hệ thống | Như chủ bộ sửa / xoá thẻ: xoá thẻ cascade tiến độ của mọi người học |
| Tắt tính năng | Xem `feature-flags.md` |

## 6. Quy tắc bắt buộc giữ khi sửa

1. Mọi route `/admin/*` qua role-guard.
2. Không tự hạ quyền / khoá / xoá chính mình; không hạ quyền, khoá hay xoá admin hoạt động cuối cùng.
3. Khoá tài khoản phải thu hồi refresh token.
4. Không đặt mật khẩu hộ người dùng.
5. Không xoá nhóm, không xoá bộ thẻ người học, không xoá vật phẩm đã bán — chặn / tắt thay vì xoá.
6. Lý do chặn nhóm và bộ thẻ bắt buộc và viết cho người dùng cuối đọc.
7. Những chỗ dùng chung hai vai trò (sidebar, thanh trên cùng, trang cá nhân) phải tự ẩn khối học
   tập và không gọi API người học khi là quản trị viên.
8. Thêm thao tác ghi mới cho quản trị viên là phải gọi `recordAdminAction` (cùng transaction), thêm
   giá trị vào `AdminAction` và nhãn vào `fe/src/features/admin/audit-labels.ts` + `en.ts`. Màn
   quản lý mới thì bọc nội dung trong `AdminLogTabs` với đúng `targetTypes`.
9. `admin_audit_logs` chỉ thêm — không thêm route sửa hay xoá nhật ký.

## 7. Điểm cần lưu ý

- **Xoá tài khoản là xoá cứng** nằm cạnh "khoá" trên cùng màn hình nhưng hậu quả không đảo ngược.
  Nhật ký thao tác giữ lại ai đã xoá ai (kèm tên lúc xoá), nhưng dữ liệu thì không lấy lại được.
- Nhật ký thao tác không có hạn lưu và không có đường dọn — bảng chỉ lớn dần. Ở quy mô hiện tại
  là chấp nhận được; cần chính sách lưu trữ nếu số quản trị viên tăng mạnh.
- `countActiveUsers` và `dailyActivity` kéo dòng về bộ nhớ rồi mới đếm; đây là trần mở rộng khi dữ
  liệu lớn.
- Cột chuỗi ở danh sách / chi tiết tài khoản và top người học đọc thẳng cache `user_streaks`.
