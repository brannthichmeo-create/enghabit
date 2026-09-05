# Luồng quên mật khẩu — tài liệu để thay thế

> **Mục đích của file này:** mô tả đầy đủ luồng quên mật khẩu đang chạy, để khi cần đổi
> sang luồng khác thì đọc file này là biết phải sửa những gì, giữ lại những gì, và mỗi
> ràng buộc hiện tại tồn tại vì lý do nào.
>
> Đọc **mục 6 (Đánh đổi)** trước khi thay đổi bất cứ điều gì liên quan tới an toàn — có
> vài ràng buộc trông như thừa nhưng đang gánh một rủi ro cụ thể.

Cập nhật: 05/09/2026.

---

## 1. Luồng hiện tại, tóm tắt

Không gửi email, không có mã xác thực. **Quản trị viên duyệt tay từng yêu cầu.**

```
Người dùng                         Hệ thống                        Quản trị viên
────────────────────────────────────────────────────────────────────────────────
bấm "Quên mật khẩu?"
nhập email HOẶC tên tài khoản
bấm "Xác nhận"          ───────►  tạo yêu cầu (PENDING)
                                  báo cho MỌI admin      ───────►  thấy thông báo
                                                                   vào /admin/requests
                                                                   tab "Yêu cầu"
                                                                        │
                                            ┌───────────────────────────┤
                                            ▼                           ▼
                                        Xác nhận                    Từ chối
                                       (APPROVED)              (REJECTED + lý do)
                                            │                           │
nhập lại tài khoản      ───────►  tra trạng thái  ◄────────────────────┘
                                            │
        ┌───────────────────────────────────┼──────────────────────┐
        ▼                                   ▼                      ▼
   PENDING                             APPROVED                REJECTED
   popup "đợi                       form đặt mật khẩu       hiện lý do
   quản trị viên                    mới → toast             + nút "Gửi lại
   xác nhận"                        "Đổi mật khẩu           yêu cầu"
                                    thành công"
                                    → về /login
```

Điểm cốt lõi của thiết kế: **người dùng chỉ làm đúng một hành động** — nhập tài khoản
của mình. Việc họ đang ở bước nào là do backend trả về, không phải do họ tự chọn. Nhờ
vậy không có đường nào để bấm nhầm sang bước chưa tới lượt.

---

## 2. Máy trạng thái

Một dòng trong bảng `password_reset_requests` chỉ đi một chiều:

```
                      ┌──────────► APPROVED ──► (dùng: used_at) ──► kết thúc
   (tạo) ──► PENDING ─┤
                      └──────────► REJECTED ──► (retry) ──► yêu cầu MỚI ở PENDING
```

- **Không có đường quay ngược.** Quản trị viên đã thao tác thì dòng đó khép lại. Muốn
  làm lại thì tạo **yêu cầu mới**, để tab Nhật ký giữ đủ dấu vết.
- Người dùng **luôn** được xét theo yêu cầu **mới nhất** của mình (`latestRequest`).

Bốn kết quả trả về cho phía người dùng (`PasswordResetOutcome`):

| Kết quả | Khi nào | Giao diện |
|---|---|---|
| `CREATED` | vừa tạo yêu cầu trong chính lời gọi này | thẻ xanh "Đã gửi yêu cầu" |
| `PENDING` | đã có yêu cầu chờ từ trước | **popup** "Đã gửi yêu cầu, đợi quản trị viên xác nhận" |
| `APPROVED` | đã duyệt, chưa dùng, chưa quá hạn | form đặt mật khẩu mới |
| `REJECTED` | bị từ chối và chưa bấm gửi lại | thẻ đỏ + lý do + nút "Gửi lại yêu cầu" |

`CREATED` và `PENDING` **cùng một trạng thái dữ liệu** nhưng phải khác câu chữ: người
vừa bấm gửi mà đọc được "đã gửi rồi, đợi đi" sẽ tưởng yêu cầu của mình có từ trước.

---

## 3. Bản đồ mã nguồn

Sửa luồng thì đây là toàn bộ danh sách file phải đụng tới.

### Cơ sở dữ liệu

