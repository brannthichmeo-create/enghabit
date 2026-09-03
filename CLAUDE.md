# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Trạng thái dự án

Đã scaffold xong nền tảng: `shared` (enum, Zod schema, SM-2, streak, phần thưởng — có test), `be` (Express + Prisma + đầy đủ module auth/goals/habits/topics/flashcards/lessons/quizzes/statistics/notifications/rewards/leaderboard/admin, cron nhắc nhở + cron vật phẩm giữ chuỗi), `fe` (React + Vite + Tailwind, auth + dashboard thống kê). `mobile` chưa scaffold.

Các feature FE còn lại (habits, goals, flashcards, quizzes, admin) đã có sẵn API backend và khuôn mẫu ở `fe/src/features/auth` + `fe/src/features/statistics` để làm theo.

## Tổng quan hệ thống

**ENG//HABIT** (English Learning Habit Building Application) — ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh. Vấn đề cốt lõi cần giải quyết: người học thường không thiếu tài liệu mà thiếu cơ chế duy trì thói quen học đều đặn. Hệ thống kết hợp: **học tiếng Anh (từ vựng, quiz) + quản lý mục tiêu/thói quen + theo dõi tiến độ (streak, thống kê)**.

### Chức năng cho người học
- Tạo tài khoản, quản lý thông tin cá nhân
- Thiết lập mục tiêu học (số từ/ngày, số phút/ngày, số bài/tuần, streak N ngày)
- Tạo và quản lý thói quen học tập (tần suất daily/weekly/custom), check-in hoàn thành
- Học từ vựng theo chủ đề, ôn tập bằng flashcard (spaced repetition)
- Làm quiz kiểm tra kiến thức
- Xem chuỗi ngày học liên tiếp (streak), tỷ lệ hoàn thành thói quen, thống kê theo ngày/tuần/tháng
- Điểm danh mỗi ngày nhận xu, làm ba nhiệm vụ ngày, mua vật phẩm giữ chuỗi để không mất streak khi lỡ nghỉ một hôm
- Xem bảng xếp hạng theo tuần/tháng/toàn thời gian, biết mình đứng thứ mấy trong số người học
- Nhận thông báo nhắc nhở học hàng ngày (theo giờ local, timezone riêng mỗi user), cảnh báo chuỗi sắp đứt, chúc mừng đạt mục tiêu — xem trong chuông thông báo và trang `/notifications`

### Chức năng cho quản trị viên

Quản trị viên **vận hành hệ thống, không phải người học**: đăng nhập bằng tài khoản
`ADMIN` sẽ vào thẳng `/admin`, không thấy màn hình học, streak hay XP (route guard
`Learner` trong `fe/src/routes/AppRoutes.tsx` đẩy admin về khu quản trị).

- **Tổng quan hệ thống** (`/admin`) — quy mô người dùng, người hoạt động 1/7/30 ngày, cơ cấu hoạt động, kho nội dung, tình trạng kết nối DB, uptime API
- **Quản lý tài khoản** (`/admin/users`) — tìm kiếm/lọc/sắp xếp, xem hồ sơ chi tiết, đổi vai trò, khoá–mở khoá, đặt lại mật khẩu, xoá
- **Lượt truy cập** (`/admin/access`) — nhật ký đăng nhập (cả lần thất bại), lượt truy cập theo ngày, phiên đang mở
- **Nội dung học tập** (`/admin/content`) — chủ đề, từ vựng, câu hỏi quiz

Ba quy tắc an toàn bắt buộc giữ khi sửa module này (đã cài trong `admin.service.ts`):
không tự hạ quyền/khoá/xoá chính mình, không xoá hay hạ quyền **quản trị viên hoạt
động cuối cùng** (mất hết admin thì phải sửa tay trong DB mới vào lại được), và khoá
tài khoản thì **thu hồi luôn refresh token** — nếu không, người bị khoá vẫn dùng tiếp
tới khi token hết hạn 30 ngày.

**Quản trị viên KHÔNG có tính năng của người học**: không cấp độ, không XP, không chuỗi
ngày, không phần thưởng, không nhắc nhở học tập. Route guard `Learner` đã chặn các màn
hình học, nhưng những chỗ **dùng chung cho hai vai trò phải tự lọc** — quên lọc thì admin
thấy một dãy số 0 vô nghĩa và tưởng hệ thống đếm sai:

- `Sidebar`, `QuickStats` (thanh trên cùng) và **trang cá nhân**: ẩn khối học tập và
  **không gọi API của người học** (`useLevel(isLearner)`, `useStreak(isLearner)`…) — gọi rồi
  bỏ đi chỉ tốn request và làm log nhiễu.
- **Cron nhắc nhở** (`be/src/jobs/reminder.job.ts`) lọc `user.role === USER`. Lọc ở job chứ
  không ở chỗ tạo cấu hình, vì một tài khoản có thể được nâng lên quản trị **sau khi** đã có
  sẵn cấu hình nhắc nhở.

