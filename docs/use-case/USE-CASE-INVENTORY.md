# Danh mục Use Case

Khảo sát ngày 20/09/2026. Tổng **102 use case** trong **15 module**.
Trạng thái xác minh: **99 Confirmed**, **3 Partially Confirmed**,
0 Inferred, 0 Unknown.

| Trạng thái | Nghĩa trong tài liệu này |
|---|---|
| Confirmed | Có đủ bằng chứng ở mã nguồn (route, service, schema) VÀ đường vào từ giao diện hoặc tiến trình nền đang chạy. |
| Partially Confirmed | Có bằng chứng ở mã nguồn nhưng thiếu một phần: không có giao diện gọi tới, hoặc nhánh phụ thuộc dịch vụ ngoài chưa cấu hình. Ghi rõ phần thiếu ở cột Ghi chú. |
| Inferred | Suy luận từ cấu trúc, chưa thấy mã thực thi. Không có use case nào ở mức này. |
| Unknown | Chưa đủ thông tin. Không có use case nào ở mức này. |

**Quy ước gộp:** thao tác thêm/sửa/xoá trên cùng một đối tượng, cùng actor, cùng điều kiện được
gộp thành một use case "Quản lý …" (mẫu CRUD); các nghiệp vụ có quy tắc riêng thì tách (ví dụ
Nhập bộ thẻ từ tệp tách khỏi Quản lý bộ thẻ). Chuyển tab, lọc, sắp xếp, phân trang là một phần
của use case xem danh sách, không tách riêng.

## Số lượng theo module

| Mã | Module | Số use case |
|---|---|---|
| AUTH | Xác thực và tài khoản cá nhân | 8 |
| LIB | Thư viện bộ thẻ | 9 |
| STU | Học và ôn tập | 7 |
| HAB | Thói quen và mục tiêu | 6 |
| STAT | Thống kê và xếp hạng | 3 |
| REW | Phần thưởng | 4 |
| SHOP | Cửa hàng, ví và kho vật phẩm | 6 |
| COM | Cộng đồng | 8 |
| GRP | Nhóm lớp | 18 |
| NOTI | Thông báo và nhắc nhở | 8 |
| AUSR | Quản trị tài khoản và truy cập | 9 |
| ACNT | Quản trị nội dung và kiểm duyệt bộ thẻ | 7 |
| AGRP | Quản trị nhóm lớp | 5 |
| ASHP | Quản trị cửa hàng | 2 |
| ASYS | Cấu hình hệ thống và thông báo chung | 2 |
| | **Tổng** | **102** |

## AUTH — Xác thực và tài khoản cá nhân

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-AUTH-01 | Đăng ký tài khoản | Register Account | Khách | Tạo tài khoản Người học mới bằng họ tên, email, tên tài khoản và mật khẩu. | Confirmed |
| UC-AUTH-02 | Đăng nhập | Log In | Khách | Vào hệ thống bằng email hoặc tên tài khoản cùng mật khẩu; phiên được duy trì bằng refresh token xoay vòng. | Confirmed |
| UC-AUTH-03 | Yêu cầu cấp lại mật khẩu | Request Password Reset | Khách | Gửi yêu cầu cấp lại mật khẩu để quản trị viên duyệt, và tra trạng thái yêu cầu gần nhất. | Confirmed |
| UC-AUTH-04 | Đặt mật khẩu mới sau khi được duyệt | Set New Password | Khách | Tự đặt mật khẩu mới khi yêu cầu cấp lại đã được quản trị viên duyệt và còn hiệu lực. | Confirmed |
| UC-AUTH-05 | Đăng xuất | Log Out | Người dùng đã xác thực | Kết thúc phiên hiện tại và thu hồi refresh token. | Confirmed |
| UC-AUTH-06 | Cập nhật thông tin cá nhân | Update Profile | Người dùng đã xác thực | Sửa họ tên và múi giờ của tài khoản. | Confirmed |
| UC-AUTH-07 | Quản lý ảnh đại diện | Manage Avatar | Người dùng đã xác thực | Tải lên, thay hoặc gỡ ảnh đại diện. | Confirmed |
| UC-AUTH-08 | Đổi mật khẩu | Change Password | Người dùng đã xác thực | Đổi mật khẩu khi biết mật khẩu hiện tại; mọi phiên cũ bị thu hồi. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-AUTH-01 | Khách chưa đăng nhập. | Có một dòng `users` mới với `role = USER`, `status = ACTIVE`.; Kèm sẵn `user_streaks`, `notification_settings` và một mốc nhắc 20:00 cả 7 ngày.; Khách được đăng nhập luôn (nhận access token và refresh token). | — | `/register`, `POST /auth/register` |
| UC-AUTH-02 | Khách chưa đăng nhập.; Đã có tài khoản. | Ghi một dòng `login_events` (thành công).; Cập nhật `users.last_login_at`.; Lưu hash refresh token mới.; Người học vào `/`, Quản trị viên vào `/admin`. | — | `/login`, `POST /auth/login`, `POST /auth/refresh` |
| UC-AUTH-03 | Khách chưa đăng nhập.; Tài khoản cần cấp lại có tồn tại. | Nếu tạo mới: có một dòng `password_reset_requests` trạng thái `PENDING`, mọi Quản trị viên đang hoạt động nhận thông báo `PASSWORD_RESET_REQUEST`.; Nếu đã có yêu cầu: không tạo gì, chỉ trả trạng thái. | được «extend» bởi UC-AUTH-04 | `/forgot-password`, `POST /auth/password-reset/request` |
| UC-AUTH-04 | Yêu cầu gần nhất của tài khoản ở trạng thái `APPROVED`, `used_at` rỗng, chưa quá 7 ngày kể từ lúc duyệt. | Mật khẩu mới được lưu (băm bcrypt).; Yêu cầu được đánh dấu đã dùng (`used_at`).; Mọi refresh token của tài khoản bị thu hồi. | «extend» UC-AUTH-03 | `/forgot-password`, `POST /auth/password-reset/confirm` |
| UC-AUTH-05 | Đang đăng nhập. | Refresh token hiện tại bị thu hồi; cookie bị xoá.; Giao diện về `/login`. | — | `(Sidebar)`, `POST /auth/logout` |
| UC-AUTH-06 | Đang đăng nhập. | `users.name` và/hoặc `users.timezone` được cập nhật. | — | `/profile`, `GET /auth/me`, `PATCH /auth/me` |
| UC-AUTH-07 | Đang đăng nhập. | Ảnh lưu ở `user_avatars` (hoặc bị xoá khi gỡ). | — | `/profile`, `PUT /auth/me/avatar`, `DELETE /auth/me/avatar` |
| UC-AUTH-08 | Đang đăng nhập.; Biết mật khẩu hiện tại. | Mật khẩu mới được lưu.; MỌI refresh token của tài khoản bị thu hồi. | — | `/profile`, `POST /auth/me/change-password` |

