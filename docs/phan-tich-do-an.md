# PHÂN TÍCH MÃ NGUỒN HỆ THỐNG ENG//HABIT

> Tài liệu hỗ trợ viết báo cáo Đồ án Khoa học Máy tính.
> Toàn bộ nội dung dẫn chứng từ mã nguồn thực tế trong repo (3 package: `shared`, `be`, `fe`;
> 8 migration; 23 bảng dữ liệu; 12 module backend; 13 feature frontend; 81 endpoint API).

## Bộ tài liệu

| File | Nội dung | Dùng cho phần nào của báo cáo |
|---|---|---|
| `docs/phan-tich-do-an.md` (file này) | Phân tích tổng thể A1-E3 | Toàn bộ các chương chính |
| `docs/phu-luc-erd.md` | Sơ đồ ERD (mã Mermaid), bảng quan hệ, ràng buộc UNIQUE, chỉ mục, enum | Chương "Thiết kế cơ sở dữ liệu" + Phụ lục |
| `docs/phu-luc-api.md` | Danh mục 81 endpoint kèm quyền, tham số, phản hồi, mã lỗi | Phụ lục "Đặc tả giao diện lập trình" |

---

# PHẦN A — THÔNG TIN TỔNG QUAN

## A1. Tên hệ thống và mục đích

**Tên hiển thị: `ENG//HABIT`** (tên gói npm là `@enghabit/*`, tên thư mục `enghabit`).

Dẫn chứng: `package.json` dòng 2-5 — `"name": "enghabit"`,
`"description": "English Learning Habit Building Application"`; component hiển thị tên là
`fe/src/shared/components/Wordmark.tsx`.

**Mục đích chính** (nêu rõ trong `CLAUDE.md`): ứng dụng **xây dựng và duy trì thói quen học
tiếng Anh**. Luận điểm cốt lõi của hệ thống: *"người học thường không thiếu tài liệu mà thiếu
cơ chế duy trì thói quen học đều đặn"*. Vì vậy hệ thống kết hợp 3 mảng:

1. **Học tiếng Anh** — từ vựng theo chủ đề, bài học có 8 dạng bài tập, flashcard lặp cách quãng, quiz.
2. **Quản lý mục tiêu và thói quen** — đặt mục tiêu (số từ/ngày, chuỗi N ngày...), tạo thói quen và check-in.
3. **Theo dõi và động viên** — chuỗi ngày học (streak), XP/cấp độ, thống kê, bảng xếp hạng,
   điểm danh nhận xu, nhiệm vụ ngày, vật phẩm giữ chuỗi, nhắc nhở.

## A2. Công nghệ sử dụng

### Frontend (`fe/package.json`)

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| `react` + `react-dom` | 18.3.1 | Thư viện UI |
| `vite` | 6.0.7 | Build tool / dev server |
| `typescript` | 5.7.3 | Strict mode (`fe/tsconfig.json`) |
| `react-router-dom` | 6.28.1 | Định tuyến (`fe/src/routes/AppRoutes.tsx`) |
| `@tanstack/react-query` | 5.62.11 | Quản lý server-state, cache (`*.hooks.ts` mỗi feature) |
| `zustand` | 5.0.2 | Client-state: phiên đăng nhập (`fe/src/features/auth/auth.store.ts`) |
| `axios` | 1.7.9 | HTTP client (`fe/src/shared/lib/api-client.ts`) |
| `tailwindcss` | 3.4.17 | CSS utility, biến màu ở `fe/src/index.css` |
| `lucide-react` | 1.37.0 | Bộ icon (dùng trong `Sidebar.tsx`) |
| `vitest` | 2.1.8 | Kiểm thử |

### Backend (`be/package.json`)

- **Ngôn ngữ**: TypeScript (ESM, `"type": "module"`), chạy trên Node >= 20.
- **Framework**: **Express 4.21.2** — quyết định có chủ ý, không dùng Fastify (lý do ghi trong
  `CLAUDE.md`: tài liệu/ví dụ nhiều, quy mô vài trăm user không cần hiệu năng của Fastify).
- Thư viện chính:

| Thư viện | Vai trò |
|---|---|
| `@prisma/client` 6.2.1 | ORM |
| `bcryptjs` 2.4.3 | Băm mật khẩu (10 rounds) |
| `jsonwebtoken` 9.0.2 | Sinh và kiểm tra JWT |
| `zod` 3.24.1 | Validate dữ liệu đầu vào |
| `helmet` 8.0.0 | Thiết lập HTTP header bảo mật |
| `cors`, `cookie-parser` | CORS và đọc cookie httpOnly |
| `pino` + `pino-http` | Structured log, mỗi request có request-id (`be/src/app.ts` dòng 37-46) |
| `node-cron` 3.0.3 | Hai job nền (nhắc nhở, vật phẩm giữ chuỗi) |
| `tsx` 4.19.2 | Chạy TypeScript ở chế độ dev |

### Database

- **MySQL** qua Prisma (`be/prisma/schema.prisma` dòng 12-15: `provider = "mysql"`,
  `url = env("DATABASE_URL")`).
- **23 bảng dữ liệu + 12 enum** (liệt kê chi tiết ở mục C1). Các bảng chính: `users`,
  `activity_logs`, `user_streaks`, `topics`, `vocabularies`, `user_vocab_progress`, `quizzes`,
  `quiz_questions`, `quiz_attempts`, `habits`, `habit_check_ins`, `goals`, `lesson_progress`,
  `mistakes`, `notifications`, `reminders`, `coin_transactions`, `streak_freezes`,
  `login_events`, `refresh_tokens`.
- Quy ước đặt tên: model Prisma dùng PascalCase số ít, bắt buộc `@@map` sang tên bảng
  snake_case số nhiều và `@map` cho cột. Charset `utf8mb4` (có tiếng Việt có dấu và emoji).
- Bắt buộc khai báo `connection_limit` trong connection string — `be/src/config/env.ts`
  dòng 42-48 cảnh báo nếu thiếu, vì MySQL free tier chỉ cho vài kết nối đồng thời.

### Package dùng chung (`shared/package.json`)

`@enghabit/shared` build bằng `tsup` ra `dist/`; `fe` và `be` import từ **bản build**, không
import thẳng file `.ts` nguồn (để Metro của React Native sau này resolve được).

Nội dung: 13 file Zod schema, 14 enum nghiệp vụ (13 ở `enums.ts` + `ExerciseType`), thuật toán SM-2, logic streak, công thức
XP/cấp độ, quy tắc phần thưởng, xử lý ảnh đại diện, kiểu `LocalDate` và các phép tính ngày.

### API bên thứ ba

- **OneSignal** — kênh gửi push notification duy nhất. `be/src/jobs/onesignal.client.ts`
  dòng 15 gọi `https://onesignal.com/api/v1/notifications`. Lưu ý quan trọng: **chỉ dùng làm
  kênh gửi**, lịch trình do cron của hệ thống quyết định (comment dòng 4-7 nêu rõ; nếu để
  OneSignal tự lên lịch thì có hai nguồn cùng gửi, người dùng nhận thông báo trùng). Chưa cấu
  hình API key thì chỉ ghi log, không làm chết job (dòng 19-22).
- **Không có** cổng thanh toán, bản đồ, dịch vụ gửi email, hay đăng nhập OAuth bên thứ ba.
  Xác thực tự triển khai hoàn toàn bằng JWT + bcrypt.
- Web Speech API của trình duyệt dùng cho phát âm từ vựng
  (`fe/src/features/lessons/components/AudioButton.tsx`).

## A3. Kiến trúc hệ thống

### Mô hình kiến trúc

**Monorepo pnpm workspace + kiến trúc phân lớp (layered) theo module nghiệp vụ
(modular/feature-based).**

Không phải microservice (một tiến trình Express duy nhất), cũng không phải MVC thuần (không có
tầng View phía server; frontend là SPA riêng biệt).

Backend phân **4 lớp cố định**, ghi trong `docs/architecture.md` mục 4:

```
routes.ts      -> định tuyến + gắn middleware (validate, auth-guard)
controller.ts  -> đọc request, gọi service, trả response (KHÔNG chứa nghiệp vụ)
service.ts     -> toàn bộ nghiệp vụ + truy cập DB qua Prisma
schema (Zod)   -> nằm ở shared/, dùng chung FE-BE
```

Ví dụ kiểm chứng: `be/src/modules/flashcards/flashcard.routes.ts` chỉ khai báo route và
middleware, `flashcard.controller.ts` đọc request, `flashcard.service.ts` chứa toàn bộ nghiệp vụ.

### Ba quyết định thiết kế cốt lõi

Trích `docs/architecture.md` mục 1:

**1. `ActivityLog` là nguồn sự thật duy nhất.** Mọi hoạt động học (học từ, ôn flashcard, làm
quiz, check-in thói quen) ghi vào một bảng duy nhất. Streak, thống kê ngày/tuần/tháng, tiến độ
mục tiêu, bảng xếp hạng — tất cả đều suy ra từ bảng này. Nơi **duy nhất** được phép ghi là hàm
`recordActivity()` trong `be/src/modules/activity-logs/activity-log.service.ts`.

*Lý do:* nếu mỗi module tự đếm số liệu riêng, khi số liệu hiển thị sai sẽ không biết nguồn nào
đúng. Có một nguồn duy nhất thì việc debug rút gọn thành: soi `activity_logs`, thấy dữ liệu
đúng thì lỗi nằm ở tầng đọc; thấy sai thì lỗi nằm ở tầng ghi.

**2. Ngày học tính theo `local_date`, không theo UTC.** `activity_logs` lưu cả `occurred_at`
(UTC) lẫn `local_date` (kiểu DATE, theo timezone của user tại thời điểm ghi). Mọi phép group
theo ngày dùng `local_date`.

*Lý do:* một user ở Việt Nam học lúc 23:30 ngày 10/03 thì theo UTC là 16:30 ngày 10/03 (trùng
ngày). Nhưng học lúc 07:00 ngày 11/03 thì theo UTC là 00:00 ngày 11/03. Nếu group theo UTC, các
mốc gần nửa đêm sẽ rơi sai ngày và streak đứt oan.

**3. Domain logic đặt ở `shared/`, không ở `be/`.** Thuật toán SM-2 (`shared/src/srs`) và tính
streak (`shared/src/streak`) là logic thuần, không phụ thuộc DB hay platform.

*Lý do:* FE cần hiển thị "chuỗi hiện tại" và "lần ôn tới", BE cần tính chính thức. Nếu viết hai
lần, hai bên sẽ lệch nhau sớm muộn.

### Cấu trúc thư mục

```
enghabit/
├── shared/                    @enghabit/shared — dùng chung fe + be
│   └── src/
│       ├── constants/         enums.ts (13 enum), exercise.ts (ExerciseType)
│       ├── schemas/           13 file Zod schema (auth, goal, habit, quiz, admin...)
│       ├── srs/               sm2.ts — thuật toán SuperMemo-2 (+ sm2.test.ts)
│       ├── streak/            streak.ts — tính chuỗi ngày (+ streak.test.ts)
│       ├── level/             level.ts — XP và cấp độ (+ level.test.ts)
│       ├── rewards/           rewards.ts — nhiệm vụ, giá vật phẩm (+ test)
│       ├── avatar/            avatar.ts — kiểm tra ảnh đại diện (+ test)
│       └── date/              local-date.ts — kiểu LocalDate và phép tính ngày
│
├── be/
│   ├── prisma/
│   │   ├── schema.prisma          23 model + 12 enum
│   │   ├── migrations/            8 migration
│   │   ├── seed.ts                dữ liệu mẫu idempotent
│   │   ├── seed-data/content.ts   chủ đề, từ vựng, câu hỏi quiz
│   │   └── scripts/recompute-streak.ts
│   └── src/
│       ├── app.ts, server.ts      khởi tạo Express, cron, graceful shutdown
│       ├── config/env.ts          validate biến môi trường bằng Zod
│       ├── lib/                   prisma.ts (singleton), logger.ts (pino)
│       ├── common/
│       │   ├── errors/            app-error.ts
│       │   ├── middlewares/       auth-guard, validate, error-handler, async-handler
│       │   └── utils/             db-date.ts
│       ├── modules/               12 module nghiệp vụ + activity-logs
│       └── jobs/                  reminder.job.ts, streak-freeze.job.ts, onesignal.client.ts
│
├── fe/
│   └── src/
│       ├── routes/AppRoutes.tsx   định tuyến + 4 loại guard
│       ├── features/<tên>/        api.ts -> hooks.ts -> components/  (13 feature)
│       └── shared/
│           ├── components/        AppLayout, Sidebar, Breadcrumb, FeatureErrorBoundary...
│           ├── i18n/              language.tsx, en.ts
│           └── lib/               api-client.ts, breadcrumbs.ts, labels.ts, config.ts
│
├── docs/                      architecture.md, color-rules.md, aiven-setup.md, deployment.md
└── mobile/                    CHƯA scaffold (dự kiến React Native + Expo)
```

