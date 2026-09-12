# Bản đồ màn hình — đường dẫn file

> Liệt kê mọi màn hình của hệ thống và file dựng ra nó.
>
> Khảo sát mã nguồn ngày 12/09/2026. Mọi đường dẫn đều tương đối từ thư mục gốc dự án.

## Cách đọc

Chia bốn mức, theo câu hỏi "cái này có địa chỉ riêng không":

| Mức | Là gì | Ví dụ |
|---|---|---|
| **1** | Màn hình có URL riêng, khai trong `fe/src/routes/AppRoutes.tsx` | `/flashcards` |
| **2** | Màn phụ nằm **trong** một route, không có URL riêng | Trình chơi bài học, chi tiết tài khoản |
| **3** | Khung app — vẽ quanh mọi màn hình | Sidebar, breadcrumb |
| **4** | Thành phần con chỉ dùng trong một màn | Ô nhập của form đăng nhập |

Đường dẫn frontend đều nằm dưới `fe/src/`. Cột **Guard** là bọc quyền trong
`fe/src/routes/AppRoutes.tsx`:

- `PublicOnly` — chỉ khách chưa đăng nhập
- `Learner` — chỉ vai trò `USER`; quản trị viên bị đẩy về `/admin`
- `Admin` — chỉ vai trò `ADMIN`
- `Feature` — cả hai vai trò

---

## 1. Màn hình có URL riêng

23 route. Nguồn: `fe/src/routes/AppRoutes.tsx`.

### 1.1 Ngoài khung app (chưa đăng nhập)

Ba màn này **không** đi qua `AppLayout` nên không có sidebar và không có breadcrumb.

| URL | Tên màn | Guard | File |
|---|---|---|---|
| `/login` | Đăng nhập | `PublicOnly` | `features/auth/components/LoginPage.tsx` |
| `/register` | Tạo tài khoản | `PublicOnly` | `features/auth/components/RegisterPage.tsx` |
| `/forgot-password` | Quên mật khẩu | `PublicOnly` | `features/auth/components/ForgotPasswordPage.tsx` |

### 1.2 Khu người học

| URL | Tên màn | Guard | File | Tầng API |
|---|---|---|---|---|
| `/` | Tổng quan | `Learner` | `features/statistics/components/DashboardPage.tsx` | `statistics/statistics.api.ts` |
| `/report` | Báo cáo | `Learner` | `features/statistics/components/ReportPage.tsx` | `statistics/statistics.api.ts` |
| `/vocabulary` | Từ vựng | `Learner` | `features/vocabulary/components/VocabularyPage.tsx` | `vocabulary/vocabulary.api.ts` |
| `/flashcards` | Ôn tập | `Learner` | `features/flashcards/components/FlashcardPage.tsx` | `flashcards/flashcard.api.ts` |
| `/habits` | Thói quen | `Learner` | `features/habits/components/HabitsPage.tsx` | `habits/habit.api.ts` |
| `/goals` | Mục tiêu | `Learner` | `features/goals/components/GoalsPage.tsx` | `goals/goal.api.ts` |
| `/leaderboard` | Bảng xếp hạng | `Learner` | `features/leaderboard/components/LeaderboardPage.tsx` | `leaderboard/leaderboard.api.ts` |
| `/groups` | Nhóm lớp | `Learner` | `features/groups/components/GroupsPage.tsx` | `groups/group.api.ts` |
| `/groups/:id` | Nhóm lớp (chi tiết) | `Learner` | `features/groups/components/GroupDetailPage.tsx` | `groups/group.api.ts` |

### 1.3 Dùng chung hai vai trò

| URL | Tên màn | Guard | File | Tầng API |
|---|---|---|---|---|
| `/community` | Cộng đồng | `Feature` | `features/community/components/CommunityPage.tsx` | `community/community.api.ts` |
| `/profile` | Trang cá nhân | `Feature` | `features/profile/components/ProfilePage.tsx` | `auth/auth.api.ts` |
| `/notifications` | Thông báo | `Feature` | `features/notifications/components/NotificationsPage.tsx` | `notifications/notification.api.ts` |
| `*` | Không tìm thấy trang | `Feature` | `shared/components/NotFoundPage.tsx` | — |

### 1.4 Khu quản trị

| URL | Tên màn | Guard | File | Tầng API |
|---|---|---|---|---|
| `/admin` | Tổng quan hệ thống | `Admin` | `features/admin/components/AdminOverviewPage.tsx` | `admin/admin.api.ts` |
| `/admin/users` | Tài khoản | `Admin` | `features/admin/components/AdminUsersPage.tsx` | `admin/admin.api.ts` |
| `/admin/access` | Lượt truy cập | `Admin` | `features/admin/components/AdminAccessPage.tsx` | `admin/admin.api.ts` |
| `/admin/content` | Nội dung học tập | `Admin` | `features/admin/components/AdminContentPage.tsx` | `admin/admin.api.ts` |
| `/admin/groups` | Quản lý nhóm | `Admin` | `features/admin/components/AdminGroupsPage.tsx` | `admin/admin.api.ts` |
| `/admin/requests` | Quản lý yêu cầu | `Admin` | `features/admin/components/AdminRequestsPage.tsx` | `admin/admin.api.ts` |
| `/admin/announcements` | Gửi thông báo | `Admin` | `features/notifications/components/AnnouncementPage.tsx` | `notifications/notification.api.ts` |