## LIB — Thư viện bộ thẻ

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-LIB-01 | Tìm kiếm bộ thẻ công khai | Search Public Study Sets | Người học | Tìm bộ thẻ công khai theo tên hoặc mô tả, có phân trang. | Confirmed |
| UC-LIB-02 | Xem bộ thẻ của tôi | View My Study Sets | Người học | Xem danh sách bộ thẻ do chính mình tạo. | Confirmed |
| UC-LIB-03 | Xem chi tiết bộ thẻ | View Study Set Details | Người học | Xem thông tin bộ thẻ, danh sách thẻ và tiến độ nhớ của bản thân trên bộ đó. | Confirmed |
| UC-LIB-04 | Quản lý bộ thẻ của tôi | Manage My Study Sets | Người học | Tạo, sửa (tên, mô tả, cấp độ, chế độ công khai/riêng tư) và xoá bộ thẻ của chính mình. | Confirmed |
| UC-LIB-05 | Nhập bộ thẻ mới từ tệp | Import New Study Set | Người học | Tạo một bộ thẻ mới kèm toàn bộ thẻ từ tệp CSV hoặc XLSX. | Confirmed |
| UC-LIB-06 | Quản lý thẻ trong bộ | Manage Cards | Người học | Thêm, sửa, xoá thẻ (từ, nghĩa, phiên âm, ví dụ) trong bộ của chính mình. | Confirmed |
| UC-LIB-07 | Nhập thẻ từ tệp vào bộ | Import Cards into Set | Người học | Thêm hàng loạt thẻ từ tệp vào một bộ đã có, bỏ qua thẻ trùng. | Confirmed |
| UC-LIB-08 | Chia sẻ liên kết bộ thẻ | Share Study Set Link | Người học | Sao chép liên kết tới trang chi tiết bộ thẻ để gửi cho người khác. | Confirmed |
| UC-LIB-09 | Báo cáo vi phạm bộ thẻ | Report Study Set | Người học | Báo cáo một bộ thẻ công khai của người khác kèm lý do. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-LIB-01 | Đăng nhập với vai trò Người học.; Cờ `VOCABULARY` đang bật. | Không thay đổi dữ liệu. | — | `/library`, `GET /library/sets` |
| UC-LIB-02 | Đăng nhập với vai trò Người học.; Cờ `VOCABULARY` bật. | Không thay đổi dữ liệu. | — | `/library`, `/learn`, `GET /library/sets/mine` |
| UC-LIB-03 | Đăng nhập với vai trò Người học.; Có quyền đọc bộ thẻ. | Không thay đổi dữ liệu. | được «extend» bởi UC-LIB-08; được «extend» bởi UC-LIB-09 | `/library/:id`, `GET /library/sets/:id` |
| UC-LIB-04 | Đăng nhập với vai trò Người học.; Sửa, xoá: là chủ bộ. | Tạo: có một dòng `topics` với `owner_id` là người học.; Sửa: thông tin bộ được cập nhật.; Xoá: bộ cùng toàn bộ thẻ và tiến độ học trên các thẻ đó bị xoá (cascade). | — | `/library`, `/library/:id`, `POST /library/sets`, `PATCH /library/sets/:id`, `DELETE /library/sets/:id` |
| UC-LIB-05 | Đăng nhập với vai trò Người học.; Có tệp CSV hoặc XLSX. | Một bộ mới cùng các thẻ hợp lệ được tạo trong MỘT transaction. | — | `/library`, `POST /library/sets/import` |
| UC-LIB-06 | Đăng nhập với vai trò Người học.; Là chủ bộ thẻ. | Thẻ được tạo, cập nhật hoặc xoá. Xoá thẻ kéo theo tiến độ và lịch sử ôn của mọi người trên thẻ đó. | — | `/library/:id`, `POST /library/sets/:id/cards`, `PATCH /library/cards/:id`, `DELETE /library/cards/:id` |
| UC-LIB-07 | Là chủ bộ.; Có tệp CSV hoặc XLSX. | Các thẻ mới không trùng được thêm vào bộ. | — | `/library/:id`, `POST /library/sets/:id/cards/import` |
| UC-LIB-08 | Đang xem chi tiết một bộ thẻ. | Liên kết `/library/:id` nằm trong clipboard. Không thay đổi dữ liệu. | «extend» UC-LIB-03 | `/library/:id` |
| UC-LIB-09 | Bộ thẻ công khai, không phải của mình, không phải bộ Hệ thống.; Người học chưa có báo cáo đang chờ cho bộ này. | Có một dòng `study_set_reports` trạng thái `PENDING`.; Mọi Quản trị viên đang hoạt động nhận thông báo `STUDY_SET_REPORTED`. | «extend» UC-LIB-03 | `/library/:id`, `POST /library/sets/:id/reports` |

## STU — Học và ôn tập

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-STU-01 | Học bộ thẻ | Study a Set | Người học | Học một bộ thẻ bằng Flashcard (tự chấm) hoặc Trắc nghiệm 4 phương án, theo lượt câu hỏi. | Confirmed |
| UC-STU-02 | Ôn tập thẻ theo lịch | Review Due Cards | Người học | Ôn thẻ theo nhóm Mới, Tới hạn, Quá hạn, Yếu trên mọi bộ đang học, theo lịch SM-2. | Confirmed |
| UC-STU-03 | Ôn nhanh (Cram) | Cram Practice | Người học | Luyện nhanh một bộ hoặc nhóm thẻ yếu; chỉ báo đúng/sai, không ghi nhận gì. | Confirmed |
| UC-STU-04 | Trả lời và chấm thẻ | Answer and Grade Card | — (qua quan hệ) | Chấm một câu trả lời; với Học và Ôn tập thì ghi lịch sử, cập nhật lịch SM-2 và ghi hoạt động học. | Confirmed |
| UC-STU-05 | Ghi nhận hoàn thành phiên học | Record Session Completion | — (qua quan hệ) | Khi phiên Học kết thúc với ít nhất một câu đã trả lời, ghi một phiên học hoàn thành. | Confirmed |
| UC-STU-06 | Xem thống kê học và ôn | View Study Statistics | Người học | Xem số phiên, số câu, độ chính xác, số thẻ đã thuộc/đang học/yếu và ngày ôn kế tiếp. | Confirmed |
| UC-STU-07 | Xem lịch sử ôn tập | View Review History | Người học | Xem từng lượt trả lời đã ghi, có phân trang. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-STU-01 | Đăng nhập với vai trò Người học.; Cờ `LEARN` bật (và `VOCABULARY`).; Có quyền đọc bộ thẻ. | Mỗi câu đã trả lời được ghi như UC-STU-04.; Nếu có ít nhất một câu: một phiên học hoàn thành được ghi (UC-STU-05). | «include» UC-STU-04; được «extend» bởi UC-STU-05 | `/learn`, `/library/:id`, `POST /study/questions` |
| UC-STU-02 | Đăng nhập với vai trò Người học.; Cờ `FLASHCARDS` bật. | Mỗi câu đã trả lời được ghi như UC-STU-04; lịch ôn của thẻ dời theo SM-2. | «include» UC-STU-04 | `/review`, `GET /study/overview`, `GET /study/due-count`, `POST /study/questions` |
| UC-STU-03 | Đăng nhập với vai trò Người học.; Cờ `FLASHCARDS` bật. | KHÔNG ghi gì: không đổi lịch SM-2, không ghi `card_reviews`, không ghi `activity_logs`. | «include» UC-STU-04 | `/review`, `/library/:id`, `POST /study/questions` |
| UC-STU-04 | Có mã câu hỏi hợp lệ do chính người học nhận được. | Học, Ôn tập: ghi một dòng `card_reviews`; tạo hoặc cập nhật `user_vocab_progress`; ghi một dòng `activity_logs` (`VOCAB_LEARNED` nếu thẻ chưa từng học, `FLASHCARD_REVIEWED` nếu đã có lịch); cập nhật `user_streaks` — tất cả trong một transaction.; Cram: không ghi gì. | được «include» bởi UC-STU-01; được «include» bởi UC-STU-02; được «include» bởi UC-STU-03 | `/learn`, `/review`, `POST /study/answers` |
| UC-STU-05 | Phiên Học có `sessionKey` và ít nhất một câu đã ghi. | Ghi một dòng `activity_logs` loại `QUIZ_COMPLETED`, `value` = số câu đúng, `dedupe_key = SESSION:<sessionKey>`. | «extend» UC-STU-01 | `/learn`, `POST /study/sessions/finish` |
| UC-STU-06 | Đăng nhập với vai trò Người học. | Không thay đổi dữ liệu. | — | `/review`, `GET /study/stats` |
| UC-STU-07 | Đăng nhập với vai trò Người học. | Không thay đổi dữ liệu. | — | `/review`, `GET /study/history` |