**Ràng buộc bắt buộc:** tên module ở `be/src/modules/<x>` và `fe/src/features/<x>` phải
**giống hệt nhau** — không được đổi tên tuỳ tiện giữa hai phía.

**Hai quy ước kỹ thuật bắt buộc:**
- `be/src/lib/prisma.ts` export **một Prisma Client instance duy nhất** (singleton có guard cho
  hot-reload). Mỗi instance mở một pool riêng, hot-reload sẽ làm cạn connection của MySQL.
- `shared/` build ra `dist/`, các app import từ bản build.

---

# PHẦN B — CHỨC NĂNG HỆ THỐNG

## B1. Các nhóm chức năng chính

Đọc từ `be/src/app.ts` dòng 52-66. Toàn bộ API gắn dưới tiền tố `/api/v1`:

| # | Nhóm chức năng | Endpoint gốc | File router |
|---|---|---|---|
| 1 | Xác thực và tài khoản cá nhân | `/auth` | `auth.routes.ts` |
| 2 | Mục tiêu học tập | `/goals` | `goal.routes.ts` |
| 3 | Thói quen học tập | `/habits` | `habit.routes.ts` |
| 4 | Chủ đề và từ vựng | `/topics` | `topic.routes.ts` |
| 5 | Flashcard (ôn tập lặp cách quãng) | `/flashcards` | `flashcard.routes.ts` |
| 6 | Lộ trình bài học và ôn lỗi sai | `/lessons` | `lesson.routes.ts` |
| 7 | Quiz | `/quizzes` | `quiz.routes.ts` |
| 8 | Thống kê và chuỗi ngày | `/statistics` | `statistics.routes.ts` |
| 9 | Thông báo và nhắc nhở | `/notifications` | `notification.routes.ts` |
| 10 | Phần thưởng động viên | `/rewards` | `rewards.routes.ts` |
| 11 | Bảng xếp hạng | `/leaderboard` | `leaderboard.routes.ts` |
| 12 | Quản trị hệ thống | `/admin` | `admin.routes.ts` |
| — | Kiểm tra sức khoẻ hệ thống | `/health` | `app.ts` dòng 48-50 |

Ngoài API còn có **2 tiến trình nền** (`be/src/server.ts` dòng 18-22): job nhắc nhở chạy 15
phút/lượt và job tiêu vật phẩm giữ chuỗi chạy 30 phút/lượt.

## B2. Cây chức năng chi tiết

```
▶ 1. XÁC THỰC VÀ TÀI KHOẢN  (auth)
   └─ Đăng ký tài khoản                   POST   /auth/register
        · tự khởi tạo UserStreak, NotificationSetting và 1 mốc nhắc 20:00
          (auth.service.ts dòng 31-44)
   └─ Đăng nhập                           POST   /auth/login
        · ghi LoginEvent cả khi thất bại (NO_ACCOUNT / WRONG_PASSWORD / LOCKED)
        · chặn tài khoản LOCKED (auth.service.ts dòng 73-78)
   └─ Làm mới phiên (refresh rotation)    POST   /auth/refresh
   └─ Đăng xuất (thu hồi token)           POST   /auth/logout
   └─ Xem hồ sơ cá nhân                   GET    /auth/me
   └─ Sửa tên / múi giờ                   PATCH  /auth/me
   └─ Tải ảnh đại diện từ thiết bị        PUT    /auth/me/avatar
   └─ Xoá ảnh đại diện                    DELETE /auth/me/avatar
   └─ Đổi mật khẩu (thu hồi mọi phiên)    POST   /auth/me/change-password

▶ 2. MỤC TIÊU HỌC TẬP  (goals) — chỉ vai trò USER
   └─ Xem danh sách mục tiêu              GET    /goals
   └─ Xem tiến độ theo kỳ                 GET    /goals/progress
        · 4 loại: VOCAB_PER_DAY, MINUTES_PER_DAY, LESSONS_PER_WEEK, STREAK_TARGET
        · kỳ DAILY tính hôm nay, WEEKLY tính từ đầu tuần (goal.service.ts dòng 63)
   └─ Tạo mục tiêu                        POST   /goals
   └─ Sửa chỉ tiêu / trạng thái           PATCH  /goals/:id
   └─ Xoá mục tiêu                        DELETE /goals/:id
   └─ (tự động) Thông báo khi đạt mục tiêu — activity-log.service.ts dòng 88-118

▶ 3. THÓI QUEN HỌC TẬP  (habits) — chỉ USER
   └─ Danh sách + trạng thái hôm nay + 7 ngày gần nhất   GET    /habits
   └─ Tạo thói quen (DAILY / WEEKLY / CUSTOM chọn thứ)   POST   /habits
   └─ Sửa hoặc bật-tắt thói quen                        PATCH  /habits/:id
   └─ Xoá thói quen                                     DELETE /habits/:id
   └─ Check-in hoàn thành trong ngày                    POST   /habits/:id/check-in
        · unique(habitId, localDate) — mỗi ngày 1 lần, trùng trả lỗi 409
   └─ Lịch sử check-in                                  GET    /habits/:id/check-ins
   └─ Tỷ lệ hoàn thành (mẫu số theo tần suất)           GET    /habits/:id/completion-rate

▶ 4. CHỦ ĐỀ VÀ TỪ VỰNG  (topics / vocabulary)
   └─ Danh sách chủ đề kèm số từ          GET /topics
   └─ Chi tiết một chủ đề                 GET /topics/:id
   └─ Từ vựng của chủ đề + cờ "đã học"    GET /topics/:id/vocabulary

▶ 5. FLASHCARD — ÔN TẬP LẶP CÁCH QUÃNG  (flashcards) — chỉ USER
   └─ Lấy thẻ tới hạn ôn hôm nay          GET  /flashcards/due        (tối đa 20 thẻ)
   └─ Đếm thẻ tới hạn (badge sidebar)     GET  /flashcards/due/count
   └─ Chấm một lần ôn theo SM-2           POST /flashcards/review
        · quality 0-5, tính repetitions / intervalDays / easeFactor / nextReviewDate
   └─ Đưa một từ vào danh sách học        POST /flashcards/learn

▶ 6. LỘ TRÌNH BÀI HỌC  (lessons) — chỉ USER
   └─ Xem lộ trình (chủ đề -> bài, khoá/mở, điểm cao nhất)   GET /lessons/path
        · bài học là dữ liệu DẪN XUẤT: chia từ vựng thành nhóm 4 từ,
          không lưu nội dung bài trong DB (lesson.service.ts dòng 18-24)
   └─ Lấy đề bài của một bài                                GET /lessons/:topicId/:index
        · 8 dạng bài tập sinh tự động (exercise-generator.ts)
   └─ Nộp bài, backend tự chấm                              POST /lessons/submit
        · qua bài khi đúng >= 70% (LESSON_PASS_RATIO)
   └─ Đếm số từ đang sai                                    GET /lessons/mistakes/count
   └─ Danh sách từ đang sai                                 GET /lessons/mistakes
   └─ Bài luyện lại từ đã sai                               GET /lessons/mistakes/practice
        · trả lời đúng 2 lần liên tiếp thì xoá khỏi danh sách (CORRECT_TO_CLEAR)

▶ 7. QUIZ  (quizzes) — chỉ USER
   └─ Danh sách quiz (lọc theo chủ đề)    GET  /quizzes
   └─ Lấy đề (KHÔNG kèm đáp án đúng)      GET  /quizzes/:id
   └─ Nộp bài, chấm điểm ở server         POST /quizzes/:id/submit
   └─ Lịch sử làm bài                     GET  /quizzes/attempts

▶ 8. THỐNG KÊ VÀ CHUỖI NGÀY  (statistics) — chỉ USER
   └─ Tổng hợp theo ngày/tuần/tháng       GET /statistics/summary?range=
        · số liệu từng ngày, tổng theo 4 loại hoạt động, tỷ lệ ngày hoạt động
   └─ Chuỗi ngày học                      GET /statistics/streak
        · currentStreak, longestStreak, isAlive, deadline
   └─ Cấp độ và XP                        GET /statistics/level
   └─ Lịch hoạt động kiểu GitHub          GET /statistics/calendar?months=

▶ 9. THÔNG BÁO VÀ NHẮC NHỞ  (notifications)
   └─ [mọi vai trò] Danh sách thông báo (lọc chưa đọc, phân trang)  GET /notifications
   └─ [mọi vai trò] Đếm số chưa đọc                                GET /notifications/unread-count
   └─ [mọi vai trò] Đánh dấu đã đọc / đọc tất cả / xoá
   └─ [USER] Cấu hình chung (công tắc tổng, cảnh báo chuỗi, nhắc ôn)
             GET | PUT  /notifications/settings
   └─ [USER] Quản lý NHIỀU mốc nhắc trong ngày
             GET | POST | PATCH | DELETE  /notifications/reminders[/:id]
        · unique(userId, timeOfDay), tối đa MAX_REMINDERS_PER_USER
   └─ [mọi vai trò] Đăng ký / huỷ thiết bị nhận push
             POST /notifications/devices, DELETE /notifications/devices/:playerId
   └─ (nền) Cron nhắc học theo giờ user đặt         reminder.job.ts
   └─ (nền) Cron cảnh báo chuỗi sắp đứt lúc 21:30   reminder.job.ts dòng 32

▶ 10. PHẦN THƯỞNG ĐỘNG VIÊN  (rewards) — chỉ USER
   └─ Xem tổng hợp khu thưởng             GET  /rewards
        · số dư xu, trạng thái điểm danh, 3 nhiệm vụ ngày, kho vật phẩm
   └─ Điểm danh hằng ngày (+50 xu)        POST /rewards/check-in
   └─ Nhận thưởng nhiệm vụ ngày (+20 xu)  POST /rewards/missions/claim
        · 3 nhiệm vụ: học 5 từ mới / ôn 10 thẻ / check-in 1 thói quen
        · backend chấm LẠI tiến độ từ ActivityLog, không tin số FE gửi lên
   └─ Mua vật phẩm giữ chuỗi (200 xu)     POST /rewards/streak-freeze/buy
        · tối đa 3 cái, transaction có khoá dòng SELECT ... FOR UPDATE
   └─ (nền) Tự tiêu vật phẩm cứu chuỗi     streak-freeze.job.ts

▶ 11. BẢNG XẾP HẠNG  (leaderboard) — chỉ USER
   └─ Xếp hạng theo tuần / tháng / toàn thời gian    GET /leaderboard?range=
        · điểm = XP tính từ ActivityLog, dùng chung hàm xpFromActivityCounts
        · chỉ xếp hạng tài khoản USER đang ACTIVE
        · trả kèm thứ hạng của chính mình nếu nằm ngoài top

▶ 12. QUẢN TRỊ HỆ THỐNG  (admin) — chỉ ADMIN
   ├─ Tổng quan hệ thống                  GET /admin/overview
   │    · quy mô người dùng, người hoạt động 1/7/30 ngày, retention, kho nội dung,
   │      lượt truy cập, phiên đang mở, uptime, phiên bản Node, tình trạng kết nối DB
   ├─ Quản lý tài khoản
   │    └─ Tìm kiếm / lọc / sắp xếp / phân trang    GET    /admin/users
   │    └─ Xem hồ sơ chi tiết                      GET    /admin/users/:id
   │    └─ Đổi vai trò USER <-> ADMIN              PATCH  /admin/users/:id/role
   │    └─ Khoá / mở khoá tài khoản                PATCH  /admin/users/:id/status
   │    └─ Xoá tài khoản                           DELETE /admin/users/:id
   ├─ Quản lý yêu cầu cấp lại mật khẩu
   │    └─ Danh sách chờ / nhật ký                 GET  /admin/password-reset-requests?tab=
   │    └─ Duyệt yêu cầu                           POST /admin/password-reset-requests/:id/approve
   │    └─ Từ chối kèm lý do                       POST /admin/password-reset-requests/:id/reject
   ├─ Lượt truy cập
   │    └─ Biểu đồ theo ngày                       GET /admin/access/overview?days=
   │    └─ Nhật ký đăng nhập (cả lần thất bại, IP, user-agent)  GET /admin/access/logs
   ├─ Nội dung học tập
   │    └─ Chủ đề: thêm / sửa / xoá     POST | PATCH | DELETE  /admin/topics[/:id]
   │    └─ Từ vựng: thêm / sửa / xoá    POST | PATCH | DELETE  /admin/vocabulary[/:id]
   │    └─ Quiz: tạo quiz, thêm câu hỏi, xoá câu hỏi
   └─ Gửi thông báo tới người dùng
        └─ Xem trước số người nhận       GET  /admin/announcements/audience
        └─ Gửi (tất cả / theo vai trò)   POST /admin/announcements
```