## Kiến trúc & tech stack

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Web | React + Vite + TypeScript, TailwindCSS + shadcn/ui, React Router, TanStack Query, Zustand | DX nhanh, hệ sinh thái lớn |
| Mobile | React Native (Expo) + NativeWind | tránh setup native, `expo-notifications` tích hợp push dễ |
| Backend | Node.js + **Express** + TypeScript | đã chốt Express (không dùng Fastify): tài liệu/ví dụ nhiều, quy mô vài trăm user không cần hiệu năng của Fastify |
| ORM/DB | Prisma + **MySQL** | quan hệ dữ liệu rõ ràng cho habit/streak/SRS |
| Validate | Zod, dùng chung schema FE/BE qua `shared/` | tránh lệch rule validate 2 phía |
| Auth | JWT tự triển khai (bcrypt hash password), không phụ thuộc bên thứ 3 | |
| Push notification | OneSignal (free tier) | hỗ trợ cả web + mobile; **lịch gửi do `be/src/jobs` quyết định**, OneSignal chỉ là kênh gửi (xem "Quy tắc xây dựng tính năng mới") |
| Monorepo | pnpm workspace | nhẹ, đủ dùng cho quy mô nhỏ |

## Cấu trúc thư mục

```
enghabit/
├── fe/                # Web (React + Vite) — features/{auth,goals,habits,vocabulary,flashcards,quizzes,statistics,notifications,admin}/
├── be/                # Backend (Node + Prisma) — modules/{...cùng tên feature với fe...}/
├── mobile/            # React Native (Expo) — thêm sau, cùng tên feature
├── shared/            # @enghabit/shared: schemas (Zod), constants/enum, srs/ (SM-2), streak/ (tính streak)
├── docs/              # ERD, API spec, architecture notes
└── .github/workflows/ # CI
```

Bên trong `be/src/modules/<feature>/`: `routes.ts → controller.ts → service.ts → schema.ts`.
Bên trong `fe/src/features/<feature>/`: `components/`, `hooks/`, `api.ts`, `types.ts`.

Tên feature/module phải **giống hệt nhau giữa `fe` và `be`** (`auth`, `goals`, `habits`, `vocabulary`, `flashcards`, `lessons`, `quizzes`, `statistics`, `notifications`, `rewards`, `leaderboard`, `admin`) — không đổi tên tuỳ tiện giữa hai phía.

**Hai quy ước bắt buộc khi scaffold:**

- `be/src/lib/prisma.ts` export **một Prisma Client instance duy nhất** (singleton, có guard cho hot-reload dev). Không được `new PrismaClient()` ở bất kỳ file nào khác — mỗi instance mở một pool riêng, hot-reload sẽ làm cạn connection của MySQL và gây lỗi rất khó truy nguyên.
- `shared/` build ra `dist/` bằng `tsup`; `fe`, `be`, `mobile` import từ bản build, **không** import thẳng file `.ts` nguồn. Lý do: Metro (React Native) không resolve TS source qua symlink của workspace nếu không cấu hình thêm — build sẵn giúp cả 3 app dùng chung một cách nhất quán.

## Data model cốt lõi (tóm tắt)

`ActivityLog` là **nguồn sự thật duy nhất** cho mọi hoạt động học (học từ, ôn flashcard, làm quiz, check-in habit). Chi tiết entity xem `docs/er-diagram.md` khi được tạo.

`LoginEvent` là **nguồn sự thật cho mọi số liệu lượt truy cập**: mỗi lần đăng nhập,
kể cả thất bại, ghi một dòng (`success`, `reason`, IP, user-agent). `User.lastLoginAt`
chỉ là bản sao cho nhanh, luôn tái tạo được từ bảng này — không tính lượt truy cập từ
`RefreshToken` hay bất kỳ nguồn nào khác. Khác với `ActivityLog`, `LoginEvent` group
theo **ngày giờ máy chủ**, không theo `local_date`: đây là sự kiện kỹ thuật của hệ
thống, không gắn với "một ngày học" của riêng người dùng nào.

**`UserStreak` là dữ liệu dẫn xuất (cache), không phải nguồn sự thật.** Bảng này lưu sẵn `current_streak`/`longest_streak` chỉ để đọc nhanh, và luôn phải tái tạo được 100% từ `ActivityLog` **cộng với các ngày đã được bù trong `streak_freezes`** (vật phẩm giữ chuỗi — xem mục dưới). Vì vậy:

- Bắt buộc có script `be/prisma/scripts/recompute-streak.ts` tính lại `UserStreak` từ `ActivityLog` (chạy được cho 1 user hoặc toàn bộ user).
- Khi phát hiện streak sai: chạy lại script này, **không sửa tay** giá trị trong bảng.
- Thống kê ngày/tuần/tháng **tính trực tiếp từ `ActivityLog`** (query on-the-fly), không tạo bảng tổng hợp riêng — ở quy mô vài trăm user, thêm bảng tổng hợp chỉ làm tăng nguy cơ lệch số liệu mà không có lợi ích thực tế.
- **Bảng xếp hạng cũng vậy**: `leaderboard.service` group `ActivityLog` theo user mỗi lần đọc, không có bảng điểm riêng. Điểm xếp hạng dùng lại đúng `xpFromActivityCounts` của `shared/level` — dựng thang điểm riêng cho bảng xếp hạng là tạo ra hai cách tính song song, và người dùng sẽ thấy "cấp độ nói một đằng, thứ hạng nói một nẻo". Chỉ xếp hạng tài khoản `USER` đang `ACTIVE`.

### Phần thưởng động viên (module `rewards`)

Điểm danh hằng ngày, ba nhiệm vụ ngày và vật phẩm giữ chuỗi. Bốn quy tắc bắt buộc:

- **Không ghi `ActivityLog`.** Điểm danh và nhận thưởng KHÔNG phải hoạt động học. Ghi vào
  đó thì bấm một nút là đủ giữ streak, và mọi thống kê học tập sẽ nói dối.
- **Thưởng bằng xu, không bằng XP.** XP suy ra từ `ActivityLog` nên không thể tặng thêm.
  Xu có sổ cái riêng `coin_transactions`; **số dư = `SUM(amount)`**, không có cột số dư —
  cùng lý do với thống kê tính thẳng từ `ActivityLog`.
- **Chống nhận trùng bằng ràng buộc `@@unique([userId, dedupeKey])` của DB**, không bằng
  đọc-rồi-ghi: hai request bấm cùng lúc đều đọc thấy "chưa nhận" và sẽ cùng ghi. Khoá dạng
  `DAILY_CHECKIN:<local_date>` và `MISSION:<id>:<local_date>` (sinh bởi `shared/rewards`).
- **Tiến độ nhiệm vụ không lưu ở đâu cả** — chấm lại từ `ActivityLog` của ngày local đó
  mỗi lần đọc, và chấm lại lần nữa ở BE khi nhận thưởng (không tin số FE gửi lên).

Vật phẩm giữ chuỗi (`streak_freezes`) là ngoại lệ duy nhất được phép tác động vào
`UserStreak` ngoài hoạt động học:

- Mỗi dòng là một vật phẩm; `used_on_date` null = còn trong kho. `@@unique([userId, usedOnDate])`
  chặn bù hai vật phẩm cho cùng một ngày (MySQL cho phép nhiều NULL trong unique index).
- Ngày được bù **nối lại mạch nhưng không cộng thêm ngày** vào chuỗi — logic ở
  `shared/streak/applyFrozenDay`, không viết lại ở nơi khác.
- Việc tiêu vật phẩm do **job `be/src/jobs/streak-freeze.job.ts`** làm tự động, không phải
  nút bấm: hôm người dùng quên học cũng là hôm họ không mở app, để họ tự bấm thì vật phẩm vô dụng.
- `recompute-streak` **phải đọc cả `streak_freezes`**, nếu không mỗi lần chạy script là một
  lần xoá sạch công dụng của vật phẩm người dùng đã mua.

### Quy ước thời gian & định nghĩa "một ngày học"

Đây là nguồn gây bug lớn nhất của tính năng streak, nên chốt cứng như sau:

- Mọi mốc thời gian lưu trong DB ở dạng **UTC** (`DATETIME`), gồm cả `ActivityLog.occurred_at`.
- `ActivityLog` **bắt buộc có thêm cột `local_date` (kiểu `DATE`)** — là ngày theo timezone của user tại thời điểm ghi log, tính một lần ở BE khi tạo bản ghi.
- Mọi phép tính streak và thống kê ngày/tuần/tháng đều **group theo `local_date`**, tuyệt đối không convert timezone trong câu SQL. Cách này giúp query đơn giản, chạy nhanh và cho kết quả ổn định kể cả khi user đổi múi giờ.
- Timezone của user lưu ở `User.timezone` (chuỗi IANA, vd `Asia/Ho_Chi_Minh`), mặc định `Asia/Ho_Chi_Minh` khi đăng ký.

## Quy chuẩn kết nối database

