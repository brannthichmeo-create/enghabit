# Thiết kế lịch cá nhân

## 1. Mục tiêu

Thêm màn Lịch cho người học để tự quản lý các lịch cá nhân theo trải nghiệm tham khảo Google Calendar. Người khác không thể xem hoặc thao tác. Quản trị viên không thấy Lịch trong khu người học, nhưng có thể tắt tính năng bằng bộ cờ tính năng.

Phạm vi:
- Xem lịch theo Tháng hoặc Tuần; Tháng là mặc định.
- Tạo, xem, sửa và xoá lịch đơn.
- Tạo lịch lặp theo ngày, tuần, tháng hoặc năm với ngày kết thúc chuỗi.
- Sửa hoặc xoá riêng một lần; sửa hoặc xoá một lần và các lần còn lại.
- Hiển thị nhiều lịch trong ô ngày mà không làm thay đổi kích thước ô ngày.
- Không ghi ActivityLog và không tác động XP, streak hoặc thống kê học tập.

## 2. Phương án kiến trúc

Chọn phương án lưu một chuỗi lịch ở backend và sinh các lần xuất hiện khi truy vấn theo khoảng hiển thị.

Không lưu từng lần lặp thành hàng riêng vì cách đó làm sửa/xoá chuỗi và các ngoại lệ phức tạp. Backend khai thác chu kỳ, ngày kết thúc và các ngoại lệ để sinh lần xuất hiện, vì vậy hai màn lịch và API dùng cùng một nguồn dữ liệu.

## 3. Mô hình dữ liệu

Thêm enum Prisma `CalendarRecurrence`: `NONE`, `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`. Thêm hai bảng:

- `personal_calendars`: `id`, `userId`, tiêu đề, ghi chú, `startsAt`, `endsAt`, `recurrence`, `recurrenceEndsAt`, `createdAt`, `updatedAt`.
- `personal_calendar_exceptions`: `id`, `calendarId`, `occurrenceKey`, trạng thái xoá và các giá trị ghi đè tùy chọn cho tiêu đề, ghi chú, thời gian bắt đầu/kết thúc. Một khóa ngoại lệ là duy nhất theo cặp `(calendarId, occurrenceKey)`.

Một lần xuất hiện được nhận diện ổn định bằng `calendarId + occurrenceKey`. Với chuỗi, `occurrenceKey` chứa ngày giờ UTC của lần xuất hiện ban đầu, ví dụ `2026-10-31T09:00:00.000Z`. Ngoại lệ chặn một chuỗi mới sinh lại lần đã xoá hoặc ghi đè chỉ một lần.

`startsAt`, `endsAt` và `recurrenceEndsAt` lưu UTC theo quy ước thời gian của dự án. Ngày kết thúc chuỗi lặp được hiểu theo ngày local của người dùng; backend chuyển sang UTC theo timezone lúc sinh dữ liệu và hiển thị. Không dùng timezone trình duyệt làm nguồn dữ liệu.

## 4. Quy tắc lặp và ngoại lệ

- Không lặp: không có ngày kết thúc chuỗi.
- Có lặp: ngày kết thúc chuỗi bắt buộc và phải nằm trong hoặc sau ngày bắt đầu.
- Chuỗi được sinh từ lịch gốc, theo khoảng truy vấn đang xem cộng đệm cần thiết để hiển thị lịch kéo dài qua nhiều ngày.
- Một lịch không được kết thúc trước khi bắt đầu.
- Sự kiện lặp hàng tháng hoặc năm gặp ngày không tồn tại không được sinh ở tháng đó; ví dụ 31 tháng 2 không xuất hiện.