## B3. Các actor của hệ thống

Hệ thống có **2 vai trò** (`enum UserRole` trong `be/prisma/schema.prisma` dòng 21-24 và
`shared/src/constants/enums.ts` dòng 6-10), cộng thêm 1 actor kỹ thuật.

### Actor 1 — Người học (`USER`)

Vai trò mặc định khi đăng ký (`role UserRole @default(USER)`).

**Làm được:** toàn bộ nhóm chức năng 1-11. Cụ thể: quản lý tài khoản cá nhân, đặt và theo dõi
mục tiêu, tạo và check-in thói quen, học từ vựng theo chủ đề, làm bài học với 8 dạng bài tập, ôn
flashcard theo SM-2, luyện lại từ sai, làm quiz, xem thống kê + streak + cấp độ, xem bảng xếp
hạng, điểm danh nhận xu, làm nhiệm vụ ngày, mua vật phẩm giữ chuỗi, đặt nhiều mốc nhắc nhở, nhận
thông báo.

### Actor 2 — Quản trị viên (`ADMIN`)

Đặc điểm thiết kế đáng chú ý: **quản trị viên KHÔNG phải người học**. Đăng nhập bằng tài khoản
ADMIN sẽ vào thẳng `/admin`, không có cấp độ, XP, chuỗi ngày, phần thưởng hay nhắc nhở học tập.

**Làm được:** nhóm 12 (toàn bộ quản trị) + nhóm 1 (tài khoản cá nhân, kể cả đổi ảnh đại diện) +
đọc `/topics` + đọc danh sách thông báo trong chuông.

**Bị chặn:** mọi module học tập chặn ngay ở tầng router bằng `requireRole(UserRole.USER)`. Ví dụ
`rewards.routes.ts` dòng 13: `rewardsRoutes.use(requireAuth, requireRole(UserRole.USER))`. Tương
tự ở `lessons`, `flashcards`, `quizzes`, `habits`, `goals`, `statistics`, `leaderboard`, và
`/notifications/settings|reminders`. Lý do: ẩn trên giao diện là chưa đủ — token admin gọi thẳng
API vẫn điểm danh lấy xu hay ghi ActivityLog được.

**Ba quy tắc an toàn bắt buộc** trong `be/src/modules/admin/admin.service.ts`:

1. Không tự hạ quyền, tự khoá, tự xoá chính mình (dòng 157-159, 180-182, 217).
2. Không xoá hay hạ quyền **quản trị viên hoạt động cuối cùng** — hàm `assertNotLastAdmin()`
   dòng 223-230. Mất hết admin thì phải sửa tay trong DB mới vào lại được.
3. Khoá tài khoản thì **thu hồi luôn refresh token** (dòng 189-194), nếu không người bị khoá vẫn
   dùng tiếp tới khi token hết hạn 30 ngày.

### Actor 3 — Hệ thống / Cron (actor kỹ thuật, không đăng nhập)

Hai job nền tự hành động thay người dùng:

- `be/src/jobs/reminder.job.ts` — 15 phút/lượt: gửi nhắc học theo mốc người dùng đặt, và cảnh
  báo chuỗi sắp đứt lúc 21:30 giờ địa phương.
- `be/src/jobs/streak-freeze.job.ts` — 30 phút/lượt: tự tiêu vật phẩm giữ chuỗi cho ngày người
  dùng nghỉ.

Đây là actor quan trọng nếu vẽ Use Case Diagram — nhiều use case không do người dùng khởi động.

## B4. Các Use Case quan trọng nhất

### UC-01. Đăng ký tài khoản

- **Actor:** Khách (chưa đăng nhập)
- **Tiền điều kiện:** Email chưa tồn tại trong hệ thống
- **Luồng chính:**
  1. Khách nhập tên, email, mật khẩu tại `/register` (`RegisterPage.tsx`).
  2. FE validate bằng `registerSchema`: tên >= 2 ký tự, email hợp lệ, mật khẩu 8-72 ký tự có cả
     chữ và số (`shared/src/schemas/auth.schema.ts` dòng 5-17).
  3. Gửi `POST /api/v1/auth/register`; middleware `validateBody(registerSchema)` validate lại ở server.
  4. `auth.service.register()` kiểm tra email trùng; nếu có thì ném `ConflictError` (HTTP 409).
  5. Băm mật khẩu bằng bcrypt 10 rounds, tạo bản ghi `User` **đồng thời** khởi tạo `UserStreak`,
     `NotificationSetting` và một mốc nhắc mặc định 20:00 cả tuần.
  6. Cấp `accessToken` (JWT hạn 15 phút) và `refreshToken` (chuỗi ngẫu nhiên hạn 30 ngày, lưu
     hash SHA-256 trong DB).
- **Kết quả:** Tài khoản vai trò `USER`, trạng thái `ACTIVE`, timezone mặc định
  `Asia/Ho_Chi_Minh`; người dùng vào thẳng trang Tổng quan.

### UC-02. Đăng nhập

- **Actor:** Người học / Quản trị viên
- **Tiền điều kiện:** Tài khoản tồn tại và ở trạng thái `ACTIVE`
- **Luồng chính:**
  1. Nhập email và mật khẩu, gửi `POST /auth/login`.
  2. Tìm user theo email. Không có thì ghi `LoginEvent(success=false, reason=NO_ACCOUNT)`, trả 401.
  3. `bcrypt.compare` mật khẩu. Sai thì ghi `LoginEvent(reason=WRONG_PASSWORD)`, trả 401 với
     **cùng một thông báo** "Email hoặc mật khẩu không đúng" để không lộ email nào đã tồn tại
     (`auth.service.ts` dòng 62-63).
  4. Nếu `status = LOCKED` thì ghi `LoginEvent(reason=LOCKED)` và trả 403 kèm lý do rõ ràng
     (mật khẩu đã đúng nên không lộ thêm thông tin gì, mà người dùng cần biết phải liên hệ admin).
  5. Thành công: ghi `LoginEvent(success=true, ip, userAgent)` và cập nhật `User.lastLoginAt`,
     rồi cấp cặp token.
  6. FE điều hướng theo vai trò: ADMIN vào `/admin`, USER vào `/` (`AppRoutes.tsx` dòng 98-103).
- **Kết quả:** Có phiên đăng nhập; một dòng nhật ký truy cập cho trang quản trị.

### UC-03. Học một bài trong lộ trình

- **Actor:** Người học
- **Tiền điều kiện:** Bài đã mở khoá (bài đầu tiên luôn mở, bài sau mở khi bài liền trước đã
  hoàn thành — `lesson.service.ts` dòng 62)
- **Luồng chính:**
  1. Vào `/learn`, gọi `GET /lessons/path` trả danh sách chủ đề, mỗi bài kèm `isUnlocked`,
     `isCompleted`, `bestScore`.
  2. Chọn bài, gọi `GET /lessons/:topicId/:index`. Server lấy 4 từ (`WORDS_PER_LESSON`) và sinh
     bài tập bằng `generateLessonExercises` với **hạt giống cố định** `topicId * 1000 + index`
     để vào lại vẫn ra đúng đề đó.
  3. Người học làm lần lượt các dạng bài (chọn nghĩa, chọn từ, ghép cặp, sắp xếp câu, điền chỗ
     trống, gõ từ, nghe-gõ, nghe-chọn) trên `LessonPlayer.tsx`.
  4. Gửi `POST /lessons/submit` kèm mảng đáp án. **Server tự chấm** bằng cách đối chiếu với bảng
     `vocabularies` — không tin đánh giá đúng/sai do client gửi (comment dòng 102-107).
  5. Trong một transaction: cập nhật bảng `mistakes` (sai thì thêm hoặc tăng `timesWrong`; đúng
     thì tăng `timesCorrect`, đủ 2 lần thì xoá), nếu đạt >= 70% thì `upsert LessonProgress` (chỉ
     nâng điểm chứ không hạ), và gọi `recordActivity(VOCAB_LEARNED)`.
- **Kết quả:** Ghi `ActivityLog`, streak cập nhật, mở khoá bài kế tiếp; từ sai vào danh sách
  "Ôn lại câu sai".

### UC-04. Ôn tập flashcard theo SM-2

- **Actor:** Người học
- **Tiền điều kiện:** Có ít nhất một từ trong `user_vocab_progress` đã tới hạn ôn
- **Luồng chính:**
  1. `GET /flashcards/due` lấy tối đa 20 thẻ có `nextReviewDate <= hôm nay (theo giờ địa phương)`.
  2. Người học lật thẻ và tự đánh giá mức độ nhớ theo thang `ReviewQuality` 0-5.
  3. Gửi `POST /flashcards/review` với `{vocabularyId, quality}`.
  4. Service gọi `reviewCard(state, quality, today)` từ `shared/src/srs/sm2.ts`: quality < 3 thì
     reset `repetitions = 0` và ôn lại sau 1 ngày; quality >= 3 thì lần 1 cách 1 ngày, lần 2
     cách 6 ngày, từ lần 3 nhân `easeFactor` (chặn dưới ở 1.3).
  5. Transaction: cập nhật `UserVocabProgress` và `recordActivity(FLASHCARD_REVIEWED)`.
- **Kết quả:** Lịch ôn mới cho từ đó; streak và XP cập nhật (+4 XP mỗi thẻ theo `XP_PER_ACTIVITY`).

### UC-05. Làm bài quiz

- **Actor:** Người học
- **Tiền điều kiện:** Quiz đã được quản trị viên tạo và có câu hỏi
- **Luồng chính:**
  1. `GET /quizzes` xem danh sách, chọn bài, gọi `GET /quizzes/:id`.
  2. Server trả đề **đã loại bỏ `correctIndex`** — đáp án đúng không bao giờ rời khỏi backend
     trước khi nộp bài (`quiz.service.ts` dòng 24-27).
  3. Người học chọn đáp án trên `QuizAttempt.tsx`, gửi `POST /quizzes/:id/submit`.
  4. Server đối chiếu với `correctIndex` trong DB, tính `score / total`.
  5. Transaction: tạo `QuizAttempt` (lưu chi tiết đáp án dạng JSON) và
     `recordActivity(QUIZ_COMPLETED, value = score)`.
- **Kết quả:** Kết quả chi tiết từng câu; +20 XP; lịch sử lưu ở `quiz_attempts`.

### UC-06. Check-in thói quen hằng ngày

- **Actor:** Người học
- **Tiền điều kiện:** Thói quen thuộc sở hữu người dùng (`assertOwnership`), chưa check-in hôm nay
- **Luồng chính:**
  1. Vào `/habits`; `GET /habits` trả kèm `checkedInToday` để **vô hiệu hoá nút sẵn**, tránh
     người dùng bấm rồi nhận lỗi 409 dù không làm gì sai (`habit.service.ts` dòng 27-32).
  2. Bấm Check-in, gửi `POST /habits/:id/check-in`.
  3. Service kiểm tra `HabitCheckIn` theo `unique(habitId, localDate)`; đã có thì ném
     `ConflictError` 409.
  4. Transaction: tạo `HabitCheckIn` và `recordActivity(HABIT_CHECKIN)`.
- **Kết quả:** Ngày được đánh dấu hoàn thành; +12 XP; streak +1 nếu là hoạt động đầu tiên trong ngày.

### UC-07. Xem thống kê và chuỗi ngày học

- **Actor:** Người học
- **Tiền điều kiện:** Đã đăng nhập với vai trò USER
- **Luồng chính:**
  1. Vào `/`; `DashboardPage.tsx` gọi song song `GET /statistics/summary?range=week`,
     `/statistics/streak`, `/statistics/level`, `/statistics/calendar`.
  2. `getDailyStats` group `ActivityLog` theo `(localDate, type)`, **điền cả những ngày không có
     hoạt động với giá trị 0** để biểu đồ liền mạch (`statistics.service.ts` dòng 110).
  3. `getStreak` đọc cache `UserStreak` nhưng luôn đối chiếu với hôm nay qua `displayStreak()`:
     không học hôm nay lẫn hôm qua thì hiện 0, dù DB vẫn giữ số cũ.
  4. `getLevel` group toàn bộ `ActivityLog` theo loại, đưa qua `xpFromActivityCounts` rồi
     `levelFromXp`.
  5. Lịch hoạt động kiểu GitHub chia 4 mức đậm nhạt theo **phân vị** chứ không theo giá trị lớn
     nhất, để một ngày học đột biến không làm toàn bộ ngày còn lại tụt xuống mức nhạt nhất.