- **Toàn bộ kết nối tới MySQL đi qua Prisma** (`be/prisma/schema.prisma` + Prisma Client) — không mở kết nối MySQL trực tiếp bằng driver khác trong code (`mysql2`, raw connection...) trừ trường hợp bất khả kháng phải ghi rõ lý do bằng comment.
- **Connection string** đặt trong biến môi trường `DATABASE_URL` (`.env` ở `be/`), theo format `mysql://<user>:<password>@<host>:<port>/<database>`. Không hardcode host/user/password trong code.
- **Bắt buộc khai báo `connection_limit`** trong `DATABASE_URL`, vd `?connection_limit=5`. MySQL trên free tier thường chỉ cho phép rất ít kết nối đồng thời (Clever Cloud ~5); để Prisma dùng pool mặc định sẽ làm hết connection và app chết với thông báo lỗi khó hiểu.
- **DB hosted phải bật SSL.** Với Aiven, kết nối đã luôn mã hoá vì server bắt buộc TLS nên không cần thêm tham số nào. **Không ghi `sslaccept=strict` mà thiếu `sslcert=ca.pem`** — chứng chỉ Aiven do CA riêng của project ký, không có trong kho chứng chỉ hệ điều hành, nên `strict` sẽ ném lỗi `unknown Cert Authority`. Chi tiết: `docs/aiven-setup.md`.
- **Database và toàn bộ bảng dùng charset `utf8mb4`** (collation `utf8mb4_unicode_ci`). Bắt buộc, vì dữ liệu có tiếng Việt có dấu và có thể có emoji — phát hiện muộn sẽ phải migrate lại toàn bộ dữ liệu.
- Repo chỉ commit `be/.env.example` (giá trị mẫu, không có secret thật). File `.env` thật nằm trong `.gitignore`, tuyệt đối không commit.
- Mỗi môi trường một connection string riêng, không dùng chung DB giữa các môi trường:
  - `local`: MySQL chạy qua Docker (`mysql:8`) hoặc cài local, dữ liệu test/dev
  - `staging`/`production`: MySQL hosted (Railway/Clever Cloud), connection string cấu hình qua biến môi trường trên nền tảng deploy, không đặt trong file commit lên git
- **Đổi schema** chỉ được thực hiện qua `prisma migrate dev` (local) và `prisma migrate deploy` (staging/production) — không sửa tay bảng/cột trực tiếp trên MySQL, kể cả qua GUI.
- `prisma migrate deploy` **chạy tự động trong bước deploy của CI**, không ai chạy tay lên production — chạy tay dễ bị quên và làm schema production lệch với code.
- **Quy ước đặt tên:** model trong Prisma dùng `PascalCase` số ít (`ActivityLog`), nhưng bắt buộc `@@map` sang tên bảng `snake_case` số nhiều (`activity_logs`) và `@map` cho cột (`local_date`). Không có quy ước này, tên trong code và tên nhìn thấy trong DBeaver sẽ khác nhau, gây nhầm lẫn khi debug.
- **Bật Prisma query log ở môi trường dev** (`log: ['query', 'error', 'warn']`) để thấy SQL thật sinh ra — cần thiết khi truy vết sai lệch số liệu thống kê. Production chỉ log `error`, `warn`.
- **Seed data** (`be/prisma/seed.ts`) phải đủ để chạy thử ngay sau khi clone: 1 tài khoản admin, 1 tài khoản user mẫu, vài chủ đề + từ vựng + câu hỏi quiz. Seed phải **idempotent** (dùng `upsert`), chạy nhiều lần không tạo dữ liệu trùng.
- **Công cụ xem/thao tác dữ liệu:**
  - `npx prisma studio` — dùng chính để xem, thêm/sửa/xoá dữ liệu nhanh khi dev/debug
  - **DBeaver Community** — dùng khi cần viết SQL thô để kiểm tra join phức tạp (vd đối chiếu `ActivityLog` với `UserStreak`), miễn phí, kết nối bằng cùng connection string
  - Không cài thêm công cụ khác ngoài 2 công cụ trên nếu không cần thiết, tránh mỗi người dùng một phần mềm khác nhau gây khó đồng bộ quy trình
- Khi kết nối tới DB hosted để debug production: chỉ dùng tài khoản/connection string được cấp riêng cho việc đọc (nếu provider hỗ trợ read-only user), hạn chế sửa trực tiếp dữ liệu production — nếu cần sửa, ưu tiên viết migration hoặc script chạy qua Prisma thay vì sửa tay qua GUI.

## Quy tắc viết code

- TypeScript strict mode ở cả `fe`, `be`, `mobile`, `shared`. Không dùng `any` trừ khi kèm comment giải thích lý do.
- Mỗi module BE bắt buộc theo đúng luồng `routes → controller → service → schema (Zod) → Prisma`. Không viết business logic trong route hoặc controller.
- File tiện ích đặt tên cụ thể theo domain (`streak-calculator.ts`, `timezone.util.ts`) — không tạo `helpers.ts`/`common.ts` chung chung làm nơi chứa đồ tạp.
- Dùng `async/await`, không dùng `.then()` chain. Mọi promise phải được bắt lỗi (try/catch hoặc error middleware), không để unhandled rejection.
- Format/lint theo cấu hình ESLint + Prettier ở root, áp dụng chung cho cả 3 app.

## Quy chuẩn màu và logo (frontend)

> Bộ quy tắc phối màu đầy đủ (25 quy tắc, có mã R1-R25 để trích dẫn) nằm trong
> **`docs/color-rules.md`**. Đọc file đó trước khi đổi bất kỳ màu nào, và chạy lại
> bảng đối chiếu tương phản ở cuối file sau khi đổi.