| Chỗ | Nội dung |
|---|---|
| `be/prisma/schema.prisma` → `model PasswordResetRequest` | bảng yêu cầu |
| `be/prisma/schema.prisma` → `enum PasswordResetStatus` | `PENDING` / `APPROVED` / `REJECTED` |
| `be/prisma/schema.prisma` → `enum NotificationType` | có thêm `PASSWORD_RESET_REQUEST` |
| `be/prisma/schema.prisma` → `model User.username` | tên tài khoản, unique |
| `be/prisma/migrations/20260905020000_them_ten_tai_khoan_va_yeu_cau_cap_lai_mat_khau/` | migration viết tay (có bước điền `username` cho dữ liệu cũ) |

### Backend

| File | Vai trò |
|---|---|
| `be/src/modules/auth/password-reset.service.ts` | **toàn bộ nghiệp vụ**, cả phía người dùng lẫn phía quản trị viên |
| `be/src/modules/auth/auth.service.ts` → `findByIdentifier` | tra tài khoản theo email hoặc tên tài khoản; **dùng chung với đăng nhập** |
| `be/src/modules/auth/auth.service.ts` → `hashPassword` | băm mật khẩu, dùng chung để hai chỗ không lệch số vòng bcrypt |
| `be/src/modules/auth/auth.routes.ts` | 2 endpoint công khai (không `requireAuth`) |
| `be/src/modules/auth/auth.controller.ts` | `requestPasswordReset`, `confirmPasswordReset` |
| `be/src/modules/admin/admin.routes.ts` | 3 endpoint quản trị, gọi ngược sang service bên `auth` |

**Vì sao service nằm ở `auth` mà không phải `admin`:** hai nửa của cùng một luồng phải
dùng chung một định nghĩa "yêu cầu nào còn hiệu lực". Tách đôi thì hai nửa sẽ trôi ra
khỏi nhau. `admin.routes.ts` gọi sang service của module khác — điều này được CLAUDE.md
cho phép rõ ràng ("ưu tiên gọi service có sẵn của module khác").

### Shared

| File | Vai trò |
|---|---|
| `shared/src/schemas/password-reset.schema.ts` | toàn bộ hợp đồng: schema Zod, `PasswordResetOutcome`, `PasswordResetState`, `ResetRequestRow` |
| `shared/src/constants/enums.ts` → `PasswordResetStatus` | enum dùng chung |
| `shared/src/schemas/auth.schema.ts` → `usernameSchema` | luật đặt tên tài khoản |
| `shared/src/schemas/auth.schema.ts` → `loginSchema` | dùng `identifier`, không phải `email` |

### Frontend

| File | Vai trò |
|---|---|
| `fe/src/features/auth/components/ForgotPasswordPage.tsx` | màn hình 4 trạng thái |
| `fe/src/features/admin/components/AdminRequestsPage.tsx` | màn quản trị, 2 tab |
| `fe/src/features/auth/auth.api.ts` + `auth.hooks.ts` | gọi API phía người dùng |
| `fe/src/features/admin/admin.api.ts` + `admin.hooks.ts` | gọi API phía quản trị |
| `fe/src/shared/components/Modal.tsx` | hộp thoại, dùng cho popup PENDING và form lý do từ chối |
| `fe/src/routes/AppRoutes.tsx` | `/forgot-password` (PublicOnly), `/admin/requests` (Admin) |
| `fe/src/shared/lib/breadcrumbs.ts` | `'/admin/requests'` |
| `fe/src/shared/components/Sidebar.tsx` | mục "Quản lý yêu cầu" |
| `fe/src/shared/i18n/en.ts` | bản dịch — **hai khoá `'Yêu cầu'` và `'Nhật ký'` nằm trong mảng `TABS` nên `check:i18n` KHÔNG quét được**, phải sửa tay |

---

## 4. Hợp đồng API

### Người dùng — không cần đăng nhập

```
POST /api/v1/auth/password-reset/request
  body  { identifier: string, retry?: boolean }
  200   { outcome, rejectReason: string|null, reviewedAt: string|null }
  404   không tìm thấy tài khoản
```

`retry: true` chỉ dùng khi người dùng bấm "Gửi lại yêu cầu" ở màn báo từ chối.

