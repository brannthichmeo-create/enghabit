# Quan hệ giữa Actor và Use Case

Khảo sát ngày 20/09/2026.

| Loại quan hệ | Số lượng |
|---|---|
| Association actor chính → use case | 100 |
| Association use case → actor phụ | 2 |
| **Tổng association** | **102** |
| «include» | 3 |
| «extend» | 9 |
| Generalization giữa actor | 3 |
| Generalization giữa use case | 1 |

Association chỉ đếm quan hệ vẽ TRỰC TIẾP. Người học và Quản trị viên còn dùng các use case của
actor cha "Người dùng đã xác thực" qua generalization; những use case đó không được đếm lại.

## 1. Association

### AUTH — Xác thực và tài khoản cá nhân

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Khách | UC-AUTH-01 | Đăng ký tài khoản | Actor chính |
| Khách | UC-AUTH-02 | Đăng nhập | Actor chính |
| Khách | UC-AUTH-03 | Yêu cầu cấp lại mật khẩu | Actor chính |
| Khách | UC-AUTH-04 | Đặt mật khẩu mới sau khi được duyệt | Actor chính |
| Người dùng đã xác thực | UC-AUTH-05 | Đăng xuất | Actor chính |
| Người dùng đã xác thực | UC-AUTH-06 | Cập nhật thông tin cá nhân | Actor chính |
| Người dùng đã xác thực | UC-AUTH-07 | Quản lý ảnh đại diện | Actor chính |
| Người dùng đã xác thực | UC-AUTH-08 | Đổi mật khẩu | Actor chính |

### LIB — Thư viện bộ thẻ

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-LIB-01 | Tìm kiếm bộ thẻ công khai | Actor chính |
| Người học | UC-LIB-02 | Xem bộ thẻ của tôi | Actor chính |
| Người học | UC-LIB-03 | Xem chi tiết bộ thẻ | Actor chính |
| Người học | UC-LIB-04 | Quản lý bộ thẻ của tôi | Actor chính |
| Người học | UC-LIB-05 | Nhập bộ thẻ mới từ tệp | Actor chính |
| Người học | UC-LIB-06 | Quản lý thẻ trong bộ | Actor chính |
| Người học | UC-LIB-07 | Nhập thẻ từ tệp vào bộ | Actor chính |
| Người học | UC-LIB-08 | Chia sẻ liên kết bộ thẻ | Actor chính |
| Người học | UC-LIB-09 | Báo cáo vi phạm bộ thẻ | Actor chính |

### STU — Học và ôn tập

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-STU-01 | Học bộ thẻ | Actor chính |
| Người học | UC-STU-02 | Ôn tập thẻ theo lịch | Actor chính |
| Người học | UC-STU-03 | Ôn nhanh (Cram) | Actor chính |
| — | UC-STU-04 | Trả lời và chấm thẻ | Không có association; chỉ chạy qua quan hệ được «include» bởi UC-STU-01, được «include» bởi UC-STU-02, được «include» bởi UC-STU-03 |
| — | UC-STU-05 | Ghi nhận hoàn thành phiên học | Không có association; chỉ chạy qua quan hệ «extend» UC-STU-01 |
| Người học | UC-STU-06 | Xem thống kê học và ôn | Actor chính |
| Người học | UC-STU-07 | Xem lịch sử ôn tập | Actor chính |

### HAB — Thói quen và mục tiêu

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-HAB-01 | Quản lý thói quen | Actor chính |
| Người học | UC-HAB-02 | Check-in thói quen | Actor chính |
| Người học | UC-HAB-03 | Check-in bù thói quen | Actor chính |
| Người học | UC-HAB-04 | Xem lịch sử và tỷ lệ hoàn thành thói quen | Actor chính |
| Người học | UC-HAB-05 | Quản lý mục tiêu | Actor chính |
| Người học | UC-HAB-06 | Xem tiến độ mục tiêu | Actor chính |

### STAT — Thống kê và xếp hạng

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-STAT-01 | Xem tổng quan học tập | Actor chính |
| Người học | UC-STAT-02 | Xem báo cáo học tập | Actor chính |
| Người học | UC-STAT-03 | Xem bảng xếp hạng | Actor chính |

### REW — Phần thưởng

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-REW-01 | Điểm danh nhận xu | Actor chính |
| Người học | UC-REW-02 | Nhận thưởng nhiệm vụ ngày | Actor chính |
| Người học | UC-REW-03 | Mua vật phẩm giữ chuỗi | Actor chính |
| Bộ lập lịch hệ thống | UC-REW-04 | Tự động dùng vật phẩm giữ chuỗi | Actor chính |