Khi sửa/xoá:
- **Chỉ lịch này**: tạo hoặc cập nhật ngoại lệ cho đúng `occurrenceKey`; không làm thay đổi các lần khác.
- **Tất cả lịch còn lại**: giữ chuỗi quá khứ. Truncate chuỗi hiện có tại lần xuất hiện trước lần được chọn, sau đó tạo chuỗi mới bắt đầu từ lần được chọn với nội dung mới hoặc kết thúc mới. Các ngoại lệ của chuỗi gốc không bị áp dụng sang chuỗi mới. Hành vi này có thể đổi sang một chuỗi mới, nhưng không dời hoặc ghi đè lịch đã xảy ra trước đó.
- Xoá chuỗi bằng **Chỉ lịch này** chỉ đánh dấu ngoại lệ đã xoá. Xoá bằng **Tất cả lịch còn lại** truncate chuỗi hiện có và giữ lịch trong quá khứ.

## 5. API

Module mới `calendar`, theo luồng `routes → controller → service → schema (Zod) → Prisma`, gồm:

- `GET /calendar?from=<ISO>&to=<ISO>&view=month|week`: trả các lần xuất hiện nằm trong khoảng hiển thị và không lấy dữ liệu của user khác.
- `POST /calendar`: tạo lịch đơn hoặc chuỗi.
- `GET /calendar/:id`: lấy dữ liệu chi tiết một lần; lịch mẫu có thể yêu cầu `occurrenceKey` để lấy ngoại lệ đúng lần.
- `PATCH /calendar/:id`: sửa một lần hoặc từ lần được chọn trở đi. Request có `scope=THIS|FUTURE` và `occurrenceKey` khi `THIS`.
- `DELETE /calendar/:id`: xoá một lần hoặc từ lần được chọn trở đi. Request có `scope=THIS|FUTURE` và `occurrenceKey` khi `THIS`.

Route mount dưới `/api/v1`, dùng `requireAuth` và `requireRole(UserRole.USER)` ở router, đồng thời mount qua `requireFeature(FeatureKey.CALENDAR)` trong `app.ts`. Token admin không được truy cập dù gọi thẳng API.

## 6. Schema chia sẻ và validation

Thêm Zod schema trong `shared`, xuất qua dist cho FE và BE. Quy tắc chung:
- `title`: chuỗi sau khi trim, bắt buộc, tối đa 100 ký tự.
- `notes`: chuỗi tùy chọn, tối đa 200 ký tự.
- `startsAt` và `endsAt`: bắt buộc, ISO hợp lệ; `endsAt >= startsAt`.
- `recurrence`: mặc định `NONE`.
- Khi recurrence khác `NONE`, `recurrenceEndsAt` bắt buộc và không trước ngày local bắt đầu.
- Query từ/ngày hiển thị phải là ISO hợp lệ, `from < to` và không vượt giới hạn khoảng cho phép để tránh truy vấn quá lớn.

Chữ frontend vẫn đi qua hệ dịch; dữ liệu tiêu đề và ghi chú do người dùng nhập là dữ liệu động, không dịch.

## 7. Giao diện

### Khung trang
- Thêm route `/calendar`, guard learner và feature gate, breadcrumb, sidebar mục **Cá nhân**, tên hiển thị thống nhất là **Lịch**.
- Thanh tiêu đề có điều hướng trước/sau, nút Hôm nay, chọn Tháng/Tuần và nút Tạo lịch.

### Lịch tháng
- Hiển thị 7 cột, ô ngày có kích thước ổn định; lịch kéo dài nhiều ngày được đặt trên các dòng theo ngày bắt đầu/kết thúc.
- Ngày hiện tại có highlight riêng.
- Nhấp vào ô ngày mở form tạo với ngày bắt đầu được chọn.
- Nhấp thẻ mở chi tiết. Thẻ hiển thị thời gian, tiêu đề và ghi chú khi có; tiêu đề và ghi chú giới hạn tối đa 2 dòng.
- Khi không còn chỗ cho các thẻ tiếp theo, ô hiển thị **+N**. Nhấp +N mở modal danh sách lịch trong ngày, thẻ trong modal có thể mở modal chi tiết.