> **Cần cờ `retry` vì:** không có nó thì người bị từ chối mắc kẹt — mỗi lần nhập tài
> khoản lại chỉ nhận về đúng thông báo từ chối cũ. Ngược lại, tự động tạo yêu cầu mới
> mỗi lần tra cứu thì họ không kịp **đọc** lý do trước khi nó bị thay bằng một yêu cầu
> đang chờ.

```
POST /api/v1/auth/password-reset/confirm
  body  { identifier, newPassword, confirmPassword }
  204   đổi xong
  400   hai ô mật khẩu không khớp / mật khẩu không đạt yêu cầu
  403   chưa được duyệt, đã dùng rồi, hoặc lượt duyệt đã quá hạn
  404   không tìm thấy tài khoản
```

### Quản trị viên — sau `requireRole(ADMIN)`

```
GET  /api/v1/admin/password-reset-requests?tab=pending|log&page&pageSize
POST /api/v1/admin/password-reset-requests/:id/approve      204
POST /api/v1/admin/password-reset-requests/:id/reject        204
     body { reason: string }   // 5–500 ký tự, BẮT BUỘC
     409  yêu cầu này đã được xử lý (người khác vừa bấm trước)
```

Hai tab đọc **cùng một bảng**, chỉ khác bộ lọc và thứ tự sắp xếp:

- `pending` — `status = PENDING`, cũ nhất trước (ai đợi lâu xử lý trước)
- `log` — `status IN (APPROVED, REJECTED)`, mới xử lý nhất trước

**Không có bảng nhật ký riêng.** Mọi thứ cần ghi lại (ai duyệt, lúc nào, lý do) đều nằm
sẵn trên chính dòng yêu cầu; thêm bảng thứ hai chỉ tạo ra chỗ để hai nguồn lệch nhau.

---

## 5. Quy tắc nghiệp vụ — thay được, nhưng phải biết mình đang thay gì

| # | Quy tắc | Cài ở đâu | Nếu bỏ thì sao |
|---|---|---|---|
| N1 | Mỗi người chỉ có **một** yêu cầu đang chờ | cột `pending_user_id` + `@@unique` | Người dùng bấm nhiều lần sẽ tạo một đống yêu cầu trùng, quản trị viên phải duyệt lặp |
| N2 | Lý do từ chối **bắt buộc**, 5–500 ký tự | `rejectResetRequestSchema` | Người dùng bị chặn mà không biết phải làm gì tiếp |
| N3 | Một lượt duyệt chỉ đổi mật khẩu **một lần** | cột `used_at` | Lượt duyệt thành vé vào cửa dùng mãi mãi |
| N4 | Đổi mật khẩu xong **thu hồi hết refresh token** | `confirmReset` | Nếu tài khoản đang bị chiếm, kẻ chiếm vẫn dùng tiếp tới 30 ngày |
| N5 | Duyệt/từ chối chỉ tác động lên dòng còn `PENDING` | `updateMany` kèm điều kiện | Hai quản trị viên bấm cùng lúc thì ghi đè nhau, nhật ký ghi nhầm người |
| N6 | Báo cho **mọi** quản trị viên đang hoạt động | `notifyAdmins` | Yêu cầu nằm im nếu đúng người phụ trách đang nghỉ |
| N7 | Thông báo đi qua `notification.service` | `createNotification` | Vi phạm quy tắc "chỉ một nơi sinh thông báo" của dự án |

### N1 hoạt động thế nào

`pending_user_id` bằng `user_id` khi đang chờ, và trả về `NULL` khi đã xử lý. Cột này
`UNIQUE`, mà **MySQL cho phép nhiều `NULL` trong unique index** — nên ràng buộc chặn
đúng "hai yêu cầu chờ cùng lúc" mà vẫn lưu được lịch sử nhiều yêu cầu đã xử lý.

Đây là **ràng buộc của DB, không phải kiểm tra trong mã**. Đọc-rồi-ghi sẽ hỏng khi hai
request tới cùng lúc: cả hai đều đọc thấy "chưa có yêu cầu" rồi cùng ghi. Cùng thủ pháp
với `StreakFreeze.usedOnDate` trong module rewards.

---

## 6. Đánh đổi an toàn — đọc trước khi sửa

### 6.1 Lượt duyệt gắn với TÀI KHOẢN, không gắn với người đã chứng minh danh tính