### SHOP — Cửa hàng, ví và kho vật phẩm

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-SHOP-01 | Xem và tìm vật phẩm | Actor chính |
| Người học | UC-SHOP-02 | Mua vật phẩm | Actor chính |
| Người học | UC-SHOP-03 | Đánh dấu yêu thích vật phẩm | Actor chính |
| Người học | UC-SHOP-04 | Xem kho vật phẩm | Actor chính |
| Người học | UC-SHOP-05 | Sử dụng hoặc bỏ dùng vật phẩm | Actor chính |
| Người học | UC-SHOP-06 | Xem ví xu | Actor chính |

### COM — Cộng đồng

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người dùng đã xác thực | UC-COM-01 | Xem và tìm bài viết | Actor chính |
| Người dùng đã xác thực | UC-COM-02 | Xem chi tiết bài viết | Actor chính |
| Người dùng đã xác thực | UC-COM-03 | Đăng bài viết | Actor chính |
| Người dùng đã xác thực | UC-COM-04 | Bình luận bài viết | Actor chính |
| Người dùng đã xác thực | UC-COM-05 | Thả tim bài viết | Actor chính |
| Người dùng đã xác thực | UC-COM-06 | Xoá bài viết | Actor chính |
| Người dùng đã xác thực | UC-COM-07 | Xoá bình luận | Actor chính |
| Người dùng đã xác thực | UC-COM-08 | Tải tệp đính kèm | Actor chính |

### GRP — Nhóm lớp

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người học | UC-GRP-01 | Xem nhóm của tôi | Actor chính |
| Người học | UC-GRP-02 | Tìm nhóm công khai | Actor chính |
| Người học | UC-GRP-03 | Tìm nhóm bằng mã | Actor chính |
| Người học | UC-GRP-04 | Tạo nhóm | Actor chính |
| Người học | UC-GRP-05 | Tham gia nhóm | Actor chính |
| Người học | UC-GRP-06 | Rời nhóm | Actor chính |
| Người học | UC-GRP-07 | Xem bảng tin nhóm | Actor chính |
| Người học | UC-GRP-08 | Đăng bài trong nhóm | Actor chính |
| Người học | UC-GRP-09 | Xem tài liệu nhóm | Actor chính |
| Người học | UC-GRP-10 | Xem bộ thẻ của nhóm | Actor chính |
| Trưởng nhóm | UC-GRP-11 | Cập nhật cài đặt nhóm | Actor chính |
| Trưởng nhóm | UC-GRP-12 | Xoá nhóm | Actor chính |
| Trưởng nhóm | UC-GRP-13 | Duyệt yêu cầu tham gia nhóm | Actor chính |
| Trưởng nhóm | UC-GRP-14 | Thêm thành viên | Actor chính |
| Trưởng nhóm | UC-GRP-15 | Xoá thành viên | Actor chính |
| Trưởng nhóm | UC-GRP-16 | Phân quyền trưởng nhóm | Actor chính |
| Trưởng nhóm | UC-GRP-17 | Chia sẻ bộ thẻ vào nhóm | Actor chính |
| Trưởng nhóm | UC-GRP-18 | Gỡ bộ thẻ khỏi nhóm | Actor chính |

### NOTI — Thông báo và nhắc nhở

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Người dùng đã xác thực | UC-NOTI-01 | Xem thông báo | Actor chính |
| Người dùng đã xác thực | UC-NOTI-02 | Đánh dấu thông báo đã đọc | Actor chính |
| Người dùng đã xác thực | UC-NOTI-03 | Xoá thông báo | Actor chính |
| Người học | UC-NOTI-04 | Cấu hình nhắc nhở | Actor chính |
| Người học | UC-NOTI-05 | Quản lý mốc nhắc học | Actor chính |
| Người dùng đã xác thực | UC-NOTI-06 | Đăng ký thiết bị nhận thông báo đẩy | Actor chính |
| Bộ lập lịch hệ thống | UC-NOTI-07 | Gửi lời nhắc học | Actor chính |
| OneSignal | UC-NOTI-07 | Gửi lời nhắc học | Actor phụ (hệ thống gọi ra) |
| Bộ lập lịch hệ thống | UC-NOTI-08 | Cảnh báo chuỗi sắp đứt | Actor chính |
| OneSignal | UC-NOTI-08 | Cảnh báo chuỗi sắp đứt | Actor phụ (hệ thống gọi ra) |

### AUSR — Quản trị tài khoản và truy cập

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Quản trị viên | UC-ADM-01 | Xem tổng quan hệ thống | Actor chính |
| Quản trị viên | UC-ADM-02 | Tìm kiếm và lọc tài khoản | Actor chính |
| Quản trị viên | UC-ADM-03 | Xem chi tiết tài khoản | Actor chính |
| Quản trị viên | UC-ADM-04 | Thay đổi vai trò tài khoản | Actor chính |
| Quản trị viên | UC-ADM-05 | Khoá hoặc mở khoá tài khoản | Actor chính |
| Quản trị viên | UC-ADM-06 | Xoá tài khoản | Actor chính |
| Quản trị viên | UC-ADM-07 | Xử lý yêu cầu cấp lại mật khẩu | Actor chính |
| Quản trị viên | UC-ADM-08 | Xem nhật ký xử lý yêu cầu | Actor chính |
| Quản trị viên | UC-ADM-09 | Xem lượt truy cập | Actor chính |