- Màu thương hiệu khai báo trong `fe/src/index.css` dưới dạng **kênh màu** (`--brand: 19 112 114;`),
  không phải hex. Tailwind cần dạng này để áp được độ mờ (`text-ink/70`, `bg-brand/20`);
  nếu khai báo hex thuần, các class có `/` **bị bỏ qua âm thầm** — không báo lỗi, chỉ mất màu khi chạy.
- Các giá trị màu đã kiểm tra tương phản WCAG, **không đổi bằng cảm tính**. Đổi thì phải chạy lại
  bảng đối chiếu ở cuối `docs/color-rules.md`, trên **cả hai chế độ**.
- **Nền hệ thống `#5A495C` là màu TỐI, nên có hai bộ token chữ, dùng nhầm là lỗi im lặng:**
  `content` (`--text*`, chữ **trong thẻ** — tối ở chế độ sáng) và `on-page` (`--on-page*`, chữ **trên
  nền hệ thống**: sidebar, thanh trên cùng, tiêu đề trang, mọi chữ ngoài thẻ — sáng ở chế độ sáng).
  Ở chế độ tối hai bộ trùng giá trị nên đặt sai chỉ lộ ra ở chế độ sáng.
- **`--brand` (olive `#8E9141`) chỉ đạt 3.35:1 trên nền trắng và 2.47:1 trên nền hệ thống** — không
  dùng làm chữ. Link trong thẻ dùng `--brand-strong`, link trên nền hệ thống dùng `--on-page-link`.
- **Panel đăng nhập luôn sáng ở cả hai chế độ**, nên chữ trên đó dùng `--on-brand` (tối ở cả hai
  chế độ), tuyệt đối không dùng `--ink` — token này lật theo chế độ và sẽ thành chữ sáng trên nền
  sáng (1.47:1).
- Thang màu biểu đồ (`--series-*`) và thang lịch hoạt động là hai bộ riêng, đã qua kiểm tra
  phân biệt cho người mù màu và tính đơn điệu độ sáng. Không hoán đổi thứ tự.
- **Tên hệ thống hiển thị là `ENG//HABIT`**, luôn dùng qua component `Wordmark`, không tự chèn thẻ
  `img` và không gõ tay chuỗi `ENG//HABIT` thành chữ. Tên là **ảnh** (`fe/public/wordmark.png` navy
  bản navy, `wordmark-dark.png` bản sáng màu) đã tách nền trong suốt từ bản thiết kế gốc — vì là ảnh
  nên **màu không đổi theo token**, đổi bảng màu nền thì phải chạy lại `fe/scripts/make-wordmark.py`.
  Chọn file theo **nền đang đứng**, không theo chế độ: khung app luôn `on="dark"` (nền hệ thống tối ở
  cả hai chế độ), panel đăng nhập `on="light"`. Tên gói npm
  `@enghabit/*` giữ nguyên, đó là định danh mã nguồn chứ không phải tên hiển thị.
- Logo: `mark.svg` (mốc thu gọn) dùng cho favicon và nơi nhỏ dưới 40px; `logo.png` (linh vật đầy đủ)
  dùng cho nơi lớn. Linh vật có chân tay mảnh nên ở cỡ nhỏ chỉ còn là một vệt màu.
  Luôn dùng qua component `Logo`, không tự chèn thẻ `img`.

## Quy tắc xây dựng tính năng mới

### Checklist bắt buộc khi thêm một màn hình mới

Làm đủ 6 việc dưới đây rồi mới coi là xong. Ba việc đầu quên thì không ai thấy lỗi
ngay lúc code — màn hình vẫn chạy, chỉ sai lệch dần so với phần còn lại của app.

1. **Route + guard** trong `fe/src/routes/AppRoutes.tsx`: bọc `Learner` / `Admin` / `Feature`
   đúng vai trò, đặt `name` là tên màn hình (dùng cho Error Boundary).
2. **Breadcrumb**: thêm dòng vào `TRAILS` ở `fe/src/shared/lib/breadcrumbs.ts`. Màn hình phụ
   không có URL riêng thì gọi `useBreadcrumbTail(...)`.
3. **Ngôn ngữ**: mọi chữ đi qua `t()`, và **thêm bản dịch tiếng Anh vào `fe/src/shared/i18n/en.ts`**.
   Đây là bước dễ quên nhất vì thiếu bản dịch không làm vỡ gì cả — câu đó chỉ lặng lẽ hiện
   tiếng Việt giữa giao diện tiếng Anh.
4. **Nhãn thống nhất**: tên màn hình ở `Sidebar`, ở `TRAILS` và ở `name` của route phải
   **giống hệt nhau** — một màn hình chỉ có một tên, và chỉ cần một khoá dịch.
5. **Màu**: chữ trong thẻ dùng `content*`, chữ trên nền hệ thống dùng `on-page*`
   (xem `docs/color-rules.md`).
6. **Chạy kiểm tra**: `pnpm --filter @enghabit/fe check:i18n` và `pnpm --filter @enghabit/fe typecheck`.
   CI cũng chạy đúng hai lệnh này nên thiếu bản dịch là build đỏ.