### Lịch tuần
- Hiển thị 7 cột ngày và trục giờ theo Google Calendar.
- Thẻ được định vị theo thời gian bắt đầu và độ dài giữa hai mốc thời gian; lịch cả ngày chiếm vùng đầu ngày.
- Thẻ nhỏ dùng cùng nội dung rút gọn; nhấp để xem chi tiết.

### Form tạo/sửa
- Trường tiêu đề và bộ đếm `0/100`, cập nhật real-time.
- Ngày/Giờ bắt đầu và kết thúc bắt buộc, bộ đếm ghi chú `0/200`, cập nhật real-time.
- Lặp lại mặc định Không; chọn Hằng ngày/Tuần/Tháng/Năm xuất hiện thêm Ngày kết thúc chuỗi bắt buộc.
- Hủy đóng form; nếu người dùng đã nhập thay đổi, dùng confirm dialog hệ thống trước khi đóng.
- Tạo/Cập nhật gửi dữ liệu; lỗi validation hiển thị cạnh trường và lỗi API bằng toast.
- Lịch lặp có thêm bước chọn **Chỉ lịch này** hoặc **Tất cả lịch còn lại** khi sửa hoặc xoá.

### Chi tiết
- Modal Chi tiết lịch hiển thị đầy đủ thời gian, tiêu đề, chu kỳ và ghi chú.
- Nội dung dài giới hạn tối đa 2 dòng kèm nút Xem thêm/Thu gọn; tiêu đề và ghi chú lần lượt được đo độc lập để tránh CSS chung làm mất lớp thu gọn.
- Nút Sửa/Xoá nằm trong modal.

## 8. Cờ tính năng và điều hướng

Thêm `CALENDAR` vào `FeatureKey`, danh mục `FEATURES`, FE feature hook và bản dịch quản trị. Giá trị thiếu trong DB mặc định bật. Sidebar và route chờ trạng thái feature đã biết trước khi gọi API.

Đặt route `/calendar` trong khu learner. Không thêm route tương đương trong `/admin`, không thêm mục sidebar admin. Khi tắt:
- sidebar learner không hiển thị Lịch;
- route learner rơi 404;
- API trả 404 trước mọi thay đổi dữ liệu;
- dữ liệu lịch vẫn được giữ để bật lại không mất.

## 9. Kiểm thử

Backend:
- Validation tiêu đề/ghi chú và khoảng thời gian.
- Quyền truy cập, bao gồm token admin và user không sở hữu.
- Sinh lịch đơn và từng chu kỳ trong khoảng tháng/tuần.
- Không sinh ngày tháng không tồn tại đối với chu kỳ tháng/năm.
- Ngoại lệ `THIS`; truncate và tạo chuỗi mới `FUTURE`; không thay đổi lịch quá khứ.
- Lịch kéo dài qua nhiều ngày và giới hạn query.

Frontend:
- Tháng mặc định, chuyển tuần và điều hướng ngày.
- Nhấp ngày mở form đúng ngày; highlight hôm nay.
- Counter real-time và lỗi validation.
- Modal xác nhận huỷ và modal xác nhận phạm vi chuỗi.
- Giới hạn 2 dòng, +N và danh sách ngày.

Shared:
- Tất cả schema, enum và hành vi nhánh lặp có unit test đồng thời.

## 10. Dịch và tài liệu liên quan

Sau khi xây dựng, cập nhật:
- đường dẫn và nhãn sidebar/breadcrumb/route;
- bản dịch tiếng Anh trong `fe/src/shared/i18n/en.ts`;
- `check:i18n` và typecheck FE;
- migration Prisma và seed feature flags nếu quy trình hiện tại yêu cầu thêm dòng mặc định.

Lịch không liên kết tới `Habit`, `Goal`, `Todo`, `ActivityLog`, streak hoặc bảng điểm thưởng để tránh tạo thêm nguồn sự thật cho dữ liệu học tập.
