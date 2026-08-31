# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Trạng thái dự án

Đã scaffold xong nền tảng: `shared` (enum, Zod schema, SM-2, streak — có test), `be` (Express + Prisma + đầy đủ module auth/goals/habits/topics/flashcards/quizzes/statistics/notifications/admin, cron nhắc nhở), `fe` (React + Vite + Tailwind, auth + dashboard thống kê). `mobile` chưa scaffold.

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

Tên feature/module phải **giống hệt nhau giữa `fe` và `be`** (`auth`, `goals`, `habits`, `vocabulary`, `flashcards`, `quizzes`, `statistics`, `notifications`, `admin`) — không đổi tên tuỳ tiện giữa hai phía.

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

**`UserStreak` là dữ liệu dẫn xuất (cache), không phải nguồn sự thật.** Bảng này lưu sẵn `current_streak`/`longest_streak` chỉ để đọc nhanh, và luôn phải tái tạo được 100% từ `ActivityLog`. Vì vậy:

- Bắt buộc có script `be/prisma/scripts/recompute-streak.ts` tính lại `UserStreak` từ `ActivityLog` (chạy được cho 1 user hoặc toàn bộ user).
- Khi phát hiện streak sai: chạy lại script này, **không sửa tay** giá trị trong bảng.
- Thống kê ngày/tuần/tháng **tính trực tiếp từ `ActivityLog`** (query on-the-fly), không tạo bảng tổng hợp riêng — ở quy mô vài trăm user, thêm bảng tổng hợp chỉ làm tăng nguy cơ lệch số liệu mà không có lợi ích thực tế.

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

- Tạo tính năng mới luôn tạo đủ cặp `be/src/modules/<feature>` và `fe/src/features/<feature>` theo đúng khuôn mẫu đã có sẵn — không tự sáng tạo cấu trúc riêng cho 1 feature.
- Mọi hành động học tập của user phải ghi vào `ActivityLog`; streak/thống kê không được tính từ nguồn khác.
- Logic tính streak là **domain logic, không phải utility** — chỉ định nghĩa một lần trong `shared/streak/`, `be` dùng để tính chính thức, `fe`/`mobile` dùng để hiển thị/preview. Không đặt trong `common/utils/` và không viết lại ở nơi khác.
- Thuật toán SRS (SM-2) chỉ định nghĩa một lần trong `shared/srs`, cả `be` (chấm điểm review) và `fe`/`mobile` (preview lịch ôn) cùng import.
- **Lịch gửi thông báo chỉ do `be/src/jobs` quyết định.** OneSignal chỉ đóng vai trò kênh gửi — không dùng tính năng tự lên lịch của OneSignal. Có hai nơi cùng lên lịch sẽ khiến user nhận trùng thông báo và rất khó truy nguyên.
- **Thông báo luôn lưu vào bảng `notifications` trước, push chỉ là kênh báo thêm.** Push có thể bị chặn hoặc bỏ lỡ; mở app lên vẫn phải thấy việc cần làm. Job gọi `notification.service.createNotification()` chứ không tự ghi bảng — chỉ một chỗ sinh thông báo.
- **Mọi thông báo tự động phải có `dedupeKey`** dạng `<TYPE>:<local_date>` (mục tiêu thì thêm `goalId`). Cron chạy lại 15 phút một lần, không có khoá này thì user nhận cùng một lời nhắc nhiều lần trong ngày.
- **Không nhắc người đã học hôm nay.** Job kiểm tra `ActivityLog` theo `local_date` trước khi tạo thông báo — nhắc người đang học đều là cách nhanh nhất khiến họ tắt thông báo.
- Query param kiểu boolean **không dùng `z.coerce.boolean()`**: query string luôn là chuỗi và `Boolean('false') === true`, nên bộ lọc sẽ luôn bật. Dùng `z.preprocess` so khớp `'true'`/`'1'` (xem `notificationQuerySchema`).
- Mọi route `/admin/*` bắt buộc đi qua role-guard middleware.
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
- Test đặt cạnh file nguồn trong cùng thư mục module (`*.test.ts`), không gom vào thư mục `tests/` tách biệt.
- FE: mỗi feature lớn (`flashcards`, `quizzes`...) có Error Boundary cục bộ, tránh lỗi 1 feature làm crash toàn app.
- Debug cron/notification: xem log riêng của `be/src/jobs`, không lẫn với log của module `notifications` (module này giữ **nội dung và lưu trữ** thông báo + cấu hình nhắc nhở, nhưng **không chứa lịch trình gửi**).
- Không nhận được nhắc nhở: kiểm tra theo thứ tự (1) `notification_settings.is_enabled` và `days_of_week` có chứa thứ hôm nay không; (2) `User.timezone` — giờ nhắc tính theo giờ user, không phải giờ máy chủ; (3) hôm đó user đã có `ActivityLog` chưa (đã học thì hệ thống cố ý im lặng); (4) bảng `notifications` xem `dedupe_key` của ngày đó đã tồn tại chưa.

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
- Không commit trực tiếp lên `main`; tạo nhánh cùng quy tắc đặt tên (vd `them/be-habits-checkin`) rồi mở PR.
- Trước khi commit, đảm bảo lint/test của đúng module đó đã pass (xem "Lệnh thường dùng" khi có).

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
| `pnpm db:migrate` | `prisma migrate dev` — tạo & áp migration |
| `pnpm db:seed` | Nạp dữ liệu mẫu (idempotent) |
| `pnpm db:studio` | Prisma Studio xem/sửa dữ liệu |
| `pnpm --filter @enghabit/be db:generate` | Generate lại Prisma Client sau khi sửa schema |
| `pnpm --filter @enghabit/be db:recompute-streak` | **Tính lại streak từ ActivityLog** khi số liệu sai (thêm `-- <userId>` để chạy cho 1 user) |

Chạy một test cụ thể: `pnpm --filter @enghabit/shared exec vitest run src/streak/streak.test.ts`