### ACNT — Quản trị nội dung và kiểm duyệt bộ thẻ

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Quản trị viên | UC-ADM-10 | Quản lý chủ đề hệ thống | Actor chính |
| Quản trị viên | UC-ADM-11 | Quản lý từ vựng hệ thống | Actor chính |
| Quản trị viên | UC-ADM-12 | Xem báo cáo vi phạm bộ thẻ | Actor chính |
| Quản trị viên | UC-ADM-13 | Xem chi tiết bộ thẻ bị báo cáo | Actor chính |
| Quản trị viên | UC-ADM-14 | Chặn bộ thẻ | Actor chính |
| Quản trị viên | UC-ADM-15 | Mở chặn bộ thẻ | Actor chính |
| Quản trị viên | UC-ADM-16 | Bỏ qua báo cáo vi phạm | Actor chính |

### AGRP — Quản trị nhóm lớp

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Quản trị viên | UC-ADM-17 | Tìm kiếm và lọc nhóm | Actor chính |
| Quản trị viên | UC-ADM-18 | Xem chi tiết nhóm | Actor chính |
| Quản trị viên | UC-ADM-19 | Gửi cảnh báo vi phạm tới nhóm | Actor chính |
| Quản trị viên | UC-ADM-20 | Chặn nhóm | Actor chính |
| Quản trị viên | UC-ADM-21 | Mở chặn nhóm | Actor chính |

### ASHP — Quản trị cửa hàng

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Quản trị viên | UC-ADM-22 | Quản lý loại vật phẩm | Actor chính |
| Quản trị viên | UC-ADM-23 | Quản lý vật phẩm | Actor chính |

### ASYS — Cấu hình hệ thống và thông báo chung

| Actor | Use case | Tên | Vai trò trong quan hệ |
|---|---|---|---|
| Quản trị viên | UC-ADM-24 | Bật hoặc tắt tính năng | Actor chính |
| Quản trị viên | UC-ADM-25 | Gửi thông báo tới người dùng | Actor chính |

## 2. «include»

Chỉ dùng khi hành vi được gộp là BẮT BUỘC mỗi lần use case gốc chạy và được nhiều use case dùng lại.

| Use case gốc | «include» | Căn cứ |
|---|---|---|
| UC-STU-01 Học bộ thẻ | UC-STU-04 Trả lời và chấm thẻ | Mỗi câu trong phiên Học đều phải chấm và ghi qua `POST /study/answers`; không có đường học nào bỏ qua bước này. |
| UC-STU-02 Ôn tập thẻ theo lịch | UC-STU-04 Trả lời và chấm thẻ | Ôn tập dùng cùng endpoint và cùng hàm `submitAnswer`; chấm là bắt buộc với mỗi thẻ. |
| UC-STU-03 Ôn nhanh (Cram) | UC-STU-04 Trả lời và chấm thẻ | Cram vẫn gọi `submitAnswer` để biết đúng/sai; khác ở chỗ nhánh CRAM không ghi gì. |

## 3. «extend»

Mũi tên trỏ từ use case mở rộng về use case gốc. Điều kiện mở rộng lấy từ mã nguồn.