**Đây là điểm yếu cố hữu của thiết kế này, không phải lỗi cài đặt.**

Sau khi quản trị viên bấm duyệt, **bất kỳ ai biết tên tài khoản đó đều đặt được mật khẩu
mới**. Không có liên kết gửi qua email, không có mã xác thực, không có gì chứng minh
người đang gõ mật khẩu mới chính là chủ tài khoản.

Hệ quả bắt buộc: **quản trị viên phải xác minh danh tính NGOÀI hệ thống** (gọi điện, gặp
mặt, đối chiếu giấy tờ) trước khi bấm duyệt. Nút duyệt là toàn bộ cánh cửa.

Hai thứ đang thu hẹp rủi ro, nhưng không xoá được nó:

- `APPROVAL_TTL_DAYS = 7` — lượt duyệt hết hiệu lực sau 7 ngày. Chỉ thu hẹp khoảng thời
  gian cửa mở. Đây là phần **thêm vào ngoài yêu cầu ban đầu**; bỏ đi chỉ cần xoá hàm
  `isUsable`.
- `used_at` — mỗi lượt duyệt dùng được đúng một lần.

**Muốn xoá hẳn điểm yếu này thì phải đổi sang luồng có mã gửi tới kênh mà chỉ chủ tài
khoản đọc được** — xem mục 7.

### 6.2 Luồng này CÓ lộ tài khoản nào tồn tại

`requestReset` trả **404 nói thẳng** khi không tìm thấy tài khoản. Đây là lựa chọn có
chủ ý, không phải sơ suất:

- Luồng vốn đã lộ ở bước sau (hiện cả "đã bị từ chối" kèm lý do), nên giấu riêng ở bước
  đầu không mua được gì.
- Đổi lại, người gõ nhầm một chữ sẽ ngồi đợi một quản trị viên không bao giờ nhìn thấy
  yêu cầu nào.

Nếu yêu cầu bảo mật đổi và cần chống dò tài khoản, phải đổi **cả bốn** kết quả trả về
thành một câu duy nhất kiểu "nếu tài khoản tồn tại, yêu cầu đã được gửi" — sửa mỗi bước
đầu là vô nghĩa.

### 6.3 Chưa có giới hạn tần suất

Không có rate limit trên `/auth/password-reset/request`. Ràng buộc N1 đã chặn việc tạo
hàng loạt yêu cầu, nhưng **không chặn việc dò xem tài khoản nào tồn tại**. Hạng mục A3
trong `docs/lo-trinh-phat-trien.md` xử lý việc này.

---

## 7. Thay luồng hiện tại bằng luồng khác

### 7.1 Sang luồng gửi mã qua email (chuẩn phổ biến)

**Giữ nguyên:**

- `User.username` và `findByIdentifier` — chuyện đăng nhập bằng email hoặc tên tài khoản
  độc lập hoàn toàn với chuyện quên mật khẩu.
- Kiến trúc `password-reset.service.ts` giữ toàn bộ nghiệp vụ ở một chỗ.
- `hashPassword`, và quy tắc **N4** (thu hồi refresh token) — luồng nào cũng cần.
- `Modal.tsx` (dùng chung, không riêng của luồng này).

**Thay:**

| Việc | Chi tiết |
|---|---|
| Bảng | `password_reset_requests` → `password_reset_tokens`: bỏ `status`, `reviewed_by_id`, `reject_reason`; thêm `token_hash` (băm, **không lưu token thô**), `expires_at` |
| Endpoint người dùng | `request` chỉ gửi mail và **luôn trả 200** (không lộ tài khoản); thêm `confirm` nhận `token` thay vì `identifier` |
| Endpoint quản trị | **Xoá cả 3** |
| Màn hình | Xoá `AdminRequestsPage`, mục sidebar, breadcrumb, route `/admin/requests`; `ForgotPasswordPage` rút còn 2 bước (nhập email → báo "đã gửi mail"), thêm màn `/reset-password?token=…` |
| Thông báo | Xoá `NotificationType.PASSWORD_RESET_REQUEST` và `notifyAdmins` |
| Hạ tầng mới | Dịch vụ gửi email — xem hạng mục **B1** trong `docs/lo-trinh-phat-trien.md` |
| Bản dịch | Xoá nhóm khoá ở cuối `en.ts`, **gồm cả `'Yêu cầu'` và `'Nhật ký'` mà script không quét được** |