- **Kết quả:** Người học thấy chuỗi hiện tại và dài nhất, tỷ lệ ngày hoạt động, biểu đồ theo
  loại hoạt động, cấp độ và số XP còn thiếu để lên cấp.

### UC-08. Điểm danh và nhận thưởng nhiệm vụ ngày

- **Actor:** Người học
- **Tiền điều kiện:** Chưa điểm danh trong ngày local hiện tại
- **Luồng chính:**
  1. `GET /rewards` gọi `getRewardsSummary(userId, timezone)`, chạy song song 4 truy vấn: số dư
     xu (= `SUM(coin_transactions.amount)`), các khoản đã nhận hôm nay, số lượt hoạt động hôm
     nay theo loại, và trạng thái kho vật phẩm.
  2. `evaluateMissions(counts, claimed)` từ `shared/rewards` chấm 3 nhiệm vụ cố định: học 5 từ /
     ôn 10 thẻ / check-in 1 thói quen. **Tiến độ không lưu ở đâu cả** — chấm lại từ `ActivityLog`
     mỗi lần đọc.
  3. Nhiệm vụ đã đủ thì nút "Nhận" sáng lên trên `RewardsBar`.
  4. Gửi `POST /rewards/missions/claim {missionId}`.
  5. `claimMission()` **chấm lại** tiến độ từ `ActivityLog` ở server — không tin số FE gửi lên,
     nên sửa vài dòng trong devtools cũng không nhận được thưởng. Chưa đạt thì trả
     `BadRequestError` 400.
  6. `addCoins()` chèn `coin_transactions` với `dedupeKey = "MISSION:<id>:<local_date>"`. Ràng
     buộc `unique(user_id, dedupe_key)` của DB là thứ **duy nhất** chống trùng — hai request bấm
     cùng lúc thì một thành công, một dính lỗi P2002.
  7. Bắt P2002 và đổi thành `ConflictError` 409 "Bạn đã nhận thưởng nhiệm vụ này hôm nay" — báo
     lỗi rõ ràng thay vì lặng lẽ bỏ qua, để FE nói được với người dùng vì sao không có gì xảy ra.
- **Kết quả:** Số dư xu tăng. **Tuyệt đối không ghi `ActivityLog` và không cộng XP**: ghi
  `ActivityLog` thì bấm một nút là đủ giữ streak và mọi thống kê học tập sẽ nói dối; còn XP suy
  ra từ `ActivityLog` nên về nguyên tắc không thể tặng thêm.

### UC-09. Hệ thống gửi nhắc nhở học tập (use case do cron khởi động)

- **Actor:** Hệ thống (cron)
- **Tiền điều kiện:** `ENABLE_REMINDER_JOB = true`; user có `notification_settings.isEnabled =
  true` và ít nhất một `Reminder` đang bật