> **Lưu ý:** `/admin/announcements` là màn **quản trị** nhưng file nằm trong feature
> `notifications`, không nằm trong `admin`. Lý do: nó dùng lại `notification.service` phía
> backend. Đây là ngoại lệ duy nhất về vị trí file trong khu quản trị.

---

## 2. Màn phụ — không có URL riêng

Những màn này thay thế nội dung của một route cha, hoặc mở dưới dạng hộp thoại. Theo
CLAUDE.md, màn phụ **không tra được từ bản đồ breadcrumb** nên phải tự gọi
`useBreadcrumbTail()`.

### 2.1 Thay toàn bộ nội dung route cha

| Màn phụ | Mở từ | File | Có đặt breadcrumb? |
|---|---|---|---|
| Chi tiết bài viết | `/community` | `features/community/components/PostDetailView.tsx` | Có — tiêu đề bài viết |


> Module `lessons` đã bị gỡ ngày 12/09/2026 để dựng lại, nên mục này hiện chỉ còn một
> dòng. Dựng lại màn học thì bổ sung vào đây.

### 2.2 Hộp thoại

Tất cả dựng trên `shared/components/Modal.tsx`.

| Hộp thoại | Trong màn | File |
|---|---|---|
| Chi tiết tài khoản (3 tab) | `/admin/users` | `features/admin/components/AdminUsersPage.tsx` |
| Từ chối yêu cầu (nhập lý do) | `/admin/requests` | `features/admin/components/AdminRequestsPage.tsx` |
| Thao tác với nhóm | `/admin/groups` | `features/admin/components/AdminGroupsPage.tsx` |
| Đợi quản trị viên xác nhận | `/forgot-password` | `features/auth/components/ForgotPasswordPage.tsx` |
| Soạn bài viết | `/community` | `features/community/components/CommunityPage.tsx` |
| Tạo nhóm / vào nhóm bằng mã | `/groups` | `features/groups/components/GroupsPage.tsx` |
| Thao tác trong nhóm | `/groups/:id` | `features/groups/components/GroupDetailPage.tsx` |
| Hỏi xác nhận (dùng chung) | mọi màn | `shared/components/ConfirmDialog.tsx` |

### 2.3 Màn hình đổi theo trạng thái

Một route, nhiều giao diện khác hẳn nhau tuỳ dữ liệu.

| Route | Các trạng thái | File |
|---|---|---|
| `/forgot-password` | 4 trạng thái: `CREATED` / `PENDING` / `APPROVED` (form đặt mật khẩu mới) / `REJECTED` | `features/auth/components/ForgotPasswordPage.tsx` |
| `/admin/requests` | 2 tab: Yêu cầu (danh sách) / Nhật ký (bảng) | `features/admin/components/AdminRequestsPage.tsx` |
| `/admin/users` → hộp thoại | 3 tab: Thông tin cá nhân / Thống kê / Hoạt động gần đây | `features/admin/components/AdminUsersPage.tsx` |
| `/leaderboard` | 2 trục lọc: tiêu chí × khoảng thời gian | `features/leaderboard/components/LeaderboardPage.tsx` |
| `/groups` | 2 tab | `features/groups/components/GroupsPage.tsx` |
| `/` | Đổi theo khoảng thời gian | `features/statistics/components/DashboardPage.tsx` |

---

## 3. Khung app và thành phần dùng chung

Thư mục `fe/src/shared/components/`.

| File | Vai trò |
|---|---|
| `shared/components/AppLayout.tsx` | Khung bao mọi màn đã đăng nhập: sidebar + thanh trên + breadcrumb + vùng nội dung |
| `shared/components/Sidebar.tsx` | Điều hướng trái; chứa cả `Avatar` và `QuickStats`. Danh sách mục quản trị nằm ở đây. |
| `shared/components/Breadcrumb.tsx` | Đường dẫn phân cấp. Trang **không** tự vẽ breadcrumb. |
| `shared/components/ui.tsx` | Bộ nguyên thuỷ: `Button Card PageHeader SectionTitle Field Input Select ErrorMessage EmptyState Skeleton SkeletonList Badge ProgressBar` |
| `shared/components/Modal.tsx` | Hộp thoại dùng chung |
| `shared/components/ConfirmDialog.tsx` | Hỏi xác nhận — **dùng thay cho `confirm()` của trình duyệt** |
| `shared/components/Toast.tsx` | Báo kết quả thao tác |
| `shared/components/FeatureErrorBoundary.tsx` | Bọc từng feature; lỗi một feature không làm sập cả app |
| `shared/components/NotFoundPage.tsx` | Trang 404 (là màn hình thật, route `*`) |
| `shared/components/ActivityCalendar.tsx` | Lịch hoạt động cả năm |
| `shared/components/ActivityChart.tsx` | Biểu đồ hoạt động theo ngày |
| `shared/components/ThemeToggle.tsx` | Chuyển sáng / tối / theo hệ thống |
| `shared/components/LanguageSwitcher.tsx` | Chuyển Việt / Anh |
| `shared/components/Logo.tsx` | Linh vật |
| `shared/components/Wordmark.tsx` | Tên hệ thống `ENG//HABIT` — **là ảnh**, không phải chữ |