- Tạo tính năng mới luôn tạo đủ cặp `be/src/modules/<feature>` và `fe/src/features/<feature>` theo đúng khuôn mẫu đã có sẵn — không tự sáng tạo cấu trúc riêng cho 1 feature.
- Mọi hành động học tập của user phải ghi vào `ActivityLog`; streak/thống kê không được tính từ nguồn khác.
- **Thêm màn hình mới là phải khai báo breadcrumb.** `AppLayout` vẽ breadcrumb sẵn cho mọi
  route, nhưng nhãn lấy từ bản đồ `fe/src/shared/lib/breadcrumbs.ts` — quên khai báo thì
  route mới chỉ hiện mỗi mục gốc, người dùng không biết mình đang ở đâu. Ba việc bắt buộc
  khi thêm route:
  1. Thêm một dòng vào `TRAILS` trong `breadcrumbs.ts`, nhãn **giống hệt** nhãn ở `Sidebar`
     và ở route guard trong `AppRoutes.tsx` — một màn hình chỉ được có một tên.
  2. Không tự chèn breadcrumb trong trang. Trang chỉ dùng `PageHeader`; breadcrumb là việc
     của khung app, đặt hai chỗ sẽ ra hai dòng chồng nhau.
  3. Màn hình phụ nằm **trong** một route (làm quiz, làm bài học, xem chi tiết) không có URL
     riêng nên không tra được từ bản đồ — gọi `useBreadcrumbTail('Tên màn')` để nối thêm một
     cấp, hook tự gỡ khi rời màn. Chỉ một component được đặt tail tại một thời điểm; đừng gọi
     hook này ở cả component cha lẫn con.
- Breadcrumb nằm trên nền hệ thống nên chữ dùng bộ token `on-page*` và liên kết dùng
  `on-page-link`, không dùng `content*` (xem `docs/color-rules.md`).
- **Mọi chữ hiện trên giao diện phải đi qua `t()`** (`fe/src/shared/i18n/language.tsx`).
  Khoá dịch chính là **câu tiếng Việt**, không phải mã kiểu `common.logout`: đọc code thấy
  ngay chữ trên màn hình, và quên dịch thì câu đó hiện tiếng Việt chứ không hiện mã.
  - **Không nối chuỗi.** Chèn biến bằng chỗ trống: `t('Còn {n} XP nữa', { n: 20 })`. Câu ghép
    bằng `+` hoặc template literal thì không dịch được vì trật tự từ hai ngôn ngữ khác nhau.
  - **Câu trải nhiều dòng JSX vẫn là một khoá duy nhất** — đừng tách thành hai `t()`.
  - Nhãn nằm trong **bảng dữ liệu** (`labels.ts`, mục sidebar, bản đồ breadcrumb, mảng
    hằng số) giữ nguyên tiếng Việt tại chỗ khai báo và dịch ở **chỗ hiển thị**: `{t(item.label)}`.
    Thêm nhãn mới vào các bảng đó thì phải tự thêm bản dịch — script kiểm tra không quét được nhóm này.
  - Hàm thường (không phải component) không gọi hook được: **nhận `t` và `locale` qua tham số**
    (xem `timeAgo`, `formatDateTime`).
  - Định dạng ngày/số dùng `useLocale()`, **không hardcode `'vi-VN'`** — nếu không, giao diện
    tiếng Anh vẫn hiện ngày kiểu Việt.
  - Sau khi thêm chữ mới: `node fe/scripts/check-translations.mjs` (báo câu còn thiếu bản dịch).
  - Dữ liệu động (tên bài học, tên chủ đề, nội dung thông báo do BE sinh) **không** đưa qua `t()`.