- **Luồng chính** (`be/src/jobs/reminder.job.ts`, chạy 15 phút một lượt):
  1. Lượt 1 — quét bảng `reminders` của các user **vai trò USER** có công tắc tổng đang bật.
  2. Với mỗi mốc: tính giờ địa phương của user bằng `Intl.DateTimeFormat` với `timeZone`; kiểm
     tra hôm nay có nằm trong `daysOfWeek` không; kiểm tra giờ hiện tại có rơi vào cửa sổ 15
     phút sau `timeOfDay` không.
  3. **Kiểm tra `ActivityLog` theo `local_date`** — hôm nay đã học rồi thì bỏ qua ("nhắc người
     đang học đều là cách nhanh nhất khiến họ tắt thông báo").
  4. Nội dung thông báo thay đổi theo việc đang tồn: có thẻ tới hạn thì gợi ý ôn; còn từ sai thì
     gợi ý luyện lại; đang có chuỗi thì nhắc giữ chuỗi.
  5. **Lưu vào bảng `notifications` trước**, với
     `dedupeKey = "DAILY_REMINDER:<reminderId>:<local_date>"` — có `reminderId` để mốc 8:00 và
     20:00 không bị coi là trùng nhau. Nếu bản ghi đã tồn tại thì không push.
  6. Sau khi lưu thành công mới gọi `sendPush()` qua OneSignal tới các `playerId` của thiết bị.
  7. Lượt 2 — lúc 21:30 giờ địa phương, cảnh báo chuỗi sắp đứt cho user đang có chuỗi > 0 mà hôm
     nay chưa học.
- **Kết quả:** Thông báo hiện trong chuông (nguồn chính) và push (kênh phụ). Cron chạy lại trong
  ngày không tạo bản ghi trùng.

### UC-10. Quản trị viên khoá tài khoản người dùng

- **Actor:** Quản trị viên
- **Tiền điều kiện:** Đăng nhập với vai trò ADMIN; tài khoản đích không phải chính mình, và
  không phải quản trị viên hoạt động cuối cùng
- **Luồng chính:**
  1. Vào `/admin/users` (`AdminUsersPage.tsx`), tìm kiếm hoặc lọc theo vai trò, trạng thái, sắp xếp.
  2. Bấm Khoá, gửi `PATCH /admin/users/:id/status` với `{status: "LOCKED"}`.
  3. Middleware `requireAuth` + `requireRole(ADMIN)` (`admin.routes.ts` dòng 41).
  4. `updateUserStatus()` kiểm 2 điều kiện an toàn: không tự khoá mình; nếu đích là ADMIN thì
     gọi `assertNotLastAdmin()`.
  5. Cập nhật `users.status = LOCKED`, **rồi** `refreshToken.updateMany({revokedAt: now})` để
     cắt phiên đang mở ngay lập tức.
- **Kết quả:** Người bị khoá không đăng nhập được (403) và cũng không refresh được token; **dữ
  liệu học vẫn giữ nguyên** vì khoá là biện pháp đảo ngược được, khác hẳn xoá.

---

# PHẦN C — DỮ LIỆU VÀ CƠ SỞ DỮ LIỆU

## C1. Danh sách bảng

Toàn bộ trích từ `be/prisma/schema.prisma`. Ký hiệu: **PK** = khoá chính, **FK** = khoá ngoại,
**UQ** = ràng buộc duy nhất.

### Nhóm 1 — Người dùng và xác thực

#### Bảng `users` (model `User`, dòng 117-156)

| Cột | Kiểu | Ràng buộc / ghi chú |
|---|---|---|
| `id` | INT AUTO_INCREMENT | **PK** |
| `name` | VARCHAR(100) | |
| `email` | VARCHAR(190) | **UQ** — 190 để vừa giới hạn index của utf8mb4 |
| `password_hash` | VARCHAR(255) | bcrypt |
| `role` | ENUM(USER, ADMIN) | mặc định USER |
| `status` | ENUM(ACTIVE, LOCKED) | mặc định ACTIVE |
| `last_login_at` | DATETIME NULL | dẫn xuất từ `login_events`, lưu sẵn để đọc nhanh |
| `timezone` | VARCHAR(64) | chuỗi IANA, mặc định `Asia/Ho_Chi_Minh` |
| `created_at`, `updated_at` | DATETIME | |

#### Bảng `user_avatars` (dòng 166-180)

`user_id` INT **PK + FK** (quan hệ 1-1 với `users`), `data` MEDIUMBLOB, `mime_type` VARCHAR(30),
`updated_at` DATETIME.

Ghi chú thiết kế: tách bảng riêng chứ không để cột trên `users` vì dữ liệu ảnh nặng hơn hẳn phần
còn lại của một dòng user; để chung thì mọi truy vấn `findMany` không chọn cột (danh sách người
dùng của trang quản trị, bảng xếp hạng...) sẽ kéo theo cả đống byte không dùng.

#### Bảng `login_events` (dòng 186-204)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | INT | **PK** |
| `user_id` | INT **NULL** | **FK** -> users, `onDelete: SetNull` |
| `email` | VARCHAR(190) | |
| `success` | BOOLEAN | |
| `reason` | VARCHAR(32) NULL | NO_ACCOUNT / WRONG_PASSWORD / LOCKED |
| `ip_address` | VARCHAR(45) | 45 ký tự đủ cho IPv6 |
| `user_agent` | VARCHAR(255) | |
| `created_at` | DATETIME | |

Index: `createdAt`, `userId`. Ghi cả lần thất bại để quản trị viên nhìn ra dấu hiệu dò mật khẩu.

#### Bảng `refresh_tokens` (dòng 207-219)

`id` PK; `user_id` FK; `token_hash` VARCHAR(255) **UQ**; `expires_at` DATETIME;
`revoked_at` DATETIME NULL; `created_at`. Lưu hash để nếu DB lộ thì token cũng không dùng lại được.

### Nhóm 2 — Mục tiêu và thói quen

#### Bảng `goals` (dòng 225-242)

`id` PK; `user_id` FK; `type` ENUM(VOCAB_PER_DAY, MINUTES_PER_DAY, LESSONS_PER_WEEK,
STREAK_TARGET); `target_value` INT; `period` ENUM(DAILY, WEEKLY); `start_date` DATE;
`end_date` DATE NULL; `status` ENUM(ACTIVE, COMPLETED, ARCHIVED). Index `(userId, status)`.

#### Bảng `habits` (dòng 244-266)

`id` PK; `user_id` FK; `name` VARCHAR(120); `frequency` ENUM(DAILY, WEEKLY, CUSTOM);
`custom_days` JSON NULL (mảng thứ 1-7 theo ISO); `reminder_time` VARCHAR(5) NULL;
`is_active` BOOLEAN. Index `(userId, isActive)`.

#### Bảng `habit_check_ins` (dòng 268-285)

`id` PK; `habit_id` FK; `user_id` FK; `local_date` DATE; `note` VARCHAR(500) NULL.
**UQ `(habit_id, local_date)`** — mỗi ngày chỉ check-in một lần. Index `(userId, localDate)`.

### Nhóm 3 — Nội dung học

#### Bảng `topics` (dòng 291-308)

`id` PK; `name` VARCHAR(120); `description` VARCHAR(1000) NULL;
`level` ENUM(BEGINNER, INTERMEDIATE, ADVANCED); `created_by_id` INT NULL FK (`SetNull`).
Index `level`.

#### Bảng `vocabularies` (dòng 310-328)

`id` PK; `topic_id` FK (Cascade); `word` VARCHAR(100); `meaning` VARCHAR(500);
`phonetic` VARCHAR(100) NULL; `example` VARCHAR(500) NULL; `audio_url` VARCHAR(500) NULL.
Index `topicId`.

#### Bảng `user_vocab_progress` (dòng 331-351)

`id` PK; `user_id` FK; `vocabulary_id` FK; `repetitions` INT; `interval_days` INT;
`ease_factor` FLOAT (mặc định 2.5); `next_review_date` DATE; `last_reviewed_at` DATETIME NULL.
**UQ `(user_id, vocabulary_id)`**. Index `(userId, nextReviewDate)`.

### Nhóm 4 — Quiz

- **`quizzes`** (dòng 357-371): `id` PK; `topic_id` FK; `title` VARCHAR(200).
- **`quiz_questions`** (dòng 373-388): `id` PK; `quiz_id` FK; `question_text` VARCHAR(1000);
  `options` JSON; `correct_index` INT — không bao giờ trả về cho client trước khi nộp bài.
- **`quiz_attempts`** (dòng 390-408): `id` PK; `user_id` FK; `quiz_id` FK; `score` INT;
  `total` INT; `answers` JSON; `completed_at`. Index `(userId, completedAt)` và `quizId`.

### Nhóm 5 — Hoạt động và streak (quan trọng nhất)

#### Bảng `activity_logs` (dòng 416-438) — NGUỒN SỰ THẬT DUY NHẤT

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | INT | **PK** |
| `user_id` | INT | **FK** -> users (Cascade) |
| `type` | ENUM | VOCAB_LEARNED / FLASHCARD_REVIEWED / QUIZ_COMPLETED / HABIT_CHECKIN |
| `ref_id` | INT NULL | id bản ghi liên quan — **cố ý KHÔNG có FK** vì đa hình (vocabularyId, quizId, habitId, topicId) |
| `value` | INT | giá trị định lượng, mặc định 1 |
| `occurred_at` | DATETIME | thời điểm UTC |
| `local_date` | **DATE** | ngày theo timezone user — **mọi thống kê và streak group theo cột này** |

Index: `(userId, localDate)`, `(userId, type, localDate)`.

#### Bảng `user_streaks` (dòng 442-452)

`user_id` INT **PK + FK** (quan hệ 1-1); `current_streak` INT; `longest_streak` INT;
`last_active_date` DATE NULL; `updated_at`.

**Là dữ liệu dẫn xuất (cache), không phải nguồn sự thật** — luôn tái tạo được 100% từ
`activity_logs` cộng với các ngày đã bù trong `streak_freezes`, bằng script
`be/prisma/scripts/recompute-streak.ts`. Khi phát hiện streak sai thì chạy lại script, **không
sửa tay** giá trị trong bảng.

### Nhóm 6 — Lộ trình học

#### Bảng `lesson_progress` (dòng 463-483)

`id` PK; `user_id` FK; `topic_id` FK; `lesson_index` INT; `best_score` INT; `completed_at`;
`updated_at`. **UQ `(user_id, topic_id, lesson_index)`**. Index `(userId, topicId)`.

Nội dung bài học **không** lưu ở đây — bài được sinh ra từ danh sách từ vựng của chủ đề theo quy
tắc cố định, nhờ vậy thêm từ vựng là lộ trình tự dài ra mà không cần migrate.

#### Bảng `mistakes` (dòng 489-508)

`id` PK; `user_id` FK; `vocabulary_id` FK; `exercise_type` ENUM (8 dạng bài);
`times_wrong` INT; `times_correct` INT; `last_wrong_at`; `created_at`.
**UQ `(user_id, vocabulary_id, exercise_type)`**. Index `(userId, lastWrongAt)`.

### Nhóm 7 — Thông báo

- **`notification_settings`** (dòng 518-537): `id` PK; `user_id` **UQ** FK (1-1);
  `is_enabled` BOOLEAN (công tắc tổng); `remind_streak_at_risk`; `remind_review_due`;
  `last_sent_date` DATE NULL.
- **`reminders`** (dòng 544-568): `id` PK; `user_id` FK; `label` VARCHAR(60) NULL;
  `time_of_day` VARCHAR(5); `days_of_week` JSON; `is_enabled` BOOLEAN.
  **UQ `(user_id, time_of_day)`** — chặn đặt hai mốc trùng giờ.
- **`notifications`** (dòng 574-596): `id` PK; `user_id` FK; `type` ENUM (6 loại);
  `title` VARCHAR(150); `body` VARCHAR(500); `link` VARCHAR(120) NULL; `read_at` DATETIME NULL;
  `created_at`; `dedupe_key` VARCHAR(120). **UQ `(user_id, dedupe_key)`** — chống trùng khi cron
  chạy lại. Index `(userId, readAt)`.
- **`user_devices`** (dòng 599-610): `id` PK; `user_id` FK; `player_id` VARCHAR(200) **UQ** (do
  OneSignal SDK cấp phía client); `platform` ENUM(web, ios, android).

### Nhóm 8 — Phần thưởng

#### Bảng `coin_transactions` (dòng 624-645) — SỔ CÁI XU, NGUỒN SỰ THẬT CỦA SỐ DƯ

`id` PK; `user_id` FK; `amount` INT (dương là nhận, âm là tiêu);
`reason` ENUM(DAILY_CHECKIN, MISSION_CLAIM, STREAK_FREEZE_PURCHASE);
`dedupe_key` VARCHAR(120); `local_date` DATE; `created_at`.
**UQ `(user_id, dedupe_key)`**. Index `(userId, localDate)`.

**Không có cột số dư** — số dư = `SUM(amount)` tính lúc đọc. Thêm cột số dư chỉ tạo thêm một chỗ
có thể lệch với sổ cái mà không nhanh hơn đáng kể.

#### Bảng `streak_freezes` (dòng 656-667)

`id` PK; `user_id` FK; `purchased_at` DATETIME; `used_on_date` DATE NULL (null = còn trong kho).
**UQ `(user_id, used_on_date)`** — chặn bù hai vật phẩm cho cùng một ngày; MySQL cho phép nhiều
dòng NULL trong unique index nên các vật phẩm chưa dùng vẫn nằm chung được.

**Tổng cộng: 23 bảng dữ liệu + 12 enum.**

## C2. Mối quan hệ giữa các bảng

### Quan hệ 1-1

| Bảng A | Bảng B | Cách hiện thực |
|---|---|---|
| `users` | `user_avatars` | PK của B chính là FK (`userId Int @id`) |
| `users` | `user_streaks` | `userId Int @id` |
| `users` | `notification_settings` | `userId @unique` |

### Quan hệ 1-N

Một `users` có nhiều: `goals`, `habits`, `habit_check_ins`, `user_vocab_progress`,
`quiz_attempts`, `activity_logs`, `lesson_progress`, `mistakes`, `reminders`, `user_devices`,
`refresh_tokens`, `login_events`, `notifications`, `coin_transactions`, `streak_freezes`, và
`topics` (qua quan hệ đặt tên `TopicCreatedBy`).

Các quan hệ 1-N khác:

| Bảng cha | Bảng con | Hành vi khi xoá cha |
|---|---|---|
| `topics` | `vocabularies` | Cascade |
| `topics` | `quizzes` | Cascade |
| `topics` | `lesson_progress` | Cascade |
| `vocabularies` | `user_vocab_progress` | Cascade |
| `vocabularies` | `mistakes` | Cascade |
| `quizzes` | `quiz_questions` | Cascade |
| `quizzes` | `quiz_attempts` | Cascade |
| `habits` | `habit_check_ins` | Cascade |

Hai ngoại lệ dùng **`SetNull`** thay vì Cascade, có chủ ý:

- `login_events.user_id` — xoá người dùng vẫn giữ dòng nhật ký, vì số liệu truy cập lịch sử
  không được biến mất chỉ vì một tài khoản bị xoá.
- `topics.created_by_id` — xoá quản trị viên không được xoá theo nội dung học tập họ đã tạo.

### Quan hệ N-N (hiện thực bằng bảng trung gian có thuộc tính)

| Cặp thực thể | Bảng nối | Thuộc tính riêng của quan hệ |
|---|---|---|
| `users` <-> `vocabularies` | `user_vocab_progress` | trạng thái SM-2: repetitions, intervalDays, easeFactor, nextReviewDate |
| `users` <-> `quizzes` | `quiz_attempts` | score, total, answers (JSON), completedAt |
| `users` <-> `topics` | `lesson_progress` | lessonIndex, bestScore |
| `users` <-> `vocabularies` (theo dạng bài) | `mistakes` | exerciseType, timesWrong, timesCorrect |
| `habits` <-> ngày | `habit_check_ins` | localDate, note |

### Quan hệ đa hình (không có FK — cố ý)

`activity_logs.ref_id` trỏ tới `vocabularies.id`, `quizzes.id`, `habits.id` hoặc `topics.id` tuỳ
theo giá trị cột `type`. Comment ở `schema.prisma` dòng 421-422 ghi rõ:
*"Không ràng buộc FK vì đa hình"*. Đây là điểm đáng nêu trong báo cáo khi vẽ ERD.

## C3. File migration / schema / SQL dump

**Có đầy đủ.** Thư mục `be/prisma/migrations/` chứa **8 migration** theo thứ tự thời gian — đọc
tên migration là thấy được lịch sử phát triển của hệ thống:

| # | Tên migration | Nội dung |
|---|---|---|
| 1 | `20260829192029_init` | Khởi tạo schema nền: users, goals, habits, topics, vocabularies, SRS, quizzes, activity_logs, user_streaks |
| 2 | `20260830074809_add_lessons_and_mistakes` | Thêm `lesson_progress` và `mistakes` — lộ trình học và ôn lại từ sai |
| 3 | `20260830103836_add_listening_exercises` | Thêm 2 dạng bài nghe (`LISTEN_TYPE`, `LISTEN_CHOOSE`) vào enum ExerciseType |
| 4 | `20260831103508_them_trang_thai_tai_khoan_va_nhat_ky_dang_nhap` | Thêm `UserStatus` và bảng `login_events` — nền tảng cho khu quản trị |
| 5 | `20260831112553_them_thong_bao_trong_ung_dung` | Thêm bảng `notifications` với cột `dedupe_key` |
| 6 | `20260901170612_them_phan_thuong_diem_danh_nhiem_vu_freeze` | Thêm `coin_transactions`, `streak_freezes`, enum `CoinReason` |
| 7 | `20260903090000_tach_lich_nhac_thanh_nhieu_moc` | Tách giờ nhắc khỏi `notification_settings` thành bảng `reminders` riêng (nhiều mốc mỗi người) |
| 8 | `20260903120000_them_anh_dai_dien` | Thêm bảng `user_avatars` |

Kèm `migration_lock.toml` ghi provider `mysql`.

**Quy trình đổi schema** (bắt buộc theo `CLAUDE.md`): `prisma migrate dev` ở local,
`prisma migrate deploy` chạy **tự động trong bước deploy** (`be/package.json` dòng 9:
`"start": "prisma migrate deploy && node dist/server.js"`). Nghiêm cấm sửa tay bảng hoặc cột
trực tiếp trên MySQL, kể cả qua GUI.

**Không có SQL dump thô** — Prisma migration đóng vai trò đó. Thay vào đó có
`be/prisma/seed.ts` sinh dữ liệu mẫu **idempotent** (dùng `upsert` hoặc kiểm tra tồn tại trước
khi tạo):

- 3 tài khoản: `admin@enghabit.com` (quản trị viên), `user@enghabit.com` (có sẵn 45 ngày lịch sử
  học), `newbie@enghabit.com` (tài khoản trắng) — mật khẩu đều `A1234567`.
- Các chủ đề, từ vựng và quiz từ `be/prisma/seed-data/content.ts`.
- 30 ngày nhật ký đăng nhập, có xen vài lần sai mật khẩu (vì màn hình "Lượt truy cập" tồn tại
  chính là để nhìn ra loại sự kiện đó).
- 3 thông báo mẫu.

Hai điểm đáng chú ý trong seed: nó **chạy thuật toán SM-2 thật** qua nhiều lượt ôn thay vì gán
số bừa (dòng 379-406), và **tính lại streak từ ActivityLog** đúng cách hệ thống làm khi chạy
thật (dòng 452-478).

---

# PHẦN D — GIAO DIỆN VÀ LUỒNG XỬ LÝ

## D1. Các màn hình chính

Đọc từ `fe/src/routes/AppRoutes.tsx`. Tổng **17 route**, chia 4 nhóm theo guard.

### Nhóm công khai (guard `PublicOnly` — đã đăng nhập thì bị đẩy đi)

| URL | Màn hình | Component |
|---|---|---|
| `/login` | Đăng nhập | `features/auth/components/LoginPage.tsx` |
| `/register` | Đăng ký | `features/auth/components/RegisterPage.tsx` |

Cả hai dùng chung khung `AuthLayout.tsx` — panel đăng nhập luôn sáng ở cả hai chế độ màu.

### Nhóm người học (guard `Learner` — ADMIN bị đẩy về `/admin`)

| URL | Tên màn hình | Component | Nội dung chính |
|---|---|---|---|
| `/` | Tổng quan | `features/statistics/components/DashboardPage.tsx` | HeroCard (streak, cấp độ), biểu đồ hoạt động, lịch kiểu GitHub, khu phần thưởng |
| `/learn` | Học | `features/lessons/components/PathPage.tsx` | Lộ trình chủ đề -> bài, badge số từ sai; màn phụ `LessonPlayer` + `ExerciseView` |
| `/vocabulary` | Từ vựng | `features/vocabulary/components/VocabularyPage.tsx` | Duyệt chủ đề, xem từ, thêm vào danh sách học |
| `/flashcards` | Ôn tập | `features/flashcards/components/FlashcardPage.tsx` | Lật thẻ, tự chấm 0-5, badge số thẻ tới hạn |
| `/quizzes` | Quiz | `features/quizzes/components/QuizzesPage.tsx` + `QuizAttempt.tsx` | Danh sách và làm bài |
| `/leaderboard` | Bảng xếp hạng | `features/leaderboard/components/LeaderboardPage.tsx` | Tuần / tháng / toàn thời gian |
| `/habits` | Thói quen | `features/habits/components/HabitsPage.tsx` + `HabitForm.tsx` | Danh sách, check-in, tỷ lệ duy trì |
| `/goals` | Mục tiêu | `features/goals/components/GoalsPage.tsx` | Đặt mục tiêu, thanh tiến độ |

### Nhóm dùng chung hai vai trò (guard `Feature`)

| URL | Màn hình | Component |
|---|---|---|
| `/profile` | Trang cá nhân | `features/profile/components/ProfilePage.tsx` + `AvatarPicker.tsx` + `ReminderSettings.tsx` |
| `/notifications` | Thông báo | `features/notifications/components/NotificationsPage.tsx` |

### Nhóm quản trị (guard `Admin` — USER bị đẩy về `/`)

| URL | Màn hình | Component |
|---|---|---|
| `/admin` | Tổng quan hệ thống | `features/admin/components/AdminOverviewPage.tsx` + `TrendChart.tsx` |
| `/admin/users` | Tài khoản | `features/admin/components/AdminUsersPage.tsx` |
| `/admin/access` | Lượt truy cập | `features/admin/components/AdminAccessPage.tsx` |
| `/admin/content` | Nội dung học tập | `features/admin/components/AdminContentPage.tsx` + `ContentManager.tsx` |
| `/admin/announcements` | Gửi thông báo | `features/notifications/components/AnnouncementPage.tsx` |

Route `*` dẫn tới `shared/components/NotFoundPage.tsx` trong khung app.

### Khung chung (`fe/src/shared/components/AppLayout.tsx`)

Sidebar dọc thu gọn được (mục hiện theo vai trò — `Sidebar.tsx` dòng 103-133), breadcrumb tự
động sinh từ bản đồ `shared/lib/breadcrumbs.ts`, chuông thông báo, chuyển ngôn ngữ Việt-Anh
(`LanguageSwitcher.tsx`), chuyển chế độ sáng/tối (`ThemeToggle.tsx`), toast thông báo
(`Toast.tsx`).

## D2. Luồng xử lý 3 chức năng quan trọng nhất

### Luồng 1 — Ghi nhận một hoạt động học và cập nhật chuỗi ngày (xương sống của cả hệ thống)

Đây là luồng quan trọng nhất vì **mọi hành động học đều đi qua nó**. Lấy ví dụ ôn một flashcard:

```
Bước 1 │ Người học bấm mức độ nhớ trên FlashcardPage
       │   -> flashcard.hooks.ts: useMutation
       ▼
Bước 2 │ FE validate bằng reviewFlashcardSchema (shared/schemas/vocabulary.schema.ts)
       │   -> apiClient tự gắn header Authorization: Bearer <accessToken>
       ▼
Bước 3 │ POST /api/v1/flashcards/review
       │   -> helmet, cors, express.json, pinoHttp (gắn x-request-id)
       ▼
Bước 4 │ requireAuth: giải mã JWT -> req.user = {id, role, timezone}
       │ requireRole(UserRole.USER): chặn token của admin
       │ validateBody(reviewFlashcardSchema): validate LẠI ở phía server
       ▼
Bước 5 │ flashcard.controller.review() -> flashcard.service.submitReview()
       ▼
Bước 6 │ today = todayLocalDate(timezone)     <- timezone của user, không phải máy chủ
       │ đọc UserVocabProgress; không có -> NotFoundError 404
       ▼
Bước 7 │ next = reviewCard(state, quality, today)   <- thuật toán SM-2 từ shared/srs
       ▼
Bước 8 │ prisma.$transaction:
       │   ├─ UPDATE user_vocab_progress (interval, easeFactor, nextReviewDate)
       │   └─ recordActivity({type: FLASHCARD_REVIEWED, tx})
       │        ├─ localDate = toLocalDate(occurredAt, timezone)
       │        ├─ INSERT activity_logs (occurred_at UTC + local_date)   <- NGUỒN SỰ THẬT
       │        └─ applyActivity(previous, localDate) -> UPSERT user_streaks   <- cache
       ▼
Bước 9 │ (chỉ khi transaction do recordActivity tự mở) kiểm tra mục tiêu vừa đạt
       │   -> createNotification(GOAL_ACHIEVED) với dedupeKey gắn goalId + kỳ
       │   -> lỗi ở bước này bị NUỐT, không được làm hỏng việc ghi hoạt động
       ▼
Kết quả│ Trả về SrsState mới. TanStack Query invalidate cache -> sidebar cập nhật badge,
       │ dashboard cập nhật streak/XP, nhiệm vụ ngày cập nhật tiến độ.
```

**Vì sao phải cùng một transaction** (`docs/architecture.md` dòng 50): nếu không, có thể xảy ra
cảnh tiến độ đã đổi nhưng streak chưa cập nhật — dữ liệu lệch mà không có cách phát hiện.

**Vì sao mọi module phải gọi `recordActivity()`**: nếu mỗi module tự insert, sẽ xuất hiện các
biến thể — chỗ quên tính `local_date`, chỗ quên cập nhật streak, chỗ dùng timezone máy chủ thay
vì timezone user. Gom về một hàm khiến những lỗi đó không thể xảy ra.

### Luồng 2 — Đăng nhập và duy trì phiên (JWT + refresh token rotation)

```
Bước 1 │ Nhập email + mật khẩu tại /login
       ▼
Bước 2 │ POST /auth/login -> validateBody(loginSchema)
       ▼
Bước 3 │ auth.service.login(input, {ipAddress, userAgent})
       │   3a. Không tìm thấy email -> LoginEvent(NO_ACCOUNT)     -> 401
       │   3b. bcrypt.compare sai   -> LoginEvent(WRONG_PASSWORD) -> 401  (cùng thông báo 3a)
       │   3c. status = LOCKED      -> LoginEvent(LOCKED)         -> 403 "Liên hệ quản trị viên"
       ▼
Bước 4 │ Thành công: ghi LoginEvent(success) + cập nhật users.last_login_at (Promise.all)
       ▼
Bước 5 │ signAccessToken({sub, role, timezone})  -> JWT HS256, hạn 15 phút
       │ issueRefreshToken(userId)               -> 48 byte ngẫu nhiên;
       │                                            LƯU SHA-256 HASH vào refresh_tokens
       ▼
Bước 6 │ auth.controller đặt refreshToken vào cookie httpOnly + Secure
       │   (app.set('trust proxy', 1) để cookie Secure hoạt động sau reverse proxy)
       │ FE lưu accessToken + thông tin user vào Zustand store
       ▼
Bước 7 │ Điều hướng theo vai trò: ADMIN -> /admin, USER -> /
       ▼
Bước 8 │ [15 phút sau] Một request bất kỳ trả 401
       │   -> interceptor của apiClient bắt được (api-client.ts dòng 27-55)
       │   -> gom mọi request 401 đồng thời vào MỘT lần refresh (biến refreshPromise)
       │   -> POST /auth/refresh (cookie tự gửi kèm nhờ withCredentials)
       ▼
Bước 9 │ rotateRefreshToken(): tìm theo hash -> kiểm revokedAt và expiresAt
       │   -> THU HỒI token cũ + cấp token mới (rotation)
       │   -> kiểm lại status: LOCKED thì chặn ngay, không đợi token hết hạn 30 ngày
       ▼
Kết quả│ Request gốc được thử lại với access token mới, người dùng không thấy gián đoạn.
       │ Refresh thất bại -> store xoá phiên -> RequireAuth đẩy về /login.
```

### Luồng 3 — Nhận thưởng nhiệm vụ ngày (minh hoạ chống gian lận và chống nhận trùng)

```
Bước 1 │ GET /rewards -> getRewardsSummary(userId, timezone)
       │   chạy song song 4 truy vấn:
       │   ├─ getCoinBalance      = SUM(coin_transactions.amount)   <- không có cột số dư
       │   ├─ listDedupeKeysOfDay = các khoản đã nhận hôm nay
       │   ├─ countActivitiesOfDay= groupBy activity_logs theo type, local_date = hôm nay
       │   └─ getFreezeState      = số vật phẩm còn trong kho
       ▼
Bước 2 │ evaluateMissions(counts, claimed)   <- shared/rewards
       │   3 nhiệm vụ cố định: học 5 từ / ôn 10 thẻ / check-in 1 thói quen
       │   TIẾN ĐỘ KHÔNG LƯU Ở ĐÂU CẢ — chấm lại từ ActivityLog mỗi lần đọc
       ▼
Bước 3 │ Nhiệm vụ đã đủ -> nút "Nhận" sáng lên trên RewardsBar
       ▼
Bước 4 │ POST /rewards/missions/claim {missionId}
       ▼
Bước 5 │ claimMission(): CHẤM LẠI tiến độ từ ActivityLog ở phía server
       │   -> không tin số FE gửi lên; sửa devtools cũng không nhận được thưởng
       │   -> chưa đạt: BadRequestError 400 "Nhiệm vụ chưa hoàn thành"
       ▼
Bước 6 │ addCoins(): INSERT coin_transactions
       │   dedupeKey = "MISSION:<id>:<local_date>"
       │   -> RÀNG BUỘC UNIQUE (user_id, dedupe_key) của DB là thứ DUY NHẤT chống trùng
       │   -> hai request bấm cùng lúc: một thành công, một dính lỗi P2002
       ▼
Bước 7 │ Bắt P2002 -> ConflictError 409 "Bạn đã nhận thưởng nhiệm vụ này hôm nay"
       │   -> báo lỗi rõ ràng thay vì lặng lẽ bỏ qua, để FE nói được với người dùng
       ▼
Kết quả│ Số dư xu tăng. TUYỆT ĐỐI KHÔNG ghi ActivityLog và KHÔNG cộng XP:
       │ - ghi ActivityLog thì bấm một nút là đủ giữ streak -> thống kê nói dối
       │ - XP suy ra từ ActivityLog nên về nguyên tắc không thể tặng thêm
```

## D3. Xử lý lỗi và validation

### Validation — hai lớp, một định nghĩa

**Nguyên tắc:** Zod schema đặt ở `shared/` để FE và BE dùng **cùng một luật**, tránh lệch rule
giữa hai phía.

- **Lớp 1 (Frontend)** — form validate trước khi gửi, phản hồi tức thì cho người dùng.
- **Lớp 2 (Backend)** — middleware `be/src/common/middlewares/validate.ts` validate lại **mọi**
  request: `validateBody`, `validateQuery`, `validateParams`. Dữ liệu đã parse được gán ngược
  vào request nên controller luôn nhận giá trị đã chuẩn hoá (trim, lowercase email...).

Ví dụ luật cụ thể: mật khẩu >= 8 và <= 72 ký tự (giới hạn của bcrypt), bắt buộc chứa cả chữ và
số (`shared/src/schemas/auth.schema.ts` dòng 5-10).

**Ba lớp kiểm tra bổ sung, không thể thay thế cho nhau:**

1. **Kiểm tra nghiệp vụ trong service** — quyền sở hữu (`assertOwnership` ở goal/habit service),
   số dư đủ tiền, nhiệm vụ đã đạt, không phải admin cuối cùng.
2. **Ràng buộc của DB** — `@@unique` là thứ **duy nhất** chống được race condition; validate ở
   tầng ứng dụng không đủ vì hai request đến cùng lúc đều đọc thấy trạng thái cũ.
3. **Chấm lại ở server** — điểm quiz, kết quả bài học, tiến độ nhiệm vụ đều tính lại từ DB,
   không tin dữ liệu client gửi lên.

Một chi tiết kỹ thuật đáng nêu: query param kiểu boolean **không dùng `z.coerce.boolean()`** vì
query string luôn là chuỗi và `Boolean('false') === true`, khiến bộ lọc luôn bật. Phải dùng
`z.preprocess` so khớp `'true'` / `'1'` (xem `notificationQuerySchema`).

### Xử lý lỗi backend — một chỗ duy nhất

**Phân cấp lỗi nghiệp vụ** (`be/src/common/errors/app-error.ts`): lớp cơ sở
`AppError(statusCode, message, code, details)` với 5 lớp con — `BadRequestError` (400),
`UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409).
Mỗi lỗi có `code` ổn định (`BAD_REQUEST`, `CONFLICT`...) để client xử lý theo mã, không phụ
thuộc câu chữ tiếng Việt.

**`errorHandler` là nơi DUY NHẤT chuyển lỗi thành HTTP response**
(`be/src/common/middlewares/error-handler.ts`) — service chỉ việc ném lỗi, controller không cần
try/catch. Xử lý 4 loại:

| Loại lỗi | Kết quả trả về |
|---|---|
| `ZodError` | 400 kèm `details` liệt kê từng field sai để FE hiển thị đúng chỗ |
| `AppError` | dùng đúng `statusCode` và `code` của lỗi |
| `PrismaClientKnownRequestError` | dịch sang thông báo hiểu được: P2002 -> 409, P2025 -> 404, P2003 -> 400 |
| Lỗi không xác định | 500; **dev mới lộ stack trace, production giấu đi** để không rò rỉ cấu trúc hệ thống |

Mọi response lỗi đều kèm `requestId` để đối chiếu với log. `asyncHandler` bọc handler async để
promise bị reject tự chuyển sang error middleware — không có unhandled rejection.
`notFoundHandler` và `errorHandler` phải nằm cuối cùng, đúng thứ tự (`app.ts` dòng 68-70).

**Xử lý lỗi ở tầng job** — cố ý khoan dung hơn: `onesignal.client.ts` dòng 38-44 chỉ ghi log khi
push thất bại, vì *"một user gửi lỗi không được làm dừng cả lượt quét"*.

### Xử lý lỗi frontend

- **Error Boundary cục bộ cho từng feature** (`shared/components/FeatureErrorBoundary.tsx`) —
  mỗi route được bọc riêng kèm tên màn hình, nên lỗi ở flashcards không làm sập toàn app.
- **`getErrorMessage()`** (`api-client.ts` dòng 58-64) lấy thông báo tiếng Việt từ backend, có
  fallback "Không kết nối được máy chủ".
- **Tự refresh token khi gặp 401** với cơ chế gom request (mô tả ở Luồng 2).
- **Route guard 4 loại**: `RequireAuth`, `Learner`, `Admin`, `PublicOnly`.
- **Fail-fast khi khởi động** (`be/src/config/env.ts` dòng 30-35): thiếu biến môi trường thì app
  dừng ngay với thông báo rõ ràng, thay vì lỗi khó hiểu lúc chạy. `assertDatabaseConnection()`
  kiểm tra DB **trước khi** mở cổng (`server.ts` dòng 10).

### Kiểm thử tự động

Có **7 file test** dùng `vitest`, đặt cạnh file nguồn trong cùng thư mục theo quy ước:
`shared/src/srs/sm2.test.ts`, `shared/src/streak/streak.test.ts`, `shared/src/level/level.test.ts`,
`shared/src/rewards/rewards.test.ts`, `shared/src/avatar/avatar.test.ts`,
`fe/src/shared/i18n/language.test.ts`.

Nhận xét: **test tập trung hoàn toàn vào domain logic thuần ở `shared/`**, chưa có test cho
service backend (`be` chạy `vitest run --passWithNoTests`).

---

# PHẦN E — ĐÁNH GIÁ VÀ GỢI Ý CHO BÁO CÁO

## E1. Hạn chế hiện tại

### Về phạm vi chức năng

**1. Ứng dụng mobile chưa được xây dựng.** `CLAUDE.md` ghi rõ *"`mobile` chưa scaffold"*, thư
mục `mobile/` chưa tồn tại — dù kiến trúc đã chuẩn bị sẵn cho nó (`shared/` build ra `dist/`
chính là để Metro của React Native resolve được; `UserDevice.platform` đã có `ios` và `android`).

**2. Quên mật khẩu vẫn cần quản trị viên duyệt tay.** Người dùng tự gửi được yêu cầu và tự đặt
mật khẩu mới, nhưng **giữa hai bước đó phải có một quản trị viên bấm duyệt**
(`/admin/requests`). Nguyên nhân kỹ thuật vẫn là hệ thống chưa tích hợp dịch vụ gửi email nào,
nên không có kênh nào gửi được liên kết xác thực tới đúng chủ tài khoản.

Hệ quả về an toàn phải nêu rõ: lượt duyệt gắn với **tài khoản**, không gắn với người đã chứng
minh danh tính — sau khi duyệt, ai biết tên tài khoản đó cũng đặt được mật khẩu mới. Vì vậy
quản trị viên bắt buộc phải xác minh danh tính ngoài hệ thống trước khi duyệt. Chi tiết trong
`docs/luong-quen-mat-khau.md`.

**3. Không có xác thực email khi đăng ký** — đăng ký xong dùng được ngay, email không được kiểm chứng.

**4. Hai loại thông báo được khai báo nhưng chưa dùng.** Enum `NotificationType` có `REVIEW_DUE`
và `MISTAKES_PENDING` (`shared/src/constants/enums.ts` dòng 80-88) nhưng trong `be/src/jobs`
chỉ thấy `DAILY_REMINDER`, `STREAK_AT_RISK`, `GOAL_ACHIEVED`, `ANNOUNCEMENT` được tạo — hai loại
kia bị gộp vào nội dung của `DAILY_REMINDER`.

**5. Mục tiêu `MINUTES_PER_DAY` không thực sự đo phút.** `goal.service.ts` dòng 93 ánh xạ nó sang
`ActivityType.FLASHCARD_REVIEWED` (đếm số lượt ôn), và nhãn ở backend cũng đã sửa thành "Số lượt
ôn tập mỗi ngày" (`activity-log.service.ts` dòng 124). Tương tự `LESSONS_PER_WEEK` thực chất đếm
số quiz. Hệ thống **chưa đo thời gian học thực tế** — không có trường nào ghi thời lượng phiên học.

**6. Nội dung học phụ thuộc hoàn toàn vào quản trị viên nhập tay.** Không có import hàng loạt
(CSV/Excel), không lấy dữ liệu từ từ điển bên ngoài. Người học cũng không tự thêm được từ vựng riêng.

**7. Phát âm dựa vào Web Speech API của trình duyệt.** `Vocabulary.audioUrl` tồn tại trong schema
nhưng dữ liệu seed không điền; chất lượng phát âm phụ thuộc giọng đọc có sẵn của máy người dùng
và không đồng nhất giữa các trình duyệt.

### Về bảo mật

**8. Không có rate limit trên endpoint đăng nhập.** `POST /auth/login` không giới hạn số lần thử.
Hệ thống *ghi nhận* được dò mật khẩu qua `login_events` (có cột `reason = WRONG_PASSWORD`, trang
`/admin/access` hiển thị) nhưng **không chặn** — không khoá tạm tài khoản, không delay, không
CAPTCHA. Không có package `express-rate-limit` trong `be/package.json`.

**9. Không có kiểm soát kích thước ảnh đại diện ở tầng hạ tầng.** Body limit chung là 1MB
(`app.ts` dòng 33); ảnh lưu MEDIUMBLOB trong DB — nhiều người dùng tải ảnh sẽ làm DB phình
nhanh, và mỗi lần trả `PublicUser` đều kèm data URL của ảnh.

**10. Refresh token bị thu hồi khi rotate nhưng không có cơ chế phát hiện tái sử dụng.** Nếu kẻ
tấn công đánh cắp và dùng token cũ (đã revoke), hệ thống chỉ trả 401 chứ không thu hồi cả họ
token (token family) — kỹ thuật tiêu chuẩn để phát hiện token bị đánh cắp.

**11. Không có nhật ký thao tác quản trị (audit log).** `login_events` ghi ai đăng nhập, nhưng
không bảng nào ghi *ai đã khoá tài khoản nào, ai xoá từ vựng nào, vào lúc nào*. Với các thao tác
không đảo ngược được (xoá tài khoản dẫn tới cascade xoá toàn bộ dữ liệu học), đây là thiếu sót
đáng kể.

**12. Xoá tài khoản là xoá cứng.** `prisma.user.delete()` (`admin.service.ts` dòng 220) cascade
xoá goals, habits, activity_logs, coin_transactions... Không có soft-delete, không khôi phục
được. Đối lập với thiết kế "khoá là biện pháp đảo ngược được" — hai thao tác nằm cạnh nhau trên
cùng một màn hình nhưng hậu quả khác nhau một trời một vực.

### Về hiệu năng và khả năng mở rộng

**13. Nhiều truy vấn tải toàn bộ bản ghi về bộ nhớ ứng dụng rồi mới xử lý.** Ví dụ rõ nhất:

- `countActiveUsers()` (`admin.service.ts` dòng 430-437) — dùng `findMany` + `distinct` kéo mọi
  `userId` trong 30 ngày về Node rồi đếm `rows.length`, thay vì `COUNT(DISTINCT)` trong SQL.
- `dailyActivity()` và `getAccessOverview()` kéo toàn bộ log/sự kiện về rồi gom nhóm bằng `Map`
  trong JavaScript.
- `getLeaderboard()` group **toàn bộ** `ActivityLog` của mọi user mỗi lần có người mở bảng xếp
  hạng, rồi sắp xếp trong bộ nhớ.

Ở quy mô vài trăm user (mục tiêu đã tuyên bố) thì chấp nhận được, nhưng đây là trần mở rộng rõ ràng.

**14. Vòng lặp `await` tuần tự trong job và trong `updateMistakes`.** `reminder.job.ts` dòng
95-117 xử lý từng reminder một, mỗi lượt có thể gọi 3 truy vấn DB; `lesson.service.ts` dòng
220-247 chạy vòng `for` với `await` cho từng câu trả lời. Số user tăng thì thời gian một lượt
quét tăng tuyến tính, có nguy cơ vượt chu kỳ 15 phút.

**15. Không có cache tầng ứng dụng.** Mọi thống kê, bảng xếp hạng, tổng quan hệ thống đều query
trực tiếp mỗi lần đọc. Đây là **đánh đổi có chủ ý** (được biện luận rõ trong `CLAUDE.md`: bảng
tổng hợp làm tăng nguy cơ lệch số liệu) nhưng vẫn là hạn chế cần nêu.

**16. `user_avatars` dùng MEDIUMBLOB trong MySQL** thay vì object storage. Lý do được ghi rõ:
nền tảng deploy free tier có ổ đĩa tạm, deploy lại là mất ảnh. Hợp lý ở quy mô hiện tại nhưng
không mở rộng được.

### Về kiểm thử và chất lượng

**17. Backend không có test nào.** `"test": "vitest run --passWithNoTests"` (`be/package.json`
dòng 10) — không có file `*.test.ts` nào trong `be/src`. Toàn bộ nghiệp vụ phức tạp (chấm bài,
chống nhận trùng xu, tiêu vật phẩm giữ chuỗi, ba quy tắc an toàn của admin) chưa được kiểm chứng
tự động. Đáng chú ý là `runReminderTick()` và `runStreakFreezeTick()` đã được **cố ý tách khỏi
cron để test được** — nhưng test chưa được viết.

**18. Không có test tích hợp hay E2E.** Không có supertest, Playwright hay Cypress.

**19. Không có tài liệu API.** Không có OpenAPI/Swagger; danh sách endpoint chỉ đọc được từ mã
nguồn. Thư mục `docs/` chưa có `er-diagram.md` (dù `CLAUDE.md` có nhắc tới file này).

### Về trải nghiệm người dùng

**20. Không thể đặt mốc nhắc riêng cho từng thói quen.** `Habit.reminderTime` tồn tại trong
schema nhưng job nhắc **chỉ đọc bảng `reminders`**, không đọc `habits.reminder_time` — trường
này hiện là dữ liệu chết.

**21. Vật phẩm giữ chuỗi chỉ cứu được khi nghỉ đúng một ngày.** `freezableDate()` yêu cầu khoảng
cách đúng 2 ngày (`shared/src/streak/streak.ts` dòng 125-128). Nghỉ hai ngày liền thì chuỗi đã
đứt, vật phẩm đã mua trở nên vô dụng — hành vi đúng theo thiết kế nhưng có thể gây thất vọng nếu
giao diện không giải thích rõ.

**22. Job quét mỗi 30 phút có độ trễ tới nửa tiếng** trong việc cứu chuỗi; nếu người dùng mở app
ngay đầu ngày, họ có thể thấy chuỗi đã về 0 trước khi job kịp chạy.

**23. Chỉ hỗ trợ 2 ngôn ngữ giao diện (Việt/Anh)** và khoá dịch chính là câu tiếng Việt — thêm
ngôn ngữ thứ ba đòi hỏi dịch lại toàn bộ `fe/src/shared/i18n/en.ts` tương ứng.

## E2. Đề xuất hướng phát triển

Sắp theo thứ tự ưu tiên, có gắn với số hạn chế tương ứng ở mục E1.

### Ưu tiên cao — vá những lỗ hổng rõ ràng

**1. Rate limit và khoá tạm sau N lần sai** (vá #8). Thêm `express-rate-limit` cho `/auth/login`
và `/auth/register`. Dữ liệu đã có sẵn: `login_events` đã ghi đủ IP, email, thời điểm và lý do
thất bại — chỉ cần đếm và chặn. Đây là đề xuất "rẻ" nhất vì hạ tầng dữ liệu đã có.

**2. Quên mật khẩu qua email** (vá #2, #3). Thêm bảng `password_reset_tokens` (cùng mô hình lưu
hash như `refresh_tokens`), tích hợp Resend hoặc SendGrid free tier. Đồng thời mở đường cho xác
thực email khi đăng ký.

**3. Nhật ký thao tác quản trị** (vá #11). Thêm bảng `admin_audit_logs` (`actor_id`, `action`,
`target_type`, `target_id`, `payload` JSON, `created_at`), ghi trong `admin.service` ở mọi hàm
thay đổi trạng thái. Thêm màn hình `/admin/audit`.

**4. Viết test cho backend** (vá #17). Ưu tiên đúng những chỗ khó nhất và đã được thiết kế sẵn
để test: `runReminderTick()`, `runStreakFreezeTick()`, `claimMission()` (chống nhận trùng),
`assertNotLastAdmin()`, `submitLesson()` (chấm bài). Dùng SQLite in-memory hoặc container MySQL
cho test tích hợp.

**5. Soft-delete cho tài khoản** (vá #12). Thêm cột `deleted_at` vào `users` thay vì xoá cứng,
hoặc ít nhất thêm bước xác nhận có gõ lại email.

### Ưu tiên trung bình — hoàn thiện chức năng đã hứa

**6. Ứng dụng mobile React Native + Expo** (vá #1). Kiến trúc đã chuẩn bị sẵn: `shared/` build ra
`dist/`, `UserDevice.platform` đã có `ios`/`android`, `expo-notifications` tích hợp OneSignal dễ.
Đây là hướng phát triển tự nhiên nhất và có sức thuyết phục cao trong báo cáo, vì mọi quyết định
kiến trúc đều đã hướng tới nó.

**7. Đo thời gian học thực tế** (vá #5). Thêm `duration_seconds` vào `activity_logs` hoặc tạo
bảng `study_sessions`, để mục tiêu `MINUTES_PER_DAY` đúng với tên gọi.

**8. Import nội dung hàng loạt và tích hợp từ điển** (vá #6, #7). Cho quản trị viên tải file CSV
danh sách từ; lấy phiên âm và file audio từ API từ điển (ví dụ Free Dictionary API) để điền
`phonetic` và `audio_url`.

**9. Kích hoạt 2 loại thông báo đang bỏ trống** (vá #4): `REVIEW_DUE` khi có thẻ tới hạn và
`MISTAKES_PENDING` khi tồn nhiều từ sai — tách khỏi `DAILY_REMINDER` để người dùng bật/tắt riêng.

**10. Người học tự tạo bộ từ vựng riêng** — thêm `Topic.ownerId`, cho phép chủ đề cá nhân bên
cạnh chủ đề hệ thống.

### Ưu tiên thấp — mở rộng quy mô và làm giàu trải nghiệm

**11. Tối ưu truy vấn thống kê** (vá #13, #14): chuyển `countActiveUsers`, `dailyActivity`,
`getAccessOverview` sang `groupBy` / `COUNT(DISTINCT)` phía SQL; xử lý reminder theo lô song song
có giới hạn đồng thời.

**12. Cache bảng xếp hạng** (vá #15) — Redis với TTL 5-10 phút. Cần cân nhắc kỹ vì đi ngược
nguyên tắc "một nguồn sự thật" đã đặt ra; nếu làm, phải là cache thuần (xoá đi tính lại được),
không phải bảng tổng hợp.

**13. Chuyển ảnh đại diện sang object storage** (vá #16) khi rời khỏi free tier.

**14. Tài liệu API bằng OpenAPI** (vá #19) — sinh tự động từ Zod schema bằng `zod-to-openapi`,
tận dụng việc schema đã tập trung ở `shared/`.

**15. Mở rộng trò chơi hoá**: huy hiệu thành tích, thử thách theo nhóm hoặc lớp, so kè với bạn
bè, cửa hàng vật phẩm phong phú hơn (đổi giao diện, biểu tượng).

**16. Cá nhân hoá lộ trình**: bài kiểm tra đầu vào để xếp trình độ, gợi ý chủ đề dựa trên lịch sử
làm sai.

**17. Phát hiện tái sử dụng refresh token** (vá #10) — thêm `family_id` vào `refresh_tokens`,
dùng token đã revoke thì thu hồi cả họ.

## E3. Gợi ý hướng tiếp cận cho báo cáo

### Nên chọn hướng chức năng hay hướng đối tượng?

**Khuyến nghị: hướng chức năng làm chủ đạo, có bổ sung một số biểu đồ của hướng đối tượng.**

#### Vì sao hướng chức năng phù hợp hơn

**1. Mã nguồn backend là mã hướng chức năng, không phải hướng đối tượng.** Đây là lý do quyết
định. Đọc bất kỳ service nào cũng thấy: `statistics.service.ts`, `goal.service.ts`,
`rewards.service.ts` đều là **tập hợp các hàm `export async function`** — không có `class`,
không kế thừa, không đa hình. Cả codebase chỉ có đúng **một cây lớp**: `AppError` và 5 lớp con
của nó (`app-error.ts`) — dùng cho xử lý lỗi kỹ thuật, không phải mô hình nghiệp vụ. Vẽ Class
Diagram nghiệp vụ sẽ phải **bịa ra các lớp không tồn tại trong mã**.

**2. Prisma model là bản ghi dữ liệu, không phải đối tượng có hành vi.** `User`, `Goal`,
`ActivityLog` là các kiểu dữ liệu thuần — mọi hành vi nằm ở service bên ngoài. Đây đúng là mô
hình "dữ liệu + hàm xử lý", khớp với phương pháp phân tích có cấu trúc.

**3. Ranh giới chức năng đã rõ ràng sẵn.** 12 module backend tương ứng 13 feature frontend với
tên trùng khớp bắt buộc, mỗi module là một nhóm chức năng độc lập. Sơ đồ phân rã chức năng gần
như vẽ lại được từ cây thư mục.

**4. `ActivityLog` là kho dữ liệu trung tâm điển hình** — mọi chức năng học ghi vào, mọi chức
năng thống kê đọc ra. Đây chính xác là cấu trúc mà DFD sinh ra để mô tả: nhiều tiến trình cùng
ghi và đọc một kho dữ liệu.

#### Vì sao vẫn nên mượn một phần hướng đối tượng

Use Case Diagram và Sequence Diagram của UML là công cụ mô tả tốt nhất cho hai thứ mà hệ thống
này có nhiều: **phân quyền theo actor** (USER / ADMIN / Cron với ranh giới rất rõ) và **luồng
tương tác nhiều lớp** (FE -> routes -> controller -> service -> Prisma). Hầu hết đồ án ở Việt Nam
chấp nhận cách kết hợp này.

#### Nếu trường bắt buộc thuần hướng đối tượng

Vẫn làm được, nhưng phải nêu rõ trong phần "Nhận xét về hiện thực": *hệ thống chọn mô hình hàm
thuần (functional) cho tầng nghiệp vụ, các "lớp" trong sơ đồ thiết kế được hiện thực thành module
hàm — đây là quyết định có chủ ý phù hợp với TypeScript và Prisma*. Nói thẳng điều này sẽ được
đánh giá cao hơn là vẽ Class Diagram giả.

### Các biểu đồ phù hợp nhất

#### Nhóm bắt buộc phải có (xếp theo mức độ quan trọng)

| # | Biểu đồ | Vì sao phù hợp với hệ thống này | Lấy dữ liệu từ đâu |
|---|---|---|---|
| 1 | **Sơ đồ phân rã chức năng (BFD)** | 12 nhóm chức năng đã có sẵn ranh giới rõ; cây ở mục B2 dùng gần như nguyên vẹn | `app.ts` dòng 52-64 + các file `*.routes.ts` |
| 2 | **Sơ đồ ERD** | 23 bảng, quan hệ đầy đủ 1-1 / 1-N / N-N, có cả điểm đặc biệt để bình luận (quan hệ đa hình của `ref_id`, hai FK `SetNull`) | `be/prisma/schema.prisma` |
| 3 | **Use Case Diagram** | 3 actor rõ ràng (USER, ADMIN, **Cron/Hệ thống**) với ranh giới quyền được cưỡng chế ở tầng router | `requireRole` trong các file routes |
| 4 | **DFD mức 0 (ngữ cảnh) và mức 1** | `ActivityLog` là kho dữ liệu trung tâm — DFD thể hiện được đúng điều mà các biểu đồ khác không nói được: mọi tiến trình học đều ghi vào một chỗ, mọi tiến trình thống kê đọc ra từ đó | `docs/architecture.md` mục 2 |
| 5 | **Sequence Diagram (3-4 cái)** | Chọn: (a) ghi hoạt động học + cập nhật streak (có transaction và lời gọi `shared/`); (b) đăng nhập + refresh token rotation; (c) cron gửi nhắc nhở (có actor hệ thống và OneSignal bên ngoài); (d) nhận thưởng nhiệm vụ (thể hiện chống gian lận) | Mục D2 của tài liệu này |
| 6 | **Sơ đồ kiến trúc triển khai** | 3 tầng: SPA (Vercel) — API + Cron (Render/Railway) — MySQL (Aiven), cộng OneSignal | `docs/deployment.md`, `fe/vercel.json` |

#### Nhóm nên có nếu còn chỗ

| # | Biểu đồ | Ghi chú |
|---|---|---|
| 7 | **Sơ đồ trạng thái (State Diagram)** | Rất hợp với hệ thống này, có 3 lựa chọn tốt: (a) trạng thái một thẻ flashcard theo SM-2 (mới -> học lần 1 -> lần 2 -> giãn dần -> sai thì reset); (b) vòng đời chuỗi streak (chưa có -> đang chạy -> nguy cơ đứt -> được vật phẩm cứu -> đứt); (c) trạng thái tài khoản (ACTIVE <-> LOCKED -> deleted) |
| 8 | **Sơ đồ hoạt động (Activity Diagram)** | Hợp nhất với luồng job nhắc nhở vì có nhiều nhánh điều kiện: đúng thứ? đúng giờ? đã học chưa? có thẻ tới hạn? đã gửi hôm nay chưa? |
| 9 | **Sơ đồ gói (Package Diagram)** | Thể hiện quan hệ `shared/` <- `be/`, `shared/` <- `fe/` và quy tắc "domain logic chỉ định nghĩa một lần" |
| 10 | **Sơ đồ phân lớp backend** | 4 lớp routes -> controller -> service -> Prisma, kèm vị trí của các middleware |

#### Nên tránh

- Class Diagram nghiệp vụ chi tiết (không khớp mã nguồn).
- Component Diagram của UML (trùng lặp với sơ đồ kiến trúc nhưng ít thông tin hơn).

### Ba điểm nên làm nổi bật để báo cáo có chiều sâu

Codebase này có một số quyết định thiết kế được biện luận rõ ràng — đây là chất liệu tốt cho
chương "Phân tích thiết kế", vì mỗi quyết định đều nêu được **vấn đề gì sẽ xảy ra nếu làm cách
khác**.

**1. Một nguồn sự thật và dữ liệu dẫn xuất.** `ActivityLog` là nguồn duy nhất; `UserStreak` và
XP là dữ liệu dẫn xuất, luôn tái tạo được. Quy tắc kèm theo: streak sai thì chạy
`recompute-streak`, tuyệt đối không sửa tay. Ba thứ **cố ý không lưu**: XP (suy từ ActivityLog),
số dư xu (bằng `SUM(amount)`), tiến độ nhiệm vụ ngày (chấm lại mỗi lần đọc). Lý do chung: mỗi bản
sao dữ liệu là một chỗ có thể lệch.

**2. Xử lý múi giờ bằng cột `local_date`.** Đây là điểm kỹ thuật hay nhất để phân tích: bài toán
"một ngày học là gì" khi người dùng ở các múi giờ khác nhau; giải pháp tính sẵn `local_date` một
lần lúc ghi thay vì convert timezone trong SQL; và hệ quả — query đơn giản hơn, chạy nhanh hơn,
ổn định kể cả khi người dùng đổi múi giờ. Kèm ví dụ cụ thể trong `docs/architecture.md` dòng 19.

**3. Chống trùng bằng ràng buộc của DB, không bằng đọc-rồi-ghi.** Ba chỗ dùng cùng một kỹ thuật:
`unique(userId, dedupeKey)` cho xu, `unique(userId, dedupeKey)` cho thông báo,
`unique(userId, usedOnDate)` cho vật phẩm giữ chuỗi. Lập luận: hai request đến cùng lúc đều đọc
thấy "chưa nhận" và sẽ cùng ghi — chỉ ràng buộc ở tầng DB mới chặn được. Đây là nội dung kỹ thuật
có trọng lượng, phù hợp để đưa vào phần "Xử lý các tình huống đặc biệt".

Ngoài ra, hai chi tiết nhỏ nhưng thể hiện sự chỉn chu, đáng nêu:

- **Quản trị viên không phải người học** — tách bạch hai không gian, chặn ở cả 3 tầng: route
  guard phía FE, `requireRole` phía BE, và lọc trong cron job.
- **Push chỉ là kênh phụ** — thông báo luôn lưu vào DB trước, vì push có thể bị chặn hoặc bỏ lỡ;
  mở app lên vẫn phải thấy việc cần làm.

---

*Tài liệu sinh từ phân tích mã nguồn thực tế, ngày 04/09/2026.*