## HAB — Thói quen và mục tiêu

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-HAB-01 | Quản lý thói quen | Manage Habits | Người học | Xem, tạo, sửa và xoá thói quen học với tần suất hằng ngày, hằng tuần hoặc tuỳ chọn. **Ghi chú:** Thao tác SỬA có API và hook `useUpdateHabit` nhưng không có nút trên giao diện (UI chỉ có Thêm, Check-in, Xoá). | Partially Confirmed |
| UC-HAB-02 | Check-in thói quen | Check In Habit | Người học | Đánh dấu hoàn thành một thói quen trong ngày; được tính là hoạt động học. | Confirmed |
| UC-HAB-03 | Check-in bù thói quen | Backfill Habit Check-in | Người học | Check-in cho một ngày đã qua trong 7 ngày gần nhất; hoạt động được tính cho đúng ngày được bù. **Ghi chú:** API nhận trường `date` và có đủ quy tắc; giao diện hiện chỉ gửi `{ id }` nên người dùng chưa có cách chọn ngày bù. | Partially Confirmed |
| UC-HAB-04 | Xem lịch sử và tỷ lệ hoàn thành thói quen | View Habit History | Người học | Xem các ngày đã check-in và tỷ lệ hoàn thành của từng thói quen. | Confirmed |
| UC-HAB-05 | Quản lý mục tiêu | Manage Goals | Người học | Tạo mục tiêu học (số từ/ngày, số lượt ôn/ngày, số phiên/tuần, chuỗi ngày), đặt hoặc đổi hạn, xoá. | Confirmed |
| UC-HAB-06 | Xem tiến độ mục tiêu | View Goal Progress | Người học | Xem mức hoàn thành của từng mục tiêu đang hiệu lực trong kỳ hiện tại. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-HAB-01 | Đăng nhập với vai trò Người học.; Cờ `HABITS` bật. | Tạo: có một dòng `habits`.; Sửa: thông tin thói quen được cập nhật.; Xoá: thói quen và toàn bộ `habit_check_ins` của nó bị xoá; các dòng `activity_logs` đã ghi GIỮ NGUYÊN. | — | `/habits`, `GET /habits`, `POST /habits`, `PATCH /habits/:id`, `DELETE /habits/:id` |
| UC-HAB-02 | Đăng nhập với vai trò Người học.; Là chủ thói quen.; Chưa check-in thói quen này trong ngày. | Có một dòng `habit_check_ins`.; Có một dòng `activity_logs` loại `HABIT_CHECKIN` và `user_streaks` được cập nhật — cùng một transaction.; Có thể sinh thông báo `GOAL_ACHIEVED` nếu vừa đạt mục tiêu. | được «extend» bởi UC-HAB-03 | `/habits`, `POST /habits/:id/check-in` |
| UC-HAB-03 | Như UC-HAB-02.; Ngày được chọn nằm trong 7 ngày gần nhất và không ở tương lai. | Như UC-HAB-02, nhưng `activity_logs.local_date` là NGÀY ĐƯỢC BÙ; `occurred_at` vẫn là lúc ghi.; Streak được TÍNH LẠI từ đầu vì ngày bù có thể nối liền một quãng đứt. | «extend» UC-HAB-02 | `POST /habits/:id/check-in` |
| UC-HAB-04 | Là chủ thói quen. | Không thay đổi dữ liệu. | — | `/habits`, `GET /habits/:id/check-ins`, `GET /habits/:id/completion-rate` |
| UC-HAB-05 | Đăng nhập với vai trò Người học.; Cờ `GOALS` bật. | Tạo: một dòng `goals` trạng thái `ACTIVE`.; Đặt/đổi hạn: cập nhật `end_date`.; Xoá: dòng `goals` bị xoá. | — | `/goals`, `GET /goals`, `POST /goals`, `PATCH /goals/:id`, `DELETE /goals/:id` |
| UC-HAB-06 | Đăng nhập với vai trò Người học. | Không thay đổi dữ liệu. | — | `/goals`, `/`, `GET /goals/progress` |

## STAT — Thống kê và xếp hạng

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-STAT-01 | Xem tổng quan học tập | View Learning Dashboard | Người học | Xem lời chào, việc hôm nay, chuỗi ngày, cấp độ và XP, biểu đồ hoạt động và lịch 90 ngày. | Confirmed |
| UC-STAT-02 | Xem báo cáo học tập | View Learning Report | Người học | Xem báo cáo hiệu quả học trong một khoảng ngày chọn được (tối đa 366 ngày). | Confirmed |
| UC-STAT-03 | Xem bảng xếp hạng | View Leaderboard | Người học | Xem thứ hạng theo điểm học tập hoặc số hoạt động, trong tuần, tháng hoặc toàn thời gian. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-STAT-01 | Đăng nhập với vai trò Người học. | Không thay đổi dữ liệu. | — | `/`, `GET /statistics/summary`, `GET /statistics/streak`, `GET /statistics/level`, `GET /statistics/calendar` |
| UC-STAT-02 | Đăng nhập với vai trò Người học.; Cờ `REPORT` bật. | Không thay đổi dữ liệu. | — | `/report`, `GET /statistics/report` |
| UC-STAT-03 | Đăng nhập với vai trò Người học.; Cờ `LEADERBOARD` bật. | Không thay đổi dữ liệu. | — | `/leaderboard`, `GET /leaderboard` |

