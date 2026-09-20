# Ma trận truy vết

Khảo sát ngày 20/09/2026. Bảng A–C được SINH TỰ ĐỘNG bằng cách quét mã nguồn (`fe/src/routes/AppRoutes.tsx`,
mọi `be/src/modules/*/*.routes.ts` cùng chỗ mount trong `be/src/app.ts`, `be/prisma/schema.prisma`)
rồi đối chiếu với mô hình use case — không liệt kê tay. Bảng D ghi từ lần quan sát giao diện
thật bằng trình duyệt với tài khoản seed `user@enghabit.com` và `admin@enghabit.com` trên DB
`enghabit_dev` (chỉ xem, không thao tác làm đổi dữ liệu ngoài việc đăng nhập).

## Tóm tắt kết quả đối chiếu

| Hạng mục | Tổng | Đã gắn use case | Không cần gắn | Chưa bao phủ |
|---|---|---|---|---|
| Route FE | 31 | 30 | 1 | 0 |
| Endpoint API | 146 | 145 | 1 | 0 |
| Bảng DB | 36 | 36 | 0 (gián tiếp) | 0 |
| Thao tác UI đã quan sát | 71 | 71 | — | 0 |
| Cặp use case ↔ endpoint kiểm quyền | 154 | 129 khớp | 5 chấp nhận | 20 lệch |

Không có lỗi mô hình: mọi use case có đặc tả, mọi endpoint và bảng ghi trong mô hình đều có thật trong mã nguồn, không trùng tên use case.

## A. Route FE ↔ Use Case

| Source Item | Loại | Use Case liên quan | Đã bao phủ? | Ghi chú |
|---|---|---|---|---|
| `/login` | Route FE (`PublicOnly`) | UC-AUTH-02 | Có |  |
| `/register` | Route FE (`PublicOnly`) | UC-AUTH-01 | Có |  |
| `/forgot-password` | Route FE (`PublicOnly`) | UC-AUTH-03, UC-AUTH-04 | Có |  |
| `/` | Route FE (`Learner`) | UC-HAB-06, UC-STAT-01, UC-REW-01, UC-REW-02, UC-REW-03 | Có | Tổng quan |
| `/report` | Route FE (`Gated`, cờ REPORT) | UC-STAT-02 | Có | Báo cáo |
| `/habits` | Route FE (`Gated`, cờ HABITS) | UC-HAB-01, UC-HAB-02, UC-HAB-04 | Có | Thói quen |
| `/goals` | Route FE (`Gated`, cờ GOALS) | UC-HAB-05, UC-HAB-06 | Có | Mục tiêu |
| `/library` | Route FE (`Gated`, cờ VOCABULARY) | UC-LIB-01, UC-LIB-02, UC-LIB-04, UC-LIB-05 | Có | Thư viện |
| `/library/:id` | Route FE (`Gated`, cờ VOCABULARY) | UC-LIB-03, UC-LIB-04, UC-LIB-06, UC-LIB-07, UC-LIB-08, UC-LIB-09, UC-STU-01, UC-STU-03 | Có | Thư viện |
| `/learn` | Route FE (`Gated`, cờ LEARN) | UC-LIB-02, UC-STU-01, UC-STU-04, UC-STU-05 | Có | Học |
| `/review` | Route FE (`Gated`, cờ FLASHCARDS) | UC-STU-02, UC-STU-03, UC-STU-04, UC-STU-06, UC-STU-07 | Có | Ôn tập |
| `/leaderboard` | Route FE (`Gated`, cờ LEADERBOARD) | UC-STAT-03 | Có | Bảng xếp hạng |
| `/shop` | Route FE (`Gated`, cờ SHOP) | UC-SHOP-01, UC-SHOP-02, UC-SHOP-03 | Có | Cửa hàng |
| `/wallet` | Route FE (`Gated`, cờ SHOP) | UC-SHOP-06 | Có | Ví của tôi |
| `/inventory` | Route FE (`Gated`, cờ SHOP) | UC-SHOP-02, UC-SHOP-03, UC-SHOP-04, UC-SHOP-05 | Có | Kho vật phẩm |
| `/community` | Route FE (`Gated`, cờ COMMUNITY) | UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-04, UC-COM-05, UC-COM-06, UC-COM-07, UC-COM-08 | Có | Cộng đồng |
| `/groups` | Route FE (`Gated`, cờ GROUPS) | UC-GRP-01, UC-GRP-02, UC-GRP-03, UC-GRP-04, UC-GRP-05 | Có | Nhóm lớp |
| `/groups/:id` | Route FE (`Gated`, cờ GROUPS) | UC-COM-02, UC-COM-04, UC-COM-05, UC-COM-06, UC-COM-07, UC-COM-08, UC-GRP-06, UC-GRP-07, UC-GRP-08, UC-GRP-09, UC-GRP-10, UC-GRP-11, UC-GRP-12, UC-GRP-13, UC-GRP-14, UC-GRP-15, UC-GRP-16, UC-GRP-17, UC-GRP-18 | Có | Nhóm lớp |
| `/profile` | Route FE (`Feature`) | UC-AUTH-06, UC-AUTH-07, UC-AUTH-08, UC-NOTI-04, UC-NOTI-05 | Có | Trang cá nhân |
| `/notifications` | Route FE (`Feature`) | UC-NOTI-01, UC-NOTI-02, UC-NOTI-03 | Có | Thông báo |
| `/admin` | Route FE (`Admin`) | UC-ADM-01 | Có | Tổng quan hệ thống |
| `/admin/users` | Route FE (`Admin`) | UC-ADM-02, UC-ADM-03, UC-ADM-04, UC-ADM-05, UC-ADM-06 | Có | Tài khoản |
| `/admin/access` | Route FE (`Admin`) | UC-ADM-09 | Có | Lượt truy cập |
| `/admin/content` | Route FE (`Admin`) | UC-ADM-10, UC-ADM-11 | Có | Nội dung học tập |
| `/admin/groups` | Route FE (`Admin`) | UC-ADM-17, UC-ADM-18, UC-ADM-19, UC-ADM-20, UC-ADM-21 | Có | Quản lý nhóm |
| `/admin/study-sets` | Route FE (`Admin`) | UC-ADM-12, UC-ADM-13, UC-ADM-14, UC-ADM-15, UC-ADM-16 | Có | Kiểm duyệt bộ thẻ |
| `/admin/shop` | Route FE (`Admin`) | UC-ADM-22, UC-ADM-23 | Có | Quản lý cửa hàng |
| `/admin/requests` | Route FE (`Admin`) | UC-ADM-07, UC-ADM-08 | Có | Quản lý yêu cầu |
| `/admin/features` | Route FE (`Admin`) | UC-ADM-24 | Có | Quản lý tính năng |
| `/admin/announcements` | Route FE (`Admin`) | UC-ADM-25 | Có | Gửi thông báo |
| `*` | Route FE (`Feature`) | — | Không cần | Trang 404 — `NotFoundPage`, không phải chức năng nghiệp vụ. |

Ngoài route, hai thành phần dùng chung trên mọi trang cũng là lối vào use case: `(Sidebar)` → UC-AUTH-05; `(NotificationBell)` → UC-NOTI-01, UC-NOTI-02.

## B. Endpoint API ↔ Use Case

Cột Loại ghi guard phía backend: `PUBLIC` không cần đăng nhập, `AUTH` chỉ cần đăng nhập,
`USER` / `ADMIN` có `requireRole`; kèm cờ tính năng nếu có.

