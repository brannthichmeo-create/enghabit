# Kế hoạch triển khai lịch cá nhân

## 1. Shared và schema

1. Thêm `FeatureKey.CALENDAR`, nhãn, mô tả và route `/calendar` trong `shared/src/constants/features.ts` và các unit test liên quan.
2. Thêm enum và schema Zod cho lịch cá nhân trong một module shared mới: recurrence, create/update/delete/query, giới hạn title 100 và notes 200, kiểm tra khoảng thời gian.
3. Thêm hàm sinh lần xuất hiện cho chuỗi hằng ngày/tuần/tháng/năm, dùng local date + timezone của người dùng và giữ lịch kéo dài nhiều ngày.
4. Build shared và chạy test shared.

## 2. Database và backend

1. Thêm migration MySQL cho `personal_calendars` và `personal_calendar_exceptions`, theo charset/collation và foreign key cascade/restrict phù hợp.
2. Thêm enum Prisma tương ứng và model User quan hệ.
3. Tạo module backend `calendar`: routes, controller, service và schema import shared.
4. Mount `/api/v1/calendar` sau `requireAuth`, `requireRole(UserRole.USER)` và `requireFeature(FeatureKey.CALENDAR)`.
5. Cài quyền truy cập theo `userId` ở mọi query/update/delete; không có endpoint công khai.
6. Triển khai GET theo khoảng hiển thị, POST, GET detail, PATCH, DELETE.
7. Triển khai scope `THIS` bằng ngoại lệ và scope `FUTURE` bằng truncate chuỗi gốc cộng tạo chuỗi mới.
8. Viết test backend cho validation, quyền truy cập, recurrence, ngoại lệ, truncate, lịch đa ngày và cờ tính năng.

## 3. Frontend nền

1. Thêm feature `calendar` với api, hooks và types dựa DTO shared.
2. Thêm route `/calendar`, feature gate learner, breadcrumb và sidebar mục Cá nhân.
3. Thêm bản dịch tiếng Việt làm khóa và bản dịch English trong `en.ts`.
4. Kiểm tra khóa dịch, route, breadcrumb và tên màn hình thống nhất là Lịch.

## 4. Giao diện lịch tháng và tuần

1. Thêm trang CalendarPage có khung điều hướng, ngày hiện tại, chọn Tháng/Tuần, trước/sau và Hôm nay.
2. Thêm MonthCalendarGrid với ô ngày cố định và ghép lịch theo ngày bắt đầu/kết thúc.
3. Hiển thị tối đa số thẻ vừa ô, phần còn lại là +N và mở modal danh sách ngày.
4. Thêm WeekCalendarGrid theo trục giờ, vị trí thẻ theo thời gian bắt đầu và chiều dài.
5. Nhấp ô/ngày trống mở form tại ngày được chọn; nhấp thẻ mở chi tiết.

## 5. Form và modal tương tác

1. Thêm CalendarFormDialog với title, ngày giờ bắt đầu/kết thúc, recurrence, recurrence end, notes và counter real-time.
2. Cài validation client cạnh trường, không lưu khi dữ liệu chưa hợp lệ.
3. Thêm xác nhận huỷ bằng `useConfirm()` khi form dirty.
4. Thêm xác nhận phạm vi `THIS/FUTURE` cho lịch lặp ở sửa và xoá.
5. Thêm CalendarDetailDialog, nút Sửa/Xoá và Xem thêm/Thu gọn cho title/notes dài.
6. Thêm DayEventsDialog và chuyển từ danh sách sang chi tiết mà không đóng trạng thái giao diện ngoài ý muốn.

## 6. Kiểm tra hoàn tất

1. Build shared trước rồi typecheck FE và BE.
2. Chạy test shared/backend liên quan.
3. Chạy `pnpm --filter @enghabit/fe check:i18n` và FE typecheck.
4. Kiểm tra feature bị tắt không xuất hiện sidebar, route trả 404 và API trả 404.
5. Kiểm tra admin không truy cập route/API dù có dữ liệu lịch trong DB.
6. Kiểm tra lịch đơn, chuỗi, ngoại lệ, thay đổi tương lai và các tương tác modal trên FE.