## REW — Phần thưởng

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-REW-01 | Điểm danh nhận xu | Daily Check-in Reward | Người học | Điểm danh mỗi ngày một lần để nhận 50 xu. | Confirmed |
| UC-REW-02 | Nhận thưởng nhiệm vụ ngày | Claim Daily Mission | Người học | Xem ba nhiệm vụ ngày và nhận 20 xu cho mỗi nhiệm vụ đã hoàn thành. | Confirmed |
| UC-REW-03 | Mua vật phẩm giữ chuỗi | Buy Streak Freeze | Người học | Dùng 200 xu mua một vật phẩm giữ chuỗi; kho giữ tối đa 3 vật phẩm. | Confirmed |
| UC-REW-04 | Tự động dùng vật phẩm giữ chuỗi | Auto-apply Streak Freeze | Bộ lập lịch hệ thống | Khi người học bỏ lỡ đúng một ngày và còn vật phẩm, hệ thống tự tiêu một vật phẩm để nối lại chuỗi. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-REW-01 | Đăng nhập với vai trò Người học.; Cờ `REWARDS` bật.; Chưa điểm danh trong ngày (theo múi giờ người học). | Có một dòng `coin_transactions` +50, lý do `DAILY_CHECKIN`, khoá `DAILY_CHECKIN:<ngày>`. | — | `/`, `GET /rewards`, `POST /rewards/check-in` |
| UC-REW-02 | Đăng nhập với vai trò Người học.; Cờ `REWARDS` bật. | Có một dòng `coin_transactions` +20, lý do `MISSION_CLAIM`, khoá `MISSION:<id>:<ngày>`. | — | `/`, `GET /rewards`, `POST /rewards/missions/claim` |
| UC-REW-03 | Đăng nhập với vai trò Người học.; Cờ `REWARDS` bật. | Có một dòng `coin_transactions` −200 và một dòng `streak_freezes` chưa dùng. | — | `/`, `POST /rewards/streak-freeze/buy` |
| UC-REW-04 | Người học còn ít nhất một vật phẩm chưa dùng. | Một vật phẩm được gán `used_on_date` = ngày bị bỏ lỡ.; `user_streaks` được nối lại: chuỗi giữ nguyên độ dài, `last_active_date` đẩy lên ngày được bù. | — | Tiến trình nền |

## SHOP — Cửa hàng, ví và kho vật phẩm

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-SHOP-01 | Xem và tìm vật phẩm | Browse Shop Items | Người học | Xem vật phẩm đang bán chưa sở hữu, lọc theo loại, tìm theo tên, có phân trang. | Confirmed |
| UC-SHOP-02 | Mua vật phẩm | Buy Item | Người học | Dùng xu mua một vật phẩm; mỗi vật phẩm chỉ mua được một lần. | Confirmed |
| UC-SHOP-03 | Đánh dấu yêu thích vật phẩm | Toggle Favorite Item | Người học | Thêm hoặc bỏ vật phẩm khỏi danh sách yêu thích. | Confirmed |
| UC-SHOP-04 | Xem kho vật phẩm | View Inventory | Người học | Xem vật phẩm yêu thích và vật phẩm đã sở hữu, lọc theo loại. | Confirmed |
| UC-SHOP-05 | Sử dụng hoặc bỏ dùng vật phẩm | Equip or Unequip Item | Người học | Chọn một vật phẩm đã sở hữu để hiển thị (mỗi loại một vật phẩm), hoặc bỏ dùng. | Confirmed |
| UC-SHOP-06 | Xem ví xu | View Coin Wallet | Người học | Xem số dư và lịch sử thu chi xu, lọc Thu/Chi, có phân trang. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-SHOP-01 | Đăng nhập với vai trò Người học.; Cờ `SHOP` bật. | Không thay đổi dữ liệu. | — | `/shop`, `GET /shop/types`, `GET /shop/items`, `GET /shop/items/:id/image` |
| UC-SHOP-02 | Đăng nhập với vai trò Người học.; Cờ `SHOP` bật.; Vật phẩm đang bán, chưa sở hữu. | Có một dòng `coin_transactions` âm, lý do `SHOP_PURCHASE`, khoá `SHOP_ITEM:<itemId>`.; Có một dòng `user_items` với `price_paid` = giá lúc mua. | — | `/shop`, `/inventory`, `POST /shop/items/:id/buy` |
| UC-SHOP-03 | Đăng nhập với vai trò Người học.; Cờ `SHOP` bật. | Thêm hoặc xoá dòng `user_item_favorites`. | — | `/shop`, `/inventory`, `PUT /shop/items/:id/favorite` |
| UC-SHOP-04 | Đăng nhập với vai trò Người học.; Cờ `SHOP` bật. | Không thay đổi dữ liệu. | — | `/inventory`, `GET /shop/inventory`, `GET /shop/items` |
| UC-SHOP-05 | Đăng nhập với vai trò Người học.; Cờ `SHOP` bật.; Dùng: đã sở hữu vật phẩm. | `user_equipped_items` có (hoặc mất) dòng cho loại đó. | — | `/inventory`, `PUT /shop/equipped/:typeId`, `DELETE /shop/equipped/:typeId` |
| UC-SHOP-06 | Đăng nhập với vai trò Người học.; Cờ `SHOP` bật. | Không thay đổi dữ liệu. | — | `/wallet`, `GET /shop/wallet` |