| Use case mở rộng | Mở rộng cho | Điều kiện mở rộng | Căn cứ |
|---|---|---|---|
| UC-AUTH-04 Đặt mật khẩu mới sau khi được duyệt | UC-AUTH-03 Yêu cầu cấp lại mật khẩu | Yêu cầu gần nhất ở trạng thái APPROVED, chưa dùng và chưa quá 7 ngày | `requestReset` trả `APPROVED` thì giao diện mở form đặt mật khẩu mới; các trạng thái khác không tới được bước này. |
| UC-LIB-08 Chia sẻ liên kết bộ thẻ | UC-LIB-03 Xem chi tiết bộ thẻ | Người học bấm "Chia sẻ" trên trang chi tiết bộ thẻ | Nút Chia sẻ chỉ có trên `/library/:id`; xem chi tiết không bắt buộc phải chia sẻ. |
| UC-LIB-09 Báo cáo vi phạm bộ thẻ | UC-LIB-03 Xem chi tiết bộ thẻ | Bộ thẻ công khai, không phải của chính mình và không phải bộ Hệ thống | UI kiểm chứng: nút "Báo cáo" chỉ hiện ở `/library/13` (bộ của người khác), không hiện ở bộ của mình hay bộ Hệ thống `/library/1`. |
| UC-STU-05 Ghi nhận hoàn thành phiên học | UC-STU-01 Học bộ thẻ | Phiên Học hết lượt câu hỏi hoặc người học thoát giữa chừng, và đã trả lời ít nhất một câu | `StudySession.tsx` gọi `finish` khi `done` hoặc `exit` với `results.length > 0`; chỉ áp dụng cho nguồn LEARN. |
| UC-HAB-03 Check-in bù thói quen | UC-HAB-02 Check-in thói quen | Người học chọn một ngày đã qua trong 7 ngày gần nhất | `checkIn` nhận `date` tuỳ chọn; thiếu `date` là check-in hôm nay. |
| UC-GRP-05 Tham gia nhóm | UC-GRP-02 Tìm nhóm công khai | Nhóm tìm được mà người học chưa là thành viên | Kết quả tìm kiếm mang `viewerState`; chỉ nhóm chưa tham gia mới có hành động tham gia. |
| UC-GRP-05 Tham gia nhóm | UC-GRP-03 Tìm nhóm bằng mã | Nhóm tra được bằng mã mà người học chưa là thành viên | Đây là lối DUY NHẤT vào nhóm riêng tư — nhóm riêng tư không hiện trong tìm kiếm. |
| UC-COM-08 Tải tệp đính kèm | UC-COM-02 Xem chi tiết bài viết | Bài viết có tệp đính kèm và người dùng chọn mở/tải tệp | Tệp chỉ tải được từ bài có tệp; xem bài không bắt buộc tải. |
| UC-COM-08 Tải tệp đính kèm | UC-GRP-09 Xem tài liệu nhóm | Người dùng bấm "Tải về" trong tab Tài liệu nhóm | Tài liệu nhóm không có đường tải riêng; tải về đi qua `/community/attachments/:id`. |

## 4. Generalization

### Giữa actor

| Con | Cha | Căn cứ |
|---|---|---|
| Người học | Người dùng đã xác thực | Người học dùng được mọi chức năng chỉ cần `requireAuth` |
| Quản trị viên | Người dùng đã xác thực | Quản trị viên dùng được mọi chức năng chỉ cần `requireAuth` (UI: Trang cá nhân, Thông báo, Cộng đồng) |
| Trưởng nhóm | Người học | Trưởng nhóm là một dòng `group_members` của một Người học; `assertLeader` chỉ cộng thêm quyền |

### Giữa use case

| Con | Cha | Căn cứ |
|---|---|---|
| UC-GRP-08 Đăng bài trong nhóm | UC-COM-03 Đăng bài viết | Cùng endpoint `POST /community/posts`, cùng hàm `createPost`; bài nhóm chỉ thêm `groupId`, kiểm tư cách thành viên và tách người được nhắc `@`. |

## 5. Quan hệ đã cân nhắc nhưng KHÔNG dùng

Ghi lại để người đọc biết đây là quyết định có chủ ý, không phải bỏ sót.

| Quan hệ ứng viên | Lý do không dùng |
|---|---|
| Check-in thói quen / Trả lời thẻ «include» "Ghi nhận hoạt động học" | `recordActivity` là thao tác kỹ thuật nội bộ, không có actor nào tương tác với nó. Ghi thành quy tắc nghiệp vụ trong đặc tả. |
| Đổi vai trò / Khoá / Xoá tài khoản «extend» Xem chi tiết tài khoản | Các nút nằm trong hộp thoại chi tiết, nhưng mỗi thao tác là một mục tiêu độc lập của Quản trị viên; nối association trực tiếp dễ đọc hơn. Tương tự Chặn / Mở chặn / Bỏ qua ở Kiểm duyệt bộ thẻ và Cảnh báo / Chặn ở Quản lý nhóm. |
| Rời nhóm / Xoá thành viên / Phân quyền «include» "Đảm bảo còn trưởng nhóm" | Là ràng buộc kiểm tra (`assertNotLastLeader`), không phải hành vi có ý nghĩa với actor. |
| Chặn bộ thẻ «include» "Đóng báo cáo" | Việc đóng báo cáo nằm trong cùng một thao tác, không tách ra dùng lại ở đâu khác. |
| Học bộ thẻ «extend» Xem bộ thẻ của nhóm | Mở bộ thẻ từ nhóm chỉ là điều hướng tới trang chi tiết bộ; không thêm hành vi mới. |
| Ôn nhanh «extend» Xem chi tiết bộ thẻ | Ôn nhanh vào được từ hai nơi (`/library/:id` và `/review`), nên là use case độc lập của Người học. |
| Generalization "Học bằng Flashcard" / "Học bằng Trắc nghiệm" | Hai chế độ khác nhau ở cách chấm, cùng luồng nghiệp vụ — ghi thành luồng thay thế trong UC-STU-01, không tách use case. |
