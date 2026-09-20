# Đặc tả Use Case

Khảo sát ngày 20/09/2026. Đặc tả cho toàn bộ 102 use case, theo đúng 18 mục.
Luồng sự kiện đánh số theo bước; luồng thay thế và ngoại lệ mang số bước mà nó rẽ nhánh
(ví dụ `3a` rẽ ở bước 3). Thông báo lỗi trích nguyên văn từ mã nguồn khi có.

Nội dung nào không xác minh được từ mã nguồn hoặc giao diện được ghi rõ
"**Chưa xác minh được từ hệ thống hiện tại**".

## Mục lục

- **AUTH — Xác thực và tài khoản cá nhân:** [UC-AUTH-01](#uc-auth-01), [UC-AUTH-02](#uc-auth-02), [UC-AUTH-03](#uc-auth-03), [UC-AUTH-04](#uc-auth-04), [UC-AUTH-05](#uc-auth-05), [UC-AUTH-06](#uc-auth-06), [UC-AUTH-07](#uc-auth-07), [UC-AUTH-08](#uc-auth-08)
- **LIB — Thư viện bộ thẻ:** [UC-LIB-01](#uc-lib-01), [UC-LIB-02](#uc-lib-02), [UC-LIB-03](#uc-lib-03), [UC-LIB-04](#uc-lib-04), [UC-LIB-05](#uc-lib-05), [UC-LIB-06](#uc-lib-06), [UC-LIB-07](#uc-lib-07), [UC-LIB-08](#uc-lib-08), [UC-LIB-09](#uc-lib-09)
- **STU — Học và ôn tập:** [UC-STU-01](#uc-stu-01), [UC-STU-02](#uc-stu-02), [UC-STU-03](#uc-stu-03), [UC-STU-04](#uc-stu-04), [UC-STU-05](#uc-stu-05), [UC-STU-06](#uc-stu-06), [UC-STU-07](#uc-stu-07)
- **HAB — Thói quen và mục tiêu:** [UC-HAB-01](#uc-hab-01), [UC-HAB-02](#uc-hab-02), [UC-HAB-03](#uc-hab-03), [UC-HAB-04](#uc-hab-04), [UC-HAB-05](#uc-hab-05), [UC-HAB-06](#uc-hab-06)
- **STAT — Thống kê và xếp hạng:** [UC-STAT-01](#uc-stat-01), [UC-STAT-02](#uc-stat-02), [UC-STAT-03](#uc-stat-03)
- **REW — Phần thưởng:** [UC-REW-01](#uc-rew-01), [UC-REW-02](#uc-rew-02), [UC-REW-03](#uc-rew-03), [UC-REW-04](#uc-rew-04)
- **SHOP — Cửa hàng, ví và kho vật phẩm:** [UC-SHOP-01](#uc-shop-01), [UC-SHOP-02](#uc-shop-02), [UC-SHOP-03](#uc-shop-03), [UC-SHOP-04](#uc-shop-04), [UC-SHOP-05](#uc-shop-05), [UC-SHOP-06](#uc-shop-06)
- **COM — Cộng đồng:** [UC-COM-01](#uc-com-01), [UC-COM-02](#uc-com-02), [UC-COM-03](#uc-com-03), [UC-COM-04](#uc-com-04), [UC-COM-05](#uc-com-05), [UC-COM-06](#uc-com-06), [UC-COM-07](#uc-com-07), [UC-COM-08](#uc-com-08)
- **GRP — Nhóm lớp:** [UC-GRP-01](#uc-grp-01), [UC-GRP-02](#uc-grp-02), [UC-GRP-03](#uc-grp-03), [UC-GRP-04](#uc-grp-04), [UC-GRP-05](#uc-grp-05), [UC-GRP-06](#uc-grp-06), [UC-GRP-07](#uc-grp-07), [UC-GRP-08](#uc-grp-08), [UC-GRP-09](#uc-grp-09), [UC-GRP-10](#uc-grp-10), [UC-GRP-11](#uc-grp-11), [UC-GRP-12](#uc-grp-12), [UC-GRP-13](#uc-grp-13), [UC-GRP-14](#uc-grp-14), [UC-GRP-15](#uc-grp-15), [UC-GRP-16](#uc-grp-16), [UC-GRP-17](#uc-grp-17), [UC-GRP-18](#uc-grp-18)
- **NOTI — Thông báo và nhắc nhở:** [UC-NOTI-01](#uc-noti-01), [UC-NOTI-02](#uc-noti-02), [UC-NOTI-03](#uc-noti-03), [UC-NOTI-04](#uc-noti-04), [UC-NOTI-05](#uc-noti-05), [UC-NOTI-06](#uc-noti-06), [UC-NOTI-07](#uc-noti-07), [UC-NOTI-08](#uc-noti-08)
- **AUSR — Quản trị tài khoản và truy cập:** [UC-ADM-01](#uc-adm-01), [UC-ADM-02](#uc-adm-02), [UC-ADM-03](#uc-adm-03), [UC-ADM-04](#uc-adm-04), [UC-ADM-05](#uc-adm-05), [UC-ADM-06](#uc-adm-06), [UC-ADM-07](#uc-adm-07), [UC-ADM-08](#uc-adm-08), [UC-ADM-09](#uc-adm-09)
- **ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ:** [UC-ADM-10](#uc-adm-10), [UC-ADM-11](#uc-adm-11), [UC-ADM-12](#uc-adm-12), [UC-ADM-13](#uc-adm-13), [UC-ADM-14](#uc-adm-14), [UC-ADM-15](#uc-adm-15), [UC-ADM-16](#uc-adm-16)
- **AGRP — Quản trị nhóm lớp:** [UC-ADM-17](#uc-adm-17), [UC-ADM-18](#uc-adm-18), [UC-ADM-19](#uc-adm-19), [UC-ADM-20](#uc-adm-20), [UC-ADM-21](#uc-adm-21)
- **ASHP — Quản trị cửa hàng:** [UC-ADM-22](#uc-adm-22), [UC-ADM-23](#uc-adm-23)
- **ASYS — Cấu hình hệ thống và thông báo chung:** [UC-ADM-24](#uc-adm-24), [UC-ADM-25](#uc-adm-25)

---

## AUTH — Xác thực và tài khoản cá nhân

### UC-AUTH-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-01 |
| 2. Tên Use Case | Đăng ký tài khoản (Register Account) |
| 3. Mục tiêu | Khách có một tài khoản Người học để bắt đầu sử dụng hệ thống. |
| 4. Actor chính | Khách |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tạo tài khoản Người học mới bằng họ tên, email, tên tài khoản và mật khẩu. |
| 7. Trigger | Khách bấm "Đăng ký" ở màn đăng nhập hoặc mở `/register`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Khách chưa đăng nhập.

**9. Hậu điều kiện**

- Có một dòng `users` mới với `role = USER`, `status = ACTIVE`.
- Kèm sẵn `user_streaks`, `notification_settings` và một mốc nhắc 20:00 cả 7 ngày.
- Khách được đăng nhập luôn (nhận access token và refresh token).

**10. Luồng sự kiện chính**

1. Khách nhập họ tên, email, tên tài khoản, mật khẩu.
2. Hệ thống kiểm tra dữ liệu theo `registerSchema`.
3. Hệ thống kiểm tra email và tên tài khoản chưa tồn tại.
4. Hệ thống băm mật khẩu bằng bcrypt và tạo tài khoản cùng cấu hình mặc định.
5. Hệ thống cấp phiên đăng nhập và chuyển Khách vào trang Tổng quan.

**11. Luồng thay thế**

- 3a. Không gửi múi giờ: dùng mặc định `Asia/Ho_Chi_Minh`.

**12. Luồng ngoại lệ**

- 2a. Dữ liệu sai định dạng (mật khẩu dưới 8 ký tự, thiếu chữ hoặc số; tên tài khoản không đúng 3–30 ký tự cho phép): trả 400 kèm thông báo theo trường.
- 3a. Email hoặc tên tài khoản đã tồn tại: trả 409, nói rõ trường bị trùng.
- 4a. Hai yêu cầu đăng ký cùng lúc vượt qua bước 3: ràng buộc UNIQUE của DB chặn, trả 409.

**13. Quy tắc nghiệp vụ**

- Mật khẩu 8–72 ký tự, có ít nhất một chữ cái và một chữ số.
- Email và tên tài khoản là duy nhất; chống trùng bằng ràng buộc UNIQUE, không bằng đọc-rồi-ghi.
- Đăng ký luôn tạo vai trò Người học; không có đường tự đăng ký làm Quản trị viên.

**14. Dữ liệu đầu vào:** name, email, username, password, timezone (tuỳ chọn)

**15. Dữ liệu đầu ra:** Thông tin người dùng công khai, Access token, Cookie refresh token

**16. Quyền truy cập:** Công khai. Route FE bọc `PublicOnly` (đã đăng nhập thì bị đẩy về trang chủ); API không gắn `requireAuth`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/register`
- API: `POST /auth/register`
- Bảng dữ liệu: `User`, `RefreshToken`
- `be/src/modules/auth/auth.service.ts` — `register`, `createUser`
- `shared/src/schemas/auth.schema.ts` — `registerSchema`, `passwordSchema`, `usernameSchema`
- `fe/src/features/auth/components/RegisterPage.tsx`

### UC-AUTH-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-02 |
| 2. Tên Use Case | Đăng nhập (Log In) |
| 3. Mục tiêu | Người dùng vào được hệ thống với đúng vai trò của mình. |
| 4. Actor chính | Khách |
| 5. Actor phụ | Không có |
| 6. Mô tả | Vào hệ thống bằng email hoặc tên tài khoản cùng mật khẩu; phiên được duy trì bằng refresh token xoay vòng. |
| 7. Trigger | Khách bấm "Đăng nhập" trên `/login`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Khách chưa đăng nhập.
- Đã có tài khoản.

**9. Hậu điều kiện**

- Ghi một dòng `login_events` (thành công).
- Cập nhật `users.last_login_at`.
- Lưu hash refresh token mới.
- Người học vào `/`, Quản trị viên vào `/admin`.

**10. Luồng sự kiện chính**

1. Khách nhập email hoặc tên tài khoản và mật khẩu.
2. Hệ thống tìm tài khoản theo email hoặc tên tài khoản.
3. Hệ thống so khớp mật khẩu.
4. Hệ thống kiểm tra tài khoản không bị khoá.
5. Hệ thống ghi nhật ký đăng nhập thành công, cập nhật lần đăng nhập cuối.
6. Hệ thống cấp access token và refresh token.
7. Giao diện chuyển người dùng theo vai trò.

**11. Luồng thay thế**

- 7a. Access token hết hạn khi đang dùng: giao diện tự gọi `POST /auth/refresh`; hệ thống thu hồi token cũ và cấp token mới (xoay vòng) mà người dùng không phải đăng nhập lại.

**12. Luồng ngoại lệ**

- 2a. Không tìm thấy tài khoản: ghi `login_events` lý do `NO_ACCOUNT`, trả 401 "Thông tin đăng nhập hoặc mật khẩu không đúng".
- 3a. Sai mật khẩu: ghi lý do `WRONG_PASSWORD`, trả 401 cùng thông báo trên.
- 4a. Tài khoản bị khoá: ghi lý do `LOCKED`, trả 403 "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên."
- 7a1. Refresh token đã thu hồi hoặc hết hạn: phiên kết thúc, người dùng phải đăng nhập lại.

**13. Quy tắc nghiệp vụ**

- Sai tài khoản và sai mật khẩu trả CÙNG một thông báo để không lộ tài khoản nào tồn tại.
- Mọi lần thử, kể cả thất bại, đều ghi `login_events` — đây là nguồn sự thật của số liệu lượt truy cập.
- Refresh token hết hạn sau 30 ngày (theo `JWT_REFRESH_EXPIRES_IN`), dùng một lần rồi xoay vòng.

**14. Dữ liệu đầu vào:** identifier (email hoặc tên tài khoản), password

**15. Dữ liệu đầu ra:** Thông tin người dùng, Access token, Cookie refresh token

**16. Quyền truy cập:** Công khai. Route FE bọc `PublicOnly` (đã đăng nhập thì bị đẩy về trang chủ); API không gắn `requireAuth`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/login`
- API: `POST /auth/login`, `POST /auth/refresh`
- Bảng dữ liệu: `User`, `LoginEvent`, `RefreshToken`
- `be/src/modules/auth/auth.service.ts` — `login`, `findByIdentifier`, `refresh`
- `be/src/modules/auth/token.service.ts` — `rotateRefreshToken`
- Kiểm chứng giao diện: đăng nhập `user@enghabit.com` vào `/`, `admin@enghabit.com` vào `/admin`

### UC-AUTH-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-03 |
| 2. Tên Use Case | Yêu cầu cấp lại mật khẩu (Request Password Reset) |
| 3. Mục tiêu | Người quên mật khẩu gửi được yêu cầu cấp lại và biết yêu cầu đang ở bước nào. |
| 4. Actor chính | Khách |
| 5. Actor phụ | Không có |
| 6. Mô tả | Gửi yêu cầu cấp lại mật khẩu để quản trị viên duyệt, và tra trạng thái yêu cầu gần nhất. |
| 7. Trigger | Khách bấm "Quên mật khẩu?" rồi nhập tài khoản. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Khách chưa đăng nhập.
- Tài khoản cần cấp lại có tồn tại.

**9. Hậu điều kiện**

- Nếu tạo mới: có một dòng `password_reset_requests` trạng thái `PENDING`, mọi Quản trị viên đang hoạt động nhận thông báo `PASSWORD_RESET_REQUEST`.
- Nếu đã có yêu cầu: không tạo gì, chỉ trả trạng thái.

**10. Luồng sự kiện chính**

1. Khách nhập email hoặc tên tài khoản và bấm Xác nhận.
2. Hệ thống tìm tài khoản và yêu cầu gần nhất của tài khoản đó.
3. Không có yêu cầu còn hiệu lực: hệ thống tạo yêu cầu `PENDING`.
4. Hệ thống báo cho mọi Quản trị viên đang hoạt động.
5. Giao diện hiện "Đã gửi yêu cầu" (kết quả `CREATED`).

**11. Luồng thay thế**

- 2a. Đang có yêu cầu `PENDING`: trả `PENDING`, giao diện hiện popup "Đã gửi yêu cầu, đợi quản trị viên xác nhận".
- 2b. Yêu cầu gần nhất `APPROVED`, chưa dùng, chưa quá 7 ngày: trả `APPROVED` → chuyển sang UC-AUTH-04.
- 2c. Yêu cầu gần nhất `REJECTED` và Khách chưa bấm gửi lại: trả `REJECTED` kèm lý do từ chối; giao diện hiện nút "Gửi lại yêu cầu".
- 2c1. Khách bấm "Gửi lại yêu cầu" (`retry = true`): tiếp tục từ bước 3.

**12. Luồng ngoại lệ**

- 2d. Không tìm thấy tài khoản: trả 404 "Không tìm thấy tài khoản với email hoặc tên tài khoản này".
- 3a. Hai yêu cầu cùng lúc: cột UNIQUE `pending_user_id` chặn yêu cầu thứ hai; hệ thống trả `PENDING` thay vì báo lỗi.

**13. Quy tắc nghiệp vụ**

- Không gửi email, không có mã xác thực; Quản trị viên duyệt tay.
- Mỗi tài khoản có tối đa MỘT yêu cầu đang chờ (ràng buộc UNIQUE trên `pending_user_id`).
- Bị từ chối thì dừng ở màn báo lý do; chỉ tạo yêu cầu mới khi Khách chủ động gửi lại.
- Quản trị viên KHÔNG đặt mật khẩu hộ; luồng này là đường duy nhất để cấp lại mật khẩu.

**14. Dữ liệu đầu vào:** identifier, retry (tuỳ chọn)

**15. Dữ liệu đầu ra:** Kết quả: CREATED / PENDING / APPROVED / REJECTED, Lý do từ chối (nếu có)

**16. Quyền truy cập:** Công khai. Route FE bọc `PublicOnly` (đã đăng nhập thì bị đẩy về trang chủ); API không gắn `requireAuth`.

**17. Quan hệ với use case khác:** được «extend» bởi UC-AUTH-04

**18. Căn cứ xác minh**

- Giao diện: `/forgot-password`
- API: `POST /auth/password-reset/request`
- Bảng dữ liệu: `PasswordResetRequest`, `Notification`, `User`
- `be/src/modules/auth/password-reset.service.ts` — `requestReset`, `createRequest`, `notifyAdmins`
- `docs/luong-quen-mat-khau.md`
- `fe/src/features/auth/components/ForgotPasswordPage.tsx`

### UC-AUTH-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-04 |
| 2. Tên Use Case | Đặt mật khẩu mới sau khi được duyệt (Set New Password) |
| 3. Mục tiêu | Người đã được duyệt tự đặt mật khẩu mới mà Quản trị viên không biết mật khẩu đó. |
| 4. Actor chính | Khách |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tự đặt mật khẩu mới khi yêu cầu cấp lại đã được quản trị viên duyệt và còn hiệu lực. |
| 7. Trigger | UC-AUTH-03 trả kết quả `APPROVED`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Yêu cầu gần nhất của tài khoản ở trạng thái `APPROVED`, `used_at` rỗng, chưa quá 7 ngày kể từ lúc duyệt.

**9. Hậu điều kiện**

- Mật khẩu mới được lưu (băm bcrypt).
- Yêu cầu được đánh dấu đã dùng (`used_at`).
- Mọi refresh token của tài khoản bị thu hồi.

**10. Luồng sự kiện chính**

1. Giao diện hiện form mật khẩu mới và xác nhận mật khẩu.
2. Khách nhập và gửi.
3. Hệ thống kiểm tra lại yêu cầu còn hiệu lực.
4. Trong một transaction: cập nhật mật khẩu, đánh dấu đã dùng, thu hồi mọi phiên.
5. Giao diện báo "Đổi mật khẩu thành công" và chuyển về `/login`.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 2a. Mật khẩu không đạt quy tắc hoặc hai ô không khớp: trả 400.
- 3a. Yêu cầu chưa duyệt, đã dùng hoặc quá hạn: trả 403 "Yêu cầu chưa được duyệt hoặc đã hết hiệu lực".
- 4a. Hai lần gửi cùng lúc: điều kiện `used_at IS NULL` chỉ cho một lần ghi đánh dấu thành công.

**13. Quy tắc nghiệp vụ**

- Một lượt duyệt chỉ đổi mật khẩu được một lần.
- Hiệu lực duyệt 7 ngày (`APPROVAL_TTL_DAYS`).
- Đổi mật khẩu luôn thu hồi mọi phiên cũ.

**14. Dữ liệu đầu vào:** identifier, newPassword, confirmPassword

**15. Dữ liệu đầu ra:** Thông báo thành công

**16. Quyền truy cập:** Công khai. Route FE bọc `PublicOnly` (đã đăng nhập thì bị đẩy về trang chủ); API không gắn `requireAuth`.

**17. Quan hệ với use case khác:** «extend» UC-AUTH-03

**18. Căn cứ xác minh**

- Giao diện: `/forgot-password`
- API: `POST /auth/password-reset/confirm`
- Bảng dữ liệu: `PasswordResetRequest`, `User`, `RefreshToken`
- `password-reset.service.ts` — `confirmReset`, `isUsable`
- `shared/src/schemas/password-reset.schema.ts` — `passwordResetConfirmSchema`

### UC-AUTH-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-05 |
| 2. Tên Use Case | Đăng xuất (Log Out) |
| 3. Mục tiêu | Kết thúc phiên làm việc an toàn. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Kết thúc phiên hiện tại và thu hồi refresh token. |
| 7. Trigger | Người dùng bấm Đăng xuất. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đang đăng nhập.

**9. Hậu điều kiện**

- Refresh token hiện tại bị thu hồi; cookie bị xoá.
- Giao diện về `/login`.

**10. Luồng sự kiện chính**

1. Người dùng bấm Đăng xuất.
2. Hệ thống thu hồi refresh token đang dùng.
3. Giao diện xoá trạng thái đăng nhập và chuyển về `/login`.

**11. Luồng thay thế**

- 2a. Không có cookie refresh token: bỏ qua bước thu hồi, vẫn xoá cookie và trả 204.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Chỉ thu hồi phiên hiện tại; phiên ở thiết bị khác không bị ảnh hưởng (khác UC-AUTH-08).

**14. Dữ liệu đầu vào:** Cookie refresh token

**15. Dữ liệu đầu ra:** 204, cookie bị xoá

**16. Quyền truy cập:** Giao diện chỉ hiện nút Đăng xuất khi đã đăng nhập. API `POST /auth/logout` KHÔNG gắn `requireAuth` — chỉ đọc cookie refresh token.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `(Sidebar)`
- API: `POST /auth/logout`
- Bảng dữ liệu: `RefreshToken`
- `auth.service.ts` — `logout`
- `token.service.ts` — `revokeRefreshToken`
- `fe/src/features/auth/auth.store.ts`

### UC-AUTH-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-06 |
| 2. Tên Use Case | Cập nhật thông tin cá nhân (Update Profile) |
| 3. Mục tiêu | Giữ họ tên và múi giờ của tài khoản đúng với thực tế. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Sửa họ tên và múi giờ của tài khoản. |
| 7. Trigger | Người dùng sửa khối "Thông tin cá nhân" ở `/profile` và bấm Lưu thay đổi. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đang đăng nhập.

**9. Hậu điều kiện**

- `users.name` và/hoặc `users.timezone` được cập nhật.

**10. Luồng sự kiện chính**

1. Hệ thống hiện thông tin hiện tại.
2. Người dùng sửa họ tên hoặc múi giờ.
3. Hệ thống kiểm tra và lưu.
4. Giao diện báo thành công.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 3a. Họ tên ngoài 2–100 ký tự: trả 400.

**13. Quy tắc nghiệp vụ**

- Múi giờ quyết định "một ngày học" của người đó (`local_date`) cho mọi bản ghi hoạt động về sau; bản ghi cũ không bị tính lại.
- Email và tên tài khoản không sửa được ở đây.

**14. Dữ liệu đầu vào:** name (tuỳ chọn), timezone (tuỳ chọn)

**15. Dữ liệu đầu ra:** Thông tin người dùng đã cập nhật

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập (Người học và Quản trị viên). API gắn `requireAuth`, không `requireRole`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/profile`
- API: `GET /auth/me`, `PATCH /auth/me`
- Bảng dữ liệu: `User`
- `auth.service.ts` — `updateProfile`
- `auth.schema.ts` — `updateProfileSchema`
- Giao diện `/profile` (cả hai vai trò): khối Thông tin cá nhân, nút Lưu thay đổi

### UC-AUTH-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-07 |
| 2. Tên Use Case | Quản lý ảnh đại diện (Manage Avatar) |
| 3. Mục tiêu | Người dùng có ảnh đại diện riêng hiển thị ở các nơi có tên mình. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tải lên, thay hoặc gỡ ảnh đại diện. |
| 7. Trigger | Người dùng bấm "Tải ảnh lên" hoặc gỡ ảnh ở `/profile`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đang đăng nhập.

**9. Hậu điều kiện**

- Ảnh lưu ở `user_avatars` (hoặc bị xoá khi gỡ).

**10. Luồng sự kiện chính**

1. Người dùng chọn tệp ảnh.
2. Giao diện đọc tệp thành data URL.
3. Hệ thống kiểm tra định dạng và dung lượng.
4. Hệ thống lưu ảnh, ghi đè ảnh cũ nếu có.

**11. Luồng thay thế**

- 1a. Người dùng gỡ ảnh: hệ thống xoá ảnh; giao diện hiện chữ cái đầu thay ảnh.

**12. Luồng ngoại lệ**

- 3a. Không phải JPEG/PNG/WebP hoặc vượt 200 KB: trả 400.

**13. Quy tắc nghiệp vụ**

- Định dạng JPEG, PNG, WebP; tối đa 200 KB (`AVATAR_MAX_BYTES`).
- Ảnh lưu ở bảng riêng, không nằm trong `users`.

**14. Dữ liệu đầu vào:** dataUrl

**15. Dữ liệu đầu ra:** Thông tin người dùng kèm ảnh

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập (Người học và Quản trị viên). API gắn `requireAuth`, không `requireRole`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/profile`
- API: `PUT /auth/me/avatar`, `DELETE /auth/me/avatar`
- Bảng dữ liệu: `UserAvatar`
- `auth.service.ts` — `setAvatar`, `removeAvatar`
- `shared/src/avatar/avatar.ts`
- `fe/src/features/profile/components/AvatarPicker.tsx`

### UC-AUTH-08

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-AUTH-08 |
| 2. Tên Use Case | Đổi mật khẩu (Change Password) |
| 3. Mục tiêu | Đổi mật khẩu và đá mọi phiên cũ ra. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đổi mật khẩu khi biết mật khẩu hiện tại; mọi phiên cũ bị thu hồi. |
| 7. Trigger | Người dùng điền khối "Đổi mật khẩu" ở `/profile`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đang đăng nhập.
- Biết mật khẩu hiện tại.

**9. Hậu điều kiện**

- Mật khẩu mới được lưu.
- MỌI refresh token của tài khoản bị thu hồi.

**10. Luồng sự kiện chính**

1. Người dùng nhập mật khẩu hiện tại và mật khẩu mới.
2. Hệ thống so khớp mật khẩu hiện tại.
3. Hệ thống lưu mật khẩu mới.
4. Hệ thống thu hồi mọi phiên đang mở.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 2a. Sai mật khẩu hiện tại: trả 401 "Mật khẩu hiện tại không đúng".
- 1a. Mật khẩu mới không đạt quy tắc: trả 400.

**13. Quy tắc nghiệp vụ**

- Cùng quy tắc mật khẩu với đăng ký.
- Đổi mật khẩu thu hồi phiên ở MỌI thiết bị.

**14. Dữ liệu đầu vào:** currentPassword, newPassword

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập (Người học và Quản trị viên). API gắn `requireAuth`, không `requireRole`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/profile`
- API: `POST /auth/me/change-password`
- Bảng dữ liệu: `User`, `RefreshToken`
- `auth.service.ts` — `changePassword`
- `auth.schema.ts` — `changePasswordSchema`

---

## LIB — Thư viện bộ thẻ

### UC-LIB-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-01 |
| 2. Tên Use Case | Tìm kiếm bộ thẻ công khai (Search Public Study Sets) |
| 3. Mục tiêu | Tìm được bộ thẻ công khai phù hợp để học. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tìm bộ thẻ công khai theo tên hoặc mô tả, có phân trang. |
| 7. Trigger | Người học mở tab "Khám phá" ở `/library` hoặc gõ vào ô tìm. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `VOCABULARY` đang bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống hiện trang đầu danh sách bộ công khai.
2. Người học gõ từ khoá (tên hoặc mô tả).
3. Hệ thống lọc và trả kết quả, xếp theo số thẻ giảm dần rồi theo lần cập nhật.
4. Người học chuyển trang bằng Trước / Sau.

**11. Luồng thay thế**

- 2a. Không gõ từ khoá: hiện mọi bộ công khai.

**12. Luồng ngoại lệ**

- 3a. Không có kết quả: hiện trạng thái rỗng.

**13. Quy tắc nghiệp vụ**

- Chỉ hiện bộ `PUBLIC`, chưa bị chặn, và chủ còn `ACTIVE` hoặc là bộ Hệ thống (`publicSetWhere`).
- Mỗi trang 12 bộ (tối đa 50); từ khoá tối đa 100 ký tự.

**14. Dữ liệu đầu vào:** search, page, pageSize

**15. Dữ liệu đầu ra:** Danh sách bộ thẻ tóm tắt, Tổng số

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/library`
- API: `GET /library/sets`
- Bảng dữ liệu: `Topic`, `Vocabulary`, `User`
- `library.service.ts` — `searchPublicSets`
- `library.access.ts` — `publicSetWhere`
- Giao diện `/library`: tab Khám phá, ô tìm, nút Trước/Sau

### UC-LIB-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-02 |
| 2. Tên Use Case | Xem bộ thẻ của tôi (View My Study Sets) |
| 3. Mục tiêu | Xem nhanh mọi bộ thẻ mình đã tạo. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem danh sách bộ thẻ do chính mình tạo. |
| 7. Trigger | Người học mở tab "Của tôi" ở `/library`, hoặc mở `/learn`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `VOCABULARY` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả mọi bộ có `owner_id` là người học, mới cập nhật trước.
2. Giao diện hiện từng bộ kèm số thẻ và chế độ công khai/riêng tư.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 1a. Chưa có bộ nào: hiện trạng thái rỗng kèm lối tạo bộ.

**13. Quy tắc nghiệp vụ**

- Gồm cả bộ riêng tư và bộ đang bị chặn của chính mình.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Danh sách bộ thẻ tóm tắt

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/library`, `/learn`
- API: `GET /library/sets/mine`
- Bảng dữ liệu: `Topic`
- `library.service.ts` — `listMySets`
- Giao diện `/library` tab Của tôi; `/learn` khối "Bộ thẻ của tôi"

### UC-LIB-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-03 |
| 2. Tên Use Case | Xem chi tiết bộ thẻ (View Study Set Details) |
| 3. Mục tiêu | Xem nội dung một bộ thẻ và biết mình đã nhớ tới đâu. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem thông tin bộ thẻ, danh sách thẻ và tiến độ nhớ của bản thân trên bộ đó. |
| 7. Trigger | Người học mở `/library/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Có quyền đọc bộ thẻ.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống kiểm tra quyền đọc.
2. Hệ thống trả thông tin bộ, toàn bộ thẻ và tiến độ: số thẻ mới, tới hạn, quá hạn, yếu, đã thuộc.
3. Giao diện hiện các hành động phù hợp: Học, Ôn nhanh, Chia sẻ; với chủ bộ có thêm Sửa, Xoá, Thêm/Sửa/Xoá thẻ; với bộ công khai của người khác có thêm Báo cáo.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 1a. Không có quyền đọc (bộ riêng tư của người khác, bộ bị chặn, bộ không tồn tại): trả 404, không trả 403.

**13. Quy tắc nghiệp vụ**

- Quyền đọc tính ở một chỗ: chủ bộ, HOẶC bộ công khai hợp lệ, HOẶC bộ được chia sẻ vào một nhóm mình là thành viên và nhóm chưa bị chặn (`readableSetWhere`).

**14. Dữ liệu đầu vào:** id bộ thẻ

**15. Dữ liệu đầu ra:** Chi tiết bộ thẻ, Danh sách thẻ, Tiến độ

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** được «extend» bởi UC-LIB-08; được «extend» bởi UC-LIB-09

**18. Căn cứ xác minh**

- Giao diện: `/library/:id`
- API: `GET /library/sets/:id`
- Bảng dữ liệu: `Topic`, `Vocabulary`, `UserVocabProgress`, `GroupStudySet`
- `library.service.ts` — `getSetDetail`
- `library.access.ts` — `readableSetWhere`, `findReadableSet`
- Giao diện: `/library/1` (bộ Hệ thống) chỉ có Học/Ôn nhanh/Chia sẻ; `/library/13` (của người khác) có thêm Báo cáo; `/library/12` (của mình) có Sửa/Xoá/Thêm thẻ

### UC-LIB-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-04 |
| 2. Tên Use Case | Quản lý bộ thẻ của tôi (Manage My Study Sets) |
| 3. Mục tiêu | Tự soạn và duy trì bộ thẻ riêng của mình. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tạo, sửa (tên, mô tả, cấp độ, chế độ công khai/riêng tư) và xoá bộ thẻ của chính mình. |
| 7. Trigger | Người học bấm "Tạo bộ thẻ" ở `/library`, hoặc Sửa/Xoá ở `/library/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Sửa, xoá: là chủ bộ.

**9. Hậu điều kiện**

- Tạo: có một dòng `topics` với `owner_id` là người học.
- Sửa: thông tin bộ được cập nhật.
- Xoá: bộ cùng toàn bộ thẻ và tiến độ học trên các thẻ đó bị xoá (cascade).

**10. Luồng sự kiện chính**

1. Người học nhập tên, mô tả, cấp độ (Cơ bản/Trung cấp/Nâng cao), chế độ (mặc định Riêng tư).
2. Hệ thống kiểm tra và tạo bộ.
3. Giao diện mở trang chi tiết bộ mới.

**11. Luồng thay thế**

- 1a. Sửa: người học đổi thông tin hoặc chế độ trên trang chi tiết; hệ thống lưu.
- 1b. Xoá: người học xác nhận trong hộp thoại; hệ thống xoá bộ.

**12. Luồng ngoại lệ**

- Sửa/xoá bộ không phải của mình: trả 404.
- Dữ liệu không hợp lệ: trả 400.

**13. Quy tắc nghiệp vụ**

- Chế độ mặc định là Riêng tư.
- Chuyển bộ về Riêng tư KHÔNG xoá tiến độ của người đã học; họ chỉ mất quyền truy cập.
- Bộ đang bị chặn vẫn hiện với chủ bộ.

**14. Dữ liệu đầu vào:** name, description, level, visibility

**15. Dữ liệu đầu ra:** Bộ thẻ tóm tắt

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/library`, `/library/:id`
- API: `POST /library/sets`, `PATCH /library/sets/:id`, `DELETE /library/sets/:id`
- Bảng dữ liệu: `Topic`, `Vocabulary`
- `library.service.ts` — `createSet`, `updateSet`, `deleteSet`, `findOwnedSet`
- `shared/src/schemas/study-set.schema.ts` — `createStudySetSchema`
- `be/prisma/schema.prisma` — `Vocabulary.topic onDelete: Cascade`

### UC-LIB-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-05 |
| 2. Tên Use Case | Nhập bộ thẻ mới từ tệp (Import New Study Set) |
| 3. Mục tiêu | Tạo nhanh một bộ thẻ từ tệp có sẵn thay vì gõ từng thẻ. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tạo một bộ thẻ mới kèm toàn bộ thẻ từ tệp CSV hoặc XLSX. |
| 7. Trigger | Người học bấm "Nhập từ file" ở `/library`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Có tệp CSV hoặc XLSX.

**9. Hậu điều kiện**

- Một bộ mới cùng các thẻ hợp lệ được tạo trong MỘT transaction.

**10. Luồng sự kiện chính**

1. Người học chọn tệp và điền thông tin bộ.
2. Giao diện đọc tệp, tách thẻ, hiện bản xem trước kèm số thẻ trùng sẽ bỏ qua.
3. Người học xác nhận nhập.
4. Hệ thống bỏ thẻ trùng trong cùng lần nhập, tạo bộ và thẻ.
5. Giao diện báo số thẻ đã tạo và số thẻ bỏ qua.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 1a. Tệp vượt 2 MB hoặc không đúng định dạng: giao diện từ chối.
- 4a. Không có thẻ hợp lệ hoặc quá 500 thẻ: trả 400.
- 4b. Lỗi giữa chừng: transaction huỷ, không để lại bộ rỗng.

**13. Quy tắc nghiệp vụ**

- Tối đa 500 thẻ mỗi lần, tệp tối đa 2 MB.
- Chống trùng lại ở BE bằng cùng khoá `cardImportKey` với FE nên số "bỏ qua" hai bên khớp nhau.

**14. Dữ liệu đầu vào:** set (name, description, level, visibility), cards[] (word, meaning, phonetic, example)

**15. Dữ liệu đầu ra:** Bộ thẻ mới, created, skipped

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Endpoint nhận body tới 3 MB.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/library`
- API: `POST /library/sets/import`
- Bảng dữ liệu: `Topic`, `Vocabulary`
- `library.service.ts` — `importNewSet`, `dropDuplicateCards`
- `fe/src/features/library/components/ImportCardsModal.tsx` (`accept=".csv,.xlsx"`)
- `shared/src/study/study.ts` — `CARD_IMPORT_MAX_ROWS`, `CARD_IMPORT_MAX_FILE_BYTES`

### UC-LIB-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-06 |
| 2. Tên Use Case | Quản lý thẻ trong bộ (Manage Cards) |
| 3. Mục tiêu | Duy trì nội dung từng thẻ trong bộ của mình. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Thêm, sửa, xoá thẻ (từ, nghĩa, phiên âm, ví dụ) trong bộ của chính mình. |
| 7. Trigger | Chủ bộ bấm Thêm thẻ, Sửa thẻ hoặc Xoá thẻ ở `/library/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Là chủ bộ thẻ.

**9. Hậu điều kiện**

- Thẻ được tạo, cập nhật hoặc xoá. Xoá thẻ kéo theo tiến độ và lịch sử ôn của mọi người trên thẻ đó.

**10. Luồng sự kiện chính**

1. Chủ bộ bấm Thêm thẻ, nhập từ, nghĩa, phiên âm, ví dụ.
2. Hệ thống kiểm tra quyền sở hữu và lưu.

**11. Luồng thay thế**

- 1a. Sửa thẻ: chủ bộ sửa nội dung; hệ thống lưu.
- 1b. Xoá thẻ: chủ bộ xác nhận; hệ thống xoá.

**12. Luồng ngoại lệ**

- Thẻ hoặc bộ không phải của mình: trả 404.
- Thiếu từ hoặc nghĩa: trả 400.

**13. Quy tắc nghiệp vụ**

- Chỉ chủ bộ sửa được thẻ; Quản trị viên không sửa được bộ người học tạo.

**14. Dữ liệu đầu vào:** word, meaning, phonetic (tuỳ chọn), example (tuỳ chọn)

**15. Dữ liệu đầu ra:** Thẻ

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/library/:id`
- API: `POST /library/sets/:id/cards`, `PATCH /library/cards/:id`, `DELETE /library/cards/:id`
- Bảng dữ liệu: `Vocabulary`
- `library.service.ts` — `addCard`, `updateCard`, `deleteCard`, `findOwnedCard`

### UC-LIB-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-07 |
| 2. Tên Use Case | Nhập thẻ từ tệp vào bộ (Import Cards into Set) |
| 3. Mục tiêu | Bổ sung hàng loạt thẻ vào một bộ đã có. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Thêm hàng loạt thẻ từ tệp vào một bộ đã có, bỏ qua thẻ trùng. |
| 7. Trigger | Chủ bộ chọn nhập thẻ từ tệp trên `/library/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là chủ bộ.
- Có tệp CSV hoặc XLSX.

**9. Hậu điều kiện**

- Các thẻ mới không trùng được thêm vào bộ.

**10. Luồng sự kiện chính**

1. Chủ bộ chọn tệp; giao diện hiện bản xem trước.
2. Chủ bộ xác nhận.
3. Hệ thống bỏ thẻ trùng với thẻ đã có trong bộ và trùng nhau trong lần nhập.
4. Hệ thống thêm các thẻ còn lại, trả số đã tạo và số bỏ qua.

**11. Luồng thay thế**

- 3a. Mọi thẻ đều trùng: không thêm gì, trả `created = 0`.

**12. Luồng ngoại lệ**

- Không phải chủ bộ: trả 404.
- Quá 500 thẻ: trả 400.

**13. Quy tắc nghiệp vụ**

- Chống trùng lại ở BE vì giữa lúc xem trước và lúc nhập, chủ bộ có thể đã thêm tay đúng thẻ đó ở tab khác.

**14. Dữ liệu đầu vào:** cards[]

**15. Dữ liệu đầu ra:** created, skipped

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Endpoint nhận body tới 3 MB.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/library/:id`
- API: `POST /library/sets/:id/cards/import`
- Bảng dữ liệu: `Vocabulary`
- `library.service.ts` — `importCards`

### UC-LIB-08

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-08 |
| 2. Tên Use Case | Chia sẻ liên kết bộ thẻ (Share Study Set Link) |
| 3. Mục tiêu | Gửi bộ thẻ cho người khác bằng liên kết. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Sao chép liên kết tới trang chi tiết bộ thẻ để gửi cho người khác. |
| 7. Trigger | Người học bấm "Chia sẻ" trên `/library/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đang xem chi tiết một bộ thẻ.

**9. Hậu điều kiện**

- Liên kết `/library/:id` nằm trong clipboard. Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Người học bấm Chia sẻ.
2. Giao diện chép địa chỉ trang vào clipboard và báo đã chép.

**11. Luồng thay thế**

- 2a. Trình duyệt chặn clipboard: giao diện hiện liên kết để người học tự chép.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Người nhận chỉ mở được nếu có quyền đọc bộ (UC-LIB-03). Chia sẻ liên kết KHÔNG mở thêm quyền; bộ riêng tư vẫn trả 404 với người khác.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Liên kết

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** «extend» UC-LIB-03

**18. Căn cứ xác minh**

- Giao diện: `/library/:id`
- API: không có (tiến trình nền hoặc chỉ giao diện)
- Bảng dữ liệu: không có
- `fe/src/features/library/components/StudySetDetailPage.tsx` — `navigator.clipboard.writeText` (dòng 74)

### UC-LIB-09

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-LIB-09 |
| 2. Tên Use Case | Báo cáo vi phạm bộ thẻ (Report Study Set) |
| 3. Mục tiêu | Báo cho Quản trị viên một bộ thẻ công khai có nội dung vi phạm. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Báo cáo một bộ thẻ công khai của người khác kèm lý do. |
| 7. Trigger | Người học bấm "Báo cáo" trên trang chi tiết bộ của người khác. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Bộ thẻ công khai, không phải của mình, không phải bộ Hệ thống.
- Người học chưa có báo cáo đang chờ cho bộ này.

**9. Hậu điều kiện**

- Có một dòng `study_set_reports` trạng thái `PENDING`.
- Mọi Quản trị viên đang hoạt động nhận thông báo `STUDY_SET_REPORTED`.

**10. Luồng sự kiện chính**

1. Người học nhập lý do.
2. Hệ thống kiểm tra điều kiện bộ thẻ.
3. Hệ thống ghi báo cáo với khoá chờ `pendingKey`.
4. Hệ thống báo cho mọi Quản trị viên.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 2a. Bộ của chính mình: trả 400 "Không thể báo cáo bộ thẻ của chính bạn".
- 2b. Bộ Hệ thống: trả 400 "Bộ thẻ của hệ thống không nhận báo cáo".
- 2c. Bộ không công khai hoặc đã bị chặn: trả 404.
- 3a. Đã có báo cáo đang chờ: ràng buộc UNIQUE `pendingKey` chặn, trả 409.
- 1a. Lý do dưới 10 ký tự: trả 400.

**13. Quy tắc nghiệp vụ**

- Lý do 10–500 ký tự.
- Chống báo cáo trùng bằng ràng buộc UNIQUE của DB, không bằng đọc-rồi-ghi.

**14. Dữ liệu đầu vào:** reason

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** «extend» UC-LIB-03

**18. Căn cứ xác minh**

- Giao diện: `/library/:id`
- API: `POST /library/sets/:id/reports`
- Bảng dữ liệu: `StudySetReport`, `Notification`
- `library.service.ts` — `reportSet`
- `library.access.ts` — `pendingReportKey`
- Giao diện: nút Báo cáo chỉ có ở `/library/13`

---

## STU — Học và ôn tập

### UC-STU-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-01 |
| 2. Tên Use Case | Học bộ thẻ (Study a Set) |
| 3. Mục tiêu | Học thẻ của một bộ, thẻ mới và thẻ đã học đều được đưa vào lịch ôn. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Học một bộ thẻ bằng Flashcard (tự chấm) hoặc Trắc nghiệm 4 phương án, theo lượt câu hỏi. |
| 7. Trigger | Người học chọn một bộ ở `/learn`, hoặc bấm "Học" ở `/library/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `LEARN` bật (và `VOCABULARY`).
- Có quyền đọc bộ thẻ.

**9. Hậu điều kiện**

- Mỗi câu đã trả lời được ghi như UC-STU-04.
- Nếu có ít nhất một câu: một phiên học hoàn thành được ghi (UC-STU-05).

**10. Luồng sự kiện chính**

1. Người học chọn bộ và chế độ: Flashcard (lật thẻ, tự chấm) hoặc Trắc nghiệm (chọn 1 trong 4).
2. Hệ thống kiểm tra cờ và quyền, chọn thẻ, sinh câu hỏi. Mỗi câu mang một mã câu hỏi mã hoá AES-GCM chứa đáp án.
3. Với mỗi câu, người học trả lời → «include» UC-STU-04.
4. Hết lượt câu hỏi, giao diện hiện kết quả phiên → «extend» UC-STU-05.

**11. Luồng thay thế**

- 1a. Trắc nghiệm: phương án nhiễu lấy từ CÙNG bộ của thẻ.
- 4a. Người học thoát giữa chừng sau khi đã trả lời ít nhất một câu: vẫn ghi phiên (UC-STU-05).

**12. Luồng ngoại lệ**

- 2a. Trắc nghiệm trên bộ dưới 4 thẻ: trả 400 "Bộ thẻ cần ít nhất 4 thẻ để làm trắc nghiệm".
- 2b. Không có quyền đọc bộ hoặc cờ `LEARN` tắt: trả 404.
- 2c. Một thẻ không dựng được câu trắc nghiệm: bỏ qua thẻ đó, trả số `skipped`.

**13. Quy tắc nghiệp vụ**

- Mỗi lượt mặc định 20 câu, tối đa 50.
- Đáp án không rời server trước khi trả lời: mã câu hỏi được mã hoá, không chỉ ký.
- Học và Ôn tập dùng CHUNG một trạng thái nhớ cho mỗi thẻ (`user_vocab_progress`).

**14. Dữ liệu đầu vào:** setId, mode (FLASHCARD | MULTIPLE_CHOICE), source = LEARN, group, limit

**15. Dữ liệu đầu ra:** Danh sách câu hỏi (không kèm đáp án), skipped

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Service kiểm thêm cờ `LEARN`.

**17. Quan hệ với use case khác:** «include» UC-STU-04; được «extend» bởi UC-STU-05

**18. Căn cứ xác minh**

- Giao diện: `/learn`, `/library/:id`
- API: `POST /study/questions`
- Bảng dữ liệu: `Vocabulary`, `UserVocabProgress`
- `study.service.ts` — `getQuestions`, `selectCards`, `assertSourceEnabled`
- `study/question-token.ts` — `encodeQuestionToken`
- `fe/src/features/study/components/LearnPage.tsx`, `StudySession.tsx`

### UC-STU-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-02 |
| 2. Tên Use Case | Ôn tập thẻ theo lịch (Review Due Cards) |
| 3. Mục tiêu | Ôn đúng thẻ cần ôn vào đúng ngày để nhớ lâu. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Ôn thẻ theo nhóm Mới, Tới hạn, Quá hạn, Yếu trên mọi bộ đang học, theo lịch SM-2. |
| 7. Trigger | Người học mở `/review`, chọn nhóm thẻ và chế độ rồi bấm Bắt đầu. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `FLASHCARDS` bật.

**9. Hậu điều kiện**

- Mỗi câu đã trả lời được ghi như UC-STU-04; lịch ôn của thẻ dời theo SM-2.

**10. Luồng sự kiện chính**

1. Hệ thống hiện số thẻ của 4 nhóm: Mới, Tới hạn, Quá hạn, Yếu và ngày ôn gần nhất.
2. Người học chọn nhóm và chế độ, bấm Bắt đầu.
3. Hệ thống chọn thẻ của nhóm đó trên mọi bộ người học có quyền đọc, sinh câu hỏi.
4. Với mỗi câu, người học trả lời → «include» UC-STU-04.

**11. Luồng thay thế**

- 3a. Nhóm Mới: chỉ lấy thẻ chưa học trong các bộ ĐÃ bắt đầu học, không lấy toàn bộ thư viện.
- 3b. Nhóm Yếu: thẻ quên từ 2 lần trở lên hoặc tỷ lệ sai cao.

**12. Luồng ngoại lệ**

- 1a. Cờ `FLASHCARDS` tắt: trả 404.
- 3c. Nhóm không có thẻ: trả danh sách rỗng, giao diện báo không có gì để ôn.

**13. Quy tắc nghiệp vụ**

- Lịch ôn tính theo NGÀY (`next_review_date` kiểu DATE), không có mốc phút.
- Thuật toán duy nhất là `reviewCard()` của `shared/srs` (SM-2).
- Thẻ của bộ đã chuyển riêng tư hoặc bị chặn tự rời khỏi mọi nhóm ôn.

**14. Dữ liệu đầu vào:** group (NEW | DUE | OVERDUE | WEAK), mode, source = REVIEW, limit

**15. Dữ liệu đầu ra:** Tổng quan 4 nhóm, Danh sách câu hỏi

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Service kiểm thêm cờ `FLASHCARDS`.

**17. Quan hệ với use case khác:** «include» UC-STU-04

**18. Căn cứ xác minh**

- Giao diện: `/review`
- API: `GET /study/overview`, `GET /study/due-count`, `POST /study/questions`
- Bảng dữ liệu: `UserVocabProgress`, `Vocabulary`
- `study.service.ts` — `getOverview`, `getDueCount`, `findWeak`
- `shared/src/study/study.ts` — `isWeakCard`, `WEAK_MIN_LAPSES`
- Giao diện `/review`: 4 nhóm, Flashcard/Trắc nghiệm, Bắt đầu

### UC-STU-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-03 |
| 2. Tên Use Case | Ôn nhanh (Cram) (Cram Practice) |
| 3. Mục tiêu | Luyện nhanh trước giờ kiểm tra mà không làm lệch lịch ôn hay thống kê. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Luyện nhanh một bộ hoặc nhóm thẻ yếu; chỉ báo đúng/sai, không ghi nhận gì. |
| 7. Trigger | Người học bấm "Ôn nhanh" ở `/library/:id` hoặc "Ôn nhanh (n)" ở `/review`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `FLASHCARDS` bật.

**9. Hậu điều kiện**

- KHÔNG ghi gì: không đổi lịch SM-2, không ghi `card_reviews`, không ghi `activity_logs`.

**10. Luồng sự kiện chính**

1. Hệ thống sinh câu hỏi với `source = CRAM`.
2. Với mỗi câu, người học trả lời → «include» UC-STU-04 (nhánh chỉ chấm).
3. Giao diện báo đúng/sai và đáp án.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Cờ `FLASHCARDS` tắt: trả 404.

**13. Quy tắc nghiệp vụ**

- Cram không ghi nhận để người học không cày được XP và chuỗi ngày vô hạn.

**14. Dữ liệu đầu vào:** setId hoặc group, mode, source = CRAM

**15. Dữ liệu đầu ra:** Câu hỏi, Kết quả đúng/sai

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Service kiểm thêm cờ `FLASHCARDS`.

**17. Quan hệ với use case khác:** «include» UC-STU-04

**18. Căn cứ xác minh**

- Giao diện: `/review`, `/library/:id`
- API: `POST /study/questions`
- Bảng dữ liệu: `Vocabulary`
- `study.service.ts` — nhánh `payload.source === StudySource.CRAM` trong `submitAnswer`

### UC-STU-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-04 |
| 2. Tên Use Case | Trả lời và chấm thẻ (Answer and Grade Card) |
| 3. Mục tiêu | Chấm một câu và ghi kết quả ngay, không mất khi người học bỏ dở. |
| 4. Actor chính | Không có — chỉ chạy qua quan hệ với use case khác |
| 5. Actor phụ | Không có |
| 6. Mô tả | Chấm một câu trả lời; với Học và Ôn tập thì ghi lịch sử, cập nhật lịch SM-2 và ghi hoạt động học. |
| 7. Trigger | Được gọi từ UC-STU-01, UC-STU-02, UC-STU-03 mỗi khi người học trả lời một câu. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Có mã câu hỏi hợp lệ do chính người học nhận được.

**9. Hậu điều kiện**

- Học, Ôn tập: ghi một dòng `card_reviews`; tạo hoặc cập nhật `user_vocab_progress`; ghi một dòng `activity_logs` (`VOCAB_LEARNED` nếu thẻ chưa từng học, `FLASHCARD_REVIEWED` nếu đã có lịch); cập nhật `user_streaks` — tất cả trong một transaction.
- Cram: không ghi gì.

**10. Luồng sự kiện chính**

1. Hệ thống giải mã câu hỏi, kiểm tra thuộc về người học.
2. Hệ thống kiểm tra LẠI quyền đọc thẻ.
3. Hệ thống chấm: Flashcard theo mức tự chấm (AGAIN/HARD/GOOD/EASY → chất lượng SM-2); Trắc nghiệm theo phương án đúng.
4. Hệ thống tính lịch mới bằng `reviewCard()`.
5. Trong một transaction: ghi lịch sử, cập nhật tiến độ và bộ đếm, gọi `recordActivity`.
6. Hệ thống trả đúng/sai, đáp án đúng, ngày ôn kế tiếp.

**11. Luồng thay thế**

- 3a. Nguồn CRAM: trả kết quả chấm, bỏ qua bước 4–5.
- 5a. Mã câu hỏi đã được nộp trước đó (bấm hai lần, mạng gửi lại): trả lại kết quả của LẦN ĐẦU với `duplicate = true`.

**12. Luồng ngoại lệ**

- 1a. Mã câu hỏi sai hoặc của người khác: trả 400.
- 2a. Bộ vừa bị chặn, chuyển riêng tư hoặc bị xoá trong lúc làm: trả 404 "Thẻ này không còn truy cập được".
- 3b. Flashcard thiếu mức nhớ, hoặc Trắc nghiệm thiếu phương án: trả 400.
- 5b. Hai câu khác nhau của cùng một thẻ mới được nộp cùng lúc: trả 409, người học thử lại.

**13. Quy tắc nghiệp vụ**

- Không có bước nộp cả phiên; mỗi câu ghi ngay.
- `card_reviews` UNIQUE (`user_id`, `attempt_key`) chặn ghi trùng.
- Mọi hoạt động học PHẢI đi qua `recordActivity` — phễu duy nhất ghi `activity_logs` và cập nhật streak.
- `card_reviews` chỉ phục vụ lịch sử và độ chính xác; streak, XP, thống kê vẫn đọc `activity_logs`.

**14. Dữ liệu đầu vào:** token, rating (Flashcard) hoặc choiceIndex (Trắc nghiệm), responseMs, sessionKey (Học)

**15. Dữ liệu đầu ra:** isCorrect, correctIndex, correctAnswer, nextReviewDate, intervalDays, duplicate

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Cờ kiểm theo nguồn ghi trong mã câu hỏi.

**17. Quan hệ với use case khác:** được «include» bởi UC-STU-01; được «include» bởi UC-STU-02; được «include» bởi UC-STU-03

**18. Căn cứ xác minh**

- Giao diện: `/learn`, `/review`
- API: `POST /study/answers`
- Bảng dữ liệu: `CardReview`, `UserVocabProgress`, `ActivityLog`, `UserStreak`
- `study.service.ts` — `submitAnswer`, `grade`, `duplicateResult`
- `activity-log.service.ts` — `recordActivity`
- `shared/src/srs` — `reviewCard`

### UC-STU-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-05 |
| 2. Tên Use Case | Ghi nhận hoàn thành phiên học (Record Session Completion) |
| 3. Mục tiêu | Tính một phiên Học là hoàn thành để mục tiêu "Số phiên học mỗi tuần" và XP ghi nhận. |
| 4. Actor chính | Không có — chỉ chạy qua quan hệ với use case khác |
| 5. Actor phụ | Không có |
| 6. Mô tả | Khi phiên Học kết thúc với ít nhất một câu đã trả lời, ghi một phiên học hoàn thành. |
| 7. Trigger | Điểm mở rộng của UC-STU-01: hết lượt câu hỏi hoặc người học thoát, với ít nhất một câu đã trả lời. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Phiên Học có `sessionKey` và ít nhất một câu đã ghi.

**9. Hậu điều kiện**

- Ghi một dòng `activity_logs` loại `QUIZ_COMPLETED`, `value` = số câu đúng, `dedupe_key = SESSION:<sessionKey>`.

**10. Luồng sự kiện chính**

1. Giao diện gửi `sessionKey`.
2. Hệ thống đếm số câu và số đúng từ `card_reviews` của phiên.
3. Hệ thống ghi hoạt động hoàn thành phiên qua `recordActivity`.
4. Giao diện hiện tổng kết phiên.

**11. Luồng thay thế**

- 2a. Phiên chưa có câu nào: không ghi, trả `logged = false`.
- 3a. Phiên đã được ghi (gửi lại): không ghi thêm, trả `logged = false`.

**12. Luồng ngoại lệ**

- Cờ `LEARN` tắt: trả 404.

**13. Quy tắc nghiệp vụ**

- Số câu đọc từ `card_reviews`, KHÔNG tin số client gửi.
- `dedupe_key` chặn một phiên bị tính hai lần.
- Giữ tên enum `QUIZ_COMPLETED` vì `activity_logs` còn dữ liệu cũ.
- Chỉ nguồn LEARN mới có phiên; Ôn tập và Cram không ghi phiên.

**14. Dữ liệu đầu vào:** sessionKey

**15. Dữ liệu đầu ra:** logged, answered, correct

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Service kiểm thêm cờ `LEARN`.

**17. Quan hệ với use case khác:** «extend» UC-STU-01

**18. Căn cứ xác minh**

- Giao diện: `/learn`
- API: `POST /study/sessions/finish`
- Bảng dữ liệu: `CardReview`, `ActivityLog`, `UserStreak`
- `study.service.ts` — `finishSession`
- `fe/src/features/study/components/StudySession.tsx` dòng 102–118

### UC-STU-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-06 |
| 2. Tên Use Case | Xem thống kê học và ôn (View Study Statistics) |
| 3. Mục tiêu | Biết hiệu quả học và ôn của bản thân. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem số phiên, số câu, độ chính xác, số thẻ đã thuộc/đang học/yếu và ngày ôn kế tiếp. |
| 7. Trigger | Người học mở `/review`, khối Thống kê. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống tổng hợp: số phiên Học, số câu, đúng, sai, độ chính xác, thời gian; số lượt ôn, thẻ tới hạn, quá hạn, yếu, đã thuộc, đang học, độ chính xác ôn, ngày ôn kế tiếp.
2. Giao diện hiện các số liệu.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Số phiên đếm từ `activity_logs` (`QUIZ_COMPLETED` có khoá `SESSION:`); độ chính xác đọc từ `card_reviews`.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** StudyStats (learning, review)

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. `getStats` không kiểm thêm cờ `LEARN`/`FLASHCARDS`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/review`
- API: `GET /study/stats`
- Bảng dữ liệu: `ActivityLog`, `CardReview`, `UserVocabProgress`
- `study.service.ts` — `getStats`, `summarizeProgress`

### UC-STU-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STU-07 |
| 2. Tên Use Case | Xem lịch sử ôn tập (View Review History) |
| 3. Mục tiêu | Xem lại từng lượt trả lời đã qua. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem từng lượt trả lời đã ghi, có phân trang. |
| 7. Trigger | Người học mở tab "Lịch sử ôn" ở `/review`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả các lượt trả lời mới nhất trước: từ, nghĩa, bộ, chế độ, đúng/sai, khoảng ôn trước và sau.
2. Người học chuyển trang.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Mỗi trang 20 dòng (tối đa 50).
- Thẻ của bộ đã riêng tư hoặc bị chặn tự rời khỏi lịch sử.

**14. Dữ liệu đầu vào:** page, pageSize

**15. Dữ liệu đầu ra:** Danh sách lượt ôn, Tổng số

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(VOCABULARY)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/review`
- API: `GET /study/history`
- Bảng dữ liệu: `CardReview`, `Vocabulary`, `Topic`
- `study.service.ts` — `listHistory`
- Giao diện `/review` tab Lịch sử ôn

---

## HAB — Thói quen và mục tiêu

### UC-HAB-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-HAB-01 |
| 2. Tên Use Case | Quản lý thói quen (Manage Habits) |
| 3. Mục tiêu | Tự đặt ra các thói quen học và giữ danh sách đó gọn gàng. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem, tạo, sửa và xoá thói quen học với tần suất hằng ngày, hằng tuần hoặc tuỳ chọn. |
| 7. Trigger | Người học mở `/habits`, bấm "Thêm thói quen" hoặc "Xoá thói quen". |
| Trạng thái xác minh | Partially Confirmed — Thao tác SỬA có API và hook `useUpdateHabit` nhưng không có nút trên giao diện (UI chỉ có Thêm, Check-in, Xoá). |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `HABITS` bật.

**9. Hậu điều kiện**

- Tạo: có một dòng `habits`.
- Sửa: thông tin thói quen được cập nhật.
- Xoá: thói quen và toàn bộ `habit_check_ins` của nó bị xoá; các dòng `activity_logs` đã ghi GIỮ NGUYÊN.

**10. Luồng sự kiện chính**

1. Hệ thống hiện danh sách thói quen, mỗi thói quen kèm trạng thái đã check-in hôm nay.
2. Người học bấm "Thêm thói quen", nhập tên, tần suất (Hằng ngày / Hằng tuần / Tuỳ chọn các thứ).
3. Hệ thống kiểm tra và lưu.

**11. Luồng thay thế**

- 2a. Xoá: người học xác nhận trong hộp thoại "Lịch sử check-in của thói quen này cũng mất theo và không khôi phục được."; hệ thống xoá.
- 2b. Sửa (tên, tần suất, các thứ, tạm dừng): có API `PATCH /habits/:id` — **chưa xác minh được từ giao diện hiện tại**, không có nút sửa trên `/habits`.

**12. Luồng ngoại lệ**

- Thói quen không phải của mình: trả 404.
- Tần suất Tuỳ chọn mà không chọn thứ nào, hoặc tên rỗng: trả 400.

**13. Quy tắc nghiệp vụ**

- Tên 1–120 ký tự.
- Xoá thói quen không xoá `activity_logs` — hoạt động học đã xảy ra vẫn là sự thật, streak và XP không bị giảm.

**14. Dữ liệu đầu vào:** name, frequency, customDays, isActive

**15. Dữ liệu đầu ra:** Thói quen

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(HABITS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/habits`
- API: `GET /habits`, `POST /habits`, `PATCH /habits/:id`, `DELETE /habits/:id`
- Bảng dữ liệu: `Habit`, `HabitCheckIn`
- `habit.service.ts` — `listHabits`, `createHabit`, `updateHabit`, `deleteHabit`
- `fe/src/features/habits/habit.hooks.ts` — `useUpdateHabit` (định nghĩa nhưng không có component nào gọi)
- Giao diện `/habits`: Thêm thói quen, Check-in, Xoá thói quen

### UC-HAB-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-HAB-02 |
| 2. Tên Use Case | Check-in thói quen (Check In Habit) |
| 3. Mục tiêu | Ghi nhận đã làm một thói quen hôm nay; việc này giữ chuỗi ngày học. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đánh dấu hoàn thành một thói quen trong ngày; được tính là hoạt động học. |
| 7. Trigger | Người học bấm "Check-in" trên một thói quen. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Là chủ thói quen.
- Chưa check-in thói quen này trong ngày.

**9. Hậu điều kiện**

- Có một dòng `habit_check_ins`.
- Có một dòng `activity_logs` loại `HABIT_CHECKIN` và `user_streaks` được cập nhật — cùng một transaction.
- Có thể sinh thông báo `GOAL_ACHIEVED` nếu vừa đạt mục tiêu.

**10. Luồng sự kiện chính**

1. Người học bấm Check-in.
2. Hệ thống xác định ngày theo múi giờ người học.
3. Hệ thống kiểm tra chưa check-in ngày đó.
4. Trong một transaction: ghi check-in và gọi `recordActivity`.
5. Giao diện báo "Đã check-in".

**11. Luồng thay thế**

- 1a. Chọn ngày đã qua: xem UC-HAB-03.

**12. Luồng ngoại lệ**

- 3a. Đã check-in ngày đó: trả 409 "Thói quen này đã được check-in trong ngày".
- Thói quen không phải của mình: trả 404.

**13. Quy tắc nghiệp vụ**

- Mỗi thói quen tối đa một check-in mỗi ngày (UNIQUE `habit_id`, `local_date`).
- Check-in là hoạt động học: +12 XP, tính cho nhiệm vụ "Làm 1 thói quen" và giữ chuỗi.

**14. Dữ liệu đầu vào:** habitId, note (tuỳ chọn)

**15. Dữ liệu đầu ra:** date

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(HABITS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** được «extend» bởi UC-HAB-03

**18. Căn cứ xác minh**

- Giao diện: `/habits`
- API: `POST /habits/:id/check-in`
- Bảng dữ liệu: `HabitCheckIn`, `ActivityLog`, `UserStreak`
- `habit.service.ts` — `checkIn`
- `activity-log.service.ts` — `recordActivity`
- `shared/src/level/level.ts` — `XP_PER_ACTIVITY`

### UC-HAB-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-HAB-03 |
| 2. Tên Use Case | Check-in bù thói quen (Backfill Habit Check-in) |
| 3. Mục tiêu | Bù check-in cho một ngày đã làm mà quên bấm, tính đúng cho ngày đó. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Check-in cho một ngày đã qua trong 7 ngày gần nhất; hoạt động được tính cho đúng ngày được bù. |
| 7. Trigger | Điểm mở rộng của UC-HAB-02 khi có ngày được chọn khác hôm nay. |
| Trạng thái xác minh | Partially Confirmed — API nhận trường `date` và có đủ quy tắc; giao diện hiện chỉ gửi `{ id }` nên người dùng chưa có cách chọn ngày bù. |

**8. Tiền điều kiện**

- Như UC-HAB-02.
- Ngày được chọn nằm trong 7 ngày gần nhất và không ở tương lai.

**9. Hậu điều kiện**

- Như UC-HAB-02, nhưng `activity_logs.local_date` là NGÀY ĐƯỢC BÙ; `occurred_at` vẫn là lúc ghi.
- Streak được TÍNH LẠI từ đầu vì ngày bù có thể nối liền một quãng đứt.

**10. Luồng sự kiện chính**

1. Người học chọn ngày cần bù và check-in.
2. Hệ thống kiểm tra khoảng ngày.
3. Hệ thống ghi check-in và hoạt động cho đúng ngày đó.
4. Hệ thống tính lại streak bằng `recomputeStreak`.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 2a. Ngày ở tương lai: trả 400 "Không thể check-in cho ngày chưa tới".
- 2b. Quá 7 ngày: trả 400 "Chỉ check-in bù được trong vòng 7 ngày gần nhất".
- 3a. Ngày đó đã check-in: trả 409.

**13. Quy tắc nghiệp vụ**

- `MAX_BACKFILL_DAYS = 7`.
- Ghi bù không cộng dồn streak mà tính lại toàn bộ.
- **Giao diện hiện tại không có chỗ chọn ngày** — màn `/habits` chỉ gửi `{ id }`. Use case chỉ thực hiện được qua API.

**14. Dữ liệu đầu vào:** habitId, date, note (tuỳ chọn)

**15. Dữ liệu đầu ra:** date

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(HABITS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** «extend» UC-HAB-02

**18. Căn cứ xác minh**

- Giao diện: không có
- API: `POST /habits/:id/check-in`
- Bảng dữ liệu: `HabitCheckIn`, `ActivityLog`, `UserStreak`
- `habit.service.ts` — `checkIn` (tham số `input.date`, `MAX_BACKFILL_DAYS`)
- `activity-log.service.ts` — nhánh `isBackdated` gọi `recomputeStreak`
- `fe/src/features/habits/components/HabitsPage.tsx` dòng 80–88 (`checkIn.mutate({ id: habit.id })`)

### UC-HAB-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-HAB-04 |
| 2. Tên Use Case | Xem lịch sử và tỷ lệ hoàn thành thói quen (View Habit History) |
| 3. Mục tiêu | Thấy mình giữ thói quen đều đặn tới đâu. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem các ngày đã check-in và tỷ lệ hoàn thành của từng thói quen. |
| 7. Trigger | Người học xem một thói quen ở `/habits`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là chủ thói quen.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả các ngày đã check-in trong khoảng thời gian.
2. Hệ thống tính số ngày đáng lẽ phải làm theo tần suất, số ngày đã làm và tỷ lệ phần trăm.
3. Giao diện hiện dải ngày đã/chưa check-in và tỷ lệ.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Thói quen không phải của mình: trả 404.

**13. Quy tắc nghiệp vụ**

- Số ngày phải làm tính theo tần suất (`countExpectedDays`): thói quen hằng tuần không bị tính là "trượt" 6 ngày mỗi tuần.

**14. Dữ liệu đầu vào:** habitId, from, to

**15. Dữ liệu đầu ra:** Danh sách ngày check-in, expected, completed, rate

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(HABITS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/habits`
- API: `GET /habits/:id/check-ins`, `GET /habits/:id/completion-rate`
- Bảng dữ liệu: `HabitCheckIn`
- `habit.service.ts` — `listCheckIns`, `getCompletionRate`

### UC-HAB-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-HAB-05 |
| 2. Tên Use Case | Quản lý mục tiêu (Manage Goals) |
| 3. Mục tiêu | Đặt ra chỉ tiêu học cụ thể để có đích mà hướng tới. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tạo mục tiêu học (số từ/ngày, số lượt ôn/ngày, số phiên/tuần, chuỗi ngày), đặt hoặc đổi hạn, xoá. |
| 7. Trigger | Người học bấm "+ Thêm mục tiêu", "Đặt hạn" hoặc "Xoá" ở `/goals`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `GOALS` bật.

**9. Hậu điều kiện**

- Tạo: một dòng `goals` trạng thái `ACTIVE`.
- Đặt/đổi hạn: cập nhật `end_date`.
- Xoá: dòng `goals` bị xoá.

**10. Luồng sự kiện chính**

1. Người học chọn loại mục tiêu: Số từ vựng mỗi ngày, Số lượt ôn tập mỗi ngày, Số phiên học mỗi tuần, Chuỗi ngày học liên tiếp.
2. Người học nhập chỉ tiêu, kỳ (ngày/tuần), ngày bắt đầu, hạn (tuỳ chọn).
3. Hệ thống kiểm tra và lưu.

**11. Luồng thay thế**

- 1a. Đặt hạn / Đổi hạn / Gia hạn: người học chọn ngày mới; hệ thống lưu.
- 1b. Xoá: người học xác nhận; hệ thống xoá.

**12. Luồng ngoại lệ**

- Hạn trước ngày bắt đầu: trả 400.
- Hạn trước hôm nay: trả 400 "Hạn phải từ hôm nay trở đi".
- Chỉ tiêu ≤ 0 hoặc > 10 000: trả 400.
- Mục tiêu không phải của mình: trả 404.

**13. Quy tắc nghiệp vụ**

- Mục tiêu không lưu tiến độ; tiến độ tính lại mỗi lần đọc (UC-HAB-06).
- Loại `LESSONS_PER_WEEK` hiển thị là "Số phiên học mỗi tuần" và đếm `QUIZ_COMPLETED` do UC-STU-05 sinh.

**14. Dữ liệu đầu vào:** type, targetValue, period, startDate, endDate

**15. Dữ liệu đầu ra:** Mục tiêu

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(GOALS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/goals`
- API: `GET /goals`, `POST /goals`, `PATCH /goals/:id`, `DELETE /goals/:id`
- Bảng dữ liệu: `Goal`
- `goal.service.ts` — `createGoal`, `updateGoal`, `deleteGoal`, `assertDeadlineNotPast`
- `shared/src/schemas/goal.schema.ts`
- Giao diện `/goals`: + Thêm mục tiêu, Đặt hạn, Xoá

### UC-HAB-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-HAB-06 |
| 2. Tên Use Case | Xem tiến độ mục tiêu (View Goal Progress) |
| 3. Mục tiêu | Biết mình còn cách mục tiêu bao xa trong kỳ này. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem mức hoàn thành của từng mục tiêu đang hiệu lực trong kỳ hiện tại. |
| 7. Trigger | Người học mở `/goals` hoặc khối "Tiến độ mục tiêu" ở `/`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống lấy các mục tiêu `ACTIVE` đang trong hiệu lực.
2. Với mỗi mục tiêu, hệ thống đếm `activity_logs` đúng loại từ đầu kỳ (hôm nay hoặc đầu tuần) tới hôm nay; mục tiêu chuỗi ngày đọc chuỗi hiện tại.
3. Hệ thống trả giá trị hiện tại, chỉ tiêu, phần trăm (tối đa 100) và đã hoàn thành hay chưa.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Đếm theo `local_date`, không đổi múi giờ trong SQL.
- Ánh xạ loại → hoạt động ở `GOAL_ACTIVITY_TYPE` (`shared/report`).
- Khi một hoạt động làm mục tiêu đạt, `recordActivity` sinh thông báo `GOAL_ACHIEVED` — mỗi kỳ một lần.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Danh sách tiến độ mục tiêu

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(GOALS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/goals`, `/`
- API: `GET /goals/progress`
- Bảng dữ liệu: `Goal`, `ActivityLog`, `UserStreak`
- `goal.service.ts` — `getProgress`, `measureProgress`
- `activity-log.service.ts` — `notifyAchievedGoals`

---

## STAT — Thống kê và xếp hạng

### UC-STAT-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STAT-01 |
| 2. Tên Use Case | Xem tổng quan học tập (View Learning Dashboard) |
| 3. Mục tiêu | Nhìn một màn là biết hôm nay cần làm gì và mình đang tiến bộ ra sao. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem lời chào, việc hôm nay, chuỗi ngày, cấp độ và XP, biểu đồ hoạt động và lịch 90 ngày. |
| 7. Trigger | Người học đăng nhập hoặc mở `/`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả chuỗi ngày hiện tại và dài nhất, cấp độ và XP, số liệu hoạt động theo khoảng thời gian, lịch hoạt động nhiều tháng.
2. Giao diện hiện lời chào, "Việc hôm nay", khối phần thưởng, biểu đồ hoạt động (7 ngày / Tuần này / Tháng này / 90 ngày / 12 tháng), tiến độ mục tiêu, lịch 90 ngày.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Mọi con số tính thẳng từ `activity_logs`; không có bảng tổng hợp.
- XP = tổng `XP_PER_ACTIVITY` theo loại hoạt động; cấp độ tối đa 200.
- Trang Tổng quan KHÔNG có cờ tính năng — tắt được thì người học đăng nhập xong rơi vào 404.

**14. Dữ liệu đầu vào:** range, months

**15. Dữ liệu đầu ra:** Tóm tắt, streak, level, lịch hoạt động

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)`; route FE bọc `Learner`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/`
- API: `GET /statistics/summary`, `GET /statistics/streak`, `GET /statistics/level`, `GET /statistics/calendar`
- Bảng dữ liệu: `ActivityLog`, `UserStreak`
- `statistics.service.ts` — `getSummary`, `getStreak`, `getLevel`, `getActivityCalendar`
- Giao diện `/`: tiêu đề "Việc hôm nay", "Hoạt động theo ngày", "90 ngày gần đây"

### UC-STAT-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STAT-02 |
| 2. Tên Use Case | Xem báo cáo học tập (View Learning Report) |
| 3. Mục tiêu | Đánh giá hiệu quả học trong một giai đoạn tự chọn. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem báo cáo hiệu quả học trong một khoảng ngày chọn được (tối đa 366 ngày). |
| 7. Trigger | Người học mở `/report` và chọn khoảng thời gian. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `REPORT` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Người học chọn 7 / 30 / 90 ngày, Tháng này, hoặc tự chọn ngày.
2. Hệ thống tổng hợp hoạt động và đối chiếu mục tiêu trong khoảng đó.
3. Giao diện hiện "Tổng kết hiệu quả", "Đã làm được gì", "Tiến độ mục tiêu".

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Ngày bắt đầu sau ngày kết thúc, hoặc khoảng quá 366 ngày: trả 400.

**13. Quy tắc nghiệp vụ**

- Mục tiêu chuỗi ngày không nhân chỉ tiêu theo số ngày của khoảng — đối chiếu bằng chuỗi dài nhất.
- Cờ `REPORT` gắn riêng trên route này, không trên cả router thống kê.

**14. Dữ liệu đầu vào:** from, to

**15. Dữ liệu đầu ra:** Báo cáo học tập

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)`; riêng `GET /statistics/report` gắn thêm `requireFeature(REPORT)`. Route FE bọc `Gated`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/report`
- API: `GET /statistics/report`
- Bảng dữ liệu: `ActivityLog`, `Goal`
- `statistics.service.ts` — `getLearningReport`
- `shared/src/report/report.ts` — `MAX_REPORT_DAYS`, `GOAL_ACTIVITY_TYPE`
- `statistics.routes.ts`

### UC-STAT-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-STAT-03 |
| 2. Tên Use Case | Xem bảng xếp hạng (View Leaderboard) |
| 3. Mục tiêu | Biết mình đứng thứ mấy so với những người học khác. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem thứ hạng theo điểm học tập hoặc số hoạt động, trong tuần, tháng hoặc toàn thời gian. |
| 7. Trigger | Người học mở `/leaderboard`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `LEADERBOARD` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Người học chọn tiêu chí (Điểm học tập / Hoạt động) và khoảng (Tuần này / Tháng này / Từ trước tới nay).
2. Hệ thống gom `activity_logs` theo người trong khoảng đó, tính XP bằng đúng công thức của cấp độ.
3. Hệ thống xếp hạng, trả nhóm đầu kèm khung viền ảnh đại diện.
4. Giao diện hiện bục 3 người đầu và danh sách còn lại.

**11. Luồng thay thế**

- 3a. Người học nằm ngoài nhóm đầu: hệ thống trả thêm dòng của chính họ (`me`).

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Chỉ xếp tài khoản `USER` đang `ACTIVE`.
- Hoà điểm: xếp theo tiêu chí phụ rồi theo id người dùng để thứ tự ổn định.
- Không có bảng điểm riêng; điểm xếp hạng dùng `xpFromActivityCounts` để khớp với cấp độ.
- Số dòng 3–50, mặc định 20.

**14. Dữ liệu đầu vào:** range (week | month | all), metric (xp | activities), limit

**15. Dữ liệu đầu ra:** Danh sách xếp hạng, me

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(LEADERBOARD)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/leaderboard`
- API: `GET /leaderboard`
- Bảng dữ liệu: `ActivityLog`, `User`, `UserEquippedItem`
- `leaderboard.service.ts` — `getLeaderboard`
- `shared/src/schemas/leaderboard.schema.ts`
- Giao diện `/leaderboard`: tab Điểm học tập, Hoạt động, Tuần này, Tháng này, Từ trước tới nay

---

## REW — Phần thưởng

### UC-REW-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-REW-01 |
| 2. Tên Use Case | Điểm danh nhận xu (Daily Check-in Reward) |
| 3. Mục tiêu | Có lý do mở app mỗi ngày. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Điểm danh mỗi ngày một lần để nhận 50 xu. |
| 7. Trigger | Người học bấm "Nhận 50 xu hôm nay" ở `/`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `REWARDS` bật.
- Chưa điểm danh trong ngày (theo múi giờ người học).

**9. Hậu điều kiện**

- Có một dòng `coin_transactions` +50, lý do `DAILY_CHECKIN`, khoá `DAILY_CHECKIN:<ngày>`.

**10. Luồng sự kiện chính**

1. Hệ thống hiện số dư và trạng thái điểm danh hôm nay.
2. Người học bấm nhận.
3. Hệ thống ghi +50 xu.
4. Giao diện cập nhật số dư.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 3a. Đã điểm danh hôm nay: ràng buộc UNIQUE (`user_id`, `dedupe_key`) chặn, trả 409 "Hôm nay bạn đã điểm danh rồi".

**13. Quy tắc nghiệp vụ**

- KHÔNG ghi `activity_logs`, KHÔNG cộng XP: điểm danh không phải hoạt động học.
- Số dư = `SUM(amount)`; không có cột số dư.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** coins, delta, summary

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(REWARDS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/`
- API: `GET /rewards`, `POST /rewards/check-in`
- Bảng dữ liệu: `CoinTransaction`
- `rewards.service.ts` — `getRewardsSummary`, `checkIn`, `addCoins`
- `shared/src/rewards/rewards.ts` — `DAILY_CHECKIN_REWARD = 50`

### UC-REW-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-REW-02 |
| 2. Tên Use Case | Nhận thưởng nhiệm vụ ngày (Claim Daily Mission) |
| 3. Mục tiêu | Được thưởng khi hoàn thành việc học cụ thể trong ngày. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem ba nhiệm vụ ngày và nhận 20 xu cho mỗi nhiệm vụ đã hoàn thành. |
| 7. Trigger | Người học mở "Nhiệm vụ n/3" ở `/` và bấm nhận thưởng một nhiệm vụ. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `REWARDS` bật.

**9. Hậu điều kiện**

- Có một dòng `coin_transactions` +20, lý do `MISSION_CLAIM`, khoá `MISSION:<id>:<ngày>`.

**10. Luồng sự kiện chính**

1. Hệ thống hiện 3 nhiệm vụ: học 5 thẻ mới, ôn 10 thẻ, làm 1 thói quen — kèm tiến độ tính từ `activity_logs` hôm nay.
2. Người học bấm nhận thưởng một nhiệm vụ đã đủ.
3. Hệ thống CHẤM LẠI tiến độ từ `activity_logs`.
4. Hệ thống ghi +20 xu.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 1a. Mã nhiệm vụ không tồn tại: trả 400.
- 3a. Chưa đủ tiến độ: trả 400 "Nhiệm vụ chưa hoàn thành".
- 4a. Đã nhận hôm nay: trả 409.

**13. Quy tắc nghiệp vụ**

- Tiến độ nhiệm vụ không lưu ở đâu cả — tính lại từ `activity_logs` của ngày local mỗi lần đọc và lần nữa lúc nhận.
- Không tin số liệu giao diện gửi lên.

**14. Dữ liệu đầu vào:** missionId

**15. Dữ liệu đầu ra:** coins, delta, summary

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(REWARDS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/`
- API: `GET /rewards`, `POST /rewards/missions/claim`
- Bảng dữ liệu: `ActivityLog`, `CoinTransaction`
- `rewards.service.ts` — `claimMission`, `countActivitiesOfDay`
- `shared/src/rewards/rewards.ts` — `DAILY_MISSIONS`, `evaluateMissions`

### UC-REW-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-REW-03 |
| 2. Tên Use Case | Mua vật phẩm giữ chuỗi (Buy Streak Freeze) |
| 3. Mục tiêu | Mua bảo hiểm cho chuỗi ngày học phòng khi lỡ nghỉ một hôm. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Dùng 200 xu mua một vật phẩm giữ chuỗi; kho giữ tối đa 3 vật phẩm. |
| 7. Trigger | Người học bấm "Mua" ở khối vật phẩm giữ chuỗi trên `/`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `REWARDS` bật.

**9. Hậu điều kiện**

- Có một dòng `coin_transactions` −200 và một dòng `streak_freezes` chưa dùng.

**10. Luồng sự kiện chính**

1. Người học bấm Mua.
2. Hệ thống khoá dòng người dùng (`SELECT … FOR UPDATE`).
3. Hệ thống kiểm tra kho chưa đầy và đủ xu.
4. Hệ thống ghi dòng trừ xu và thêm vật phẩm vào kho.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 3a. Kho đã có 3 vật phẩm: trả 400.
- 3b. Không đủ 200 xu: trả 400 "Cần 200 xu, bạn mới có n".

**13. Quy tắc nghiệp vụ**

- Giá 200 xu; kho tối đa 3.
- Kiểm tra số dư và ghi dòng trừ nằm trong một transaction có khoá dòng — hai lần bấm cùng lúc không tiêu âm số dư.
- Mua được nhiều lần, nên khoá chống trùng mang phần ngẫu nhiên (UUID).

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** coins, delta, summary

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(REWARDS)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/`
- API: `POST /rewards/streak-freeze/buy`
- Bảng dữ liệu: `CoinTransaction`, `StreakFreeze`
- `rewards.service.ts` — `buyStreakFreeze`
- `shared/src/rewards/rewards.ts` — `STREAK_FREEZE_PRICE`, `MAX_STREAK_FREEZES`

### UC-REW-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-REW-04 |
| 2. Tên Use Case | Tự động dùng vật phẩm giữ chuỗi (Auto-apply Streak Freeze) |
| 3. Mục tiêu | Chuỗi ngày học không đứt khi người học lỡ nghỉ một ngày mà còn vật phẩm. |
| 4. Actor chính | Bộ lập lịch hệ thống |
| 5. Actor phụ | Không có |
| 6. Mô tả | Khi người học bỏ lỡ đúng một ngày và còn vật phẩm, hệ thống tự tiêu một vật phẩm để nối lại chuỗi. |
| 7. Trigger | Bộ lập lịch chạy mỗi 30 phút. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Người học còn ít nhất một vật phẩm chưa dùng.

**9. Hậu điều kiện**

- Một vật phẩm được gán `used_on_date` = ngày bị bỏ lỡ.
- `user_streaks` được nối lại: chuỗi giữ nguyên độ dài, `last_active_date` đẩy lên ngày được bù.

**10. Luồng sự kiện chính**

1. Bộ lập lịch lấy những người còn vật phẩm.
2. Với từng người, hệ thống xác định có bỏ lỡ ĐÚNG một ngày hay không (`freezableDate`).
3. Hệ thống kiểm tra ngày đó thật sự không có hoạt động học.
4. Trong một transaction: dùng vật phẩm cũ nhất, cập nhật streak bằng `applyFrozenDay`.

**11. Luồng thay thế**

- 2a. Không bỏ lỡ ngày nào, hoặc đã bỏ lỡ từ 2 ngày: không làm gì.
- 3a. Ngày đó thực ra có học (cache streak lạc hậu): không tiêu vật phẩm.

**12. Luồng ngoại lệ**

- 4a. Hai lượt quét cùng bù một ngày: UNIQUE (`user_id`, `used_on_date`) chặn lượt thứ hai, bỏ qua không lỗi.

**13. Quy tắc nghiệp vụ**

- Không có nút "dùng vật phẩm": hôm người học quên học cũng là hôm họ không mở app.
- Ngày được bù nối mạch nhưng không cộng thêm ngày vào chuỗi.
- `recompute-streak` phải đọc `streak_freezes`, nếu không sẽ xoá công dụng vật phẩm.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Số chuỗi đã cứu (ghi log job)

**16. Quyền truy cập:** Không có actor người. Chạy trong tiến trình backend, không qua API.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: không có
- API: không có (tiến trình nền hoặc chỉ giao diện)
- Bảng dữ liệu: `StreakFreeze`, `UserStreak`, `ActivityLog`
- `be/src/jobs/streak-freeze.job.ts` — `runStreakFreezeTick`
- `rewards.service.ts` — `consumeFreezeIfNeeded`
- `shared/src/streak` — `freezableDate`, `applyFrozenDay`

---

## SHOP — Cửa hàng, ví và kho vật phẩm

### UC-SHOP-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-SHOP-01 |
| 2. Tên Use Case | Xem và tìm vật phẩm (Browse Shop Items) |
| 3. Mục tiêu | Tìm vật phẩm muốn mua bằng xu. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem vật phẩm đang bán chưa sở hữu, lọc theo loại, tìm theo tên, có phân trang. |
| 7. Trigger | Người học mở `/shop`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `SHOP` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả các loại vật phẩm đang bật và trang đầu vật phẩm đang bán mà người học chưa sở hữu.
2. Người học lọc theo loại (Tất cả / Linh vật / Khung viền…), gõ tên vào ô tìm, chuyển trang.
3. Giao diện tải ảnh vật phẩm qua endpoint ảnh công khai.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không có kết quả: hiện trạng thái rỗng.

**13. Quy tắc nghiệp vụ**

- Cửa hàng ẩn vật phẩm đã sở hữu (`hideOwned`); món đã mua nằm ở kho.
- Chỉ hiện vật phẩm và loại đang bật (`isActive`).
- Tìm theo tên tối đa 100 ký tự.
- Ảnh vật phẩm có endpoint KHÔNG cần đăng nhập vì thẻ `<img>` không gửi được token.

**14. Dữ liệu đầu vào:** typeId, q, page, pageSize

**15. Dữ liệu đầu ra:** Danh sách vật phẩm, Tổng số

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(SHOP)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404. Riêng `GET /shop/items/:id/image` công khai.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/shop`
- API: `GET /shop/types`, `GET /shop/items`, `GET /shop/items/:id/image`
- Bảng dữ liệu: `ShopItemType`, `ShopItem`, `ShopItemImage`, `UserItem`
- `shop.service.ts` — `listTypes`, `listItems`, `getItemImage`
- `shared/src/schemas/shop.schema.ts` — `shopItemQuerySchema`
- Giao diện `/shop`: ô Tìm vật phẩm, lọc loại, Trang trước/sau

### UC-SHOP-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-SHOP-02 |
| 2. Tên Use Case | Mua vật phẩm (Buy Item) |
| 3. Mục tiêu | Sở hữu vĩnh viễn một vật phẩm trang trí. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Dùng xu mua một vật phẩm; mỗi vật phẩm chỉ mua được một lần. |
| 7. Trigger | Người học bấm "Mua" trên một vật phẩm. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `SHOP` bật.
- Vật phẩm đang bán, chưa sở hữu.

**9. Hậu điều kiện**

- Có một dòng `coin_transactions` âm, lý do `SHOP_PURCHASE`, khoá `SHOP_ITEM:<itemId>`.
- Có một dòng `user_items` với `price_paid` = giá lúc mua.

**10. Luồng sự kiện chính**

1. Người học bấm Mua và xác nhận.
2. Hệ thống khoá dòng người dùng.
3. Hệ thống kiểm tra vật phẩm còn bán, chưa sở hữu, đủ xu.
4. Hệ thống ghi dòng trừ xu TRƯỚC, rồi ghi sở hữu.
5. Giao diện cập nhật số dư; vật phẩm rời khỏi cửa hàng và xuất hiện trong kho.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 3a. Vật phẩm không tồn tại hoặc đã ngừng bán: trả 404.
- 3b. Đã sở hữu: trả 409 "Bạn đã sở hữu vật phẩm này".
- 3c. Không đủ xu: trả 400 "Cần n xu, bạn mới có m".
- 4a. Hai lần mua cùng lúc: UNIQUE khoá `SHOP_ITEM:<itemId>` chặn, trả 409.

**13. Quy tắc nghiệp vụ**

- Mua hàng KHÔNG ghi `activity_logs`, không cộng XP.
- Mỗi vật phẩm mua một lần vĩnh viễn.
- Khoá dòng người dùng là bắt buộc: hai lệnh mua hai vật phẩm KHÁC nhau có hai khoá khác nhau.
- Lịch sử ví đọc `price_paid`, không đọc giá hiện tại.

**14. Dữ liệu đầu vào:** itemId

**15. Dữ liệu đầu ra:** coins, delta, item

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(SHOP)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/shop`, `/inventory`
- API: `POST /shop/items/:id/buy`
- Bảng dữ liệu: `CoinTransaction`, `UserItem`, `ShopItem`
- `shop.service.ts` — `buyItem`
- `docs/ke-hoach-cua-hang-vat-pham.md`

### UC-SHOP-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-SHOP-03 |
| 2. Tên Use Case | Đánh dấu yêu thích vật phẩm (Toggle Favorite Item) |
| 3. Mục tiêu | Đánh dấu vật phẩm muốn để dành mua sau. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Thêm hoặc bỏ vật phẩm khỏi danh sách yêu thích. |
| 7. Trigger | Người học bấm "Yêu thích" hoặc "Bỏ yêu thích". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `SHOP` bật.

**9. Hậu điều kiện**

- Thêm hoặc xoá dòng `user_item_favorites`.

**10. Luồng sự kiện chính**

1. Người học bấm biểu tượng yêu thích.
2. Hệ thống lưu trạng thái mới.
3. Giao diện cập nhật nút.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Vật phẩm không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Yêu thích được cả vật phẩm chưa mua; danh sách yêu thích hiện ở tab Yêu thích của kho.

**14. Dữ liệu đầu vào:** itemId, favorite (true/false)

**15. Dữ liệu đầu ra:** Vật phẩm

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(SHOP)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/shop`, `/inventory`
- API: `PUT /shop/items/:id/favorite`
- Bảng dữ liệu: `UserItemFavorite`
- `shop.service.ts` — `setFavorite`

### UC-SHOP-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-SHOP-04 |
| 2. Tên Use Case | Xem kho vật phẩm (View Inventory) |
| 3. Mục tiêu | Xem những gì mình đã có và đã đánh dấu. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem vật phẩm yêu thích và vật phẩm đã sở hữu, lọc theo loại. |
| 7. Trigger | Người học mở `/inventory`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `SHOP` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả vật phẩm đang dùng theo từng loại.
2. Người học chọn tab Yêu thích hoặc Của tôi, lọc theo loại.
3. Giao diện hiện vật phẩm kèm nút Mua (với món yêu thích chưa mua), Dùng/Bỏ dùng (với món đã sở hữu).

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Bộ lọc loại tự cập nhật theo loại quản trị viên sửa.

**14. Dữ liệu đầu vào:** typeId, favorite, owned

**15. Dữ liệu đầu ra:** Kho vật phẩm, Vật phẩm đang dùng

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(SHOP)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/inventory`
- API: `GET /shop/inventory`, `GET /shop/items`
- Bảng dữ liệu: `UserItem`, `UserItemFavorite`, `UserEquippedItem`
- `shop.service.ts` — `getInventory`, `listItems`
- Giao diện `/inventory`: Yêu thích, Của tôi, lọc loại, Bỏ dùng, Mua

### UC-SHOP-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-SHOP-05 |
| 2. Tên Use Case | Sử dụng hoặc bỏ dùng vật phẩm (Equip or Unequip Item) |
| 3. Mục tiêu | Hiển thị vật phẩm mình thích, ví dụ linh vật trên trang chủ hoặc khung viền ảnh đại diện. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Chọn một vật phẩm đã sở hữu để hiển thị (mỗi loại một vật phẩm), hoặc bỏ dùng. |
| 7. Trigger | Người học chọn Dùng hoặc Bỏ dùng một vật phẩm trong kho. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `SHOP` bật.
- Dùng: đã sở hữu vật phẩm.

**9. Hậu điều kiện**

- `user_equipped_items` có (hoặc mất) dòng cho loại đó.

**10. Luồng sự kiện chính**

1. Người học chọn Dùng.
2. Hệ thống kiểm tra đã sở hữu và vật phẩm đúng loại.
3. Hệ thống ghi vật phẩm đang dùng cho loại đó, thay món cũ nếu có.
4. Khung viền mới hiện ở Cộng đồng, Bảng xếp hạng, danh sách thành viên nhóm.

**11. Luồng thay thế**

- 1a. Bỏ dùng: hệ thống xoá dòng của loại đó; ảnh đại diện quay về vòng trắng mặc định.

**12. Luồng ngoại lệ**

- 2a. Chưa sở hữu: trả 404 "Vật phẩm không có trong kho của bạn".
- 2b. Vật phẩm không thuộc loại: trả 400.

**13. Quy tắc nghiệp vụ**

- Mỗi loại một vật phẩm, ép bằng khoá chính (`user_id`, `type_id`).
- Khung mặc định không phải vật phẩm.
- Tắt Cửa hàng thì khung của MỌI người bị ẩn nhưng vẫn lưu.

**14. Dữ liệu đầu vào:** typeId, itemId

**15. Dữ liệu đầu ra:** Kho vật phẩm

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(SHOP)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/inventory`
- API: `PUT /shop/equipped/:typeId`, `DELETE /shop/equipped/:typeId`
- Bảng dữ liệu: `UserEquippedItem`, `UserItem`
- `shop.service.ts` — `equipItem`, `unequipItem`
- `shop.frame.ts` — `getEquippedFrameUrls`

### UC-SHOP-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-SHOP-06 |
| 2. Tên Use Case | Xem ví xu (View Coin Wallet) |
| 3. Mục tiêu | Biết xu từ đâu tới và đã tiêu vào đâu. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem số dư và lịch sử thu chi xu, lọc Thu/Chi, có phân trang. |
| 7. Trigger | Người học mở `/wallet`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `SHOP` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả số dư và lịch sử giao dịch, mới nhất trước.
2. Người học lọc Tất cả / Thu / Chi và chuyển trang.

**11. Luồng thay thế**

- 2a. API nhận thêm khoảng ngày `from`, `to` — giao diện hiện chưa có ô chọn ngày.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Thu là `amount > 0`; Chi là `amount <= 0` — dòng 0 xu (vật phẩm tặng) thuộc Chi, không biến mất khỏi cả hai tab.
- Số tiền mua đọc `price_paid` lúc mua.

**14. Dữ liệu đầu vào:** direction, from, to, page, pageSize

**15. Dữ liệu đầu ra:** Số dư, Danh sách giao dịch

**16. Quyền truy cập:** Chỉ Người học. API: `requireAuth` + `requireRole(USER)` + `requireFeature(SHOP)`; route FE bọc `Gated`. Tắt cờ thì API trả 404 và route ra trang 404.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/wallet`
- API: `GET /shop/wallet`
- Bảng dữ liệu: `CoinTransaction`, `UserItem`
- `shop.service.ts` — `getWallet`
- `shared/src/schemas/shop.schema.ts` — `walletQuerySchema`
- Giao diện `/wallet`: Tất cả, Thu, Chi, Trang trước/sau

---

## COM — Cộng đồng

### UC-COM-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-01 |
| 2. Tên Use Case | Xem và tìm bài viết (Browse Posts) |
| 3. Mục tiêu | Tìm được bài trao đổi đáng đọc trên diễn đàn chung. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem bảng tin chung; tìm trong tiêu đề và nội dung; sắp xếp mới nhất hoặc nhiều tim nhất; lọc bài của tôi, bài đã thích, có tệp, chưa có trả lời; phân trang. |
| 7. Trigger | Người dùng mở `/community`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả trang đầu các bài KHÔNG thuộc nhóm nào, mới nhất trước.
2. Người dùng gõ từ khoá và bấm Tìm; chọn Mới nhất hoặc Nhiều tim nhất; bật các bộ lọc Bài của tôi, Bài tôi đã thích, Có tệp đính kèm, Chưa có trả lời.
3. Hệ thống trả kết quả; người dùng chuyển trang.

**11. Luồng thay thế**

- 2a. Các bộ lọc cộng dồn với nhau.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Diễn đàn chung chỉ lấy bài `group_id IS NULL` — bài nhóm không bao giờ lọt ra.
- Mỗi trang 10 bài (tối đa 50); từ khoá tối đa 200 ký tự.
- Bộ lọc boolean dùng `z.preprocess` so khớp chuỗi, không `z.coerce.boolean()`.

**14. Dữ liệu đầu vào:** search, sort (latest | popular), mine, liked, hasAttachment, unanswered, page

**15. Dữ liệu đầu ra:** Danh sách bài, Tổng số

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/community`
- API: `GET /community/posts`
- Bảng dữ liệu: `Post`, `PostLike`, `PostComment`, `PostAttachment`
- `community.service.ts` — `listPosts`
- `shared/src/schemas/community.schema.ts` — `postQuerySchema`
- Giao diện `/community` (cả hai vai trò)

### UC-COM-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-02 |
| 2. Tên Use Case | Xem chi tiết bài viết (View Post) |
| 3. Mục tiêu | Đọc đầy đủ một bài và các bình luận. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem nội dung đầy đủ, tệp đính kèm và bình luận của một bài. |
| 7. Trigger | Người dùng mở một bài ở bảng tin chung hoặc bảng tin nhóm. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.
- Bài thuộc nhóm: là thành viên nhóm và nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả tiêu đề, nội dung, tác giả kèm cấp độ và khung viền, danh sách tệp, bình luận, số tim.
2. Giao diện hiện bài; ảnh đính kèm hiện tại chỗ.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bài không tồn tại, hoặc bài nhóm mà người xem không phải thành viên: trả 404.

**13. Quy tắc nghiệp vụ**

- Kiểm tra tư cách thành viên ở cả năm lối vào: danh sách, chi tiết, bình luận, thả tim, tải tệp.

**14. Dữ liệu đầu vào:** postId

**15. Dữ liệu đầu ra:** Chi tiết bài

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** được «extend» bởi UC-COM-08

**18. Căn cứ xác minh**

- Giao diện: `/community`, `/groups/:id`
- API: `GET /community/posts/:id`
- Bảng dữ liệu: `Post`, `PostComment`, `PostAttachment`
- `community.service.ts` — `getPost`, `assertGroupAccess`

### UC-COM-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-03 |
| 2. Tên Use Case | Đăng bài viết (Create Post) |
| 3. Mục tiêu | Chia sẻ câu hỏi, kinh nghiệm hoặc tài liệu với cộng đồng. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đăng bài có tiêu đề, nội dung và tối đa 3 tệp đính kèm. |
| 7. Trigger | Người dùng bấm "Đăng bài" ở `/community`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.

**9. Hậu điều kiện**

- Có một dòng `posts` và tối đa 3 dòng `post_attachments`.

**10. Luồng sự kiện chính**

1. Người dùng nhập tiêu đề, nội dung, chọn tệp đính kèm (tuỳ chọn).
2. Hệ thống kiểm tra số tệp, định dạng, dung lượng từng tệp.
3. Trong một transaction: ghi bài, rồi ghi TỪNG tệp một.
4. Giao diện hiện bài mới.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tiêu đề dưới 5 hoặc nội dung dưới 10 ký tự: trả 400.
- Quá 3 tệp: trả 400 "Mỗi bài chỉ đính kèm tối đa 3 tệp".
- Tệp sai định dạng hoặc quá 900 KB: trả 400 kèm tên tệp.

**13. Quy tắc nghiệp vụ**

- Tệp cho phép: JPEG, PNG, WebP, GIF, PDF, TXT; mỗi tệp tối đa 900 KB.
- Ghi từng tệp một để không vượt `max_allowed_packet` 1 MB của MySQL.
- Endpoint `/community` nhận body tới 5 MB.

**14. Dữ liệu đầu vào:** title, body, attachments[] (fileName, dataUrl)

**15. Dữ liệu đầu ra:** Chi tiết bài

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** tổng quát hoá của UC-GRP-08

**18. Căn cứ xác minh**

- Giao diện: `/community`
- API: `POST /community/posts`
- Bảng dữ liệu: `Post`, `PostAttachment`
- `community.service.ts` — `createPost`
- `shared/src/attachment/attachment.ts` — `ALLOWED_ATTACHMENT_MIME`, `ATTACHMENT_MAX_BYTES`, `MAX_ATTACHMENTS_PER_POST`

### UC-COM-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-04 |
| 2. Tên Use Case | Bình luận bài viết (Comment on Post) |
| 3. Mục tiêu | Trả lời hoặc góp ý dưới một bài. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Viết bình luận dưới một bài. |
| 7. Trigger | Người dùng gửi bình luận trong trang chi tiết bài. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.
- Bài nhóm: là thành viên nhóm.

**9. Hậu điều kiện**

- Có một dòng `post_comments`. Nếu bài thuộc nhóm và bình luận có `@tên`/`@all`: người được nhắc nhận thông báo `MENTIONED`.

**10. Luồng sự kiện chính**

1. Người dùng nhập nội dung và gửi.
2. Hệ thống kiểm tra quyền truy cập bài.
3. Hệ thống lưu bình luận.
4. Hệ thống tách người được nhắc và gửi thông báo (chỉ trong nhóm).

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Nội dung rỗng hoặc quá 2000 ký tự: trả 400.
- Bài không tồn tại hoặc không có quyền: trả 404.

**13. Quy tắc nghiệp vụ**

- Lỗi khi gửi thông báo đề cập chỉ ghi log, không làm hỏng bình luận đã lưu.

**14. Dữ liệu đầu vào:** postId, body

**15. Dữ liệu đầu ra:** Bình luận

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/community`, `/groups/:id`
- API: `POST /community/posts/:id/comments`
- Bảng dữ liệu: `PostComment`
- `community.service.ts` — `createComment`
- `community/mention.service.ts` — `notifyMentions`

### UC-COM-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-05 |
| 2. Tên Use Case | Thả tim bài viết (Like Post) |
| 3. Mục tiêu | Bày tỏ đồng tình với một bài. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Thả hoặc bỏ tim cho một bài. |
| 7. Trigger | Người dùng bấm biểu tượng tim. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.
- Bài nhóm: là thành viên nhóm.

**9. Hậu điều kiện**

- Thêm hoặc xoá dòng `post_likes` của người dùng.

**10. Luồng sự kiện chính**

1. Người dùng bấm tim.
2. Hệ thống đảo trạng thái: chưa thích thì thêm, đã thích thì bỏ.
3. Hệ thống trả trạng thái mới và số tim.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bài không tồn tại hoặc không có quyền: trả 404.

**13. Quy tắc nghiệp vụ**

- Mỗi người tối đa một tim mỗi bài (UNIQUE `post_id`, `user_id`).

**14. Dữ liệu đầu vào:** postId

**15. Dữ liệu đầu ra:** liked, likeCount

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/community`, `/groups/:id`
- API: `POST /community/posts/:id/like`
- Bảng dữ liệu: `PostLike`
- `community.service.ts` — `toggleLike`

### UC-COM-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-06 |
| 2. Tên Use Case | Xoá bài viết (Delete Post) |
| 3. Mục tiêu | Gỡ bài của mình, hoặc gỡ bài vi phạm (Quản trị viên). |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tác giả xoá bài của mình; quản trị viên xoá được mọi bài. |
| 7. Trigger | Người dùng chọn xoá một bài. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là tác giả bài, HOẶC là Quản trị viên.

**9. Hậu điều kiện**

- Bài cùng bình luận, tim và tệp đính kèm bị xoá (cascade).

**10. Luồng sự kiện chính**

1. Người dùng chọn xoá và xác nhận.
2. Hệ thống kiểm tra quyền xoá.
3. Hệ thống xoá bài.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bài không tồn tại: trả 404.
- Không phải tác giả và không phải Quản trị viên: trả 403 "Bạn chỉ xoá được bài của chính mình".

**13. Quy tắc nghiệp vụ**

- Quản trị viên xoá được MỌI bài — đây là công cụ kiểm duyệt cộng đồng duy nhất.
- Xoá là vĩnh viễn, không có thùng rác.

**14. Dữ liệu đầu vào:** postId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/community`, `/groups/:id`
- API: `DELETE /community/posts/:id`
- Bảng dữ liệu: `Post`, `PostComment`, `PostLike`, `PostAttachment`
- `community.service.ts` — `deletePost`, `canDelete`

### UC-COM-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-07 |
| 2. Tên Use Case | Xoá bình luận (Delete Comment) |
| 3. Mục tiêu | Gỡ bình luận của mình, hoặc gỡ bình luận vi phạm (Quản trị viên). |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tác giả xoá bình luận của mình; quản trị viên xoá được mọi bình luận. |
| 7. Trigger | Người dùng chọn xoá một bình luận. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là tác giả bình luận, HOẶC là Quản trị viên.

**9. Hậu điều kiện**

- Dòng `post_comments` bị xoá.

**10. Luồng sự kiện chính**

1. Người dùng chọn xoá và xác nhận.
2. Hệ thống kiểm tra quyền.
3. Hệ thống xoá bình luận.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bình luận không tồn tại: trả 404.
- Không có quyền: trả 403 "Bạn chỉ xoá được bình luận của chính mình".

**13. Quy tắc nghiệp vụ**

- Cùng quy tắc quyền với UC-COM-06.

**14. Dữ liệu đầu vào:** commentId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/community`, `/groups/:id`
- API: `DELETE /community/comments/:id`
- Bảng dữ liệu: `PostComment`
- `community.service.ts` — `deleteComment`

### UC-COM-08

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-COM-08 |
| 2. Tên Use Case | Tải tệp đính kèm (Download Attachment) |
| 3. Mục tiêu | Lấy được tệp tài liệu người khác chia sẻ. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tải về hoặc xem tệp đính kèm của một bài; tệp của bài nhóm chỉ thành viên tải được. |
| 7. Trigger | Người dùng bấm mở/tải một tệp trong bài, hoặc "Tải về" ở tab Tài liệu nhóm. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.
- Tệp thuộc bài nhóm: là thành viên nhóm và nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Giao diện gọi endpoint tải tệp kèm token.
2. Hệ thống kiểm tra quyền truy cập bài chứa tệp.
3. Hệ thống trả nội dung tệp với đúng kiểu MIME và tên tệp.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tệp không tồn tại, hoặc không có quyền: trả 404.

**13. Quy tắc nghiệp vụ**

- Tệp phải tải bằng fetch kèm token, không dùng thẳng URL làm `src` — khác ảnh vật phẩm cửa hàng.
- Tài liệu nhóm không có đường tải riêng; mọi lối tải đi qua endpoint này.

**14. Dữ liệu đầu vào:** attachmentId

**15. Dữ liệu đầu ra:** Nội dung tệp

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API: `requireAuth` + `requireFeature(COMMUNITY, { adminBypass: true })` — tắt Cộng đồng thì Người học nhận 404 còn Quản trị viên vẫn vào được để kiểm duyệt. Nội dung thuộc nhóm lớp chỉ thành viên nhóm truy cập được.

**17. Quan hệ với use case khác:** «extend» UC-COM-02; «extend» UC-GRP-09

**18. Căn cứ xác minh**

- Giao diện: `/community`, `/groups/:id`
- API: `GET /community/attachments/:id`
- Bảng dữ liệu: `PostAttachment`, `GroupMember`
- `community.service.ts` — `getAttachmentContent`
- `fe/src/features/community/components/AttachmentView.tsx`
- Giao diện `/groups/5` tab Tài liệu nhóm: nút Tải về

---

## GRP — Nhóm lớp

### UC-GRP-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-01 |
| 2. Tên Use Case | Xem nhóm của tôi (View My Groups) |
| 3. Mục tiêu | Vào nhanh các nhóm mình đang tham gia. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem các nhóm mình là thành viên hoặc trưởng nhóm, lọc theo vai trò. |
| 7. Trigger | Người học mở `/groups`, tab "Nhóm của tôi". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `GROUPS` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả mọi nhóm người học là thành viên hoặc trưởng nhóm, kèm số thành viên, số bài, vai trò.
2. Người học lọc Tất cả / Là thành viên / Là trưởng nhóm.
3. Người học bấm "Mở nhóm".

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Chưa tham gia nhóm nào: hiện trạng thái rỗng.

**13. Quy tắc nghiệp vụ**

- Bộ lọc vai trò chạy ở giao diện trên danh sách đã tải.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Danh sách nhóm

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups`
- API: `GET /groups/mine`
- Bảng dữ liệu: `Group`, `GroupMember`
- `group.service.ts` — `listMyGroups`
- Giao diện `/groups`: tab Nhóm của tôi, bộ lọc 3 lựa chọn

### UC-GRP-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-02 |
| 2. Tên Use Case | Tìm nhóm công khai (Search Public Groups) |
| 3. Mục tiêu | Tìm một nhóm công khai phù hợp để tham gia. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tìm nhóm công khai theo tên, có phân trang. |
| 7. Trigger | Người học mở tab "Khám phá nhóm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `GROUPS` bật.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Người học gõ tên nhóm.
2. Hệ thống trả nhóm công khai chưa bị chặn khớp tên, kèm trạng thái của người xem (chưa tham gia / đang chờ / thành viên / trưởng nhóm).
3. Người học chuyển trang; với nhóm chưa tham gia có thể «extend» UC-GRP-05.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Nhóm riêng tư và nhóm bị chặn KHÔNG hiện trong tìm kiếm.
- Mỗi trang 12 nhóm (tối đa 50).

**14. Dữ liệu đầu vào:** search, page

**15. Dữ liệu đầu ra:** Danh sách nhóm tóm tắt

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** được «extend» bởi UC-GRP-05

**18. Căn cứ xác minh**

- Giao diện: `/groups`
- API: `GET /groups/search`
- Bảng dữ liệu: `Group`
- `group.service.ts` — `searchPublicGroups`

### UC-GRP-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-03 |
| 2. Tên Use Case | Tìm nhóm bằng mã (Find Group by Code) |
| 3. Mục tiêu | Vào được nhóm riêng tư khi có mã do trưởng nhóm đưa. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Nhập mã 8 chữ số để tìm một nhóm (kể cả nhóm riêng tư). |
| 7. Trigger | Người học bấm "Nhập mã nhóm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Có mã 8 chữ số.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Người học nhập mã.
2. Hệ thống tìm nhóm theo mã và trả tóm tắt kèm trạng thái người xem.
3. Với nhóm chưa tham gia có thể «extend» UC-GRP-05.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không có nhóm nào có mã này: trả 404.

**13. Quy tắc nghiệp vụ**

- Mã là thứ DUY NHẤT bảo vệ nhóm riêng tư; sinh bằng `randomInt` của `node:crypto`, không dùng `Math.random`.

**14. Dữ liệu đầu vào:** code

**15. Dữ liệu đầu ra:** Nhóm tóm tắt

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** được «extend» bởi UC-GRP-05

**18. Căn cứ xác minh**

- Giao diện: `/groups`
- API: `GET /groups/code/:code`
- Bảng dữ liệu: `Group`
- `group.service.ts` — `findByCode`, `generateUniqueCode`

### UC-GRP-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-04 |
| 2. Tên Use Case | Tạo nhóm (Create Group) |
| 3. Mục tiêu | Lập một không gian học riêng cho lớp hoặc nhóm bạn. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Lập nhóm mới; người tạo trở thành trưởng nhóm đầu tiên. |
| 7. Trigger | Người học bấm "Tạo nhóm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.
- Cờ `GROUPS` bật.

**9. Hậu điều kiện**

- Có một dòng `groups` với mã 8 chữ số duy nhất.
- Người tạo là thành viên với vai trò `LEADER`.

**10. Luồng sự kiện chính**

1. Người học nhập tên, mô tả, chọn công khai/riêng tư và bật/tắt phê duyệt.
2. Hệ thống sinh mã duy nhất và tạo nhóm.
3. Hệ thống thêm người tạo làm trưởng nhóm.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tên dưới 3 ký tự hoặc mô tả quá 500 ký tự: trả 400.

**13. Quy tắc nghiệp vụ**

- Mặc định Công khai và BẬT phê duyệt thành viên.
- Ai cũng tạo được nhóm.

**14. Dữ liệu đầu vào:** name, description, visibility, requireApproval

**15. Dữ liệu đầu ra:** Nhóm tóm tắt

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups`
- API: `POST /groups`
- Bảng dữ liệu: `Group`, `GroupMember`
- `group.service.ts` — `createGroup`
- `shared/src/schemas/group.schema.ts` — `createGroupSchema`

### UC-GRP-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-05 |
| 2. Tên Use Case | Tham gia nhóm (Join Group) |
| 3. Mục tiêu | Trở thành thành viên của một nhóm. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Vào nhóm ngay, hoặc gửi yêu cầu chờ duyệt nếu nhóm bật phê duyệt. |
| 7. Trigger | Người học chọn tham gia một nhóm từ kết quả tìm kiếm hoặc tra mã. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Chưa là thành viên nhóm.
- Nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Nhóm không cần duyệt: có dòng `group_members` vai trò `MEMBER`.
- Nhóm cần duyệt: có dòng `group_join_requests` trạng thái `PENDING`; các trưởng nhóm nhận thông báo `GROUP_JOIN_REQUEST`.

**10. Luồng sự kiện chính**

1. Người học bấm tham gia, có thể kèm lời nhắn.
2. Hệ thống kiểm tra nhóm tồn tại, chưa bị chặn.
3. Nhóm tắt phê duyệt: hệ thống thêm thành viên ngay.

**11. Luồng thay thế**

- 2a. Đã là thành viên: trả trạng thái hiện có, không làm gì.
- 3a. Nhóm bật phê duyệt: hệ thống tạo (hoặc làm mới) yêu cầu chờ duyệt và báo cho trưởng nhóm; người học chờ UC-GRP-13.

**12. Luồng ngoại lệ**

- 2b. Nhóm không tồn tại: trả 404.
- 2c. Nhóm bị chặn: trả 403 "Nhóm này đang bị chặn, tạm thời không nhận thành viên mới".

**13. Quy tắc nghiệp vụ**

- Một người tối đa một yêu cầu cho mỗi nhóm (UNIQUE `group_id`, `user_id`); xin lại sau khi bị từ chối là cập nhật yêu cầu cũ về `PENDING`.
- Lời nhắn tối đa 300 ký tự.

**14. Dữ liệu đầu vào:** groupId, message (tuỳ chọn)

**15. Dữ liệu đầu ra:** state, joined

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** «extend» UC-GRP-02; «extend» UC-GRP-03

**18. Căn cứ xác minh**

- Giao diện: `/groups`
- API: `POST /groups/:id/join`
- Bảng dữ liệu: `GroupMember`, `GroupJoinRequest`, `Notification`
- `group.service.ts` — `requestJoin`, `notifyLeaders`

### UC-GRP-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-06 |
| 2. Tên Use Case | Rời nhóm (Leave Group) |
| 3. Mục tiêu | Rời một nhóm không còn tham gia. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tự rời khỏi một nhóm. |
| 7. Trigger | Người học bấm "Rời nhóm" ở `/groups/:id`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là thành viên nhóm.

**9. Hậu điều kiện**

- Dòng `group_members` bị xoá.

**10. Luồng sự kiện chính**

1. Người học bấm Rời nhóm và xác nhận.
2. Hệ thống kiểm tra không làm nhóm mất trưởng nhóm cuối.
3. Hệ thống xoá tư cách thành viên.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Là trưởng nhóm cuối cùng: trả 400, yêu cầu phong người khác trước.
- Không phải thành viên: trả 403.

**13. Quy tắc nghiệp vụ**

- Nhóm luôn còn ít nhất một trưởng nhóm (`assertNotLastLeader`).

**14. Dữ liệu đầu vào:** groupId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `POST /groups/:id/leave`
- Bảng dữ liệu: `GroupMember`
- `group.service.ts` — `leaveGroup`, `assertNotLastLeader`

### UC-GRP-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-07 |
| 2. Tên Use Case | Xem bảng tin nhóm (View Group Feed) |
| 3. Mục tiêu | Theo dõi hoạt động trong nhóm. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem thông tin nhóm, danh sách thành viên và các bài đăng nội bộ. |
| 7. Trigger | Thành viên mở `/groups/:id`, tab "Bảng tin". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là thành viên nhóm.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống kiểm tra tư cách thành viên.
2. Hệ thống trả thông tin nhóm, danh sách thành viên kèm vai trò và khung viền; trưởng nhóm nhận thêm danh sách yêu cầu chờ.
3. Giao diện tải bài của nhóm qua `/community/posts?groupId=`.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không phải thành viên: trả 403 "Bạn không phải thành viên của nhóm này".
- Nhóm bị chặn: trả 403 kèm NGUYÊN VĂN lý do chặn để thành viên đọc.

**13. Quy tắc nghiệp vụ**

- Người ngoài chỉ thấy phần tóm tắt qua tìm kiếm hoặc tra mã, không thấy thành viên hay bài.
- Khoá cache bảng tin phía FE bắt buộc chứa `groupId`.

**14. Dữ liệu đầu vào:** groupId

**15. Dữ liệu đầu ra:** Chi tiết nhóm, Bài của nhóm

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `GET /groups/:id`, `GET /community/posts`
- Bảng dữ liệu: `Group`, `GroupMember`, `Post`
- `group.service.ts` — `getGroupDetail`, `assertMember`, `assertNotBlocked`
- `community.service.ts` — `listPosts` với `groupId`

### UC-GRP-08

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-08 |
| 2. Tên Use Case | Đăng bài trong nhóm (Post in Group) |
| 3. Mục tiêu | Trao đổi nội bộ và nhắc đúng người trong nhóm. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đăng bài nội bộ; gõ `@tên` hoặc `@all` để nhắc thành viên. |
| 7. Trigger | Thành viên bấm "Đăng bài trong nhóm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là thành viên nhóm; nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Như UC-COM-03, bài mang `group_id`.
- Người được nhắc bằng `@tên` hoặc `@all` nhận thông báo `MENTIONED`.

**10. Luồng sự kiện chính**

1. Thành viên soạn bài; gõ `@` thì giao diện gợi ý thành viên (`/groups/:id/mentions`).
2. Hệ thống thực hiện luồng đăng bài của UC-COM-03 với `groupId` (quan hệ chuyên biệt hoá).
3. Hệ thống TỰ tách người được nhắc từ nội dung bằng `matchMentions` và gửi thông báo.

**11. Luồng thay thế**

- 3a. Gõ tên không có trong nhóm: chỉ là chữ thường, không ai nhận thông báo.

**12. Luồng ngoại lệ**

- Không phải thành viên hoặc nhóm bị chặn: trả 404/403, không ghi bài.

**13. Quy tắc nghiệp vụ**

- Danh sách người được nhắc do BACKEND tách, không nhận từ giao diện — nhận từ giao diện là gọi thẳng API nhắc được cả người ngoài nhóm.
- Không lưu bảng liên kết bài ↔ người được nhắc; nội dung vẫn là văn bản thuần.
- Lỗi gửi thông báo đề cập không làm hỏng bài đã lưu.

**14. Dữ liệu đầu vào:** groupId, title, body, attachments[]

**15. Dữ liệu đầu ra:** Chi tiết bài

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Endpoint ghi bài là `POST /community/posts` nên cũng qua guard của Cộng đồng.

**17. Quan hệ với use case khác:** chuyên biệt hoá của UC-COM-03

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `POST /community/posts`, `GET /groups/:id/mentions`
- Bảng dữ liệu: `Post`, `PostAttachment`, `Notification`
- `community.service.ts` — `createPost`, `assertGroupAccess`
- `community/mention.service.ts` — `notifyMentions`
- `shared/src/mention` — `matchMentions`
- `group.service.ts` — `listMentionTargets`

### UC-GRP-09

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-09 |
| 2. Tên Use Case | Xem tài liệu nhóm (View Group Documents) |
| 3. Mục tiêu | Tìm lại tài liệu đã chia sẻ trong nhóm mà không phải lục bảng tin. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem mọi tệp đã đính kèm trong bài của nhóm, tìm theo tên tệp, có phân trang. |
| 7. Trigger | Thành viên mở tab "Tài liệu nhóm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là thành viên nhóm.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả mọi tệp đính kèm của các bài thuộc nhóm, bài mới nhất trước, kèm người đăng và bài chứa tệp.
2. Thành viên tìm theo tên tệp, chuyển trang.
3. Thành viên bấm "Tải về" → «extend» UC-COM-08.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không phải thành viên: trả 404.

**13. Quy tắc nghiệp vụ**

- Tài liệu nhóm KHÔNG có bảng riêng và không có đường tải lên riêng — chính là `post_attachments` của bài có `group_id`.
- Mỗi trang 20 tệp (tối đa 50); từ khoá tối đa 255 ký tự.

**14. Dữ liệu đầu vào:** groupId, search, page

**15. Dữ liệu đầu ra:** Danh sách tệp

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** được «extend» bởi UC-COM-08

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `GET /groups/:id/documents`
- Bảng dữ liệu: `PostAttachment`, `Post`
- `group.service.ts` — `listDocuments`
- `shared/src/schemas/group.schema.ts` — `groupDocumentQuerySchema`
- Giao diện `/groups/5`: ô "Tìm theo tên tệp", nút Tải về

### UC-GRP-10

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-10 |
| 2. Tên Use Case | Xem bộ thẻ của nhóm (View Group Study Sets) |
| 3. Mục tiêu | Học các bộ thẻ trưởng nhóm đã chọn cho cả nhóm. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem các bộ thẻ trưởng nhóm đã chia sẻ và mở ra để học. |
| 7. Trigger | Thành viên mở tab "Flashcard" của nhóm. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là thành viên nhóm; nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả các bộ đã chia sẻ vào nhóm, bỏ các bộ đang bị chặn.
2. Thành viên bấm "Mở bộ thẻ" và học như UC-LIB-03 / UC-STU-01.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không phải thành viên: trả 404.

**13. Quy tắc nghiệp vụ**

- Trong nhóm, bộ nào cũng mang nhãn "Nội bộ"; ở Thư viện chế độ gốc của bộ giữ nguyên.
- Quyền đọc bộ được chia sẻ nằm ở nhánh thứ ba của `readableSetWhere`.

**14. Dữ liệu đầu vào:** groupId

**15. Dữ liệu đầu ra:** Danh sách bộ thẻ của nhóm

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`).

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `GET /groups/:id/study-sets`
- Bảng dữ liệu: `GroupStudySet`, `Topic`
- `group.service.ts` — `listStudySets`
- `library.access.ts` — `readableSetWhere` (nhánh chia sẻ nhóm)

### UC-GRP-11

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-11 |
| 2. Tên Use Case | Cập nhật cài đặt nhóm (Update Group Settings) |
| 3. Mục tiêu | Điều chỉnh thông tin và chính sách vào nhóm. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Sửa tên, mô tả, chế độ công khai/riêng tư và bật/tắt phê duyệt thành viên. |
| 7. Trigger | Trưởng nhóm mở tab "Cài đặt" và bấm "Lưu thay đổi". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.
- Nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Tên, mô tả, chế độ và/hoặc phê duyệt được cập nhật.

**10. Luồng sự kiện chính**

1. Trưởng nhóm sửa các trường cần đổi.
2. Hệ thống kiểm tra quyền trưởng nhóm và nhóm chưa bị chặn.
3. Hệ thống lưu các trường được gửi.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không phải trưởng nhóm: trả 403.
- Nhóm bị chặn: trả 403 kèm lý do chặn.
- Dữ liệu không hợp lệ: trả 400.

**13. Quy tắc nghiệp vụ**

- Gửi trường nào sửa trường đó.
- Nhóm bị chặn thì không sửa được thông tin.

**14. Dữ liệu đầu vào:** name, description, visibility, requireApproval

**15. Dữ liệu đầu ra:** Nhóm tóm tắt

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `PATCH /groups/:id`
- Bảng dữ liệu: `Group`
- `group.service.ts` — `updateGroup`, `assertNotBlocked`

### UC-GRP-12

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-12 |
| 2. Tên Use Case | Xoá nhóm (Delete Group) |
| 3. Mục tiêu | Giải tán nhóm. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xoá nhóm cùng thành viên, yêu cầu và bài đăng nội bộ. |
| 7. Trigger | Trưởng nhóm bấm "Xoá nhóm" ở tab Cài đặt. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.

**9. Hậu điều kiện**

- Nhóm cùng thành viên, yêu cầu và bài đăng nội bộ bị xoá (cascade).

**10. Luồng sự kiện chính**

1. Trưởng nhóm bấm Xoá nhóm và xác nhận.
2. Hệ thống kiểm tra quyền.
3. Hệ thống xoá nhóm.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

- Chỉ trưởng nhóm xoá được; Quản trị viên KHÔNG có quyền xoá nhóm, chỉ chặn.
- Bộ thẻ đã chia sẻ không bị xoá — chỉ liên kết chia sẻ mất.

**14. Dữ liệu đầu vào:** groupId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `DELETE /groups/:id`
- Bảng dữ liệu: `Group`, `GroupMember`, `GroupJoinRequest`, `Post`
- `group.service.ts` — `deleteGroup`

### UC-GRP-13

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-13 |
| 2. Tên Use Case | Duyệt yêu cầu tham gia nhóm (Review Join Requests) |
| 3. Mục tiêu | Kiểm soát ai được vào nhóm. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Duyệt hoặc từ chối người xin vào nhóm. |
| 7. Trigger | Trưởng nhóm mở tab "Yêu cầu" và bấm Duyệt hoặc Từ chối. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.
- Có yêu cầu đang `PENDING`.

**9. Hậu điều kiện**

- Yêu cầu chuyển `APPROVED` hoặc `REJECTED`, ghi người và lúc quyết định.
- Duyệt: người xin trở thành thành viên.
- Người xin nhận thông báo `GROUP_JOIN_APPROVED` hoặc `GROUP_JOIN_REJECTED`.

**10. Luồng sự kiện chính**

1. Hệ thống hiện danh sách yêu cầu chờ kèm lời nhắn.
2. Trưởng nhóm bấm Duyệt.
3. Hệ thống cập nhật yêu cầu và thêm thành viên.
4. Hệ thống báo cho người xin, kèm liên kết vào nhóm.

**11. Luồng thay thế**

- 2a. Trưởng nhóm bấm Từ chối: hệ thống cập nhật `REJECTED` và báo cho người xin, liên kết về `/groups`.

**12. Luồng ngoại lệ**

- Yêu cầu không tồn tại hoặc đã xử lý: trả 404 "Yêu cầu không tồn tại hoặc đã được xử lý".
- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

- Duyệt hoặc từ chối đều sinh thông báo.

**14. Dữ liệu đầu vào:** groupId, userId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `GET /groups/:id`, `POST /groups/:id/requests/:userId/approve`, `POST /groups/:id/requests/:userId/reject`
- Bảng dữ liệu: `GroupJoinRequest`, `GroupMember`, `Notification`
- `group.service.ts` — `decideRequest`
- Giao diện `/groups/5` tab Yêu cầu: Duyệt, Từ chối

### UC-GRP-14

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-14 |
| 2. Tên Use Case | Thêm thành viên (Add Member) |
| 3. Mục tiêu | Đưa thẳng một người vào nhóm mà không cần họ xin. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Thêm thẳng một người vào nhóm bằng tên tài khoản hoặc email. |
| 7. Trigger | Trưởng nhóm nhập tên tài khoản hoặc email ở tab "Thành viên" và bấm "Thêm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.

**9. Hậu điều kiện**

- Có dòng `group_members` vai trò `MEMBER`; người được thêm nhận thông báo `GROUP_JOIN_APPROVED`.

**10. Luồng sự kiện chính**

1. Trưởng nhóm nhập tên tài khoản hoặc email.
2. Hệ thống tìm người dùng.
3. Hệ thống kiểm tra người đó chưa ở trong nhóm.
4. Hệ thống thêm thành viên và báo cho họ.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không tìm thấy người dùng: trả 404.
- Đã ở trong nhóm: trả 400 "Người này đã ở trong nhóm".
- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

Không có.

**14. Dữ liệu đầu vào:** groupId, identifier

**15. Dữ liệu đầu ra:** Thành viên

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `POST /groups/:id/members`
- Bảng dữ liệu: `GroupMember`, `Notification`
- `group.service.ts` — `addMember`
- `shared/src/schemas/group.schema.ts` — `addMemberSchema`

### UC-GRP-15

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-15 |
| 2. Tên Use Case | Xoá thành viên (Remove Member) |
| 3. Mục tiêu | Đưa một thành viên ra khỏi nhóm. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đưa một thành viên ra khỏi nhóm. |
| 7. Trigger | Trưởng nhóm bấm "Xoá khỏi nhóm" ở tab Thành viên. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.
- Người bị xoá đang là thành viên.

**9. Hậu điều kiện**

- Dòng `group_members` của người đó bị xoá.

**10. Luồng sự kiện chính**

1. Trưởng nhóm chọn thành viên và xác nhận.
2. Hệ thống kiểm tra quyền; nếu người bị xoá là trưởng nhóm, kiểm tra không phải trưởng nhóm cuối.
3. Hệ thống xoá thành viên.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Người này không ở trong nhóm: trả 404.
- Là trưởng nhóm cuối: trả 400.
- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

- Nhóm luôn còn ít nhất một trưởng nhóm.

**14. Dữ liệu đầu vào:** groupId, userId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `DELETE /groups/:id/members/:userId`
- Bảng dữ liệu: `GroupMember`
- `group.service.ts` — `removeMember`

### UC-GRP-16

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-16 |
| 2. Tên Use Case | Phân quyền trưởng nhóm (Change Member Role) |
| 3. Mục tiêu | Chia sẻ việc điều hành nhóm cho nhiều người. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Phong thành viên làm trưởng nhóm hoặc hạ trưởng nhóm về thành viên. |
| 7. Trigger | Trưởng nhóm bấm "Phong trưởng nhóm" hoặc "Hạ quyền". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.
- Người được đổi vai trò là thành viên nhóm.

**9. Hậu điều kiện**

- `group_members.role` của người đó đổi giữa `MEMBER` và `LEADER`.

**10. Luồng sự kiện chính**

1. Trưởng nhóm chọn thành viên và hành động.
2. Hệ thống kiểm tra quyền.
3. Khi hạ quyền: kiểm tra không phải trưởng nhóm cuối.
4. Hệ thống lưu vai trò mới.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Người này không ở trong nhóm: trả 404.
- Hạ trưởng nhóm cuối: trả 400.
- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

- Một nhóm có thể có nhiều trưởng nhóm, phong/hạ lẫn nhau được.

**14. Dữ liệu đầu vào:** groupId, userId, role

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `PATCH /groups/:id/members/:userId/role`
- Bảng dữ liệu: `GroupMember`
- `group.service.ts` — `updateMemberRole`

### UC-GRP-17

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-17 |
| 2. Tên Use Case | Chia sẻ bộ thẻ vào nhóm (Share Study Set to Group) |
| 3. Mục tiêu | Cho cả nhóm học cùng một bộ thẻ. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Chia sẻ một bộ thẻ của chính mình vào nhóm (không nhân bản bộ thẻ). |
| 7. Trigger | Trưởng nhóm bấm "Chia sẻ bộ thẻ vào nhóm" ở tab Flashcard. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.
- Bộ thẻ là của chính trưởng nhóm (kể cả riêng tư) và không bị chặn.

**9. Hậu điều kiện**

- Có một dòng `group_study_sets`; thành viên nhóm có quyền đọc bộ thẻ.
- Thành viên nhận thông báo `GROUP_STUDY_SET_SHARED`.

**10. Luồng sự kiện chính**

1. Trưởng nhóm chọn một bộ của mình.
2. Hệ thống kiểm tra quyền, quyền sở hữu, trạng thái chặn.
3. Hệ thống tạo liên kết chia sẻ.
4. Hệ thống báo cho thành viên.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bộ không phải của mình: trả 404 "Không tìm thấy bộ thẻ của bạn".
- Bộ đang bị chặn: trả 400.
- Bộ đã có trong nhóm: trả 409.
- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

- Chia sẻ KHÔNG nhân bản bộ thẻ: bộ vẫn là một dòng `topics` do chủ sửa ở Thư viện.
- Chỉ chia sẻ được bộ của chính mình.

**14. Dữ liệu đầu vào:** groupId, setId

**15. Dữ liệu đầu ra:** Bộ thẻ của nhóm

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `POST /groups/:id/study-sets`
- Bảng dữ liệu: `GroupStudySet`, `Notification`
- `group.service.ts` — `shareStudySet`
- Giao diện `/groups/5` tab Flashcard

### UC-GRP-18

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-GRP-18 |
| 2. Tên Use Case | Gỡ bộ thẻ khỏi nhóm (Unshare Study Set) |
| 3. Mục tiêu | Thu lại một bộ thẻ khỏi nhóm. |
| 4. Actor chính | Trưởng nhóm |
| 5. Actor phụ | Không có |
| 6. Mô tả | Gỡ liên kết chia sẻ; tiến độ học của thành viên được giữ nguyên. |
| 7. Trigger | Trưởng nhóm bấm "Gỡ khỏi nhóm". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Là trưởng nhóm.
- Bộ đang được chia sẻ trong nhóm.

**9. Hậu điều kiện**

- Dòng `group_study_sets` bị xoá; `user_vocab_progress` của thành viên GIỮ NGUYÊN.

**10. Luồng sự kiện chính**

1. Trưởng nhóm chọn bộ và xác nhận.
2. Hệ thống kiểm tra quyền.
3. Hệ thống xoá liên kết chia sẻ.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bộ không có trong nhóm: trả 404.
- Không phải trưởng nhóm: trả 403.

**13. Quy tắc nghiệp vụ**

- Gỡ chia sẻ không xoá tiến độ — chia sẻ lại là thành viên học tiếp được.

**14. Dữ liệu đầu vào:** groupId, setId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Người học. Route FE `/groups`, `/groups/:id` bọc `Gated` (Quản trị viên bị đẩy về `/admin`). API chỉ gắn `requireAuth` + `requireFeature(GROUPS)` — **không có `requireRole(USER)`**, nên việc loại Quản trị viên hiện chỉ nằm ở giao diện (xem mục cần xác nhận trong `README.md`). Service gọi `assertLeader` — người không phải trưởng nhóm nhận 403 "Chỉ trưởng nhóm mới làm được việc này".

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/groups/:id`
- API: `DELETE /groups/:id/study-sets/:setId`
- Bảng dữ liệu: `GroupStudySet`
- `group.service.ts` — `unshareStudySet`

---

## NOTI — Thông báo và nhắc nhở

### UC-NOTI-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-01 |
| 2. Tên Use Case | Xem thông báo (View Notifications) |
| 3. Mục tiêu | Không bỏ lỡ việc cần làm và sự kiện liên quan tới mình. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem số thông báo chưa đọc trên chuông và danh sách thông báo, lọc Tất cả/Chưa đọc/Đã đọc, phân trang. |
| 7. Trigger | Người dùng xem chuông thông báo hoặc mở `/notifications`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Chuông hiện số thông báo chưa đọc.
2. Người dùng mở trang Thông báo; hệ thống trả danh sách mới nhất trước.
3. Người dùng lọc Tất cả / Chưa đọc / Đã đọc, chuyển trang, bấm một thông báo để tới liên kết đi kèm.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Thông báo luôn lưu DB trước; push chỉ là kênh báo thêm.
- Mỗi trang 20 (tối đa 50).
- Lọc chưa đọc dùng `z.preprocess`, không `z.coerce.boolean()`.

**14. Dữ liệu đầu vào:** unreadOnly, page

**15. Dữ liệu đầu ra:** Danh sách thông báo, Số chưa đọc

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API gắn `requireAuth`, không `requireRole`, không cờ tính năng.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/notifications`, `(NotificationBell)`
- API: `GET /notifications`, `GET /notifications/unread-count`
- Bảng dữ liệu: `Notification`
- `notification.service.ts` — `listNotifications`, `countUnread`
- `fe/src/features/notifications/components/NotificationBell.tsx`, `NotificationsPage.tsx`

### UC-NOTI-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-02 |
| 2. Tên Use Case | Đánh dấu thông báo đã đọc (Mark Notification Read) |
| 3. Mục tiêu | Dọn trạng thái chưa đọc. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đánh dấu một thông báo hoặc tất cả là đã đọc. |
| 7. Trigger | Người dùng bấm một thông báo, hoặc "Đánh dấu đã đọc hết". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.

**9. Hậu điều kiện**

- `notifications.read_at` được đặt cho một hoặc mọi thông báo chưa đọc của người dùng.

**10. Luồng sự kiện chính**

1. Người dùng bấm "Đánh dấu đã đọc hết".
2. Hệ thống đặt thời điểm đọc cho mọi thông báo chưa đọc của người đó.
3. Chuông về 0.

**11. Luồng thay thế**

- 1a. Bấm một thông báo: chỉ thông báo đó được đánh dấu.

**12. Luồng ngoại lệ**

- Thông báo không phải của mình: trả 404.

**13. Quy tắc nghiệp vụ**

- Người dùng chỉ thao tác được trên thông báo của chính mình.

**14. Dữ liệu đầu vào:** notificationId (một cái)

**15. Dữ liệu đầu ra:** Thông báo / số đã cập nhật

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API gắn `requireAuth`, không `requireRole`, không cờ tính năng.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/notifications`, `(NotificationBell)`
- API: `PATCH /notifications/:id/read`, `POST /notifications/read-all`
- Bảng dữ liệu: `Notification`
- `notification.service.ts` — `markRead`, `markAllRead`

### UC-NOTI-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-03 |
| 2. Tên Use Case | Xoá thông báo (Delete Notification) |
| 3. Mục tiêu | Xoá thông báo không còn cần. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xoá một thông báo của mình. |
| 7. Trigger | Người dùng bấm "Xoá thông báo". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đã đăng nhập.

**9. Hậu điều kiện**

- Dòng `notifications` bị xoá.

**10. Luồng sự kiện chính**

1. Người dùng bấm xoá.
2. Hệ thống xoá thông báo của chính người đó.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Không tìm thấy (hoặc không phải của mình): trả 404.

**13. Quy tắc nghiệp vụ**

- Khoá chống trùng của thông báo tự động nằm NGAY TRÊN dòng thông báo (UNIQUE `user_id`, `dedupe_key`), nên xoá thông báo là xoá luôn khoá. Hệ quả đọc được từ mã: xoá thông báo `GOAL_ACHIEVED` rồi học thêm trong cùng kỳ thì nhận lại lời chúc mừng đó. Lời nhắc học và cảnh báo chuỗi không bị tạo lại vì chỉ sinh trong cửa sổ 15 phút của mốc giờ. Chưa kiểm chứng khi chạy — xem mục cần xác nhận trong `README.md`.

**14. Dữ liệu đầu vào:** notificationId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API gắn `requireAuth`, không `requireRole`, không cờ tính năng.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/notifications`
- API: `DELETE /notifications/:id`
- Bảng dữ liệu: `Notification`
- `notification.service.ts` — `deleteNotification`

### UC-NOTI-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-04 |
| 2. Tên Use Case | Cấu hình nhắc nhở (Configure Reminders) |
| 3. Mục tiêu | Tự quyết định có nhận nhắc nhở hay không và loại nào. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Bật/tắt toàn bộ nhắc nhở, nhắc thẻ tới hạn và cảnh báo chuỗi sắp đứt. |
| 7. Trigger | Người học chỉnh khối "Cài đặt nhắc nhở" ở `/profile` và bấm "Lưu cài đặt". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.

**9. Hậu điều kiện**

- `notification_settings` được cập nhật.

**10. Luồng sự kiện chính**

1. Hệ thống hiện cấu hình hiện tại.
2. Người học bật/tắt công tắc tổng, nhắc thẻ tới hạn, cảnh báo chuỗi sắp đứt.
3. Hệ thống lưu.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Công tắc tổng tắt thì MỌI mốc nhắc im lặng.
- Giờ nhắc không nằm ở đây mà ở bảng `reminders` (UC-NOTI-05).
- Quản trị viên không có cấu hình này (API chặn bằng `requireRole(USER)`, trang cá nhân của Quản trị viên không có khối nhắc nhở).

**14. Dữ liệu đầu vào:** isEnabled, remindReviewDue, remindStreakAtRisk

**15. Dữ liệu đầu ra:** Cấu hình

**16. Quyền truy cập:** Chỉ Người học. API `requireAuth` + `requireRole(USER)`; không có cờ tính năng.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/profile`
- API: `GET /notifications/settings`, `PUT /notifications/settings`
- Bảng dữ liệu: `NotificationSetting`
- `notification.service.ts` — `getSetting`, `updateSetting`
- `notification.routes.ts` dòng 77–92

### UC-NOTI-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-05 |
| 2. Tên Use Case | Quản lý mốc nhắc học (Manage Reminder Times) |
| 3. Mục tiêu | Đặt các giờ muốn được nhắc học trong ngày. |
| 4. Actor chính | Người học |
| 5. Actor phụ | Không có |
| 6. Mô tả | Thêm, sửa, bật/tắt, xoá tối đa 10 mốc nhắc theo giờ và thứ trong tuần. |
| 7. Trigger | Người học bấm "Thêm lời nhắc", "Sửa lời nhắc" hoặc "Xoá lời nhắc" ở `/profile`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Người học.

**9. Hậu điều kiện**

- Dòng `reminders` được tạo, cập nhật hoặc xoá.

**10. Luồng sự kiện chính**

1. Người học chọn giờ (HH:mm), các thứ trong tuần, nhãn (tuỳ chọn).
2. Hệ thống kiểm tra chưa quá 10 mốc và chưa có mốc cùng giờ.
3. Hệ thống lưu mốc nhắc.

**11. Luồng thay thế**

- 1a. Sửa hoặc bật/tắt một mốc: hệ thống cập nhật.
- 1b. Xoá một mốc: hệ thống xoá.

**12. Luồng ngoại lệ**

- 2a. Đã có 10 mốc: trả 400 "Mỗi người chỉ đặt được tối đa 10 lời nhắc".
- 2b. Trùng giờ với mốc khác: trả 409 "Bạn đã có một lời nhắc vào giờ này".
- Mốc không phải của mình: trả 404.

**13. Quy tắc nghiệp vụ**

- Tối đa `MAX_REMINDERS_PER_USER = 10`.
- UNIQUE (`user_id`, `time_of_day`).
- Nhãn tối đa 60 ký tự; ít nhất một thứ trong tuần.
- Đăng ký tài khoản đã tạo sẵn một mốc 20:00 cả tuần.

**14. Dữ liệu đầu vào:** timeOfDay, daysOfWeek, label, isEnabled

**15. Dữ liệu đầu ra:** Mốc nhắc

**16. Quyền truy cập:** Chỉ Người học. API `requireAuth` + `requireRole(USER)`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/profile`
- API: `GET /notifications/reminders`, `POST /notifications/reminders`, `PATCH /notifications/reminders/:id`, `DELETE /notifications/reminders/:id`
- Bảng dữ liệu: `Reminder`
- `notification.service.ts` — `createReminder`, `updateReminder`, `deleteReminder`
- `fe/src/features/notifications/components/ReminderSettings.tsx`

### UC-NOTI-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-06 |
| 2. Tên Use Case | Đăng ký thiết bị nhận thông báo đẩy (Register Push Device) |
| 3. Mục tiêu | Nhận thông báo đẩy trên thiết bị ngay cả khi không mở app. |
| 4. Actor chính | Người dùng đã xác thực |
| 5. Actor phụ | Không có |
| 6. Mô tả | Lưu hoặc gỡ mã thiết bị OneSignal để nhận thông báo đẩy. |
| 7. Trigger | **Chưa xác minh được từ hệ thống hiện tại** — không có màn hình hay đoạn mã phía web nào gọi endpoint này. |
| Trạng thái xác minh | Partially Confirmed — Có API và bảng `user_devices`, nhưng web chưa tích hợp SDK OneSignal và không có lời gọi nào tới hai endpoint này. Ứng dụng `mobile` chưa scaffold. |

**8. Tiền điều kiện**

- Đã đăng nhập.
- Thiết bị có mã người nhận OneSignal (`playerId`).

**9. Hậu điều kiện**

- Có (hoặc mất) dòng `user_devices`.

**10. Luồng sự kiện chính**

1. Ứng dụng gửi `playerId` và nền tảng (web / ios / android).
2. Hệ thống lưu thiết bị cho người dùng.

**11. Luồng thay thế**

- 1a. Gỡ thiết bị: hệ thống xoá dòng theo `playerId`.

**12. Luồng ngoại lệ**

- Dữ liệu không hợp lệ: trả 400.

**13. Quy tắc nghiệp vụ**

- `player_id` là duy nhất.
- Khi có thiết bị, UC-NOTI-07 và UC-NOTI-08 đẩy thêm qua OneSignal.

**14. Dữ liệu đầu vào:** playerId, platform

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Mọi tài khoản đã đăng nhập. API gắn `requireAuth`, không `requireRole`, không cờ tính năng.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: không có
- API: `POST /notifications/devices`, `DELETE /notifications/devices/:playerId`
- Bảng dữ liệu: `UserDevice`
- `notification.service.ts` — `registerDevice`, `unregisterDevice`
- Không có lời gọi `/notifications/devices` trong `fe/src`; không có SDK OneSignal phía web
- Thư mục `mobile/` chưa scaffold

### UC-NOTI-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-07 |
| 2. Tên Use Case | Gửi lời nhắc học (Send Study Reminder) |
| 3. Mục tiêu | Nhắc người học vào đúng giờ họ đặt, trong những ngày họ chưa học. |
| 4. Actor chính | Bộ lập lịch hệ thống |
| 5. Actor phụ | OneSignal |
| 6. Mô tả | Tới mốc giờ người học đặt mà hôm đó họ chưa học, hệ thống tạo lời nhắc và đẩy qua OneSignal nếu có thiết bị. |
| 7. Trigger | Bộ lập lịch chạy mỗi 15 phút. |
| Trạng thái xác minh | Confirmed — Nhánh gửi đẩy chưa kiểm chứng khi chạy: OneSignal chưa cấu hình ở môi trường dev và chưa có thiết bị nào đăng ký được (xem UC-NOTI-06). |

**8. Tiền điều kiện**

- Người học có mốc nhắc đang bật; công tắc tổng bật; vai trò `USER`.

**9. Hậu điều kiện**

- Có một dòng `notifications` loại `DAILY_REMINDER`, khoá `DAILY_REMINDER:<reminderId>:<ngày>`.
- Nếu có thiết bị và đã cấu hình OneSignal: một thông báo đẩy được gửi.
- `notification_settings.last_sent_date` được cập nhật.

**10. Luồng sự kiện chính**

1. Bộ lập lịch lấy mọi mốc nhắc đang bật của Người học có công tắc tổng bật.
2. Với mỗi mốc: kiểm tra hôm nay là thứ được chọn và giờ địa phương nằm trong cửa sổ 15 phút của mốc.
3. Kiểm tra hôm nay người học CHƯA có hoạt động học.
4. Soạn nội dung: có thẻ tới hạn thì mời ôn (liên kết `/review`), có chuỗi thì mời giữ chuỗi, còn lại mời bắt đầu chuỗi mới.
5. Lưu thông báo; nếu lưu mới thành công và có thiết bị thì đẩy qua OneSignal.

**11. Luồng thay thế**

- 2a. Sai thứ hoặc ngoài cửa sổ giờ: bỏ qua.
- 3a. Hôm nay đã học: bỏ qua — không nhắc người đang học đều.
- 4a. Cờ Ôn tập tắt: không đếm thẻ tới hạn, liên kết trỏ về `/`.
- 5a. Khoá chống trùng đã tồn tại: không lưu, không đẩy.

**12. Luồng ngoại lệ**

- 5b. Chưa cấu hình OneSignal: chỉ ghi log cảnh báo, thông báo trong app vẫn có.
- 5c. OneSignal trả lỗi: ghi log, không dừng lượt quét.

**13. Quy tắc nghiệp vụ**

- Lịch gửi chỉ do `be/src/jobs` quyết định; không dùng lịch của OneSignal.
- Khoá chống trùng BẮT BUỘC có `reminderId` — hai mốc 8:00 và 20:00 là hai lời nhắc khác nhau.
- Giờ tính theo múi giờ người học.
- Lọc vai trò `USER` ở job, vì tài khoản có thể được nâng lên Quản trị viên sau khi đã có mốc nhắc.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Số lời nhắc đã gửi (ghi log job)

**16. Quyền truy cập:** Không có actor người. Chạy trong tiến trình backend.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: không có
- API: không có (tiến trình nền hoặc chỉ giao diện)
- Bảng dữ liệu: `Reminder`, `NotificationSetting`, `ActivityLog`, `UserVocabProgress`, `Notification`, `UserDevice`
- `be/src/jobs/reminder.job.ts` — `sendDueReminders`, `sendDailyReminder`, `deliver`
- `be/src/jobs/onesignal.client.ts` — `sendPush`
- Nhánh đẩy chưa chạy thử: `ONESIGNAL_API_KEY` trống ở `be/.env` dev

### UC-NOTI-08

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-NOTI-08 |
| 2. Tên Use Case | Cảnh báo chuỗi sắp đứt (Warn Streak at Risk) |
| 3. Mục tiêu | Cứu chuỗi ngày học trước nửa đêm. |
| 4. Actor chính | Bộ lập lịch hệ thống |
| 5. Actor phụ | OneSignal |
| 6. Mô tả | Lúc 21:30 giờ địa phương, cảnh báo người đang có chuỗi mà hôm đó chưa học. |
| 7. Trigger | Bộ lập lịch chạy mỗi 15 phút. |
| Trạng thái xác minh | Confirmed — Như UC-NOTI-07: nhánh gửi đẩy chưa kiểm chứng khi chạy. |

**8. Tiền điều kiện**

- Người học bật công tắc tổng và cảnh báo chuỗi; vai trò `USER`.

**9. Hậu điều kiện**

- Có một dòng `notifications` loại `STREAK_AT_RISK`, khoá `STREAK_AT_RISK:<ngày>`; đẩy qua OneSignal nếu có thiết bị.

**10. Luồng sự kiện chính**

1. Bộ lập lịch lấy cấu hình của những người bật cảnh báo chuỗi.
2. Kiểm tra giờ địa phương nằm trong cửa sổ 21:30.
3. Kiểm tra chuỗi hiện tại lớn hơn 0.
4. Kiểm tra hôm nay CHƯA học.
5. Lưu thông báo "Chuỗi n ngày sắp đứt" và đẩy nếu có thiết bị.

**11. Luồng thay thế**

- 2a, 3a, 4a. Không thoả: bỏ qua.
- 5a. Đã cảnh báo hôm nay: không gửi lại.

**12. Luồng ngoại lệ**

- Như UC-NOTI-07 bước 5b, 5c.

**13. Quy tắc nghiệp vụ**

- Mỗi người tối đa một cảnh báo mỗi ngày.
- Một hoạt động học bất kỳ trước nửa đêm là đủ giữ chuỗi.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** Số cảnh báo đã gửi (ghi log job)

**16. Quyền truy cập:** Không có actor người. Chạy trong tiến trình backend.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: không có
- API: không có (tiến trình nền hoặc chỉ giao diện)
- Bảng dữ liệu: `NotificationSetting`, `UserStreak`, `ActivityLog`, `Notification`, `UserDevice`
- `be/src/jobs/reminder.job.ts` — `sendDueStreakWarnings`, `sendStreakWarning`, `STREAK_WARNING_TIME`

---

## AUSR — Quản trị tài khoản và truy cập

### UC-ADM-01

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-01 |
| 2. Tên Use Case | Xem tổng quan hệ thống (View System Overview) |
| 3. Mục tiêu | Nắm tình trạng vận hành và mức sử dụng của hệ thống. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem quy mô người dùng, người hoạt động 1/7/30 ngày, xu hướng và cơ cấu hoạt động, người học tích cực, tình trạng DB và API. |
| 7. Trigger | Quản trị viên đăng nhập (vào thẳng `/admin`) hoặc mở mục "Tổng quan hệ thống". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống đếm người dùng, quản trị viên, tài khoản bị khoá, người đăng ký mới 7/30 ngày.
2. Hệ thống đếm người hoạt động 1/7/30 ngày, hoạt động học 30 ngày qua theo ngày, cơ cấu theo loại hoạt động, người học tích cực nhất.
3. Hệ thống đếm kho nội dung, lượt đăng nhập thành công/thất bại 7 ngày, phiên đang mở.
4. Hệ thống kiểm tra kết nối DB (`SELECT 1`) và thời gian chạy của API.
5. Giao diện hiện các khối số liệu và biểu đồ.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- 4a. DB không phản hồi: hiện trạng thái kết nối lỗi.

**13. Quy tắc nghiệp vụ**

- Mọi số liệu học tập đọc từ `activity_logs`, số liệu truy cập đọc từ `login_events`.

**14. Dữ liệu đầu vào:** Không có

**15. Dữ liệu đầu ra:** SystemOverview

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin`
- API: `GET /admin/overview`
- Bảng dữ liệu: `User`, `ActivityLog`, `RefreshToken`, `Topic`, `Vocabulary`
- `admin.service.ts` — `getSystemOverview`, `pingDatabase`
- Giao diện `/admin`: "Hoạt động học 30 ngày qua", "Cơ cấu hoạt động", "Người học tích cực nhất", "Số liệu tra cứu"

### UC-ADM-02

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-02 |
| 2. Tên Use Case | Tìm kiếm và lọc tài khoản (Search Accounts) |
| 3. Mục tiêu | Tìm đúng tài khoản cần xử lý. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tìm theo tên, tên tài khoản hoặc email; lọc vai trò, trạng thái; sắp xếp mới nhất, cũ nhất, đăng nhập gần đây, học nhiều nhất; phân trang. |
| 7. Trigger | Quản trị viên mở `/admin/users`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả trang đầu danh sách tài khoản, mới đăng ký nhất trước.
2. Quản trị viên gõ tên, tên tài khoản hoặc email; lọc vai trò, trạng thái; chọn sắp xếp Mới đăng ký nhất / Cũ nhất / Đăng nhập gần đây / Học nhiều nhất.
3. Hệ thống trả kết quả; quản trị viên chuyển trang.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Mỗi trang 20 (tối đa 100); từ khoá tối đa 190 ký tự.
- Tài khoản đang đăng nhập được đánh dấu "(bạn)".

**14. Dữ liệu đầu vào:** search, role, status, sort, page, pageSize

**15. Dữ liệu đầu ra:** Danh sách tài khoản, Tổng số

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/users`
- API: `GET /admin/users`
- Bảng dữ liệu: `User`, `ActivityLog`, `RefreshToken`
- `admin.service.ts` — `listUsers`
- `shared/src/schemas/admin.schema.ts` — `adminUserQuerySchema`
- Giao diện `/admin/users`: ô tìm, 3 hộp chọn

### UC-ADM-03

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-03 |
| 2. Tên Use Case | Xem chi tiết tài khoản (View Account Details) |
| 3. Mục tiêu | Hiểu đầy đủ một tài khoản trước khi ra quyết định. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem thông tin cá nhân, thống kê hoạt động 10 ngày và các sự kiện gần đây của một tài khoản. |
| 7. Trigger | Quản trị viên bấm "Quản lý" trên một dòng tài khoản. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống mở hộp thoại cố định kích thước, không đóng khi bấm ra ngoài.
2. Tab "Thông tin cá nhân": ảnh đại diện, họ tên, tên tài khoản, email, vai trò, trạng thái, ngày tạo, lần đăng nhập cuối, phiên đang mở; kèm các nút đổi vai trò, khoá/mở khoá, xoá.
3. Tab "Thống kê": cơ cấu hoạt động theo loại và tần suất hoạt động 10 ngày gần nhất (tính cả hôm nay).
4. Tab "Hoạt động gần đây": 30 sự kiện mới nhất gộp từ đăng nhập và hoạt động học.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tài khoản không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Quản trị viên KHÔNG thấy và không đặt được mật khẩu người dùng.

**14. Dữ liệu đầu vào:** userId

**15. Dữ liệu đầu ra:** AdminUserDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/users`
- API: `GET /admin/users/:id`
- Bảng dữ liệu: `User`, `UserAvatar`, `ActivityLog`, `LoginEvent`, `RefreshToken`
- `admin.service.ts` — `getUserDetail` (`RECENT_EVENTS_TOTAL = 30`)
- `fe/src/features/admin/components/AdminUsersPage.tsx`, `TrendChart.tsx`

### UC-ADM-04

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-04 |
| 2. Tên Use Case | Thay đổi vai trò tài khoản (Change Account Role) |
| 3. Mục tiêu | Cấp hoặc thu quyền quản trị. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đổi vai trò giữa Người học và Quản trị viên. |
| 7. Trigger | Quản trị viên đổi vai trò trong hộp thoại chi tiết tài khoản. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- `users.role` được cập nhật.

**10. Luồng sự kiện chính**

1. Quản trị viên chọn vai trò mới và xác nhận.
2. Hệ thống kiểm tra các quy tắc an toàn.
3. Hệ thống lưu và trả dòng đã cập nhật.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tự bỏ quyền quản trị của chính mình: trả 400.
- Hạ quyền quản trị viên hoạt động cuối cùng: trả 400.
- Tài khoản không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Ba quy tắc an toàn: không tự hạ quyền / khoá / xoá chính mình; không hạ quyền, khoá hay xoá QUẢN TRỊ VIÊN HOẠT ĐỘNG CUỐI CÙNG ("Đây là quản trị viên hoạt động duy nhất — hãy chỉ định người khác trước").
- Tài khoản được nâng lên Quản trị viên vẫn giữ cấu hình nhắc nhở cũ; cron tự lọc vai trò `USER` nên họ không bị nhắc học.

**14. Dữ liệu đầu vào:** userId, role

**15. Dữ liệu đầu ra:** Dòng tài khoản đã cập nhật

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/users`
- API: `PATCH /admin/users/:id/role`
- Bảng dữ liệu: `User`
- `admin.service.ts` — `updateUserRole`, `assertNotLastAdmin`

### UC-ADM-05

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-05 |
| 2. Tên Use Case | Khoá hoặc mở khoá tài khoản (Lock or Unlock Account) |
| 3. Mục tiêu | Ngăn một tài khoản sử dụng hệ thống, hoặc cho dùng lại. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Khoá tài khoản (thu hồi mọi phiên) hoặc mở khoá lại. |
| 7. Trigger | Quản trị viên bấm khoá hoặc mở khoá trong hộp thoại chi tiết. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- `users.status` = `LOCKED` hoặc `ACTIVE`.
- Khi khoá: MỌI refresh token của tài khoản bị thu hồi.

**10. Luồng sự kiện chính**

1. Quản trị viên chọn Khoá và xác nhận.
2. Hệ thống kiểm tra quy tắc an toàn.
3. Hệ thống đổi trạng thái và thu hồi mọi phiên.
4. Người bị khoá mất phiên ở lần làm mới token kế tiếp; đăng nhập lại nhận 403.

**11. Luồng thay thế**

- 1a. Mở khoá: hệ thống đổi về `ACTIVE`, không động tới phiên.

**12. Luồng ngoại lệ**

- Tự khoá chính mình: trả 400.
- Khoá quản trị viên hoạt động cuối cùng: trả 400.
- Tài khoản không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Ba quy tắc an toàn: không tự hạ quyền / khoá / xoá chính mình; không hạ quyền, khoá hay xoá QUẢN TRỊ VIÊN HOẠT ĐỘNG CUỐI CÙNG ("Đây là quản trị viên hoạt động duy nhất — hãy chỉ định người khác trước").
- Khoá phải thu hồi refresh token, nếu không người bị khoá dùng tiếp tới khi token hết hạn 30 ngày.
- Người học bị khoá rời khỏi bảng xếp hạng; bộ thẻ công khai của họ rời khỏi Khám phá (`publicSetWhere` yêu cầu chủ `ACTIVE`).

**14. Dữ liệu đầu vào:** userId, status

**15. Dữ liệu đầu ra:** Dòng tài khoản đã cập nhật

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/users`
- API: `PATCH /admin/users/:id/status`
- Bảng dữ liệu: `User`, `RefreshToken`
- `admin.service.ts` — `updateUserStatus`
- `library.access.ts` — `publicSetWhere`

### UC-ADM-06

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-06 |
| 2. Tên Use Case | Xoá tài khoản (Delete Account) |
| 3. Mục tiêu | Gỡ bỏ hẳn một tài khoản. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xoá vĩnh viễn một tài khoản. |
| 7. Trigger | Quản trị viên bấm xoá trong hộp thoại chi tiết và xác nhận. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Dòng `users` bị xoá; dữ liệu phụ thuộc xử lý theo `onDelete` của schema (ví dụ bộ thẻ người đó sở hữu bị xoá theo — `Topic.owner onDelete: Cascade`).

**10. Luồng sự kiện chính**

1. Quản trị viên bấm xoá, xác nhận trong hộp thoại.
2. Hệ thống kiểm tra quy tắc an toàn.
3. Hệ thống xoá tài khoản.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tự xoá chính mình: trả 400.
- Xoá quản trị viên hoạt động cuối cùng: trả 400.
- Tài khoản không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Ba quy tắc an toàn: không tự hạ quyền / khoá / xoá chính mình; không hạ quyền, khoá hay xoá QUẢN TRỊ VIÊN HOẠT ĐỘNG CUỐI CÙNG ("Đây là quản trị viên hoạt động duy nhất — hãy chỉ định người khác trước").
- Xoá là không đảo ngược; khoá (UC-ADM-05) là lựa chọn đảo ngược được.
- Tác động đầy đủ lên từng bảng liên quan (nhóm do người đó lập, bài đăng, sổ xu…) **chưa xác minh được từ hệ thống hiện tại** ngoài việc đọc `onDelete` trong schema.

**14. Dữ liệu đầu vào:** userId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/users`
- API: `DELETE /admin/users/:id`
- Bảng dữ liệu: `User`
- `admin.service.ts` — `deleteUser`
- `be/prisma/schema.prisma` — các `onDelete`

### UC-ADM-07

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-07 |
| 2. Tên Use Case | Xử lý yêu cầu cấp lại mật khẩu (Process Password Reset Request) |
| 3. Mục tiêu | Cho người quên mật khẩu lấy lại quyền truy cập, sau khi Quản trị viên tự xác minh họ. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem yêu cầu đang chờ, xác nhận hoặc từ chối kèm lý do. |
| 7. Trigger | Quản trị viên nhận thông báo `PASSWORD_RESET_REQUEST`, mở `/admin/requests` tab "Yêu cầu". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Có yêu cầu `PENDING`.

**9. Hậu điều kiện**

- Xác nhận: yêu cầu `APPROVED`, ghi người và lúc xử lý; người dùng có 7 ngày để đặt mật khẩu (UC-AUTH-04).
- Từ chối: yêu cầu `REJECTED` kèm lý do mà người dùng sẽ đọc nguyên văn.

**10. Luồng sự kiện chính**

1. Hệ thống hiện các yêu cầu đang chờ.
2. Quản trị viên xác minh người yêu cầu bằng kênh ngoài hệ thống.
3. Quản trị viên bấm Xác nhận.
4. Hệ thống chuyển trạng thái với điều kiện yêu cầu vẫn đang `PENDING`.

**11. Luồng thay thế**

- 3a. Quản trị viên bấm Từ chối và nhập lý do: hệ thống chuyển `REJECTED` kèm lý do.

**12. Luồng ngoại lệ**

- 4a. Yêu cầu vừa được quản trị viên khác xử lý: trả 409 "Yêu cầu này đã được xử lý".
- Yêu cầu không tồn tại: trả 404.
- Lý do từ chối dưới 5 ký tự: trả 400.

**13. Quy tắc nghiệp vụ**

- Cập nhật bằng `updateMany` có điều kiện `status = PENDING`: hai quản trị viên bấm cùng lúc thì chỉ một người thắng.
- Đã xử lý thì không đổi lại được; muốn làm lại, người dùng tạo yêu cầu mới.
- Quản trị viên không biết và không đặt mật khẩu mới.
- Điểm yếu đã ghi nhận: việc duyệt gắn với tài khoản, không gắn với danh tính đã chứng minh (xem `docs/luong-quen-mat-khau.md` mục Đánh đổi).

**14. Dữ liệu đầu vào:** requestId, reason (khi từ chối)

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/requests`
- API: `GET /admin/password-reset-requests`, `POST /admin/password-reset-requests/:id/approve`, `POST /admin/password-reset-requests/:id/reject`
- Bảng dữ liệu: `PasswordResetRequest`
- `password-reset.service.ts` — `listRequests`, `approveRequest`, `rejectRequest`
- Giao diện `/admin/requests`: tab Yêu cầu, nút Xác nhận, Từ chối

### UC-ADM-08

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-08 |
| 2. Tên Use Case | Xem nhật ký xử lý yêu cầu (View Request Log) |
| 3. Mục tiêu | Truy lại ai đã xử lý yêu cầu cấp lại mật khẩu, lúc nào, vì sao. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem các yêu cầu đã xử lý: ai xử lý, lúc nào, kết quả và lý do. |
| 7. Trigger | Quản trị viên mở tab "Nhật ký" ở `/admin/requests`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả các yêu cầu `APPROVED` và `REJECTED` dạng bảng: người yêu cầu, kết quả, người xử lý, thời điểm, lý do.
2. Quản trị viên chuyển trang.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Mỗi trang 20 (tối đa 100).

**14. Dữ liệu đầu vào:** tab = log, page

**15. Dữ liệu đầu ra:** Danh sách yêu cầu đã xử lý

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/requests`
- API: `GET /admin/password-reset-requests`
- Bảng dữ liệu: `PasswordResetRequest`
- `password-reset.service.ts` — `listRequests` (nhánh `tab = log`)
- `shared/src/schemas/password-reset.schema.ts` — `resetRequestQuerySchema`

### UC-ADM-09

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-09 |
| 2. Tên Use Case | Xem lượt truy cập (View Access Log) |
| 3. Mục tiêu | Theo dõi lượt truy cập và phát hiện đăng nhập bất thường. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem lượt đăng nhập theo ngày, phiên đang mở và nhật ký đăng nhập; lọc 7/30/90 ngày và kết quả; phân trang. |
| 7. Trigger | Quản trị viên mở `/admin/access`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Quản trị viên chọn khoảng 7 / 30 / 90 ngày.
2. Hệ thống trả lượt đăng nhập theo ngày và số phiên đang mở.
3. Quản trị viên lọc nhật ký theo Tất cả / Chỉ thành công / Chỉ thất bại và chuyển trang.
4. Hệ thống trả từng lượt: thời điểm, email hoặc chuỗi đã gõ, kết quả, lý do thất bại, IP, trình duyệt.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Số liệu truy cập chỉ đọc từ `login_events`; nhóm theo ngày giờ máy chủ, không theo `local_date`.
- Lượt thất bại vào tài khoản có thật ghi email thật; chuỗi lạ ghi nguyên văn.

**14. Dữ liệu đầu vào:** days, result, page

**15. Dữ liệu đầu ra:** AccessOverview, Danh sách LoginEvent

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/access`
- API: `GET /admin/access/overview`, `GET /admin/access/logs`
- Bảng dữ liệu: `LoginEvent`, `RefreshToken`
- `admin.service.ts` — `getAccessOverview`, `listLoginEvents`
- `shared/src/schemas/admin.schema.ts` — `accessLogQuerySchema`

---

## ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ

### UC-ADM-10

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-10 |
| 2. Tên Use Case | Quản lý chủ đề hệ thống (Manage System Topics) |
| 3. Mục tiêu | Soạn bộ thẻ "Hệ thống" cho mọi người học. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem, thêm, sửa, xoá chủ đề (bộ thẻ "Hệ thống"). |
| 7. Trigger | Quản trị viên mở `/admin/content`, khối "Chủ đề". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Chủ đề (`topics` có `owner_id` rỗng) được tạo, sửa hoặc xoá. Xoá chủ đề kéo theo từ vựng và tiến độ học trên từ vựng đó.

**10. Luồng sự kiện chính**

1. Hệ thống hiện danh sách chủ đề Hệ thống kèm cấp độ và số từ.
2. Quản trị viên nhập tên, chọn cấp độ, bấm "Thêm chủ đề".
3. Hệ thống tạo chủ đề với `owner_id` rỗng.

**11. Luồng thay thế**

- 2a. Sửa chủ đề: hệ thống kiểm tra là chủ đề Hệ thống rồi lưu.
- 2b. Xoá chủ đề: quản trị viên xác nhận; hệ thống xoá.

**12. Luồng ngoại lệ**

- Chủ đề không tồn tại hoặc là bộ người học tạo: trả 404 "Không tìm thấy chủ đề".

**13. Quy tắc nghiệp vụ**

- Quản trị viên CHỈ đụng được bộ `owner_id IS NULL`; không sửa được bộ người học tự tạo.
- `/topics` chỉ mở cho Quản trị viên.

**14. Dữ liệu đầu vào:** name, description, level

**15. Dữ liệu đầu ra:** Chủ đề

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403. Riêng `GET /topics*` nằm ở router `topics` với `requireRole(ADMIN)`.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/content`
- API: `GET /topics`, `GET /topics/:id`, `POST /admin/topics`, `PATCH /admin/topics/:id`, `DELETE /admin/topics/:id`
- Bảng dữ liệu: `Topic`
- `topic.service.ts` — `listTopics`, `getTopic`, `createTopic`, `updateTopic`, `deleteTopic`
- `fe/src/features/admin/components/ContentManager.tsx`

### UC-ADM-11

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-11 |
| 2. Tên Use Case | Quản lý từ vựng hệ thống (Manage System Vocabulary) |
| 3. Mục tiêu | Duy trì nội dung từng từ của bộ Hệ thống. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem, thêm, sửa, xoá từ vựng trong một chủ đề hệ thống. |
| 7. Trigger | Quản trị viên chọn một chủ đề ở `/admin/content`, khối "Từ vựng". |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Chủ đề là bộ Hệ thống.

**9. Hậu điều kiện**

- Từ vựng được tạo, sửa hoặc xoá.

**10. Luồng sự kiện chính**

1. Hệ thống hiện từ vựng của chủ đề, xếp theo chữ cái.
2. Quản trị viên nhập từ, nghĩa, phiên âm, ví dụ, đường dẫn âm thanh (tuỳ chọn) và thêm.
3. Hệ thống kiểm tra chủ đề là bộ Hệ thống rồi lưu.

**11. Luồng thay thế**

- 2a. Sửa hoặc xoá một từ: hệ thống kiểm tra từ thuộc bộ Hệ thống rồi thực hiện.

**12. Luồng ngoại lệ**

- Chủ đề hoặc từ không thuộc bộ Hệ thống: trả 404.

**13. Quy tắc nghiệp vụ**

- Quản trị viên không sửa được thẻ trong bộ người học tạo.

**14. Dữ liệu đầu vào:** topicId, word, meaning, phonetic, example, audioUrl

**15. Dữ liệu đầu ra:** Từ vựng

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/content`
- API: `GET /topics/:id/vocabulary`, `POST /admin/vocabulary`, `PATCH /admin/vocabulary/:id`, `DELETE /admin/vocabulary/:id`
- Bảng dữ liệu: `Vocabulary`
- `admin.service.ts` — `createVocabulary`, `updateVocabulary`, `deleteVocabulary`, `assertSystemTopic`, `assertSystemVocabulary`
- `topic.service.ts` — `listVocabularyByTopic`

### UC-ADM-12

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-12 |
| 2. Tên Use Case | Xem báo cáo vi phạm bộ thẻ (View Study Set Reports) |
| 3. Mục tiêu | Nắm các báo cáo vi phạm bộ thẻ cần xử lý. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem danh sách báo cáo, lọc Chờ xử lý / Đã chặn / Đã bỏ qua, phân trang. |
| 7. Trigger | Quản trị viên mở `/admin/study-sets` (thường sau thông báo `STUDY_SET_REPORTED`). |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả danh sách báo cáo: bộ thẻ, chủ bộ, người báo cáo, lý do, trạng thái.
2. Quản trị viên lọc Tất cả / Chờ xử lý / Đã chặn bộ thẻ / Đã bỏ qua và chuyển trang.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Mỗi trang 20 (tối đa 100).

**14. Dữ liệu đầu vào:** status, page

**15. Dữ liệu đầu ra:** Danh sách báo cáo

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/study-sets`
- API: `GET /admin/study-set-reports`
- Bảng dữ liệu: `StudySetReport`, `Topic`, `User`
- `admin-study-set.service.ts` — `listReports`
- Giao diện `/admin/study-sets`: hộp chọn 4 trạng thái, nút Xem

### UC-ADM-13

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-13 |
| 2. Tên Use Case | Xem chi tiết bộ thẻ bị báo cáo (Inspect Reported Study Set) |
| 3. Mục tiêu | Tự xem nội dung bộ thẻ bị báo cáo trước khi quyết định. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem thông tin bộ thẻ, chủ sở hữu, trạng thái chặn và toàn bộ thẻ trong bộ. |
| 7. Trigger | Quản trị viên bấm "Xem" trên một báo cáo. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả thông tin bộ thẻ, chủ sở hữu, trạng thái chặn và toàn bộ thẻ.
2. Giao diện hiện nội dung kèm các hành động Chặn / Mở chặn / Bỏ qua.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bộ thẻ không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Quản trị viên xem được mọi bộ, kể cả riêng tư, ở màn này.

**14. Dữ liệu đầu vào:** setId

**15. Dữ liệu đầu ra:** AdminStudySetDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/study-sets`
- API: `GET /admin/study-sets/:id`
- Bảng dữ liệu: `Topic`, `Vocabulary`, `User`
- `admin-study-set.service.ts` — `getStudySet`

### UC-ADM-14

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-14 |
| 2. Tên Use Case | Chặn bộ thẻ (Block Study Set) |
| 3. Mục tiêu | Gỡ một bộ thẻ vi phạm khỏi tầm với của người học khác mà không xoá dữ liệu. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Chặn một bộ thẻ công khai của người học kèm lý do; đóng mọi báo cáo đang chờ của bộ đó. |
| 7. Trigger | Quản trị viên bấm Chặn và nhập lý do. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Bộ thẻ do người học tạo và chưa bị chặn.

**9. Hậu điều kiện**

- Bộ thẻ có `blocked_at`, `blocked_by`, lý do.
- MỌI báo cáo đang chờ của bộ chuyển `RESOLVED`.
- Chủ bộ nhận `STUDY_SET_BLOCKED`; từng người báo cáo nhận `STUDY_SET_REPORT_RESOLVED`.

**10. Luồng sự kiện chính**

1. Quản trị viên nhập lý do và xác nhận.
2. Hệ thống kiểm tra bộ tồn tại, không phải bộ Hệ thống, chưa bị chặn.
3. Hệ thống chặn bộ và đóng mọi báo cáo đang chờ.
4. Hệ thống gửi thông báo cho chủ bộ và người báo cáo.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bộ Hệ thống: trả 400 "Bộ thẻ của hệ thống sửa trực tiếp ở Nội dung học tập".
- Đã bị chặn: trả 400.
- Lý do dưới 10 ký tự: trả 400.
- Bộ không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Lý do bắt buộc, 10–500 ký tự.
- Không có "xoá bộ thẻ" phía quản trị — chặn là đảo ngược được.
- Bộ bị chặn rời khỏi `readableSetWhere` của mọi người trừ chủ: Học, Ôn tập, lịch sử, số thẻ tới hạn, nhắc nhở tự bỏ qua.

**14. Dữ liệu đầu vào:** setId, reason

**15. Dữ liệu đầu ra:** AdminStudySetDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/study-sets`
- API: `POST /admin/study-sets/:id/block`
- Bảng dữ liệu: `Topic`, `StudySetReport`, `Notification`
- `admin-study-set.service.ts` — `blockSet`
- `shared/src/schemas/study-set.schema.ts` — `blockStudySetSchema`

### UC-ADM-15

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-15 |
| 2. Tên Use Case | Mở chặn bộ thẻ (Unblock Study Set) |
| 3. Mục tiêu | Trả lại bộ thẻ đã chặn nhầm hoặc đã được sửa. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Gỡ chặn một bộ thẻ và báo cho chủ bộ. |
| 7. Trigger | Quản trị viên bấm Mở chặn. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Bộ thẻ đang bị chặn.

**9. Hậu điều kiện**

- Trường chặn được xoá; chủ bộ nhận `STUDY_SET_UNBLOCKED`.

**10. Luồng sự kiện chính**

1. Quản trị viên xác nhận mở chặn.
2. Hệ thống gỡ chặn.
3. Hệ thống báo cho chủ bộ.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Bộ không bị chặn: trả 400.
- Bộ không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Tiến độ học của mọi người trên bộ vẫn còn nguyên nên học tiếp được ngay.

**14. Dữ liệu đầu vào:** setId

**15. Dữ liệu đầu ra:** AdminStudySetDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/study-sets`
- API: `POST /admin/study-sets/:id/unblock`
- Bảng dữ liệu: `Topic`, `Notification`
- `admin-study-set.service.ts` — `unblockSet`

### UC-ADM-16

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-16 |
| 2. Tên Use Case | Bỏ qua báo cáo vi phạm (Dismiss Report) |
| 3. Mục tiêu | Đóng báo cáo không có cơ sở. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Đóng một báo cáo mà không chặn bộ thẻ, báo kết quả cho người báo cáo. |
| 7. Trigger | Quản trị viên bấm Bỏ qua trên một báo cáo đang chờ. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Báo cáo ở trạng thái `PENDING`.

**9. Hậu điều kiện**

- Báo cáo chuyển `DISMISSED`, ghi người và lúc xử lý; khoá chờ `pendingKey` được giải phóng.
- Người báo cáo nhận `STUDY_SET_REPORT_RESOLVED`.

**10. Luồng sự kiện chính**

1. Quản trị viên bấm Bỏ qua.
2. Hệ thống kiểm tra báo cáo còn chờ.
3. Hệ thống đóng báo cáo và báo cho người báo cáo.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Báo cáo đã xử lý: trả 400 "Báo cáo này đã được xử lý".
- Không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Sau khi đóng, cùng người đó báo cáo lại bộ này được vì `pendingKey` đã trống.

**14. Dữ liệu đầu vào:** reportId

**15. Dữ liệu đầu ra:** Không có

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/study-sets`
- API: `POST /admin/study-set-reports/:id/dismiss`
- Bảng dữ liệu: `StudySetReport`, `Notification`
- `admin-study-set.service.ts` — `dismissReport`

---

## AGRP — Quản trị nhóm lớp

### UC-ADM-17

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-17 |
| 2. Tên Use Case | Tìm kiếm và lọc nhóm (Search Groups (Admin)) |
| 3. Mục tiêu | Tìm nhóm cần kiểm tra. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Tìm nhóm theo tên hoặc mã; lọc trạng thái, chế độ; sắp xếp mới lập, nhiều thành viên, nhiều bài; phân trang. |
| 7. Trigger | Quản trị viên mở `/admin/groups`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả danh sách nhóm kèm mã, số thành viên, số bài, trạng thái.
2. Quản trị viên tìm theo tên hoặc mã; lọc trạng thái (Mọi / Đang hoạt động / Đang bị chặn) và chế độ (Công khai / Riêng tư); sắp xếp Mới lập / Nhiều thành viên / Nhiều bài.
3. Quản trị viên chuyển trang.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

Không có.

**13. Quy tắc nghiệp vụ**

- Quản trị viên thấy cả nhóm riêng tư.
- Mỗi trang 20 (tối đa 100).

**14. Dữ liệu đầu vào:** search, status, visibility, sort, page

**15. Dữ liệu đầu ra:** Danh sách nhóm

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/groups`
- API: `GET /admin/groups`
- Bảng dữ liệu: `Group`, `GroupMember`, `Post`
- `admin-group.service.ts` — `listGroups`
- `shared/src/schemas/group.schema.ts` — `adminGroupQuerySchema`

### UC-ADM-18

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-18 |
| 2. Tên Use Case | Xem chi tiết nhóm (Inspect Group) |
| 3. Mục tiêu | Đánh giá một nhóm có vi phạm hay không. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem thông tin, trưởng nhóm, thành viên, số yêu cầu chờ và tiêu đề 10 bài gần nhất của một nhóm. |
| 7. Trigger | Quản trị viên bấm "Xem" trên một nhóm. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Không thay đổi dữ liệu.

**10. Luồng sự kiện chính**

1. Hệ thống trả thông tin nhóm, trưởng nhóm, thành viên (kèm chuỗi ngày và số hoạt động), số yêu cầu chờ, tiêu đề 10 bài gần nhất.
2. Giao diện hiện các hành động Cảnh báo, Chặn / Mở chặn.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Nhóm không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Chỉ lấy TIÊU ĐỀ bài, không lấy nội dung và tệp đính kèm.

**14. Dữ liệu đầu vào:** groupId

**15. Dữ liệu đầu ra:** AdminGroupDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/groups`
- API: `GET /admin/groups/:id`
- Bảng dữ liệu: `Group`, `GroupMember`, `Post`
- `admin-group.service.ts` — `getGroupDetail`

### UC-ADM-19

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-19 |
| 2. Tên Use Case | Gửi cảnh báo vi phạm tới nhóm (Warn Group) |
| 3. Mục tiêu | Nhắc cả nhóm về vi phạm trước khi phải chặn. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Gửi một thông báo cảnh báo tới toàn bộ thành viên nhóm. |
| 7. Trigger | Quản trị viên nhập nội dung cảnh báo và gửi. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Nhóm tồn tại.

**9. Hậu điều kiện**

- Mỗi thành viên nhận một thông báo `GROUP_WARNING`.

**10. Luồng sự kiện chính**

1. Quản trị viên nhập nội dung cảnh báo.
2. Hệ thống gửi thông báo tới toàn bộ thành viên.
3. Hệ thống trả số người nhận.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Nội dung dưới 10 ký tự: trả 400.
- Nhóm không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Nội dung 10–500 ký tự.
- Mỗi lần gửi có khoá riêng theo thời điểm nên gửi nhiều lần là nhiều thông báo.

**14. Dữ liệu đầu vào:** groupId, message

**15. Dữ liệu đầu ra:** recipients

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/groups`
- API: `POST /admin/groups/:id/warn`
- Bảng dữ liệu: `Notification`, `GroupMember`
- `admin-group.service.ts` — `warnGroup`, `notifyMembers`

### UC-ADM-20

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-20 |
| 2. Tên Use Case | Chặn nhóm (Block Group) |
| 3. Mục tiêu | Đình chỉ một nhóm vi phạm mà không mất dữ liệu. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Chặn nhóm kèm lý do; mọi lối vào nội dung nhóm bị khoá. |
| 7. Trigger | Quản trị viên bấm Chặn và nhập lý do. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Nhóm chưa bị chặn.

**9. Hậu điều kiện**

- Nhóm có `blocked_at`, `blocked_by`, lý do; thành viên nhận `GROUP_BLOCKED`.
- Mọi lối vào nội dung nhóm bị khoá.

**10. Luồng sự kiện chính**

1. Quản trị viên nhập lý do và xác nhận.
2. Hệ thống chặn nhóm.
3. Hệ thống báo cho toàn bộ thành viên.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Nhóm đã bị chặn: trả 400.
- Lý do dưới 10 ký tự: trả 400.
- Không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Lý do bắt buộc và hiện NGUYÊN VĂN cho thành viên — viết cho người dùng cuối đọc.
- Chặn phải khoá đủ mọi lối: `isMember` trả false với mọi người, nên bài, bình luận, tim, tệp, bộ thẻ chia sẻ khoá theo; ngoài ra chặn sửa thông tin nhóm, chặn xin vào, và nhóm biến khỏi tìm kiếm.
- Không có "xoá nhóm" phía quản trị.

**14. Dữ liệu đầu vào:** groupId, reason

**15. Dữ liệu đầu ra:** AdminGroupDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/groups`
- API: `POST /admin/groups/:id/block`
- Bảng dữ liệu: `Group`, `Notification`
- `admin-group.service.ts` — `blockGroup`
- `group.service.ts` — `isMember`, `assertNotBlocked`
- `shared/src/schemas/group.schema.ts` — `blockGroupSchema`

### UC-ADM-21

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-21 |
| 2. Tên Use Case | Mở chặn nhóm (Unblock Group) |
| 3. Mục tiêu | Cho nhóm hoạt động lại. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Gỡ chặn một nhóm và báo cho thành viên. |
| 7. Trigger | Quản trị viên bấm Mở chặn. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.
- Nhóm đang bị chặn.

**9. Hậu điều kiện**

- Trường chặn được xoá; thành viên nhận `GROUP_UNBLOCKED`.

**10. Luồng sự kiện chính**

1. Quản trị viên xác nhận.
2. Hệ thống gỡ chặn.
3. Hệ thống báo cho thành viên.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Nhóm không bị chặn: trả 400.
- Không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Bài, tệp, thành viên còn nguyên vì chặn không xoá gì.

**14. Dữ liệu đầu vào:** groupId

**15. Dữ liệu đầu ra:** AdminGroupDetail

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/groups`
- API: `POST /admin/groups/:id/unblock`
- Bảng dữ liệu: `Group`, `Notification`
- `admin-group.service.ts` — `unblockGroup`

---

## ASHP — Quản trị cửa hàng

### UC-ADM-22

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-22 |
| 2. Tên Use Case | Quản lý loại vật phẩm (Manage Item Types) |
| 3. Mục tiêu | Tổ chức danh mục cửa hàng thành các loại vật phẩm. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem, thêm, sửa, bật/tắt, xoá loại vật phẩm. |
| 7. Trigger | Quản trị viên dùng khối "Loại vật phẩm" ở `/admin/shop`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Dòng `shop_item_types` được tạo, sửa (kể cả bật/tắt) hoặc xoá.

**10. Luồng sự kiện chính**

1. Hệ thống hiện các loại kèm số vật phẩm.
2. Quản trị viên bấm "Thêm loại", nhập mã loại, tên, mô tả, thứ tự, trạng thái.
3. Hệ thống kiểm tra mã chưa tồn tại rồi lưu.

**11. Luồng thay thế**

- 2a. Sửa loại: mọi trường trừ mã loại.
- 2b. Xoá loại: chỉ khi loại không còn vật phẩm nào.

**12. Luồng ngoại lệ**

- Mã loại đã tồn tại: trả 409.
- Xoá loại còn vật phẩm: trả 400 "Loại này còn n vật phẩm… hoặc tắt loại thay vì xoá".
- Mã loại sai định dạng: trả 400.

**13. Quy tắc nghiệp vụ**

- Mã loại (`slug`) chỉ gồm CHỮ HOA, số, gạch dưới, bắt đầu bằng chữ; KHÔNG sửa được sau khi tạo vì giao diện gắn cách hiển thị theo nó.
- Danh mục loại nằm dưới DB: thêm loại không cần deploy; loại lạ vẫn mua và dùng được, chỉ chưa gắn vào đâu trên giao diện.
- Loại đang có vật phẩm chỉ tắt được, không xoá.

**14. Dữ liệu đầu vào:** slug, label, description, sortOrder, isActive

**15. Dữ liệu đầu ra:** Loại vật phẩm

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/shop`
- API: `GET /admin/shop/types`, `POST /admin/shop/types`, `PATCH /admin/shop/types/:id`, `DELETE /admin/shop/types/:id`
- Bảng dữ liệu: `ShopItemType`, `ShopItem`
- `admin-shop.service.ts` — `listTypes`, `createType`, `updateType`, `deleteType`
- `shared/src/schemas/shop.schema.ts` — `createShopTypeSchema`, `updateShopTypeSchema`

### UC-ADM-23

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-23 |
| 2. Tên Use Case | Quản lý vật phẩm (Manage Shop Items) |
| 3. Mục tiêu | Duy trì danh sách vật phẩm bán bằng xu. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Xem, thêm, sửa (giá, ảnh, trạng thái bán), gỡ ảnh, xoá vật phẩm. |
| 7. Trigger | Quản trị viên dùng khối "Vật phẩm" ở `/admin/shop`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Dòng `shop_items` (và ảnh ở `shop_item_images`) được tạo, sửa, gỡ ảnh hoặc xoá.

**10. Luồng sự kiện chính**

1. Hệ thống hiện vật phẩm, lọc được theo loại.
2. Quản trị viên bấm "Thêm vật phẩm", nhập tên, mô tả, giá, thứ tự, trạng thái Đang bán, chọn ảnh.
3. Hệ thống kiểm tra loại tồn tại, ảnh hợp lệ rồi lưu.

**11. Luồng thay thế**

- 2a. Sửa: đổi giá, ảnh, trạng thái bán. Đổi giá không làm sai lịch sử của người đã mua (`price_paid`).
- 2b. Gỡ ảnh: vật phẩm vẫn bán được, giao diện vẽ ô giữ chỗ.
- 2c. Xoá: chỉ khi chưa ai mua.

**12. Luồng ngoại lệ**

- Xoá vật phẩm đã có người mua: trả 400 "Đã có n người mua… Hãy tắt Đang bán để ngừng bán".
- Giá âm hoặc ảnh sai định dạng / quá 300 KB: trả 400.
- Loại hoặc vật phẩm không tồn tại: trả 404.

**13. Quy tắc nghiệp vụ**

- Không xoá thứ người dùng đã trả xu để có (`user_items → shop_items onDelete: Restrict`); ngừng bán bằng `isActive`.
- Ảnh tối đa 300 KB.
- Danh mục 20 linh vật mặc định được nạp lúc khởi động server và không ghi đè vật phẩm quản trị viên đã sửa.

**14. Dữ liệu đầu vào:** typeId, name, description, price, sortOrder, isActive, imageDataUrl

**15. Dữ liệu đầu ra:** Vật phẩm

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/shop`
- API: `GET /admin/shop/items`, `POST /admin/shop/items`, `PATCH /admin/shop/items/:id`, `DELETE /admin/shop/items/:id`, `DELETE /admin/shop/items/:id/image`
- Bảng dữ liệu: `ShopItem`, `ShopItemImage`, `UserItem`
- `admin-shop.service.ts` — `listItems`, `createItem`, `updateItem`, `deleteItem`, `deleteItemImage`
- `shared/src/shop/shop.ts` — `SHOP_IMAGE_MAX_BYTES`
- Giao diện `/admin/shop`: công tắc "Đang bán", Sửa, Xoá

---

## ASYS — Cấu hình hệ thống và thông báo chung

### UC-ADM-24

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-24 |
| 2. Tên Use Case | Bật hoặc tắt tính năng (Toggle Features) |
| 3. Mục tiêu | Tạm dừng một tính năng của người học mà không mất dữ liệu. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Bật/tắt từng tính năng của người học; tắt một tính năng thì tắt luôn các tính năng phụ thuộc. |
| 7. Trigger | Quản trị viên gạt công tắc ở `/admin/features`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- `feature_flags` lưu trạng thái mới (upsert) cho tính năng và các tính năng phụ thuộc.
- Người học: mục biến khỏi sidebar, route ra 404, API trả 404.

**10. Luồng sự kiện chính**

1. Hệ thống hiện 11 tính năng kèm mô tả và mức sử dụng.
2. Quản trị viên tắt một tính năng.
3. Hệ thống tắt tính năng đó và MỌI tính năng phụ thuộc (đệ quy) trong một transaction.
4. Hệ thống xoá cache cờ và trả danh sách tính năng bị tắt kèm.

**11. Luồng thay thế**

- 2a. Bật một tính năng: hệ thống kiểm tra các tính năng nó phụ thuộc đang bật.

**12. Luồng ngoại lệ**

- 2a1. Tính năng phụ thuộc chưa bật: trả 400 "Phải bật … trước khi bật tính năng này".

**13. Quy tắc nghiệp vụ**

- Danh mục tính năng nằm trong mã (`shared/src/constants/features.ts`), bảng chỉ giữ trạng thái; thiếu dòng nghĩa là BẬT.
- `requireFeature` trả 404, không 403.
- Không có cờ cho `auth`, `admin`, `profile`, `notifications`, trang Tổng quan.
- Tắt là đảo ngược được: không dọn `activity_logs`, không xoá mục tiêu/thói quen, không tính lại streak.
- Học và Ôn tập phụ thuộc Thư viện.

**14. Dữ liệu đầu vào:** key, isEnabled

**15. Dữ liệu đầu ra:** flags, alsoDisabled

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403. `GET /features` (đọc cờ) mở cho mọi tài khoản đã đăng nhập (`requireAuth`) để giao diện ẩn/hiện menu.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/features`
- API: `GET /admin/features`, `PATCH /admin/features/:key`, `GET /features`
- Bảng dữ liệu: `FeatureFlag`, `ActivityLog`
- `feature.service.ts` — `listForAdmin`, `setEnabled`, `collectDependents`, `getFlags`
- `feature.guard.ts` — `requireFeature`
- `docs/ke-hoach-quan-ly-tinh-nang.md`
- Giao diện `/admin/features`: 11 công tắc

### UC-ADM-25

| Mục | Nội dung |
|---|---|
| 1. Use Case ID | UC-ADM-25 |
| 2. Tên Use Case | Gửi thông báo tới người dùng (Send Announcement) |
| 3. Mục tiêu | Báo tin chung (bảo trì, nội dung mới…) tới người dùng. |
| 4. Actor chính | Quản trị viên |
| 5. Actor phụ | Không có |
| 6. Mô tả | Soạn và gửi thông báo tới tất cả người dùng hoặc theo vai trò, có xem trước. |
| 7. Trigger | Quản trị viên mở `/admin/announcements`. |
| Trạng thái xác minh | Confirmed |

**8. Tiền điều kiện**

- Đăng nhập với vai trò Quản trị viên.

**9. Hậu điều kiện**

- Mỗi người nhận có một dòng `notifications` loại `ANNOUNCEMENT`.

**10. Luồng sự kiện chính**

1. Quản trị viên nhập tiêu đề, nội dung, chọn đối tượng (Tất cả / Chỉ người học / Chỉ quản trị viên), liên kết kèm (tuỳ chọn).
2. Giao diện hiện bản xem trước và số người sẽ nhận.
3. Quản trị viên bấm "Gửi tới n người".
4. Hệ thống tạo thông báo cho mọi người thuộc đối tượng.
5. Hệ thống trả số người đã nhận.

**11. Luồng thay thế**

Không có.

**12. Luồng ngoại lệ**

- Tiêu đề hoặc nội dung dưới 3 ký tự: trả 400.

**13. Quy tắc nghiệp vụ**

- Tiêu đề 3–150, nội dung 3–500, liên kết tối đa 120 ký tự.
- Không có push; thông báo chỉ hiện trong chuông và trang Thông báo.
- Đối tượng lọc theo vai trò, KHÔNG lọc trạng thái — tài khoản đang bị khoá cũng nhận (đọc từ mã; xem mục cần xác nhận).

**14. Dữ liệu đầu vào:** title, body, audience, role, link

**15. Dữ liệu đầu ra:** recipients

**16. Quyền truy cập:** Chỉ Quản trị viên. API: `adminRoutes.use(requireAuth, requireRole(ADMIN))`; route FE bọc `Admin`. Người học gọi thẳng API nhận 403.

**17. Quan hệ với use case khác:** —

**18. Căn cứ xác minh**

- Giao diện: `/admin/announcements`
- API: `GET /admin/announcements/audience`, `POST /admin/announcements`
- Bảng dữ liệu: `Notification`, `User`
- `notification.service.ts` — `createAnnouncement`, `countAudience`
- `fe/src/features/notifications/components/AnnouncementPage.tsx`