## COM — Cộng đồng

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-COM-01 | Xem và tìm bài viết | Browse Posts | Người dùng đã xác thực | Xem bảng tin chung; tìm trong tiêu đề và nội dung; sắp xếp mới nhất hoặc nhiều tim nhất; lọc bài của tôi, bài đã thích, có tệp, chưa có trả lời; phân trang. | Confirmed |
| UC-COM-02 | Xem chi tiết bài viết | View Post | Người dùng đã xác thực | Xem nội dung đầy đủ, tệp đính kèm và bình luận của một bài. | Confirmed |
| UC-COM-03 | Đăng bài viết | Create Post | Người dùng đã xác thực | Đăng bài có tiêu đề, nội dung và tối đa 3 tệp đính kèm. | Confirmed |
| UC-COM-04 | Bình luận bài viết | Comment on Post | Người dùng đã xác thực | Viết bình luận dưới một bài. | Confirmed |
| UC-COM-05 | Thả tim bài viết | Like Post | Người dùng đã xác thực | Thả hoặc bỏ tim cho một bài. | Confirmed |
| UC-COM-06 | Xoá bài viết | Delete Post | Người dùng đã xác thực | Tác giả xoá bài của mình; quản trị viên xoá được mọi bài. | Confirmed |
| UC-COM-07 | Xoá bình luận | Delete Comment | Người dùng đã xác thực | Tác giả xoá bình luận của mình; quản trị viên xoá được mọi bình luận. | Confirmed |
| UC-COM-08 | Tải tệp đính kèm | Download Attachment | Người dùng đã xác thực | Tải về hoặc xem tệp đính kèm của một bài; tệp của bài nhóm chỉ thành viên tải được. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-COM-01 | Đã đăng nhập. | Không thay đổi dữ liệu. | — | `/community`, `GET /community/posts` |
| UC-COM-02 | Đã đăng nhập.; Bài thuộc nhóm: là thành viên nhóm và nhóm chưa bị chặn. | Không thay đổi dữ liệu. | được «extend» bởi UC-COM-08 | `/community`, `/groups/:id`, `GET /community/posts/:id` |
| UC-COM-03 | Đã đăng nhập. | Có một dòng `posts` và tối đa 3 dòng `post_attachments`. | tổng quát hoá của UC-GRP-08 | `/community`, `POST /community/posts` |
| UC-COM-04 | Đã đăng nhập.; Bài nhóm: là thành viên nhóm. | Có một dòng `post_comments`. Nếu bài thuộc nhóm và bình luận có `@tên`/`@all`: người được nhắc nhận thông báo `MENTIONED`. | — | `/community`, `/groups/:id`, `POST /community/posts/:id/comments` |
| UC-COM-05 | Đã đăng nhập.; Bài nhóm: là thành viên nhóm. | Thêm hoặc xoá dòng `post_likes` của người dùng. | — | `/community`, `/groups/:id`, `POST /community/posts/:id/like` |
| UC-COM-06 | Là tác giả bài, HOẶC là Quản trị viên. | Bài cùng bình luận, tim và tệp đính kèm bị xoá (cascade). | — | `/community`, `/groups/:id`, `DELETE /community/posts/:id` |
| UC-COM-07 | Là tác giả bình luận, HOẶC là Quản trị viên. | Dòng `post_comments` bị xoá. | — | `/community`, `/groups/:id`, `DELETE /community/comments/:id` |
| UC-COM-08 | Đã đăng nhập.; Tệp thuộc bài nhóm: là thành viên nhóm và nhóm chưa bị chặn. | Không thay đổi dữ liệu. | «extend» UC-COM-02; «extend» UC-GRP-09 | `/community`, `/groups/:id`, `GET /community/attachments/:id` |

## GRP — Nhóm lớp

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-GRP-01 | Xem nhóm của tôi | View My Groups | Người học | Xem các nhóm mình là thành viên hoặc trưởng nhóm, lọc theo vai trò. | Confirmed |
| UC-GRP-02 | Tìm nhóm công khai | Search Public Groups | Người học | Tìm nhóm công khai theo tên, có phân trang. | Confirmed |
| UC-GRP-03 | Tìm nhóm bằng mã | Find Group by Code | Người học | Nhập mã 8 chữ số để tìm một nhóm (kể cả nhóm riêng tư). | Confirmed |
| UC-GRP-04 | Tạo nhóm | Create Group | Người học | Lập nhóm mới; người tạo trở thành trưởng nhóm đầu tiên. | Confirmed |
| UC-GRP-05 | Tham gia nhóm | Join Group | Người học | Vào nhóm ngay, hoặc gửi yêu cầu chờ duyệt nếu nhóm bật phê duyệt. | Confirmed |
| UC-GRP-06 | Rời nhóm | Leave Group | Người học | Tự rời khỏi một nhóm. | Confirmed |
| UC-GRP-07 | Xem bảng tin nhóm | View Group Feed | Người học | Xem thông tin nhóm, danh sách thành viên và các bài đăng nội bộ. | Confirmed |
| UC-GRP-08 | Đăng bài trong nhóm | Post in Group | Người học | Đăng bài nội bộ; gõ `@tên` hoặc `@all` để nhắc thành viên. | Confirmed |
| UC-GRP-09 | Xem tài liệu nhóm | View Group Documents | Người học | Xem mọi tệp đã đính kèm trong bài của nhóm, tìm theo tên tệp, có phân trang. | Confirmed |
| UC-GRP-10 | Xem bộ thẻ của nhóm | View Group Study Sets | Người học | Xem các bộ thẻ trưởng nhóm đã chia sẻ và mở ra để học. | Confirmed |
| UC-GRP-11 | Cập nhật cài đặt nhóm | Update Group Settings | Trưởng nhóm | Sửa tên, mô tả, chế độ công khai/riêng tư và bật/tắt phê duyệt thành viên. | Confirmed |
| UC-GRP-12 | Xoá nhóm | Delete Group | Trưởng nhóm | Xoá nhóm cùng thành viên, yêu cầu và bài đăng nội bộ. | Confirmed |
| UC-GRP-13 | Duyệt yêu cầu tham gia nhóm | Review Join Requests | Trưởng nhóm | Duyệt hoặc từ chối người xin vào nhóm. | Confirmed |
| UC-GRP-14 | Thêm thành viên | Add Member | Trưởng nhóm | Thêm thẳng một người vào nhóm bằng tên tài khoản hoặc email. | Confirmed |
| UC-GRP-15 | Xoá thành viên | Remove Member | Trưởng nhóm | Đưa một thành viên ra khỏi nhóm. | Confirmed |
| UC-GRP-16 | Phân quyền trưởng nhóm | Change Member Role | Trưởng nhóm | Phong thành viên làm trưởng nhóm hoặc hạ trưởng nhóm về thành viên. | Confirmed |
| UC-GRP-17 | Chia sẻ bộ thẻ vào nhóm | Share Study Set to Group | Trưởng nhóm | Chia sẻ một bộ thẻ của chính mình vào nhóm (không nhân bản bộ thẻ). | Confirmed |
| UC-GRP-18 | Gỡ bộ thẻ khỏi nhóm | Unshare Study Set | Trưởng nhóm | Gỡ liên kết chia sẻ; tiến độ học của thành viên được giữ nguyên. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-GRP-01 | Đăng nhập với vai trò Người học.; Cờ `GROUPS` bật. | Không thay đổi dữ liệu. | — | `/groups`, `GET /groups/mine` |
| UC-GRP-02 | Đăng nhập với vai trò Người học.; Cờ `GROUPS` bật. | Không thay đổi dữ liệu. | được «extend» bởi UC-GRP-05 | `/groups`, `GET /groups/search` |
| UC-GRP-03 | Đăng nhập với vai trò Người học.; Có mã 8 chữ số. | Không thay đổi dữ liệu. | được «extend» bởi UC-GRP-05 | `/groups`, `GET /groups/code/:code` |
| UC-GRP-04 | Đăng nhập với vai trò Người học.; Cờ `GROUPS` bật. | Có một dòng `groups` với mã 8 chữ số duy nhất.; Người tạo là thành viên với vai trò `LEADER`. | — | `/groups`, `POST /groups` |
| UC-GRP-05 | Chưa là thành viên nhóm.; Nhóm chưa bị chặn. | Nhóm không cần duyệt: có dòng `group_members` vai trò `MEMBER`.; Nhóm cần duyệt: có dòng `group_join_requests` trạng thái `PENDING`; các trưởng nhóm nhận thông báo `GROUP_JOIN_REQUEST`. | «extend» UC-GRP-02; «extend» UC-GRP-03 | `/groups`, `POST /groups/:id/join` |
| UC-GRP-06 | Là thành viên nhóm. | Dòng `group_members` bị xoá. | — | `/groups/:id`, `POST /groups/:id/leave` |
| UC-GRP-07 | Là thành viên nhóm. | Không thay đổi dữ liệu. | — | `/groups/:id`, `GET /groups/:id`, `GET /community/posts` |
| UC-GRP-08 | Là thành viên nhóm; nhóm chưa bị chặn. | Như UC-COM-03, bài mang `group_id`.; Người được nhắc bằng `@tên` hoặc `@all` nhận thông báo `MENTIONED`. | chuyên biệt hoá của UC-COM-03 | `/groups/:id`, `POST /community/posts`, `GET /groups/:id/mentions` |
| UC-GRP-09 | Là thành viên nhóm. | Không thay đổi dữ liệu. | được «extend» bởi UC-COM-08 | `/groups/:id`, `GET /groups/:id/documents` |
| UC-GRP-10 | Là thành viên nhóm; nhóm chưa bị chặn. | Không thay đổi dữ liệu. | — | `/groups/:id`, `GET /groups/:id/study-sets` |
| UC-GRP-11 | Là trưởng nhóm.; Nhóm chưa bị chặn. | Tên, mô tả, chế độ và/hoặc phê duyệt được cập nhật. | — | `/groups/:id`, `PATCH /groups/:id` |
| UC-GRP-12 | Là trưởng nhóm. | Nhóm cùng thành viên, yêu cầu và bài đăng nội bộ bị xoá (cascade). | — | `/groups/:id`, `DELETE /groups/:id` |
| UC-GRP-13 | Là trưởng nhóm.; Có yêu cầu đang `PENDING`. | Yêu cầu chuyển `APPROVED` hoặc `REJECTED`, ghi người và lúc quyết định.; Duyệt: người xin trở thành thành viên.; Người xin nhận thông báo `GROUP_JOIN_APPROVED` hoặc `GROUP_JOIN_REJECTED`. | — | `/groups/:id`, `GET /groups/:id`, `POST /groups/:id/requests/:userId/approve`, `POST /groups/:id/requests/:userId/reject` |
| UC-GRP-14 | Là trưởng nhóm. | Có dòng `group_members` vai trò `MEMBER`; người được thêm nhận thông báo `GROUP_JOIN_APPROVED`. | — | `/groups/:id`, `POST /groups/:id/members` |
| UC-GRP-15 | Là trưởng nhóm.; Người bị xoá đang là thành viên. | Dòng `group_members` của người đó bị xoá. | — | `/groups/:id`, `DELETE /groups/:id/members/:userId` |
| UC-GRP-16 | Là trưởng nhóm.; Người được đổi vai trò là thành viên nhóm. | `group_members.role` của người đó đổi giữa `MEMBER` và `LEADER`. | — | `/groups/:id`, `PATCH /groups/:id/members/:userId/role` |
| UC-GRP-17 | Là trưởng nhóm.; Bộ thẻ là của chính trưởng nhóm (kể cả riêng tư) và không bị chặn. | Có một dòng `group_study_sets`; thành viên nhóm có quyền đọc bộ thẻ.; Thành viên nhận thông báo `GROUP_STUDY_SET_SHARED`. | — | `/groups/:id`, `POST /groups/:id/study-sets` |
| UC-GRP-18 | Là trưởng nhóm.; Bộ đang được chia sẻ trong nhóm. | Dòng `group_study_sets` bị xoá; `user_vocab_progress` của thành viên GIỮ NGUYÊN. | — | `/groups/:id`, `DELETE /groups/:id/study-sets/:setId` |