| Source Item | Loại | Use Case liên quan | Đã bao phủ? | Ghi chú |
|---|---|---|---|---|
| `GET /health` | API (PUBLIC) | — | Không cần | Kiểm tra sống của máy chủ — kỹ thuật vận hành, không có actor nghiệp vụ. |
| `GET /admin/overview` | API (ADMIN) | UC-ADM-01 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/users` | API (ADMIN) | UC-ADM-02 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/users/:id` | API (ADMIN) | UC-ADM-03 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/users/:id/role` | API (ADMIN) | UC-ADM-04 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/users/:id/status` | API (ADMIN) | UC-ADM-05 | Có | `be/src/modules/admin/admin.routes.ts` |
| `DELETE /admin/users/:id` | API (ADMIN) | UC-ADM-06 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/access/overview` | API (ADMIN) | UC-ADM-09 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/access/logs` | API (ADMIN) | UC-ADM-09 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/password-reset-requests` | API (ADMIN) | UC-ADM-07, UC-ADM-08 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/password-reset-requests/:id/approve` | API (ADMIN) | UC-ADM-07 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/password-reset-requests/:id/reject` | API (ADMIN) | UC-ADM-07 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/announcements/audience` | API (ADMIN) | UC-ADM-25 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/announcements` | API (ADMIN) | UC-ADM-25 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/groups` | API (ADMIN) | UC-ADM-17 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/groups/:id` | API (ADMIN) | UC-ADM-18 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/groups/:id/warn` | API (ADMIN) | UC-ADM-19 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/groups/:id/block` | API (ADMIN) | UC-ADM-20 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/groups/:id/unblock` | API (ADMIN) | UC-ADM-21 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/topics` | API (ADMIN) | UC-ADM-10 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/topics/:id` | API (ADMIN) | UC-ADM-10 | Có | `be/src/modules/admin/admin.routes.ts` |
| `DELETE /admin/topics/:id` | API (ADMIN) | UC-ADM-10 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/vocabulary` | API (ADMIN) | UC-ADM-11 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/vocabulary/:id` | API (ADMIN) | UC-ADM-11 | Có | `be/src/modules/admin/admin.routes.ts` |
| `DELETE /admin/vocabulary/:id` | API (ADMIN) | UC-ADM-11 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/study-set-reports` | API (ADMIN) | UC-ADM-12 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/study-set-reports/:id/dismiss` | API (ADMIN) | UC-ADM-16 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/study-sets/:id` | API (ADMIN) | UC-ADM-13 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/study-sets/:id/block` | API (ADMIN) | UC-ADM-14 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/study-sets/:id/unblock` | API (ADMIN) | UC-ADM-15 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/features` | API (ADMIN) | UC-ADM-24 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/features/:key` | API (ADMIN) | UC-ADM-24 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/shop/types` | API (ADMIN) | UC-ADM-22 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/shop/types` | API (ADMIN) | UC-ADM-22 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/shop/types/:id` | API (ADMIN) | UC-ADM-22 | Có | `be/src/modules/admin/admin.routes.ts` |
| `DELETE /admin/shop/types/:id` | API (ADMIN) | UC-ADM-22 | Có | `be/src/modules/admin/admin.routes.ts` |
| `GET /admin/shop/items` | API (ADMIN) | UC-ADM-23 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /admin/shop/items` | API (ADMIN) | UC-ADM-23 | Có | `be/src/modules/admin/admin.routes.ts` |
| `PATCH /admin/shop/items/:id` | API (ADMIN) | UC-ADM-23 | Có | `be/src/modules/admin/admin.routes.ts` |
| `DELETE /admin/shop/items/:id` | API (ADMIN) | UC-ADM-23 | Có | `be/src/modules/admin/admin.routes.ts` |
| `DELETE /admin/shop/items/:id/image` | API (ADMIN) | UC-ADM-23 | Có | `be/src/modules/admin/admin.routes.ts` |
| `POST /auth/register` | API (PUBLIC) | UC-AUTH-01 | Có | `be/src/modules/auth/auth.routes.ts` |
| `POST /auth/login` | API (PUBLIC) | UC-AUTH-02 | Có | `be/src/modules/auth/auth.routes.ts` |
| `POST /auth/refresh` | API (PUBLIC) | UC-AUTH-02 | Có | `be/src/modules/auth/auth.routes.ts` |
| `POST /auth/logout` | API (PUBLIC) | UC-AUTH-05 | Có | `be/src/modules/auth/auth.routes.ts` |
| `POST /auth/password-reset/request` | API (PUBLIC) | UC-AUTH-03 | Có | `be/src/modules/auth/auth.routes.ts` |
| `POST /auth/password-reset/confirm` | API (PUBLIC) | UC-AUTH-04 | Có | `be/src/modules/auth/auth.routes.ts` |
| `GET /auth/me` | API (AUTH) | UC-AUTH-06 | Có | `be/src/modules/auth/auth.routes.ts` |
| `PATCH /auth/me` | API (AUTH) | UC-AUTH-06 | Có | `be/src/modules/auth/auth.routes.ts` |
| `PUT /auth/me/avatar` | API (AUTH) | UC-AUTH-07 | Có | `be/src/modules/auth/auth.routes.ts` |
| `DELETE /auth/me/avatar` | API (AUTH) | UC-AUTH-07 | Có | `be/src/modules/auth/auth.routes.ts` |
| `POST /auth/me/change-password` | API (AUTH) | UC-AUTH-08 | Có | `be/src/modules/auth/auth.routes.ts` |
| `GET /community/posts` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-01, UC-GRP-07 | Có | `be/src/modules/community/community.routes.ts` |
| `GET /community/posts/:id` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-02 | Có | `be/src/modules/community/community.routes.ts` |
| `POST /community/posts` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-03, UC-GRP-08 | Có | `be/src/modules/community/community.routes.ts` |
| `DELETE /community/posts/:id` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-06 | Có | `be/src/modules/community/community.routes.ts` |
| `POST /community/posts/:id/comments` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-04 | Có | `be/src/modules/community/community.routes.ts` |
| `DELETE /community/comments/:id` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-07 | Có | `be/src/modules/community/community.routes.ts` |
| `POST /community/posts/:id/like` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-05 | Có | `be/src/modules/community/community.routes.ts` |
| `GET /community/attachments/:id` | API (AUTH, cờ COMMUNITY + adminBypass) | UC-COM-08 | Có | `be/src/modules/community/community.routes.ts` |
| `GET /features` | API (AUTH) | UC-ADM-24 | Có | `be/src/modules/feature-flags/feature.routes.ts` |
| `GET /goals` | API (USER, cờ GOALS) | UC-HAB-05 | Có | `be/src/modules/goals/goal.routes.ts` |
| `GET /goals/progress` | API (USER, cờ GOALS) | UC-HAB-06 | Có | `be/src/modules/goals/goal.routes.ts` |
| `POST /goals` | API (USER, cờ GOALS) | UC-HAB-05 | Có | `be/src/modules/goals/goal.routes.ts` |
| `PATCH /goals/:id` | API (USER, cờ GOALS) | UC-HAB-05 | Có | `be/src/modules/goals/goal.routes.ts` |
| `DELETE /goals/:id` | API (USER, cờ GOALS) | UC-HAB-05 | Có | `be/src/modules/goals/goal.routes.ts` |
| `GET /groups/mine` | API (AUTH, cờ GROUPS) | UC-GRP-01 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /groups/search` | API (AUTH, cờ GROUPS) | UC-GRP-02 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /groups/code/:code` | API (AUTH, cờ GROUPS) | UC-GRP-03 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups` | API (AUTH, cờ GROUPS) | UC-GRP-04 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /groups/:id` | API (AUTH, cờ GROUPS) | UC-GRP-07, UC-GRP-13 | Có | `be/src/modules/groups/group.routes.ts` |
| `PATCH /groups/:id` | API (AUTH, cờ GROUPS) | UC-GRP-11 | Có | `be/src/modules/groups/group.routes.ts` |
| `DELETE /groups/:id` | API (AUTH, cờ GROUPS) | UC-GRP-12 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups/:id/join` | API (AUTH, cờ GROUPS) | UC-GRP-05 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups/:id/leave` | API (AUTH, cờ GROUPS) | UC-GRP-06 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups/:id/requests/:userId/approve` | API (AUTH, cờ GROUPS) | UC-GRP-13 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups/:id/requests/:userId/reject` | API (AUTH, cờ GROUPS) | UC-GRP-13 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups/:id/members` | API (AUTH, cờ GROUPS) | UC-GRP-14 | Có | `be/src/modules/groups/group.routes.ts` |
| `PATCH /groups/:id/members/:userId/role` | API (AUTH, cờ GROUPS) | UC-GRP-16 | Có | `be/src/modules/groups/group.routes.ts` |
| `DELETE /groups/:id/members/:userId` | API (AUTH, cờ GROUPS) | UC-GRP-15 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /groups/:id/mentions` | API (AUTH, cờ GROUPS) | UC-GRP-08 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /groups/:id/documents` | API (AUTH, cờ GROUPS) | UC-GRP-09 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /groups/:id/study-sets` | API (AUTH, cờ GROUPS) | UC-GRP-10 | Có | `be/src/modules/groups/group.routes.ts` |
| `POST /groups/:id/study-sets` | API (AUTH, cờ GROUPS) | UC-GRP-17 | Có | `be/src/modules/groups/group.routes.ts` |
| `DELETE /groups/:id/study-sets/:setId` | API (AUTH, cờ GROUPS) | UC-GRP-18 | Có | `be/src/modules/groups/group.routes.ts` |
| `GET /habits` | API (USER, cờ HABITS) | UC-HAB-01 | Có | `be/src/modules/habits/habit.routes.ts` |
| `POST /habits` | API (USER, cờ HABITS) | UC-HAB-01 | Có | `be/src/modules/habits/habit.routes.ts` |
| `PATCH /habits/:id` | API (USER, cờ HABITS) | UC-HAB-01 | Có | `be/src/modules/habits/habit.routes.ts` |
| `DELETE /habits/:id` | API (USER, cờ HABITS) | UC-HAB-01 | Có | `be/src/modules/habits/habit.routes.ts` |
| `POST /habits/:id/check-in` | API (USER, cờ HABITS) | UC-HAB-02, UC-HAB-03 | Có | `be/src/modules/habits/habit.routes.ts` |
| `GET /habits/:id/check-ins` | API (USER, cờ HABITS) | UC-HAB-04 | Có | `be/src/modules/habits/habit.routes.ts` |
| `GET /habits/:id/completion-rate` | API (USER, cờ HABITS) | UC-HAB-04 | Có | `be/src/modules/habits/habit.routes.ts` |
| `GET /leaderboard` | API (USER, cờ LEADERBOARD) | UC-STAT-03 | Có | `be/src/modules/leaderboard/leaderboard.routes.ts` |
| `GET /library/sets` | API (USER, cờ VOCABULARY) | UC-LIB-01 | Có | `be/src/modules/library/library.routes.ts` |
| `GET /library/sets/mine` | API (USER, cờ VOCABULARY) | UC-LIB-02 | Có | `be/src/modules/library/library.routes.ts` |
| `GET /library/sets/:id` | API (USER, cờ VOCABULARY) | UC-LIB-03 | Có | `be/src/modules/library/library.routes.ts` |
| `POST /library/sets` | API (USER, cờ VOCABULARY) | UC-LIB-04 | Có | `be/src/modules/library/library.routes.ts` |
| `POST /library/sets/import` | API (USER, cờ VOCABULARY) | UC-LIB-05 | Có | `be/src/modules/library/library.routes.ts` |
| `PATCH /library/sets/:id` | API (USER, cờ VOCABULARY) | UC-LIB-04 | Có | `be/src/modules/library/library.routes.ts` |
| `DELETE /library/sets/:id` | API (USER, cờ VOCABULARY) | UC-LIB-04 | Có | `be/src/modules/library/library.routes.ts` |
| `POST /library/sets/:id/cards` | API (USER, cờ VOCABULARY) | UC-LIB-06 | Có | `be/src/modules/library/library.routes.ts` |
| `POST /library/sets/:id/cards/import` | API (USER, cờ VOCABULARY) | UC-LIB-07 | Có | `be/src/modules/library/library.routes.ts` |
| `PATCH /library/cards/:id` | API (USER, cờ VOCABULARY) | UC-LIB-06 | Có | `be/src/modules/library/library.routes.ts` |
| `DELETE /library/cards/:id` | API (USER, cờ VOCABULARY) | UC-LIB-06 | Có | `be/src/modules/library/library.routes.ts` |
| `POST /library/sets/:id/reports` | API (USER, cờ VOCABULARY) | UC-LIB-09 | Có | `be/src/modules/library/library.routes.ts` |
| `GET /notifications` | API (AUTH) | UC-NOTI-01 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `GET /notifications/unread-count` | API (AUTH) | UC-NOTI-01 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `PATCH /notifications/:id/read` | API (AUTH) | UC-NOTI-02 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `POST /notifications/read-all` | API (AUTH) | UC-NOTI-02 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `DELETE /notifications/:id` | API (AUTH) | UC-NOTI-03 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `GET /notifications/settings` | API (USER) | UC-NOTI-04 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `PUT /notifications/settings` | API (USER) | UC-NOTI-04 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `GET /notifications/reminders` | API (USER) | UC-NOTI-05 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `POST /notifications/reminders` | API (USER) | UC-NOTI-05 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `PATCH /notifications/reminders/:id` | API (USER) | UC-NOTI-05 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `DELETE /notifications/reminders/:id` | API (USER) | UC-NOTI-05 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `POST /notifications/devices` | API (AUTH) | UC-NOTI-06 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `DELETE /notifications/devices/:playerId` | API (AUTH) | UC-NOTI-06 | Có | `be/src/modules/notifications/notification.routes.ts` |
| `GET /rewards` | API (USER, cờ REWARDS) | UC-REW-01, UC-REW-02 | Có | `be/src/modules/rewards/rewards.routes.ts` |
| `POST /rewards/check-in` | API (USER, cờ REWARDS) | UC-REW-01 | Có | `be/src/modules/rewards/rewards.routes.ts` |
| `POST /rewards/missions/claim` | API (USER, cờ REWARDS) | UC-REW-02 | Có | `be/src/modules/rewards/rewards.routes.ts` |
| `POST /rewards/streak-freeze/buy` | API (USER, cờ REWARDS) | UC-REW-03 | Có | `be/src/modules/rewards/rewards.routes.ts` |
| `GET /shop/items/:id/image` | API (PUBLIC) | UC-SHOP-01 | Có | `be/src/modules/shop/shop.routes.ts` |
| `GET /shop/types` | API (USER, cờ SHOP) | UC-SHOP-01 | Có | `be/src/modules/shop/shop.routes.ts` |
| `GET /shop/items` | API (USER, cờ SHOP) | UC-SHOP-01, UC-SHOP-04 | Có | `be/src/modules/shop/shop.routes.ts` |
| `POST /shop/items/:id/buy` | API (USER, cờ SHOP) | UC-SHOP-02 | Có | `be/src/modules/shop/shop.routes.ts` |
| `PUT /shop/items/:id/favorite` | API (USER, cờ SHOP) | UC-SHOP-03 | Có | `be/src/modules/shop/shop.routes.ts` |
| `GET /shop/inventory` | API (USER, cờ SHOP) | UC-SHOP-04 | Có | `be/src/modules/shop/shop.routes.ts` |
| `PUT /shop/equipped/:typeId` | API (USER, cờ SHOP) | UC-SHOP-05 | Có | `be/src/modules/shop/shop.routes.ts` |
| `DELETE /shop/equipped/:typeId` | API (USER, cờ SHOP) | UC-SHOP-05 | Có | `be/src/modules/shop/shop.routes.ts` |
| `GET /shop/wallet` | API (USER, cờ SHOP) | UC-SHOP-06 | Có | `be/src/modules/shop/shop.routes.ts` |
| `GET /statistics/summary` | API (USER) | UC-STAT-01 | Có | `be/src/modules/statistics/statistics.routes.ts` |
| `GET /statistics/report` | API (USER, cờ REPORT) | UC-STAT-02 | Có | `be/src/modules/statistics/statistics.routes.ts` |
| `GET /statistics/streak` | API (USER) | UC-STAT-01 | Có | `be/src/modules/statistics/statistics.routes.ts` |
| `GET /statistics/level` | API (USER) | UC-STAT-01 | Có | `be/src/modules/statistics/statistics.routes.ts` |
| `GET /statistics/calendar` | API (USER) | UC-STAT-01 | Có | `be/src/modules/statistics/statistics.routes.ts` |
| `POST /study/questions` | API (USER, cờ VOCABULARY) | UC-STU-01, UC-STU-02, UC-STU-03 | Có | `be/src/modules/study/study.routes.ts` |
| `POST /study/answers` | API (USER, cờ VOCABULARY) | UC-STU-04 | Có | `be/src/modules/study/study.routes.ts` |
| `POST /study/sessions/finish` | API (USER, cờ VOCABULARY) | UC-STU-05 | Có | `be/src/modules/study/study.routes.ts` |
| `GET /study/overview` | API (USER, cờ VOCABULARY) | UC-STU-02 | Có | `be/src/modules/study/study.routes.ts` |
| `GET /study/due-count` | API (USER, cờ VOCABULARY) | UC-STU-02 | Có | `be/src/modules/study/study.routes.ts` |
| `GET /study/stats` | API (USER, cờ VOCABULARY) | UC-STU-06 | Có | `be/src/modules/study/study.routes.ts` |
| `GET /study/history` | API (USER, cờ VOCABULARY) | UC-STU-07 | Có | `be/src/modules/study/study.routes.ts` |
| `GET /topics` | API (ADMIN) | UC-ADM-10 | Có | `be/src/modules/topics/topic.routes.ts` |
| `GET /topics/:id` | API (ADMIN) | UC-ADM-10 | Có | `be/src/modules/topics/topic.routes.ts` |
| `GET /topics/:id/vocabulary` | API (ADMIN) | UC-ADM-11 | Có | `be/src/modules/topics/topic.routes.ts` |

## C. Bảng DB ↔ Use Case

| Source Item | Loại | Use Case liên quan | Đã bao phủ? | Ghi chú |
|---|---|---|---|---|
| `User` (`users`) | Bảng DB | UC-AUTH-01, UC-AUTH-02, UC-AUTH-03, UC-AUTH-04, UC-AUTH-06, UC-AUTH-08, UC-LIB-01, UC-STAT-03, UC-ADM-01, UC-ADM-02, UC-ADM-03, UC-ADM-04, UC-ADM-05, UC-ADM-06, UC-ADM-12, UC-ADM-13, UC-ADM-25 | Có |  |
| `UserAvatar` (`user_avatars`) | Bảng DB | UC-AUTH-07, UC-ADM-03 | Có |  |
| `LoginEvent` (`login_events`) | Bảng DB | UC-AUTH-02, UC-ADM-03, UC-ADM-09 | Có |  |
| `RefreshToken` (`refresh_tokens`) | Bảng DB | UC-AUTH-01, UC-AUTH-02, UC-AUTH-04, UC-AUTH-05, UC-AUTH-08, UC-ADM-01, UC-ADM-02, UC-ADM-03, UC-ADM-05, UC-ADM-09 | Có |  |
| `PasswordResetRequest` (`password_reset_requests`) | Bảng DB | UC-AUTH-03, UC-AUTH-04, UC-ADM-07, UC-ADM-08 | Có |  |
| `Goal` (`goals`) | Bảng DB | UC-HAB-05, UC-HAB-06, UC-STAT-02 | Có |  |
| `Habit` (`habits`) | Bảng DB | UC-HAB-01 | Có |  |
| `HabitCheckIn` (`habit_check_ins`) | Bảng DB | UC-HAB-01, UC-HAB-02, UC-HAB-03, UC-HAB-04 | Có |  |
| `Topic` (`topics`) | Bảng DB | UC-LIB-01, UC-LIB-02, UC-LIB-03, UC-LIB-04, UC-LIB-05, UC-STU-07, UC-GRP-10, UC-ADM-01, UC-ADM-10, UC-ADM-12, UC-ADM-13, UC-ADM-14, UC-ADM-15 | Có |  |
| `Vocabulary` (`vocabularies`) | Bảng DB | UC-LIB-01, UC-LIB-03, UC-LIB-04, UC-LIB-05, UC-LIB-06, UC-LIB-07, UC-STU-01, UC-STU-02, UC-STU-03, UC-STU-07, UC-ADM-01, UC-ADM-11, UC-ADM-13 | Có |  |
| `UserVocabProgress` (`user_vocab_progress`) | Bảng DB | UC-LIB-03, UC-STU-01, UC-STU-02, UC-STU-04, UC-STU-06, UC-NOTI-07 | Có |  |
| `CardReview` (`card_reviews`) | Bảng DB | UC-STU-04, UC-STU-05, UC-STU-06, UC-STU-07 | Có |  |
| `StudySetReport` (`study_set_reports`) | Bảng DB | UC-LIB-09, UC-ADM-12, UC-ADM-14, UC-ADM-16 | Có |  |
| `ActivityLog` (`activity_logs`) | Bảng DB | UC-STU-04, UC-STU-05, UC-STU-06, UC-HAB-02, UC-HAB-03, UC-HAB-06, UC-STAT-01, UC-STAT-02, UC-STAT-03, UC-REW-02, UC-REW-04, UC-NOTI-07, UC-NOTI-08, UC-ADM-01, UC-ADM-02, UC-ADM-03, UC-ADM-24 | Có | Nguồn sự thật của hoạt động học — ghi gián tiếp qua UC-STU-04, UC-STU-05, UC-HAB-02, UC-HAB-03. |
| `UserStreak` (`user_streaks`) | Bảng DB | UC-STU-04, UC-STU-05, UC-HAB-02, UC-HAB-03, UC-HAB-06, UC-STAT-01, UC-REW-04, UC-NOTI-08 | Có | Bảng dẫn xuất (cache) — ghi gián tiếp qua mọi use case ghi hoạt động học. |
| `NotificationSetting` (`notification_settings`) | Bảng DB | UC-NOTI-04, UC-NOTI-07, UC-NOTI-08 | Có |  |
| `Reminder` (`reminders`) | Bảng DB | UC-NOTI-05, UC-NOTI-07 | Có |  |
| `Notification` (`notifications`) | Bảng DB | UC-AUTH-03, UC-LIB-09, UC-GRP-05, UC-GRP-08, UC-GRP-13, UC-GRP-14, UC-GRP-17, UC-NOTI-01, UC-NOTI-02, UC-NOTI-03, UC-NOTI-07, UC-NOTI-08, UC-ADM-14, UC-ADM-15, UC-ADM-16, UC-ADM-19, UC-ADM-20, UC-ADM-21, UC-ADM-25 | Có |  |
| `UserDevice` (`user_devices`) | Bảng DB | UC-NOTI-06, UC-NOTI-07, UC-NOTI-08 | Có |  |
| `CoinTransaction` (`coin_transactions`) | Bảng DB | UC-REW-01, UC-REW-02, UC-REW-03, UC-SHOP-02, UC-SHOP-06 | Có |  |
| `Post` (`posts`) | Bảng DB | UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-06, UC-GRP-07, UC-GRP-08, UC-GRP-09, UC-GRP-12, UC-ADM-17, UC-ADM-18 | Có |  |
| `PostComment` (`post_comments`) | Bảng DB | UC-COM-01, UC-COM-02, UC-COM-04, UC-COM-06, UC-COM-07 | Có |  |
| `PostLike` (`post_likes`) | Bảng DB | UC-COM-01, UC-COM-05, UC-COM-06 | Có |  |
| `PostAttachment` (`post_attachments`) | Bảng DB | UC-COM-01, UC-COM-02, UC-COM-03, UC-COM-06, UC-COM-08, UC-GRP-08, UC-GRP-09 | Có |  |
| `Group` (`groups`) | Bảng DB | UC-GRP-01, UC-GRP-02, UC-GRP-03, UC-GRP-04, UC-GRP-07, UC-GRP-11, UC-GRP-12, UC-ADM-17, UC-ADM-18, UC-ADM-20, UC-ADM-21 | Có |  |
| `GroupMember` (`group_members`) | Bảng DB | UC-COM-08, UC-GRP-01, UC-GRP-04, UC-GRP-05, UC-GRP-06, UC-GRP-07, UC-GRP-12, UC-GRP-13, UC-GRP-14, UC-GRP-15, UC-GRP-16, UC-ADM-17, UC-ADM-18, UC-ADM-19 | Có |  |
| `GroupJoinRequest` (`group_join_requests`) | Bảng DB | UC-GRP-05, UC-GRP-12, UC-GRP-13 | Có |  |
| `GroupStudySet` (`group_study_sets`) | Bảng DB | UC-LIB-03, UC-GRP-10, UC-GRP-17, UC-GRP-18 | Có |  |
| `StreakFreeze` (`streak_freezes`) | Bảng DB | UC-REW-03, UC-REW-04 | Có |  |
| `FeatureFlag` (`feature_flags`) | Bảng DB | UC-ADM-24 | Có |  |
| `ShopItemType` (`shop_item_types`) | Bảng DB | UC-SHOP-01, UC-ADM-22 | Có |  |
| `ShopItem` (`shop_items`) | Bảng DB | UC-SHOP-01, UC-SHOP-02, UC-ADM-22, UC-ADM-23 | Có |  |
| `ShopItemImage` (`shop_item_images`) | Bảng DB | UC-SHOP-01, UC-ADM-23 | Có |  |
| `UserItem` (`user_items`) | Bảng DB | UC-SHOP-01, UC-SHOP-02, UC-SHOP-04, UC-SHOP-05, UC-SHOP-06, UC-ADM-23 | Có |  |
| `UserItemFavorite` (`user_item_favorites`) | Bảng DB | UC-SHOP-03, UC-SHOP-04 | Có |  |
| `UserEquippedItem` (`user_equipped_items`) | Bảng DB | UC-STAT-03, UC-SHOP-04, UC-SHOP-05 | Có |  |

## D. Thao tác giao diện ↔ Use Case

| Source Item | Loại | Use Case liên quan | Đã bao phủ? | Ghi chú |
|---|---|---|---|---|
| Ô "ban@example.com hoặc tentaikhoan", nút Đăng nhập | Thao tác UI trên `/login` | UC-AUTH-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Liên kết Quên mật khẩu, Đăng ký | Thao tác UI trên `/login` | UC-AUTH-03, UC-AUTH-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút "Nhận 50 xu hôm nay" | Thao tác UI trên `/` | UC-REW-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút "Nhiệm vụ 0/3" | Thao tác UI trên `/` | UC-REW-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút "Mua" (vật phẩm giữ chuỗi) | Thao tác UI trên `/` | UC-REW-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab 7 ngày / Tuần này / Tháng này / 90 ngày / 12 tháng; lịch 90 ngày | Thao tác UI trên `/` | UC-STAT-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút 7 / 30 / 90 ngày, Tháng này; ô chọn ngày | Thao tác UI trên `/report` | UC-STAT-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Thêm thói quen, Xoá thói quen | Thao tác UI trên `/habits` | UC-HAB-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Check-in | Thao tác UI trên `/habits` | UC-HAB-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút + Thêm mục tiêu, Đặt hạn, Xoá | Thao tác UI trên `/goals` | UC-HAB-05 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Khám phá, ô "Tìm theo tên hoặc mô tả bộ thẻ", Trước/Sau | Thao tác UI trên `/library` | UC-LIB-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Của tôi | Thao tác UI trên `/library` | UC-LIB-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Tạo bộ thẻ | Thao tác UI trên `/library` | UC-LIB-04 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Nhập từ file | Thao tác UI trên `/library` | UC-LIB-05 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Sửa, Xoá (bộ) | Thao tác UI trên `/library/:id` | UC-LIB-04 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Thêm thẻ, Sửa thẻ, Xoá thẻ | Thao tác UI trên `/library/:id` | UC-LIB-06 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Chia sẻ | Thao tác UI trên `/library/:id` | UC-LIB-08 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Báo cáo (chỉ bộ công khai của người khác) | Thao tác UI trên `/library/:id` | UC-LIB-09 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Học, Ôn nhanh | Thao tác UI trên `/library/:id` | UC-STU-01, UC-STU-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Danh sách bộ thẻ của tôi, nút Tìm trong Thư viện | Thao tác UI trên `/learn` | UC-STU-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Chọn nhóm Thẻ mới / Tới hạn / Quá hạn / Thẻ yếu; chế độ Flashcard / Trắc nghiệm; Bắt đầu | Thao tác UI trên `/review` | UC-STU-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Ôn nhanh (n) | Thao tác UI trên `/review` | UC-STU-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Khối Thống kê | Thao tác UI trên `/review` | UC-STU-06 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Lịch sử ôn | Thao tác UI trên `/review` | UC-STU-07 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Điểm học tập / Hoạt động; Tuần này / Tháng này / Từ trước tới nay | Thao tác UI trên `/leaderboard` | UC-STAT-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Ô Tìm vật phẩm, lọc Tất cả / Linh vật / Khung viền, Trang trước/sau | Thao tác UI trên `/shop` | UC-SHOP-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Mua | Thao tác UI trên `/shop` | UC-SHOP-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Yêu thích / Bỏ yêu thích | Thao tác UI trên `/shop` | UC-SHOP-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Yêu thích / Của tôi, lọc loại | Thao tác UI trên `/inventory` | UC-SHOP-04 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Bỏ dùng (và chọn dùng) | Thao tác UI trên `/inventory` | UC-SHOP-05 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Lọc Tất cả / Thu / Chi, Trang trước/sau | Thao tác UI trên `/wallet` | UC-SHOP-06 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Ô "Tìm trong tiêu đề và nội dung", Mới nhất / Nhiều tim nhất, bộ lọc Bài của tôi / Bài tôi đã thích / Có tệp đính kèm / Chưa có trả lời | Thao tác UI trên `/community` | UC-COM-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Đăng bài | Thao tác UI trên `/community` | UC-COM-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Nhóm của tôi, lọc Tất cả / Là thành viên / Là trưởng nhóm | Thao tác UI trên `/groups` | UC-GRP-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Khám phá nhóm | Thao tác UI trên `/groups` | UC-GRP-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Nhập mã nhóm | Thao tác UI trên `/groups` | UC-GRP-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Tạo nhóm | Thao tác UI trên `/groups` | UC-GRP-04 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Rời nhóm | Thao tác UI trên `/groups/:id` | UC-GRP-06 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Bảng tin | Thao tác UI trên `/groups/:id` | UC-GRP-07 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Đăng bài trong nhóm | Thao tác UI trên `/groups/:id` | UC-GRP-08 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Tài liệu nhóm: ô "Tìm theo tên tệp", nút Tải về | Thao tác UI trên `/groups/:id` | UC-GRP-09, UC-COM-08 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Flashcard: Mở bộ thẻ | Thao tác UI trên `/groups/:id` | UC-GRP-10 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Flashcard: Chia sẻ bộ thẻ vào nhóm, Gỡ khỏi nhóm | Thao tác UI trên `/groups/:id` | UC-GRP-17, UC-GRP-18 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Thành viên: ô tên tài khoản + Thêm | Thao tác UI trên `/groups/:id` | UC-GRP-14 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Thành viên: Hạ quyền / Phong trưởng nhóm | Thao tác UI trên `/groups/:id` | UC-GRP-16 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Thành viên: Xoá khỏi nhóm | Thao tác UI trên `/groups/:id` | UC-GRP-15 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Yêu cầu: Duyệt, Từ chối | Thao tác UI trên `/groups/:id` | UC-GRP-13 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Cài đặt: Lưu thay đổi | Thao tác UI trên `/groups/:id` | UC-GRP-11 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Cài đặt: Xoá nhóm | Thao tác UI trên `/groups/:id` | UC-GRP-12 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Tải ảnh lên | Thao tác UI trên `/profile` | UC-AUTH-07 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Khối Thông tin cá nhân: Lưu thay đổi | Thao tác UI trên `/profile` | UC-AUTH-06 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Khối Đổi mật khẩu | Thao tác UI trên `/profile` | UC-AUTH-08 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Khối Cài đặt nhắc nhở: Lưu cài đặt (chỉ Người học) | Thao tác UI trên `/profile` | UC-NOTI-04 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Thêm lời nhắc, Sửa lời nhắc, Xoá lời nhắc (chỉ Người học) | Thao tác UI trên `/profile` | UC-NOTI-05 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Lọc Tất cả / Chưa đọc / Đã đọc | Thao tác UI trên `/notifications` | UC-NOTI-01 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Đánh dấu đã đọc hết | Thao tác UI trên `/notifications` | UC-NOTI-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Xoá thông báo | Thao tác UI trên `/notifications` | UC-NOTI-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Ô tìm; lọc vai trò, trạng thái; sắp xếp | Thao tác UI trên `/admin/users` | UC-ADM-02 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Quản lý (mở modal chi tiết 3 tab) | Thao tác UI trên `/admin/users` | UC-ADM-03 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Yêu cầu: Xác nhận, Từ chối | Thao tác UI trên `/admin/requests` | UC-ADM-07 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Tab Nhật ký | Thao tác UI trên `/admin/requests` | UC-ADM-08 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Lọc 7/30/90 ngày, Tất cả / Chỉ thành công / Chỉ thất bại, Trước/Sau | Thao tác UI trên `/admin/access` | UC-ADM-09 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Ô tên chủ đề, chọn cấp độ, Thêm chủ đề, Xoá | Thao tác UI trên `/admin/content` | UC-ADM-10 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Lọc Tất cả / Chờ xử lý / Đã chặn / Đã bỏ qua | Thao tác UI trên `/admin/study-sets` | UC-ADM-12 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Xem | Thao tác UI trên `/admin/study-sets` | UC-ADM-13 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Ô tìm tên/mã; lọc trạng thái, chế độ; sắp xếp | Thao tác UI trên `/admin/groups` | UC-ADM-17 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Nút Xem | Thao tác UI trên `/admin/groups` | UC-ADM-18 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Thêm loại, Sửa loại, Xoá loại | Thao tác UI trên `/admin/shop` | UC-ADM-22 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Thêm vật phẩm, Sửa, Xoá, công tắc Đang bán, lọc loại | Thao tác UI trên `/admin/shop` | UC-ADM-23 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| 11 công tắc tính năng | Thao tác UI trên `/admin/features` | UC-ADM-24 | Có | Quan sát bằng trình duyệt 20/09/2026 |
| Ô tiêu đề, chọn đối tượng, ô liên kết, nút "Gửi tới n người" | Thao tác UI trên `/admin/announcements` | UC-ADM-25 | Có | Quan sát bằng trình duyệt 20/09/2026 |

Thao tác giao diện **cố ý không** mô hình hoá thành use case:

| Thao tác | Lý do |
|---|---|
| Đổi ngôn ngữ giao diện (Việt/Anh) | `LanguageSwitcher` — lưu `localStorage`, không gọi API; tuỳ chỉnh hiển thị, không phải nghiệp vụ. |
| Đổi giao diện sáng/tối | `ThemeToggle` — lưu `localStorage`; tuỳ chỉnh hiển thị. |
| Hiện/ẩn mật khẩu | Thao tác trên ô nhập. |
| Chuyển tab, phân trang, sắp xếp | Là một phần của use case xem danh sách tương ứng, không tách riêng. |
| Làm mới phiên bằng refresh token | Tự động, không có hành động của actor — gộp vào quy tắc của UC-AUTH-02. |

## E. Vai trò người dùng ↔ Actor

| Vai trò / nhận diện trong hệ thống | Nguồn | Actor |
|---|---|---|
| Chưa đăng nhập | Guard `PublicOnly` | Khách |
| `users.role = USER` | `enum UserRole` | Người học |
| `users.role = ADMIN` | `enum UserRole` | Quản trị viên |
| `USER` hoặc `ADMIN` | `requireAuth` không kèm `requireRole` | Người dùng đã xác thực (trừu tượng) |
| `group_members.role = LEADER` | `enum GroupMemberRole` | Trưởng nhóm |
| `group_members.role = MEMBER` | `enum GroupMemberRole` | Gộp vào Người học |
| `users.status = LOCKED` | `enum UserStatus` | Không phải actor — trạng thái chặn đăng nhập của cả hai vai trò |
| Cron `*/15`, `*/30` | `be/src/jobs` | Bộ lập lịch hệ thống |
| `onesignal.client.ts` | Gọi HTTP ra ngoài | OneSignal |

## F. Quy tắc phân quyền ↔ Association

Mỗi dòng đối chiếu actor của use case với guard THẬT của endpoint mà use case gọi. "Lệch" nghĩa
là backend cho phép rộng hơn mô hình.

| Use case | Endpoint | Actor trong mô hình | Guard BE | Cờ | Kết quả | Ghi chú |
|---|---|---|---|---|---|---|
| UC-AUTH-01 | `POST /auth/register` | Khách | PUBLIC | — | Khớp |  |
| UC-AUTH-02 | `POST /auth/login` | Khách | PUBLIC | — | Khớp |  |
| UC-AUTH-02 | `POST /auth/refresh` | Khách | PUBLIC | — | Khớp | Công khai, xác thực bằng cookie refresh token. |
| UC-AUTH-03 | `POST /auth/password-reset/request` | Khách | PUBLIC | — | Khớp |  |
| UC-AUTH-04 | `POST /auth/password-reset/confirm` | Khách | PUBLIC | — | Khớp |  |
| UC-AUTH-05 | `POST /auth/logout` | Người dùng đã xác thực | PUBLIC | — | Chấp nhận | API không gắn requireAuth; chỉ dựa vào cookie. |
| UC-AUTH-06 | `GET /auth/me` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-AUTH-06 | `PATCH /auth/me` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-AUTH-07 | `PUT /auth/me/avatar` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-AUTH-07 | `DELETE /auth/me/avatar` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-AUTH-08 | `POST /auth/me/change-password` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-LIB-01 | `GET /library/sets` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-02 | `GET /library/sets/mine` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-03 | `GET /library/sets/:id` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-04 | `POST /library/sets` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-04 | `PATCH /library/sets/:id` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-04 | `DELETE /library/sets/:id` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-05 | `POST /library/sets/import` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-06 | `POST /library/sets/:id/cards` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-06 | `PATCH /library/cards/:id` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-06 | `DELETE /library/cards/:id` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-07 | `POST /library/sets/:id/cards/import` | Người học | USER | VOCABULARY | Khớp |  |
| UC-LIB-09 | `POST /library/sets/:id/reports` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-01 | `POST /study/questions` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-02 | `GET /study/overview` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-02 | `GET /study/due-count` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-02 | `POST /study/questions` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-03 | `POST /study/questions` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-04 | `POST /study/answers` | — | USER | VOCABULARY | — | Use case không có actor người (chỉ qua quan hệ). |
| UC-STU-05 | `POST /study/sessions/finish` | — | USER | VOCABULARY | — | Use case không có actor người (chỉ qua quan hệ). |
| UC-STU-06 | `GET /study/stats` | Người học | USER | VOCABULARY | Khớp |  |
| UC-STU-07 | `GET /study/history` | Người học | USER | VOCABULARY | Khớp |  |
| UC-HAB-01 | `GET /habits` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-01 | `POST /habits` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-01 | `PATCH /habits/:id` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-01 | `DELETE /habits/:id` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-02 | `POST /habits/:id/check-in` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-03 | `POST /habits/:id/check-in` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-04 | `GET /habits/:id/check-ins` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-04 | `GET /habits/:id/completion-rate` | Người học | USER | HABITS | Khớp |  |
| UC-HAB-05 | `GET /goals` | Người học | USER | GOALS | Khớp |  |
| UC-HAB-05 | `POST /goals` | Người học | USER | GOALS | Khớp |  |
| UC-HAB-05 | `PATCH /goals/:id` | Người học | USER | GOALS | Khớp |  |
| UC-HAB-05 | `DELETE /goals/:id` | Người học | USER | GOALS | Khớp |  |
| UC-HAB-06 | `GET /goals/progress` | Người học | USER | GOALS | Khớp |  |
| UC-STAT-01 | `GET /statistics/summary` | Người học | USER | — | Khớp |  |
| UC-STAT-01 | `GET /statistics/streak` | Người học | USER | — | Khớp |  |
| UC-STAT-01 | `GET /statistics/level` | Người học | USER | — | Khớp |  |
| UC-STAT-01 | `GET /statistics/calendar` | Người học | USER | — | Khớp |  |
| UC-STAT-02 | `GET /statistics/report` | Người học | USER | REPORT | Khớp |  |
| UC-STAT-03 | `GET /leaderboard` | Người học | USER | LEADERBOARD | Khớp |  |
| UC-REW-01 | `GET /rewards` | Người học | USER | REWARDS | Khớp |  |
| UC-REW-01 | `POST /rewards/check-in` | Người học | USER | REWARDS | Khớp |  |
| UC-REW-02 | `GET /rewards` | Người học | USER | REWARDS | Khớp |  |
| UC-REW-02 | `POST /rewards/missions/claim` | Người học | USER | REWARDS | Khớp |  |
| UC-REW-03 | `POST /rewards/streak-freeze/buy` | Người học | USER | REWARDS | Khớp |  |
| UC-SHOP-01 | `GET /shop/types` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-01 | `GET /shop/items` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-01 | `GET /shop/items/:id/image` | Người học | PUBLIC | — | Chấp nhận | Cố ý công khai: thẻ <img> không gửi được token, ảnh không chứa dữ liệu người dùng. |
| UC-SHOP-02 | `POST /shop/items/:id/buy` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-03 | `PUT /shop/items/:id/favorite` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-04 | `GET /shop/inventory` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-04 | `GET /shop/items` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-05 | `PUT /shop/equipped/:typeId` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-05 | `DELETE /shop/equipped/:typeId` | Người học | USER | SHOP | Khớp |  |
| UC-SHOP-06 | `GET /shop/wallet` | Người học | USER | SHOP | Khớp |  |
| UC-COM-01 | `GET /community/posts` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-02 | `GET /community/posts/:id` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-03 | `POST /community/posts` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-04 | `POST /community/posts/:id/comments` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-05 | `POST /community/posts/:id/like` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-06 | `DELETE /community/posts/:id` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-07 | `DELETE /community/comments/:id` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-COM-08 | `GET /community/attachments/:id` | Người dùng đã xác thực | AUTH | COMMUNITY | Khớp |  |
| UC-GRP-01 | `GET /groups/mine` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-02 | `GET /groups/search` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-03 | `GET /groups/code/:code` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-04 | `POST /groups` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-05 | `POST /groups/:id/join` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-06 | `POST /groups/:id/leave` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-07 | `GET /groups/:id` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-07 | `GET /community/posts` | Người học | AUTH | COMMUNITY | Khớp | Bảng tin nhóm dùng endpoint Cộng đồng với `groupId`; tư cách thành viên kiểm ở service. |
| UC-GRP-08 | `POST /community/posts` | Người học | AUTH | COMMUNITY | Khớp | Endpoint dùng chung với UC-COM-03; tư cách thành viên kiểm ở service. |
| UC-GRP-08 | `GET /groups/:id/mentions` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-09 | `GET /groups/:id/documents` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-10 | `GET /groups/:id/study-sets` | Người học | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-11 | `PATCH /groups/:id` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-12 | `DELETE /groups/:id` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-13 | `GET /groups/:id` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-13 | `POST /groups/:id/requests/:userId/approve` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-13 | `POST /groups/:id/requests/:userId/reject` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-14 | `POST /groups/:id/members` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-15 | `DELETE /groups/:id/members/:userId` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-16 | `PATCH /groups/:id/members/:userId/role` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-17 | `POST /groups/:id/study-sets` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-GRP-18 | `DELETE /groups/:id/study-sets/:setId` | Trưởng nhóm | AUTH | GROUPS | Lệch | API chỉ cần đăng nhập; việc chặn Quản trị viên chỉ nằm ở guard giao diện. |
| UC-NOTI-01 | `GET /notifications` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-NOTI-01 | `GET /notifications/unread-count` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-NOTI-02 | `PATCH /notifications/:id/read` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-NOTI-02 | `POST /notifications/read-all` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-NOTI-03 | `DELETE /notifications/:id` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-NOTI-04 | `GET /notifications/settings` | Người học | USER | — | Khớp |  |
| UC-NOTI-04 | `PUT /notifications/settings` | Người học | USER | — | Khớp |  |
| UC-NOTI-05 | `GET /notifications/reminders` | Người học | USER | — | Khớp |  |
| UC-NOTI-05 | `POST /notifications/reminders` | Người học | USER | — | Khớp |  |
| UC-NOTI-05 | `PATCH /notifications/reminders/:id` | Người học | USER | — | Khớp |  |
| UC-NOTI-05 | `DELETE /notifications/reminders/:id` | Người học | USER | — | Khớp |  |
| UC-NOTI-06 | `POST /notifications/devices` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-NOTI-06 | `DELETE /notifications/devices/:playerId` | Người dùng đã xác thực | AUTH | — | Khớp |  |
| UC-ADM-01 | `GET /admin/overview` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-02 | `GET /admin/users` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-03 | `GET /admin/users/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-04 | `PATCH /admin/users/:id/role` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-05 | `PATCH /admin/users/:id/status` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-06 | `DELETE /admin/users/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-07 | `GET /admin/password-reset-requests` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-07 | `POST /admin/password-reset-requests/:id/approve` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-07 | `POST /admin/password-reset-requests/:id/reject` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-08 | `GET /admin/password-reset-requests` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-09 | `GET /admin/access/overview` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-09 | `GET /admin/access/logs` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-10 | `GET /topics` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-10 | `GET /topics/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-10 | `POST /admin/topics` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-10 | `PATCH /admin/topics/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-10 | `DELETE /admin/topics/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-11 | `GET /topics/:id/vocabulary` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-11 | `POST /admin/vocabulary` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-11 | `PATCH /admin/vocabulary/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-11 | `DELETE /admin/vocabulary/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-12 | `GET /admin/study-set-reports` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-13 | `GET /admin/study-sets/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-14 | `POST /admin/study-sets/:id/block` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-15 | `POST /admin/study-sets/:id/unblock` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-16 | `POST /admin/study-set-reports/:id/dismiss` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-17 | `GET /admin/groups` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-18 | `GET /admin/groups/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-19 | `POST /admin/groups/:id/warn` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-20 | `POST /admin/groups/:id/block` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-21 | `POST /admin/groups/:id/unblock` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-22 | `GET /admin/shop/types` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-22 | `POST /admin/shop/types` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-22 | `PATCH /admin/shop/types/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-22 | `DELETE /admin/shop/types/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-23 | `GET /admin/shop/items` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-23 | `POST /admin/shop/items` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-23 | `PATCH /admin/shop/items/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-23 | `DELETE /admin/shop/items/:id` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-23 | `DELETE /admin/shop/items/:id/image` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-24 | `GET /admin/features` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-24 | `PATCH /admin/features/:key` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-24 | `GET /features` | Quản trị viên | AUTH | — | Chấp nhận | Đọc cờ để giao diện ẩn/hiện menu, mở cho mọi tài khoản đã đăng nhập. |
| UC-ADM-25 | `GET /admin/announcements/audience` | Quản trị viên | ADMIN | — | Khớp |  |
| UC-ADM-25 | `POST /admin/announcements` | Quản trị viên | ADMIN | — | Khớp |  |

## G. Luồng nghiệp vụ ↔ Quan hệ use case

Đối chiếu với 13 luồng mô tả trong `docs/chuc-nang-va-luong-nghiep-vu.md` mục 4.

| Luồng nghiệp vụ | Use case | Quan hệ thể hiện luồng |
|---|---|---|
| 4.1 Phễu ghi hoạt động học | UC-STU-04, UC-STU-05, UC-HAB-02, UC-HAB-03 | Quy tắc nghiệp vụ trong đặc tả (không vẽ — thao tác nội bộ) |
| 4.2 Đăng nhập và duy trì phiên | UC-AUTH-02 | Luồng thay thế 7a (làm mới phiên) |
| 4.3 Quên mật khẩu | UC-AUTH-03, UC-AUTH-04, UC-ADM-07, UC-ADM-08 | UC-AUTH-04 «extend» UC-AUTH-03 |
| 4.4 Học và ôn tập | UC-STU-01…05 | 3 «include» tới UC-STU-04; UC-STU-05 «extend» UC-STU-01 |
| 4.5 Check-in thói quen | UC-HAB-02, UC-HAB-03 | UC-HAB-03 «extend» UC-HAB-02 |
| 4.6 Phần thưởng, giữ chuỗi | UC-REW-01…04 | Association của Bộ lập lịch với UC-REW-04 |
| 4.7 Mua vật phẩm | UC-SHOP-02 | — |
| 4.8 Vào nhóm | UC-GRP-02, 03, 05, 13 | UC-GRP-05 «extend» UC-GRP-02 và UC-GRP-03 |
| 4.9 Đăng bài có đề cập | UC-GRP-08, UC-COM-03 | UC-GRP-08 chuyên biệt hoá UC-COM-03 |
| 4.10 Báo cáo và kiểm duyệt bộ thẻ | UC-LIB-09, UC-ADM-12…16 | UC-LIB-09 «extend» UC-LIB-03 |
| 4.11 Cron nhắc nhở | UC-NOTI-07, UC-NOTI-08 | Association Bộ lập lịch → use case → OneSignal |
| 4.12 Bật, tắt tính năng | UC-ADM-24 | — |
| 4.13 Khoá tài khoản | UC-ADM-05 | — |

## H. Kết luận kiểm tra

**Đã có use case:** 30/31 route FE, 145/146 endpoint API, 36/36 bảng DB (kể cả gắn gián tiếp), 71/71 thao tác giao diện đã quan sát.

**Chưa được mô hình hoá:** không còn route, endpoint hay bảng nào chưa gắn use case.
Công cụ vận hành cố ý nằm ngoài phạm vi: `be/prisma/scripts/recompute-streak.ts`, `be/src/scripts/seed-shop.ts` (`--soft`), `be/prisma/seed.ts`, `.githooks/post-merge`.

**Trùng lặp:** không có hai use case trùng tên (kiểm tự động). Các endpoint dùng chung bởi nhiều use case là có chủ ý:
`POST /study/questions` (UC-STU-01, UC-STU-02, UC-STU-03); `POST /habits/:id/check-in` (UC-HAB-02, UC-HAB-03); `GET /rewards` (UC-REW-01, UC-REW-02); `GET /shop/items` (UC-SHOP-01, UC-SHOP-04); `GET /community/posts` (UC-COM-01, UC-GRP-07); `POST /community/posts` (UC-COM-03, UC-GRP-08); `GET /groups/:id` (UC-GRP-07, UC-GRP-13); `GET /admin/password-reset-requests` (UC-ADM-07, UC-ADM-08).

**Có bằng chứng ở mã nhưng thiếu đường vào giao diện:** UC-HAB-03 Check-in bù thói quen; UC-NOTI-06 Đăng ký thiết bị nhận thông báo đẩy. Ngoài ra UC-HAB-01 thiếu nút Sửa trên giao diện; UC-SHOP-06 thiếu ô lọc theo ngày.

**Actor chưa xác minh đầy đủ:** OneSignal — có mã gọi ra nhưng chưa cấu hình ở môi trường dev và chưa có thiết bị nào đăng ký được, nên chưa quan sát một lần gửi thật.

**Quan hệ / phân quyền cần xem lại:** 20 cặp lệch, đều thuộc nhóm lớp: `GET /groups/mine`, `GET /groups/search`, `GET /groups/code/:code`, `POST /groups`, `POST /groups/:id/join`, `POST /groups/:id/leave`, `GET /groups/:id`, `GET /groups/:id/mentions`, `GET /groups/:id/documents`, `GET /groups/:id/study-sets`, `PATCH /groups/:id`, `DELETE /groups/:id`, `POST /groups/:id/requests/:userId/approve`, `POST /groups/:id/requests/:userId/reject`, `POST /groups/:id/members`, `DELETE /groups/:id/members/:userId`, `PATCH /groups/:id/members/:userId/role`, `POST /groups/:id/study-sets`, `DELETE /groups/:id/study-sets/:setId`. Backend chỉ yêu cầu đăng nhập, còn việc Quản trị viên không vào nhóm lớp chỉ được chặn ở giao diện. Nếu quy tắc "Quản trị viên KHÔNG dùng khu nhóm của người học" phải được ép ở backend thì router `groups` còn thiếu `requireRole(USER)`.

Tài liệu này không khẳng định "bao phủ 100%" hệ thống: đối chiếu trên chỉ chứng minh mọi route, endpoint và bảng hiện có đều gắn với use case. Hành vi bên trong từng endpoint được đọc từ mã, không phải kiểm thử đầy đủ.
