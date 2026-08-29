# Kiến trúc hệ thống Enghabit

Tài liệu này giải thích **vì sao** hệ thống được tổ chức như hiện tại. Quy tắc bắt buộc khi viết code nằm ở [CLAUDE.md](../CLAUDE.md).

## 1. Ba quyết định thiết kế cốt lõi

### 1.1. ActivityLog là nguồn sự thật duy nhất

Mọi hoạt động học (học từ, ôn flashcard, làm quiz, check-in thói quen) đều ghi vào một bảng duy nhất `activity_logs`. Streak, thống kê ngày/tuần/tháng, tiến độ mục tiêu — tất cả đều suy ra từ bảng này.

**Lý do:** nếu mỗi module tự đếm số liệu riêng, khi số liệu hiển thị sai sẽ không biết nguồn nào đúng. Có một nguồn duy nhất thì việc debug rút gọn thành: soi `activity_logs`, thấy dữ liệu đúng thì lỗi nằm ở tầng đọc; thấy sai thì lỗi nằm ở tầng ghi.

`user_streaks` chỉ là **cache** để đọc nhanh, luôn tái tạo được bằng `db:recompute-streak`.

### 1.2. Ngày học tính theo `local_date`, không theo UTC

`activity_logs` lưu cả `occurred_at` (UTC) lẫn `local_date` (DATE, theo timezone của user tại thời điểm ghi). Mọi phép group theo ngày dùng `local_date`.

**Lý do:** một user ở Việt Nam học lúc 23:30 ngày 10/03 thì theo UTC là 16:30 ngày 10/03 — trùng ngày. Nhưng học lúc 07:00 ngày 11/03 thì theo UTC là 00:00 ngày 11/03. Nếu group theo UTC, các mốc gần nửa đêm sẽ rơi sai ngày và streak đứt oan. Tính sẵn `local_date` một lần lúc ghi giúp query đơn giản, chạy nhanh, và ổn định kể cả khi user đổi múi giờ.

Xem `shared/src/date/local-date.ts` và `be/src/common/utils/db-date.ts`.

### 1.3. Domain logic đặt ở `shared/`, không ở `be/`

Thuật toán SM-2 (`shared/src/srs`) và tính streak (`shared/src/streak`) là logic thuần, không phụ thuộc DB hay platform.

**Lý do:** FE cần hiển thị "chuỗi hiện tại" và "lần ôn tới", BE cần tính chính thức. Nếu viết hai lần, hai bên sẽ lệch nhau sớm muộn. Đặt ở `shared/` thì chỉ có một định nghĩa, lại test được độc lập, không cần DB.

## 2. Luồng dữ liệu của một hành động học

Ví dụ user ôn xong một flashcard:

```
FE: reviewFlashcardSchema.parse(input)     ← validate bằng schema dùng chung
 │
 ▼  POST /api/v1/flashcards/review
BE: flashcard.routes → validateBody → flashcard.controller
 │
 ▼
flashcard.service.submitReview()
 ├─ reviewCard(state, quality, today)      ← thuật toán SM-2 từ shared/
 │
 └─ prisma.$transaction:
      ├─ update user_vocab_progress        ← lịch ôn mới
      └─ recordActivity()                  ← activity-log.service
            ├─ insert activity_logs        ← NGUỒN SỰ THẬT
            └─ applyActivity() + upsert user_streaks   ← cache streak
```

Điểm quan trọng: cập nhật tiến độ và ghi log nằm **trong cùng một transaction**. Nếu không, có thể xảy ra cảnh tiến độ đã đổi nhưng streak chưa cập nhật — dữ liệu lệch mà không có cách phát hiện.

## 3. Tại sao mọi module phải gọi `recordActivity()`

`be/src/modules/activity-logs/activity-log.service.ts` là nơi **duy nhất** được phép insert vào `activity_logs` và cập nhật `user_streaks`.

Nếu mỗi module tự insert, sẽ xuất hiện các biến thể: chỗ quên tính `local_date`, chỗ quên cập nhật streak, chỗ dùng timezone máy chủ thay vì timezone user. Gom về một hàm khiến những lỗi đó không thể xảy ra.

## 4. Phân lớp backend

```
routes.ts       định tuyến + gắn middleware (validate, auth-guard)
controller.ts   đọc request, gọi service, trả response — KHÔNG chứa nghiệp vụ
service.ts      toàn bộ nghiệp vụ + truy cập DB qua Prisma
```

Lỗi được ném từ service dưới dạng `AppError`, và **chỉ có** `error-handler.ts` chuyển lỗi thành HTTP response. Nhờ vậy format lỗi đồng nhất trên toàn API và service không cần biết gì về HTTP.

## 5. Xác thực

- Access token: JWT ngắn hạn (15 phút), gửi qua header `Authorization`.
- Refresh token: chuỗi ngẫu nhiên dài hạn (30 ngày), **lưu hash** trong DB.
  - Web nhận qua cookie `httpOnly` → JavaScript không đọc được, giảm rủi ro XSS.
  - Mobile nhận trong body (không có cookie) → lưu ở SecureStore.
- Mỗi lần refresh sẽ thu hồi token cũ và cấp token mới (rotation).
- Đổi mật khẩu thu hồi toàn bộ refresh token đang hoạt động.

Lưu hash thay vì token thô để nếu DB bị lộ thì kẻ tấn công vẫn không đăng nhập được.

## 6. Thông báo nhắc nhở

`be/src/jobs/reminder.job.ts` chạy cron mỗi 15 phút, quét các user đang tới giờ nhắc **theo timezone của chính họ**, rồi gọi OneSignal để gửi.

OneSignal cũng có tính năng tự lên lịch, nhưng hệ thống **cố ý không dùng** — hai nguồn cùng lên lịch sẽ khiến user nhận trùng thông báo và rất khó truy nguyên. Cột `last_sent_date` chặn gửi lặp trong cùng một ngày khi cron chạy lại.

## 7. Frontend

Mỗi feature ở `fe/src/features/<tên>/` gồm `api.ts` (gọi HTTP) → `hooks.ts` (TanStack Query) → `components/`. Component không gọi axios trực tiếp.

`apiClient` xử lý gắn token và tự refresh khi gặp 401, gom các request 401 đồng thời vào một lần refresh duy nhất — mỗi feature không phải lặp lại logic này.

Mỗi feature lớn được bọc `FeatureErrorBoundary` riêng để lỗi ở một phần không làm sập toàn bộ ứng dụng.