## NOTI — Thông báo và nhắc nhở

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-NOTI-01 | Xem thông báo | View Notifications | Người dùng đã xác thực | Xem số thông báo chưa đọc trên chuông và danh sách thông báo, lọc Tất cả/Chưa đọc/Đã đọc, phân trang. | Confirmed |
| UC-NOTI-02 | Đánh dấu thông báo đã đọc | Mark Notification Read | Người dùng đã xác thực | Đánh dấu một thông báo hoặc tất cả là đã đọc. | Confirmed |
| UC-NOTI-03 | Xoá thông báo | Delete Notification | Người dùng đã xác thực | Xoá một thông báo của mình. | Confirmed |
| UC-NOTI-04 | Cấu hình nhắc nhở | Configure Reminders | Người học | Bật/tắt toàn bộ nhắc nhở, nhắc thẻ tới hạn và cảnh báo chuỗi sắp đứt. | Confirmed |
| UC-NOTI-05 | Quản lý mốc nhắc học | Manage Reminder Times | Người học | Thêm, sửa, bật/tắt, xoá tối đa 10 mốc nhắc theo giờ và thứ trong tuần. | Confirmed |
| UC-NOTI-06 | Đăng ký thiết bị nhận thông báo đẩy | Register Push Device | Người dùng đã xác thực | Lưu hoặc gỡ mã thiết bị OneSignal để nhận thông báo đẩy. **Ghi chú:** Có API và bảng `user_devices`, nhưng web chưa tích hợp SDK OneSignal và không có lời gọi nào tới hai endpoint này. Ứng dụng `mobile` chưa scaffold. | Partially Confirmed |
| UC-NOTI-07 | Gửi lời nhắc học | Send Study Reminder | Bộ lập lịch hệ thống, OneSignal | Tới mốc giờ người học đặt mà hôm đó họ chưa học, hệ thống tạo lời nhắc và đẩy qua OneSignal nếu có thiết bị. **Ghi chú:** Nhánh gửi đẩy chưa kiểm chứng khi chạy: OneSignal chưa cấu hình ở môi trường dev và chưa có thiết bị nào đăng ký được (xem UC-NOTI-06). | Confirmed |
| UC-NOTI-08 | Cảnh báo chuỗi sắp đứt | Warn Streak at Risk | Bộ lập lịch hệ thống, OneSignal | Lúc 21:30 giờ địa phương, cảnh báo người đang có chuỗi mà hôm đó chưa học. **Ghi chú:** Như UC-NOTI-07: nhánh gửi đẩy chưa kiểm chứng khi chạy. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-NOTI-01 | Đã đăng nhập. | Không thay đổi dữ liệu. | — | `/notifications`, `(NotificationBell)`, `GET /notifications`, `GET /notifications/unread-count` |
| UC-NOTI-02 | Đã đăng nhập. | `notifications.read_at` được đặt cho một hoặc mọi thông báo chưa đọc của người dùng. | — | `/notifications`, `(NotificationBell)`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` |
| UC-NOTI-03 | Đã đăng nhập. | Dòng `notifications` bị xoá. | — | `/notifications`, `DELETE /notifications/:id` |
| UC-NOTI-04 | Đăng nhập với vai trò Người học. | `notification_settings` được cập nhật. | — | `/profile`, `GET /notifications/settings`, `PUT /notifications/settings` |
| UC-NOTI-05 | Đăng nhập với vai trò Người học. | Dòng `reminders` được tạo, cập nhật hoặc xoá. | — | `/profile`, `GET /notifications/reminders`, `POST /notifications/reminders`, `PATCH /notifications/reminders/:id`, `DELETE /notifications/reminders/:id` |
| UC-NOTI-06 | Đã đăng nhập.; Thiết bị có mã người nhận OneSignal (`playerId`). | Có (hoặc mất) dòng `user_devices`. | — | `POST /notifications/devices`, `DELETE /notifications/devices/:playerId` |
| UC-NOTI-07 | Người học có mốc nhắc đang bật; công tắc tổng bật; vai trò `USER`. | Có một dòng `notifications` loại `DAILY_REMINDER`, khoá `DAILY_REMINDER:<reminderId>:<ngày>`.; Nếu có thiết bị và đã cấu hình OneSignal: một thông báo đẩy được gửi.; `notification_settings.last_sent_date` được cập nhật. | — | Tiến trình nền |
| UC-NOTI-08 | Người học bật công tắc tổng và cảnh báo chuỗi; vai trò `USER`. | Có một dòng `notifications` loại `STREAK_AT_RISK`, khoá `STREAK_AT_RISK:<ngày>`; đẩy qua OneSignal nếu có thiết bị. | — | Tiến trình nền |

## AUSR — Quản trị tài khoản và truy cập

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-ADM-01 | Xem tổng quan hệ thống | View System Overview | Quản trị viên | Xem quy mô người dùng, người hoạt động 1/7/30 ngày, xu hướng và cơ cấu hoạt động, người học tích cực, tình trạng DB và API. | Confirmed |
| UC-ADM-02 | Tìm kiếm và lọc tài khoản | Search Accounts | Quản trị viên | Tìm theo tên, tên tài khoản hoặc email; lọc vai trò, trạng thái; sắp xếp mới nhất, cũ nhất, đăng nhập gần đây, học nhiều nhất; phân trang. | Confirmed |
| UC-ADM-03 | Xem chi tiết tài khoản | View Account Details | Quản trị viên | Xem thông tin cá nhân, thống kê hoạt động 10 ngày và các sự kiện gần đây của một tài khoản. | Confirmed |
| UC-ADM-04 | Thay đổi vai trò tài khoản | Change Account Role | Quản trị viên | Đổi vai trò giữa Người học và Quản trị viên. | Confirmed |
| UC-ADM-05 | Khoá hoặc mở khoá tài khoản | Lock or Unlock Account | Quản trị viên | Khoá tài khoản (thu hồi mọi phiên) hoặc mở khoá lại. | Confirmed |
| UC-ADM-06 | Xoá tài khoản | Delete Account | Quản trị viên | Xoá vĩnh viễn một tài khoản. | Confirmed |
| UC-ADM-07 | Xử lý yêu cầu cấp lại mật khẩu | Process Password Reset Request | Quản trị viên | Xem yêu cầu đang chờ, xác nhận hoặc từ chối kèm lý do. | Confirmed |
| UC-ADM-08 | Xem nhật ký xử lý yêu cầu | View Request Log | Quản trị viên | Xem các yêu cầu đã xử lý: ai xử lý, lúc nào, kết quả và lý do. | Confirmed |
| UC-ADM-09 | Xem lượt truy cập | View Access Log | Quản trị viên | Xem lượt đăng nhập theo ngày, phiên đang mở và nhật ký đăng nhập; lọc 7/30/90 ngày và kết quả; phân trang. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-ADM-01 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin`, `GET /admin/overview` |
| UC-ADM-02 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/users`, `GET /admin/users` |
| UC-ADM-03 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/users`, `GET /admin/users/:id` |
| UC-ADM-04 | Đăng nhập với vai trò Quản trị viên. | `users.role` được cập nhật. | — | `/admin/users`, `PATCH /admin/users/:id/role` |
| UC-ADM-05 | Đăng nhập với vai trò Quản trị viên. | `users.status` = `LOCKED` hoặc `ACTIVE`.; Khi khoá: MỌI refresh token của tài khoản bị thu hồi. | — | `/admin/users`, `PATCH /admin/users/:id/status` |
| UC-ADM-06 | Đăng nhập với vai trò Quản trị viên. | Dòng `users` bị xoá; dữ liệu phụ thuộc xử lý theo `onDelete` của schema (ví dụ bộ thẻ người đó sở hữu bị xoá theo — `Topic.owner onDelete: Cascade`). | — | `/admin/users`, `DELETE /admin/users/:id` |
| UC-ADM-07 | Đăng nhập với vai trò Quản trị viên.; Có yêu cầu `PENDING`. | Xác nhận: yêu cầu `APPROVED`, ghi người và lúc xử lý; người dùng có 7 ngày để đặt mật khẩu (UC-AUTH-04).; Từ chối: yêu cầu `REJECTED` kèm lý do mà người dùng sẽ đọc nguyên văn. | — | `/admin/requests`, `GET /admin/password-reset-requests`, `POST /admin/password-reset-requests/:id/approve`, `POST /admin/password-reset-requests/:id/reject` |
| UC-ADM-08 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/requests`, `GET /admin/password-reset-requests` |
| UC-ADM-09 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/access`, `GET /admin/access/overview`, `GET /admin/access/logs` |

## ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-ADM-10 | Quản lý chủ đề hệ thống | Manage System Topics | Quản trị viên | Xem, thêm, sửa, xoá chủ đề (bộ thẻ "Hệ thống"). | Confirmed |
| UC-ADM-11 | Quản lý từ vựng hệ thống | Manage System Vocabulary | Quản trị viên | Xem, thêm, sửa, xoá từ vựng trong một chủ đề hệ thống. | Confirmed |
| UC-ADM-12 | Xem báo cáo vi phạm bộ thẻ | View Study Set Reports | Quản trị viên | Xem danh sách báo cáo, lọc Chờ xử lý / Đã chặn / Đã bỏ qua, phân trang. | Confirmed |
| UC-ADM-13 | Xem chi tiết bộ thẻ bị báo cáo | Inspect Reported Study Set | Quản trị viên | Xem thông tin bộ thẻ, chủ sở hữu, trạng thái chặn và toàn bộ thẻ trong bộ. | Confirmed |
| UC-ADM-14 | Chặn bộ thẻ | Block Study Set | Quản trị viên | Chặn một bộ thẻ công khai của người học kèm lý do; đóng mọi báo cáo đang chờ của bộ đó. | Confirmed |
| UC-ADM-15 | Mở chặn bộ thẻ | Unblock Study Set | Quản trị viên | Gỡ chặn một bộ thẻ và báo cho chủ bộ. | Confirmed |
| UC-ADM-16 | Bỏ qua báo cáo vi phạm | Dismiss Report | Quản trị viên | Đóng một báo cáo mà không chặn bộ thẻ, báo kết quả cho người báo cáo. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-ADM-10 | Đăng nhập với vai trò Quản trị viên. | Chủ đề (`topics` có `owner_id` rỗng) được tạo, sửa hoặc xoá. Xoá chủ đề kéo theo từ vựng và tiến độ học trên từ vựng đó. | — | `/admin/content`, `GET /topics`, `GET /topics/:id`, `POST /admin/topics`, `PATCH /admin/topics/:id`, `DELETE /admin/topics/:id` |
| UC-ADM-11 | Đăng nhập với vai trò Quản trị viên.; Chủ đề là bộ Hệ thống. | Từ vựng được tạo, sửa hoặc xoá. | — | `/admin/content`, `GET /topics/:id/vocabulary`, `POST /admin/vocabulary`, `PATCH /admin/vocabulary/:id`, `DELETE /admin/vocabulary/:id` |
| UC-ADM-12 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/study-sets`, `GET /admin/study-set-reports` |
| UC-ADM-13 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/study-sets`, `GET /admin/study-sets/:id` |
| UC-ADM-14 | Đăng nhập với vai trò Quản trị viên.; Bộ thẻ do người học tạo và chưa bị chặn. | Bộ thẻ có `blocked_at`, `blocked_by`, lý do.; MỌI báo cáo đang chờ của bộ chuyển `RESOLVED`.; Chủ bộ nhận `STUDY_SET_BLOCKED`; từng người báo cáo nhận `STUDY_SET_REPORT_RESOLVED`. | — | `/admin/study-sets`, `POST /admin/study-sets/:id/block` |
| UC-ADM-15 | Đăng nhập với vai trò Quản trị viên.; Bộ thẻ đang bị chặn. | Trường chặn được xoá; chủ bộ nhận `STUDY_SET_UNBLOCKED`. | — | `/admin/study-sets`, `POST /admin/study-sets/:id/unblock` |
| UC-ADM-16 | Đăng nhập với vai trò Quản trị viên.; Báo cáo ở trạng thái `PENDING`. | Báo cáo chuyển `DISMISSED`, ghi người và lúc xử lý; khoá chờ `pendingKey` được giải phóng.; Người báo cáo nhận `STUDY_SET_REPORT_RESOLVED`. | — | `/admin/study-sets`, `POST /admin/study-set-reports/:id/dismiss` |