- Logic tính streak là **domain logic, không phải utility** — chỉ định nghĩa một lần trong `shared/streak/`, `be` dùng để tính chính thức, `fe`/`mobile` dùng để hiển thị/preview. Không đặt trong `common/utils/` và không viết lại ở nơi khác.
- Thuật toán SRS (SM-2) chỉ định nghĩa một lần trong `shared/srs`, cả `be` (chấm điểm review) và `fe`/`mobile` (preview lịch ôn) cùng import.
- **Lịch gửi thông báo chỉ do `be/src/jobs` quyết định.** OneSignal chỉ đóng vai trò kênh gửi — không dùng tính năng tự lên lịch của OneSignal. Có hai nơi cùng lên lịch sẽ khiến user nhận trùng thông báo và rất khó truy nguyên.
- **Thông báo luôn lưu vào bảng `notifications` trước, push chỉ là kênh báo thêm.** Push có thể bị chặn hoặc bỏ lỡ; mở app lên vẫn phải thấy việc cần làm. Job gọi `notification.service.createNotification()` chứ không tự ghi bảng — chỉ một chỗ sinh thông báo.
- **Mọi thông báo tự động phải có `dedupeKey`** dạng `<TYPE>:<local_date>` (mục tiêu thì thêm `goalId`, lời nhắc học thì thêm `reminderId`). Cron chạy lại 15 phút một lần, không có khoá này thì user nhận cùng một lời nhắc nhiều lần trong ngày.
- **Một người đặt được NHIỀU mốc nhắc** (bảng `reminders`, tối đa `MAX_REMINDERS_PER_USER`), còn `notification_settings` chỉ giữ công tắc tổng và các loại cảnh báo — không còn cột giờ nhắc ở đó. Vì vậy khoá chống trùng của lời nhắc học **bắt buộc có `reminderId`**: đặt 8:00 và 20:00 là hai lời nhắc cố ý khác nhau trong cùng một ngày, thiếu id thì mốc thứ hai bị coi là trùng và im lặng. `@@unique([userId, timeOfDay])` chặn hai mốc cùng giờ.
- **Không nhắc người đã học hôm nay.** Job kiểm tra `ActivityLog` theo `local_date` trước khi tạo thông báo — nhắc người đang học đều là cách nhanh nhất khiến họ tắt thông báo.
- Query param kiểu boolean **không dùng `z.coerce.boolean()`**: query string luôn là chuỗi và `Boolean('false') === true`, nên bộ lọc sẽ luôn bật. Dùng `z.preprocess` so khớp `'true'`/`'1'` (xem `notificationQuerySchema`).
- Mọi route `/admin/*` bắt buộc đi qua role-guard middleware.
- **Và ngược lại: module học tập chặn `requireRole(UserRole.USER)` ngay ở tầng router** —
  `rewards`, `lessons`, `flashcards`, `quizzes`, `habits`, `goals`, `statistics`, cùng
  `/notifications/settings`. Ẩn trên giao diện là chưa đủ: token admin gọi thẳng API vẫn
  điểm danh lấy xu hay ghi `ActivityLog` được. Hai ngoại lệ cố ý mở cho cả hai vai trò:
  `/topics` (khu quản trị đọc để quản lý nội dung) và danh sách `/notifications` (quản trị
  viên vẫn nhận thông báo hệ thống trong chuông).
- Thay đổi schema DB luôn qua `prisma migrate dev`, không sửa tay trực tiếp trên MySQL.

## Quy tắc tái sử dụng code

- Trước khi viết mới một hàm/schema/enum, kiểm tra `shared/` xem đã có sẵn chưa.
- Bất kỳ logic nào dùng ở ≥ 2 app (`fe`+`be`, hoặc `be`+`mobile`) bắt buộc đưa vào `shared/`, không copy-paste giữa các app.
- `shared/` chỉ chứa: Zod schema validate, enum/constants nghiệp vụ (`GoalType`, `ActivityType`, `HabitFrequency`...), thuật toán SRS, type dùng chung. Không đặt UI component hay code đặc thù riêng 1 platform vào đây.
- Trong một module, ưu tiên gọi service có sẵn của module khác (ví dụ `activity-logs.service`) thay vì tự ghi trực tiếp vào DB, để tránh 2 chỗ cùng ghi log theo cách khác nhau.

## Quy tắc debug

- Mọi request BE có request-id (structured logger, ví dụ `pino`) để trace xuyên suốt `routes → controller → service`.
- Khi số liệu streak/thống kê sai, theo đúng thứ tự: (1) soi `ActivityLog` — bản ghi có được tạo không, `local_date` có đúng timezone user không; (2) nếu `ActivityLog` đúng mà `UserStreak` sai thì chạy `recompute-streak`; (3) tuyệt đối không sửa tay giá trị trong `UserStreak`.
- Bug liên quan tới ngày/streak: luôn kiểm tra `User.timezone` và cột `local_date` trước khi nghi ngờ logic tính toán — phần lớn lỗi loại này đến từ sai timezone, không phải sai thuật toán.
- Streak "tự nhiên còn" dù có ngày nghỉ: xem `streak_freezes` — rất có thể một vật phẩm đã bù ngày đó (job chạy 30 phút một lượt). Đây là hành vi đúng, không phải bug.
- Không nhận được xu: kiểm tra `coin_transactions` theo `dedupe_key` của ngày đó. Trùng khoá nghĩa là đã nhận rồi, API trả lỗi 409 chứ không cộng thêm lần nữa.
- Test đặt cạnh file nguồn trong cùng thư mục module (`*.test.ts`), không gom vào thư mục `tests/` tách biệt.
- FE: mỗi feature lớn (`flashcards`, `quizzes`...) có Error Boundary cục bộ, tránh lỗi 1 feature làm crash toàn app.
- Debug cron/notification: xem log riêng của `be/src/jobs`, không lẫn với log của module `notifications` (module này giữ **nội dung và lưu trữ** thông báo + cấu hình nhắc nhở, nhưng **không chứa lịch trình gửi**).
- Không nhận được nhắc nhở: kiểm tra theo thứ tự (1) `notification_settings.is_enabled` — công tắc tổng, tắt là im hết; (2) bảng `reminders`: có mốc nào `is_enabled` và `days_of_week` chứa thứ hôm nay không; (3) `User.timezone` — giờ nhắc tính theo giờ user, không phải giờ máy chủ; (4) hôm đó user đã có `ActivityLog` chưa (đã học thì hệ thống cố ý im lặng); (5) bảng `notifications` xem `dedupe_key` (`DAILY_REMINDER:<reminderId>:<local_date>`) của ngày đó đã tồn tại chưa.

