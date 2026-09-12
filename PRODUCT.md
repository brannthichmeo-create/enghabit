# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người học tiếng Anh tự học, không nhắm riêng một kỳ thi hay trình độ cụ thể. Chủ đề từ
vựng seed hiện tại đều mang tính tổng quát (Giao tiếp hằng ngày, Business, Du lịch, Công
nghệ, Academic Writing) — không có nhóm chủ đề luyện thi chứng chỉ riêng (IELTS/TOEIC...).

Vai trò thứ hai: **Quản trị viên** — vận hành hệ thống, không tự học qua app. Tách biệt
hoàn toàn khỏi trải nghiệm học (route guard `Learner` trong `fe/src/routes/AppRoutes.tsx`);
không thấy streak/XP/phần thưởng, chỉ dùng các trang `/admin/*`.

Ngôn ngữ giao diện chính là **tiếng Việt** (khoá dịch trong code chính là câu tiếng Việt),
có bản tiếng Anh song song qua `fe/src/shared/i18n`. Timezone mặc định `Asia/Ho_Chi_Minh`.

## Product Purpose

Xây dựng và duy trì thói quen học tiếng Anh đều đặn. Luận điểm cốt lõi (nguyên văn
`CLAUDE.md`): "người học thường không thiếu tài liệu mà thiếu cơ chế duy trì thói quen học
đều đặn." Thành công của người dùng = học liên tục nhiều ngày (streak sống), không phải học
được nhiều nội dung trong một lần rồi bỏ.

## Positioning

Gộp một hệ thống thay vì người dùng phải tự ghép nhiều công cụ rời rạc — ví dụ Duolingo/Anki
lo phần nội dung/ôn tập, còn mục tiêu, chuỗi ngày, thống kê thì phải tự quản lý riêng (note,
giấy, app khác). ENG//HABIT gộp ba mảng vào một hệ thống, cùng một nguồn dữ liệu duy nhất
(`ActivityLog`): học từ vựng có ôn tập lặp cách quãng (SM-2) + quản lý mục tiêu/thói quen +
theo dõi động viên (streak, XP, xu, bảng xếp hạng, nhắc nhở).

## Operating Context

- Web app (React SPA) đang chạy được. Mobile (React Native/Expo) đã có tên trong kiến trúc
  nhưng **chưa scaffold** — chỉ nền web tồn tại ở giai đoạn hiện tại.
- Vòng dùng hằng ngày: học từ vựng/flashcard/bài học → check-in thói quen → xem streak/thống
  kê → điểm danh nhận xu, làm nhiệm vụ ngày → (tuỳ chọn) tham gia Nhóm lớp hoặc diễn đàn
  Cộng đồng.
- Nhắc nhở qua push (OneSignal) + trong app; lịch trình gửi do cron `be/src/jobs` quyết định
  — OneSignal chỉ là kênh gửi, không tự lên lịch.
- Quản trị viên là vai trò vận hành nội bộ (xem tổng quan hệ thống, quản lý tài khoản, duyệt
  yêu cầu cấp lại mật khẩu, quản lý nội dung/nhóm), không phải người dùng học.
- Dự án một người phát triển (solo) — commit thẳng nhánh `main`, không có quy trình PR/review.

## Capabilities and Constraints

- **Không có cổng thanh toán, không đăng nhập OAuth bên thứ ba** — xác thực tự triển khai
  bằng JWT + bcrypt. Miễn phí hoàn toàn, không có tính năng thu phí hay giới hạn theo gói.
  Đây là đồ án/dự án cá nhân, chưa tính thương mại hoá — không tự thêm luồng thanh toán hay
  giới hạn tính năng theo gói trả phí mà không hỏi lại.
- "Tiền tệ" duy nhất trong app là xu (coin) — chỉ đổi được bằng hoạt động học/điểm danh,
  không mua bằng tiền thật (nhất quán với việc không có cổng thanh toán).