### File điều phối

| File | Vai trò |
|---|---|
| `fe/src/routes/AppRoutes.tsx` | Bảng route và bọc quyền |
| `fe/src/shared/lib/breadcrumbs.ts` | Bản đồ nhãn breadcrumb (`TRAILS`) |
| `fe/src/shared/i18n/language.tsx` | Hàm `t()`, `useLocale()` |
| `fe/src/shared/i18n/en.ts` | Bản dịch tiếng Anh |
| `fe/src/shared/lib/labels.ts` | Nhãn dạng bảng dữ liệu |
| `fe/src/shared/lib/api-client.ts` | axios + `getErrorMessage` |
| `fe/src/index.css` | Token màu |

---

## 4. Thành phần con theo từng màn

Chỉ dùng trong đúng một màn, không tái sử dụng nơi khác.

| Feature | File | Dùng ở đâu |
|---|---|---|
| `auth` | `features/auth/components/AuthLayout.tsx` | Khung chung 3 màn đăng nhập/đăng ký/quên mật khẩu |
| `auth` | `features/auth/components/AuthField.tsx` | Ô nhập + `PasswordField` + `PasswordStrength` |
| `admin` | `features/admin/components/ContentManager.tsx` | Ruột màn `/admin/content` |
| `admin` | `features/admin/components/TrendChart.tsx` | Biểu đồ cột — dùng ở `/admin/access` và hộp thoại chi tiết tài khoản |
| `community` | `features/community/components/PostComposer.tsx` | Form soạn bài |
| `community` | `features/community/components/AttachmentView.tsx` | Xem tệp đính kèm |
| `habits` | `features/habits/components/HabitForm.tsx` | Form thêm/sửa thói quen |
| `notifications` | `features/notifications/components/NotificationBell.tsx` | Chuông trên thanh trên cùng |
| `notifications` | `features/notifications/components/ReminderSettings.tsx` | Cấu hình lời nhắc, trong `/profile` |
| `notifications` | `features/notifications/components/notification-display.tsx` | Bảng tra biểu tượng + nhãn theo loại |
| `profile` | `features/profile/components/AvatarPicker.tsx` | Chọn và cắt ảnh đại diện |
| `rewards` | `features/rewards/components/RewardsBar.tsx` | Điểm danh + nhiệm vụ ngày, trong `/` |
| `statistics` | `features/statistics/components/HeroCard.tsx` | Thẻ mở đầu của Tổng quan |

---

## 5. Ghi chú và điểm cần lưu ý

### 5.1 Feature không có màn hình riêng

| Feature | Vì sao |
|---|---|
| `rewards` | Chỉ có `RewardsBar`, nhúng trong `/` |
| `profile` | Có `/profile` nhưng dùng `features/auth/auth.api.ts`, không có `profile.api.ts` |

### 5.2 `/groups/:id` không có trong bản đồ breadcrumb

Bản đồ `TRAILS` tra theo đường dẫn tĩnh nên không khớp được `:id`. Màn này dùng
`useBreadcrumbTail(group.data?.name)` — giống cách màn phụ làm, dù nó **có** URL riêng.

Đây là ngoại lệ hợp lý, không phải thiếu sót: nhãn breadcrumb là tên nhóm, chỉ biết sau khi
tải dữ liệu.

### 5.3 Tên màn phải giống hệt nhau ở ba nơi

Theo CLAUDE.md, mỗi màn hình chỉ có một tên, dùng chung một khoá dịch:

1. `name` của route trong `fe/src/routes/AppRoutes.tsx`
2. `label` trong `shared/components/Sidebar.tsx`
3. `label` trong `TRAILS` của `fe/src/shared/lib/breadcrumbs.ts`

### 5.4 Sáu bước bắt buộc khi thêm màn hình mới

1. Route + guard trong `fe/src/routes/AppRoutes.tsx`
2. Breadcrumb trong `TRAILS`
3. Mọi chữ qua `t()` **và** thêm bản dịch vào `fe/src/shared/i18n/en.ts`
4. Nhãn giống hệt nhau ở ba nơi (mục 5.3)
5. Đúng bộ token màu: `content*` trong thẻ, `on-page*` ngoài thẻ
6. Chạy `pnpm --filter @enghabit/fe check:i18n` và `typecheck`

Ba bước đầu quên thì **không ai thấy lỗi ngay lúc code** — màn hình vẫn chạy.