## AGRP — Quản trị nhóm lớp

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-ADM-17 | Tìm kiếm và lọc nhóm | Search Groups (Admin) | Quản trị viên | Tìm nhóm theo tên hoặc mã; lọc trạng thái, chế độ; sắp xếp mới lập, nhiều thành viên, nhiều bài; phân trang. | Confirmed |
| UC-ADM-18 | Xem chi tiết nhóm | Inspect Group | Quản trị viên | Xem thông tin, trưởng nhóm, thành viên, số yêu cầu chờ và tiêu đề 10 bài gần nhất của một nhóm. | Confirmed |
| UC-ADM-19 | Gửi cảnh báo vi phạm tới nhóm | Warn Group | Quản trị viên | Gửi một thông báo cảnh báo tới toàn bộ thành viên nhóm. | Confirmed |
| UC-ADM-20 | Chặn nhóm | Block Group | Quản trị viên | Chặn nhóm kèm lý do; mọi lối vào nội dung nhóm bị khoá. | Confirmed |
| UC-ADM-21 | Mở chặn nhóm | Unblock Group | Quản trị viên | Gỡ chặn một nhóm và báo cho thành viên. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-ADM-17 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/groups`, `GET /admin/groups` |
| UC-ADM-18 | Đăng nhập với vai trò Quản trị viên. | Không thay đổi dữ liệu. | — | `/admin/groups`, `GET /admin/groups/:id` |
| UC-ADM-19 | Đăng nhập với vai trò Quản trị viên.; Nhóm tồn tại. | Mỗi thành viên nhận một thông báo `GROUP_WARNING`. | — | `/admin/groups`, `POST /admin/groups/:id/warn` |
| UC-ADM-20 | Đăng nhập với vai trò Quản trị viên.; Nhóm chưa bị chặn. | Nhóm có `blocked_at`, `blocked_by`, lý do; thành viên nhận `GROUP_BLOCKED`.; Mọi lối vào nội dung nhóm bị khoá. | — | `/admin/groups`, `POST /admin/groups/:id/block` |
| UC-ADM-21 | Đăng nhập với vai trò Quản trị viên.; Nhóm đang bị chặn. | Trường chặn được xoá; thành viên nhận `GROUP_UNBLOCKED`. | — | `/admin/groups`, `POST /admin/groups/:id/unblock` |

## ASHP — Quản trị cửa hàng

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-ADM-22 | Quản lý loại vật phẩm | Manage Item Types | Quản trị viên | Xem, thêm, sửa, bật/tắt, xoá loại vật phẩm. | Confirmed |
| UC-ADM-23 | Quản lý vật phẩm | Manage Shop Items | Quản trị viên | Xem, thêm, sửa (giá, ảnh, trạng thái bán), gỡ ảnh, xoá vật phẩm. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-ADM-22 | Đăng nhập với vai trò Quản trị viên. | Dòng `shop_item_types` được tạo, sửa (kể cả bật/tắt) hoặc xoá. | — | `/admin/shop`, `GET /admin/shop/types`, `POST /admin/shop/types`, `PATCH /admin/shop/types/:id`, `DELETE /admin/shop/types/:id` |
| UC-ADM-23 | Đăng nhập với vai trò Quản trị viên. | Dòng `shop_items` (và ảnh ở `shop_item_images`) được tạo, sửa, gỡ ảnh hoặc xoá. | — | `/admin/shop`, `GET /admin/shop/items`, `POST /admin/shop/items`, `PATCH /admin/shop/items/:id`, `DELETE /admin/shop/items/:id`, `DELETE /admin/shop/items/:id/image` |

## ASYS — Cấu hình hệ thống và thông báo chung

| ID | Tên use case | Tên tiếng Anh | Actor | Mô tả | Trạng thái |
|---|---|---|---|---|---|
| UC-ADM-24 | Bật hoặc tắt tính năng | Toggle Features | Quản trị viên | Bật/tắt từng tính năng của người học; tắt một tính năng thì tắt luôn các tính năng phụ thuộc. | Confirmed |
| UC-ADM-25 | Gửi thông báo tới người dùng | Send Announcement | Quản trị viên | Soạn và gửi thông báo tới tất cả người dùng hoặc theo vai trò, có xem trước. | Confirmed |

| ID | Tiền điều kiện | Hậu điều kiện | Use case liên quan | Căn cứ (UI / API) |
|---|---|---|---|---|
| UC-ADM-24 | Đăng nhập với vai trò Quản trị viên. | `feature_flags` lưu trạng thái mới (upsert) cho tính năng và các tính năng phụ thuộc.; Người học: mục biến khỏi sidebar, route ra 404, API trả 404. | — | `/admin/features`, `GET /admin/features`, `PATCH /admin/features/:key`, `GET /features` |
| UC-ADM-25 | Đăng nhập với vai trò Quản trị viên. | Mỗi người nhận có một dòng `notifications` loại `ANNOUNCEMENT`. | — | `/admin/announcements`, `GET /admin/announcements/audience`, `POST /admin/announcements` |