- MySQL free-tier khi deploy (Aiven/Clever Cloud) luôn giới hạn số kết nối đồng thời rất
  thấp — ràng buộc này đã ảnh hưởng trực tiếp tới quyết định sản phẩm, ví dụ chọn poll 60s
  cho số thông báo chưa đọc thay vì kết nối realtime.
- `README.md` hướng dẫn cài đặt viết cho người **chưa biết lập trình** — ứng dụng có thể
  được người ngoài kỹ thuật (vd giảng viên chấm đồ án) tự cài và dùng thử, không chỉ dev nội bộ.
- Có hướng dẫn deploy thật (Render cho backend, Vercel cho frontend — `docs/deployment.md`)
  nhưng **chưa xác nhận có bản production nào đang chạy công khai**; không mặc định có người
  dùng thật đang online khi đưa ra quyết định thiết kế.

## Brand Commitments

- Tên hiển thị **ENG//HABIT**, luôn qua component `Wordmark`/`Logo` — không gõ tay chuỗi tên
  hay chèn `<img>` trực tiếp. Có bản ảnh riêng cho nền sáng/tối (`wordmark.png`,
  `wordmark-dark.png`), tách nền trong suốt từ thiết kế gốc.
- Hệ màu đã có bộ token đầy đủ kèm tài liệu đối chiếu tương phản WCAG 2.2 AA
  (`docs/color-rules.md`, 25 quy tắc R1–R25) cho cả chế độ sáng và tối — ràng buộc nhận diện
  đã chốt, không đổi bằng cảm tính.

## Evidence on Hand

- Seed data mẫu (`be/prisma/seed.ts`): 3 tài khoản demo, 5 chủ đề, 40 từ vựng, ~45 ngày lịch
  sử hoạt động mẫu — dữ liệu phát triển/demo, **không phải dữ liệu người dùng thật**.
- Không có testimonial, số liệu người dùng thật, hay case study nào trong repo — các mục này
  **không được bịa** khi làm việc thiết kế sau này (landing page, trang giới thiệu...).
- Tài liệu phân tích hệ thống chi tiết đã có sẵn phục vụ báo cáo đồ án: `docs/phan-tich-do-an.md`,
  `docs/phu-luc-erd.md`, `docs/phu-luc-api.md`, `docs/architecture.md`.

## Product Principles

1. Cơ chế duy trì thói quen (streak, mục tiêu, nhắc nhở, phần thưởng) là tính năng chính —
   nội dung học (từ vựng, bài học) là chất liệu phục vụ cơ chế đó, không phải kho nội dung để
   thi đua số lượng.
2. Một nguồn sự thật duy nhất cho mọi hoạt động học (`ActivityLog`) — mọi thống kê, streak,
   XP, bảng xếp hạng đều suy ra từ đó, không tạo bảng tổng hợp song song dễ lệch số liệu.
3. Vai trò quản trị viên tách biệt hoàn toàn khỏi trải nghiệm học — không có XP/streak/phần
   thưởng, không gọi API học tập.
4. Không mở khoá tính năng bằng tiền thật — mọi "tiền tệ" trong app chỉ đổi được bằng hoạt
   động học, phù hợp với việc sản phẩm hiện miễn phí hoàn toàn và chưa tính thương mại hoá.
5. Tiếng Việt là ngôn ngữ chính của giao diện, tiếng Anh là bản dịch song song — không
   hardcode chuỗi hiển thị, luôn qua `t()`.

## Accessibility & Inclusion

Chuẩn đã chốt: WCAG 2.2 mức AA cho tương phản màu, áp dụng cho toàn bộ token màu ở cả chế độ
sáng và tối (`docs/color-rules.md`, đối chiếu theo 25 quy tắc). Chưa có yêu cầu accessibility
nào khác được xác nhận (vd hỗ trợ đọc màn hình đầy đủ, hỗ trợ ngôn ngữ ngoài Việt/Anh) — không
tự suy diễn thêm ngoài phạm vi này.