## Quy tắc commit Git

Format bắt buộc:

```text
<Hành_động>_<Tên_module>_<Tên_tính_năng>_<Mô_tả_cập_nhật_ngắn>
```

- **`Hành_động`**: một trong `Them` (thêm mới), `Sua` (sửa lỗi), `Capnhat` (cập nhật/chỉnh sửa logic có sẵn), `Xoa` (xoá), `Taicautruc` (refactor), `Taillieu` (docs), `Kiemthu` (test).
- **`Tên_module`**: `<app>-<module>` theo đúng tên đã quy ước ở trên, vd `BE-Habits`, `FE-Flashcards`, `Shared-Srs`, `Mobile-Quizzes`. Nếu đụng nhiều module, nối bằng dấu `+`: `BE-Habits+FE-Habits`.
- **`Tên_tính_năng`**: tên cụ thể của tính năng trong module đó, vd `CheckIn`, `TinhLichOn`, `ThongKeTuan` — không để trống, không viết chung chung như `Code`, `Logic`.
- **`Mô_tả_cập_nhật_ngắn`**: một câu ngắn gọn mô tả đã làm gì, viết thường có dấu, không lặp lại tên tính năng.

Ví dụ hợp lệ:

```text
Them_BE-Flashcards_TinhLichOn_Thêm API tính lịch ôn theo thuật toán SM-2
Sua_FE-Statistics_ThongKeTuan_Sửa sai lệch số liệu thống kê theo tuần
Taicautruc_Shared-Schemas_GoalSchema_Tách schema Goal ra khỏi schema Habit
Taillieu_Docs-Claude_QuyTacCommit_Bổ sung quy tắc commit git
```

Nguyên tắc bổ sung:

- Mỗi commit chỉ nên gói gọn trong **một tính năng**; nếu thay đổi không liên quan nhau, tách thành nhiều commit riêng.
- **Dự án chỉ có một nhánh `main`** — commit thẳng lên `main`, không tạo nhánh phụ và không mở PR. Đây là dự án một người làm, thêm nhánh chỉ tốn thêm thao tác merge mà không có ai review.
- Bù lại cho việc không có PR: mỗi commit phải tự nó **biên dịch và chạy được**. Khi một thay đổi trải trên nhiều commit, đừng để commit ở giữa gọi tới thứ chưa tồn tại — người sau `git checkout` vào đúng commit đó sẽ thấy code hỏng mà không hiểu vì sao.
- Trước khi commit, đảm bảo lint/test của đúng module đó đã pass (xem "Lệnh thường dùng" khi có). Commit có đụng chữ trên giao diện thì chạy thêm `pnpm --filter @enghabit/fe check:i18n`.

## Lệnh thường dùng

Chạy từ thư mục gốc:

| Lệnh | Tác dụng |
|---|---|
| `pnpm install` | Cài dependencies toàn workspace |
| `pnpm build:shared` | **Build `shared/` — bắt buộc chạy lại sau mỗi lần sửa `shared/`**, nếu không `be`/`fe` vẫn dùng bản cũ |
| `pnpm dev:be` | Chạy API dev (tsx watch) tại `http://localhost:4000` |
| `pnpm dev:fe` | Chạy web dev tại `http://localhost:5173` (proxy `/api` sang backend) |
| `pnpm test` | Test toàn workspace |
| `pnpm --filter @enghabit/shared test` | Chỉ test `shared` (streak, SM-2) |
| `pnpm --filter @enghabit/be typecheck` | Typecheck backend |
| `pnpm --filter @enghabit/fe check:i18n` | **Soát câu chưa có bản dịch tiếng Anh** — chạy sau mỗi lần thêm chữ mới lên giao diện (CI cũng chạy lệnh này) |
| `pnpm db:migrate` | `prisma migrate dev` — tạo & áp migration |
| `pnpm db:seed` | Nạp dữ liệu mẫu (idempotent) |
| `pnpm db:studio` | Prisma Studio xem/sửa dữ liệu |
| `pnpm --filter @enghabit/be db:generate` | Generate lại Prisma Client sau khi sửa schema |
| `pnpm --filter @enghabit/be db:recompute-streak` | **Tính lại streak từ ActivityLog** khi số liệu sai (thêm `-- <userId>` để chạy cho 1 user) |

Chạy một test cụ thể: `pnpm --filter @enghabit/shared exec vitest run src/streak/streak.test.ts`