### 7.2 Giữ duyệt tay nhưng thêm xác minh danh tính

Cách rẻ nhất để bịt 6.1 mà không cần hạ tầng email: khi duyệt, quản trị viên **đặt luôn
một mã dùng một lần** rồi đưa mã đó cho người dùng qua kênh đã xác minh. Bước
`confirm` đòi thêm mã này.

Sửa ít: thêm cột `claim_code_hash` vào bảng hiện có, thêm một ô trong form duyệt, thêm
một ô trong form đặt mật khẩu. Máy trạng thái và toàn bộ giao diện còn lại giữ nguyên.

### 7.3 Checklist khi thay bằng bất kỳ luồng nào

- [ ] Migration: chỉ **thêm/xoá bảng của luồng này**, không đụng `User.username`
- [ ] Xoá sạch endpoint không còn dùng ở cả `auth.routes.ts` và `admin.routes.ts`
- [ ] Giữ quy tắc **N4** (thu hồi refresh token sau khi đổi mật khẩu)
- [ ] Giữ **một** service duy nhất cho cả luồng
- [ ] Nếu bỏ màn quản trị: xoá route + `TRAILS` + mục Sidebar **cùng lúc** (thiếu một chỗ
      là breadcrumb hoặc menu trỏ tới trang 404)
- [ ] Xoá `NotificationType` không còn dùng khỏi **cả** `enums.ts`, `schema.prisma`
      (kèm migration `MODIFY COLUMN`) và bảng `DISPLAY` trong `notification-display.tsx`
- [ ] `pnpm build:shared` sau khi sửa `shared/`
- [ ] `pnpm --filter @enghabit/fe check:i18n` **và** rà tay các khoá dịch động

---

## 8. Cách kiểm thử lại

Chưa có test tự động cho luồng này (dự án hiện chưa có test cho `be/src/modules` — xem
hạng mục **C1** trong `docs/lo-trinh-phat-trien.md`). Kịch bản đã chạy tay và **đều
đúng**, dùng lại được khi sửa:

| # | Thao tác | Kết quả đúng |
|---|---|---|
| 1 | Đăng nhập bằng tên tài khoản | 200 |
| 2 | Đăng nhập bằng email cùng tài khoản | 200 |
| 3 | Đăng ký trùng tên tài khoản | 409 `"Tên đã tồn tại"` |
| 4 | Đăng ký trùng email | 409 `"Email này đã được đăng ký"` |
| 5 | Quên mật khẩu lần đầu | `CREATED` |
| 6 | **Tra lại bằng email của cùng người đó** | `PENDING` (không tạo yêu cầu thứ hai) |
| 7 | Kiểm tra chuông của admin | có `PASSWORD_RESET_REQUEST`, link `/admin/requests` |
| 8 | Đổi mật khẩu khi chưa duyệt | 403 |
| 9 | Admin từ chối kèm lý do | 204 |
| 10 | Người dùng tra lại | `REJECTED` + đúng lý do |
| 11 | Tra lại lần nữa **không** `retry` | vẫn `REJECTED`, không tự tạo mới |
| 12 | Gửi lại với `retry: true` | `CREATED` |
| 13 | Admin duyệt | 204 |
| 14 | Người dùng tra lại | `APPROVED` |
| 15 | Hai ô mật khẩu không khớp | 400 |
| 16 | Đổi mật khẩu hợp lệ | 204 |
| 17 | Đăng nhập bằng mật khẩu mới | 200 |
| 18 | Dùng lại lượt duyệt đã tiêu | 403 |
| 19 | Tab Nhật ký | đủ ai duyệt, lúc nào, lý do, đã đổi mật khẩu chưa |
| 20 | Tài khoản không tồn tại | 404 |

Bước **6** là bước dễ hỏng nhất khi sửa luồng: nó kiểm tra rằng nhập email và nhập tên
tài khoản của **cùng một người** phải lần ra **cùng một yêu cầu**. Sai chỗ này thì một
người tạo được hai yêu cầu chờ song song.
