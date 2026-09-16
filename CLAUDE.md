# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Trạng thái dự án

Đã scaffold xong nền tảng: `shared` (enum, Zod schema, SM-2, streak, phần thưởng — có test), `be` (Express + Prisma + đầy đủ module auth/goals/habits/topics/library/study/statistics/notifications/rewards/leaderboard/admin, cron nhắc nhở + cron vật phẩm giữ chuỗi), `fe` (React + Vite + Tailwind, auth + dashboard thống kê). `mobile` chưa scaffold.

Các feature FE còn lại (habits, goals, admin) đã có sẵn API backend và khuôn mẫu ở `fe/src/features/auth` + `fe/src/features/statistics` để làm theo.

## Tổng quan hệ thống

**ENG//HABIT** (English Learning Habit Building Application) — ứng dụng hỗ trợ xây dựng và duy trì thói quen học tiếng Anh. Vấn đề cốt lõi cần giải quyết: người học thường không thiếu tài liệu mà thiếu cơ chế duy trì thói quen học đều đặn. Hệ thống kết hợp: **học tiếng Anh (từ vựng, quiz) + quản lý mục tiêu/thói quen + theo dõi tiến độ (streak, thống kê)**.

### Chức năng cho người học
- Tạo tài khoản, quản lý thông tin cá nhân
- Thiết lập mục tiêu học (số từ/ngày, số phút/ngày, số bài/tuần, streak N ngày)
- Tạo và quản lý thói quen học tập (tần suất daily/weekly/custom), check-in hoàn thành
- Khám phá bộ thẻ công khai, tự tạo bộ thẻ riêng tư/công khai, chia sẻ và báo cáo vi phạm (`/library`)
- Học một bộ thẻ bằng flashcard hoặc trắc nghiệm (`/learn`), ôn thẻ tới hạn/quá hạn/yếu theo SM-2 (`/review`)
- Xem chuỗi ngày học liên tiếp (streak), tỷ lệ hoàn thành thói quen, thống kê theo ngày/tuần/tháng
- Điểm danh mỗi ngày nhận xu, làm ba nhiệm vụ ngày, mua vật phẩm giữ chuỗi để không mất streak khi lỡ nghỉ một hôm
- Xem bảng xếp hạng theo tuần/tháng/toàn thời gian, biết mình đứng thứ mấy trong số người học
- Lập nhóm lớp, đăng bài nội bộ, nhắc nhau bằng `@`, dùng chung kho tài liệu của nhóm và học các bộ thẻ trưởng nhóm chia sẻ
- Nhận thông báo nhắc nhở học hàng ngày (theo giờ local, timezone riêng mỗi user), cảnh báo chuỗi sắp đứt, chúc mừng đạt mục tiêu — xem trong chuông thông báo và trang `/notifications`

### Thư viện, Học và Ôn tập (module `library` + `study`)

Đặc tả đầy đủ và mọi quyết định đã chốt: **`docs/ke-hoach-hoc-on-flashcard.md`** — đọc
trước khi sửa. Thay cho module `lessons` (gỡ 12/09/2026) và màn `/flashcards` cũ.

- **Bộ thẻ = `Topic`, thẻ = `Vocabulary`.** Không có bảng StudySet/Flashcard riêng.
  `ownerId` null là bộ "Hệ thống" do quản trị viên soạn ở `/admin/content`; có giá trị là
  bộ người học tự tạo. `createdById` KHÔNG dùng để hiển thị tác giả.
- **Quyền truy cập nằm ở MỘT chỗ: `be/src/modules/library/library.access.ts`.** Mọi truy
  vấn bộ thẻ, thẻ, tiến độ, lịch sử của người học phải lọc qua `readableSetWhere` ngay
  trong câu truy vấn. Người không có quyền nhận **404**, không nhận 403.
- **Một thẻ, một trạng thái nhớ (`UserVocabProgress`).** Học và Ôn tập cùng gọi
  `reviewCard()` của `shared/srs`. Lịch ôn tính theo NGÀY (`nextReviewDate` kiểu `DATE`),
  không có mốc phút. Nhóm Yếu và các ngưỡng nằm ở `shared/src/study/study.ts`.
- **Đáp án không rời server trước khi trả lời.** Đề phát kèm mã câu hỏi mã hoá AES-GCM
  (`study/question-token.ts`) — chỉ ký là KHÔNG ĐỦ vì base64 đọc được. Mỗi câu chấm và ghi
  ngay; `card_reviews.@@unique([userId, attemptKey])` chặn bấm hai lần.
- **`ActivityLog` mỗi thẻ một dòng:** thẻ chưa từng học ghi `VOCAB_LEARNED`, thẻ đã có lịch
  ghi `FLASHCARD_REVIEWED`. Kết thúc phiên Học ghi thêm một `QUIZ_COMPLETED` với
  `dedupeKey = SESSION:<sessionKey>` — đây là nguồn của mục tiêu `LESSONS_PER_WEEK` (nay
  hiển thị "Số phiên học mỗi tuần"). Không đổi tên enum: `activity_logs` còn dữ liệu cũ.
- **Cram Mode không ghi gì cả** — không SRS, không `card_reviews`, không `ActivityLog`.
  Ghi vào là cày được XP và streak vô hạn.
- **`card_reviews` chỉ phục vụ lịch sử và độ chính xác.** Streak, XP, thống kê ngày vẫn
  đọc `ActivityLog` — đếm hoạt động từ `card_reviews` là tạo nguồn số liệu thứ hai.
- **Kiểm duyệt như nhóm lớp:** người học báo cáo bộ công khai, quản trị viên chặn (bắt buộc
  lý do) hoặc bỏ qua ở `/admin/study-sets`. Không có xoá bộ thẻ phía quản trị. Bộ "Hệ
  thống" không nhận báo cáo và không bị chặn. Chống báo cáo trùng bằng unique `pendingKey`.
- Cờ tính năng giữ khoá cũ để không mất trạng thái đã lưu: `VOCABULARY` = Thư viện,
  `FLASHCARDS` = Ôn tập, thêm `LEARN` = Học. `/study` kiểm tra cờ theo `source` trong service.

`NotificationType.MISTAKES_PENDING` vẫn còn trong enum nhưng **không ai sinh ra nữa**. Giữ
lại vì các thông báo CŨ đã gửi đang mang giá trị đó; bỏ khỏi enum là chúng không đọc được.

### Nhóm lớp (mọi người dùng)

Không gian trao đổi nội bộ do chính người học lập ra, tách hẳn khỏi diễn đàn Cộng đồng.

- Ai cũng tạo được nhóm; người tạo là **trưởng nhóm** đầu tiên. Một nhóm có thể có nhiều
  trưởng nhóm (mô hình quản trị viên của nhóm Messenger), phong/hạ quyền lẫn nhau được.
- Nhóm **công khai** tìm được bằng tên; nhóm **riêng tư** chỉ vào được qua **mã 8 chữ số**
  duy nhất. Mã sinh bằng `randomInt` của `node:crypto`, không dùng `Math.random` — mã là
  thứ duy nhất bảo vệ nhóm riêng tư.
- Trưởng nhóm bật/tắt **phê duyệt thành viên**: bật thì người xin vào phải chờ duyệt, tắt
  thì vào thẳng. Duyệt hoặc từ chối đều sinh thông báo cho người xin.

**Quản trị viên KHÔNG dùng khu nhóm của người học.** Route `/groups` bọc guard `Learner`,
sidebar quản trị không có mục đó. Quản trị viên có `/admin/groups` với đúng ba việc: xem
thông tin nhóm, gửi cảnh báo vi phạm tới toàn bộ thành viên, và chặn/mở chặn nhóm. Không
có "xoá nhóm" ở phía quản trị — chặn là biện pháp đảo ngược được, xoá thì mất dữ liệu.

**Chặn nhóm phải khoá đủ mọi lối, không chỉ giấu giao diện.** `isMember` trả false với
mọi người khi nhóm bị chặn, nên toàn bộ bài đăng, bình luận, thả tim và tệp đính kèm khoá
theo; ngoài ra chặn riêng: sửa thông tin nhóm, xin vào nhóm, và nhóm biến mất khỏi tìm
kiếm. Lý do chặn là **bắt buộc** và hiện nguyên văn cho thành viên khi họ mở nhóm — nên
viết cho người dùng cuối đọc, không phải ghi chú nội bộ.

Ba quy tắc bắt buộc giữ khi sửa module này:

- **Nhóm luôn còn ít nhất một trưởng nhóm.** `assertNotLastLeader` chặn mọi thao tác làm
  mất trưởng nhóm cuối (hạ quyền, rời nhóm, bị xoá). Mất hết trưởng nhóm thì không ai
  duyệt được yêu cầu và nhóm thành xác chết.
- **Bài đăng của nhóm không bao giờ lọt ra diễn đàn chung.** `Post.groupId` null là bài
  chung, có giá trị là bài nội bộ; `community.service` lọc `groupId: query.groupId ?? null`
  và kiểm tra tư cách thành viên ở **cả năm** lối vào: danh sách, chi tiết bài, bình luận,
  thả tim và **tải tệp đính kèm**. Thiếu một chỗ là rò rỉ nội dung nhóm riêng tư.
- **Bài của nhóm dùng lại module community**, không dựng bảng bài viết thứ hai — nhờ vậy
  tệp đính kèm, bình luận, thả tim chỉ có một bản triển khai. Khoá cache của FE
  (`communityKeys.list`) **bắt buộc chứa `groupId`**, thiếu là hai bảng tin dùng chung ô cache.

#### Đề cập, tài liệu và bộ thẻ trong nhóm

Nhóm có năm tab: Bảng tin, **Tài liệu nhóm**, **Flashcard**, Thành viên, Yêu cầu (và Cài
đặt cho trưởng nhóm). Bốn quyết định bắt buộc giữ:

- **Người được nhắc do BACKEND tách ra từ chính nội dung bài**, không nhận danh sách từ
  frontend — nhận là gọi thẳng API nhắc được cả người ngoài nhóm. Cả hai phía tách bằng
  cùng `matchMentions` của `shared/mention`, nên ô gợi ý và người thật sự nhận thông báo
  không bao giờ lệch. Nội dung vẫn là **văn bản thuần**: không lưu bảng liên kết
  "bài ↔ người được nhắc", `@all` là cả nhóm, gõ tên không có thật thì chỉ là chữ thường.
  Thông báo đề cập **không được làm hỏng việc đăng bài** — `notifyMentions` tự nuốt lỗi
  và chỉ ghi log, vì bài đã ghi vào DB trước đó rồi.
- **Tài liệu nhóm KHÔNG có bảng riêng và không có đường tải lên riêng.** Nó chính là
  `post_attachments` của các bài có `group_id`, xếp theo bài mới nhất; tải về vẫn đi qua
  `/community/attachments/:id` (endpoint đó đã kiểm tra tư cách thành viên). Dựng kho tệp
  thứ hai là hai chỗ kiểm định dạng, hai chỗ kiểm quyền, và tệp mất ngữ cảnh "ai đăng,
  trong bài nào".
- **Chia sẻ bộ thẻ KHÔNG nhân bản bộ thẻ.** `group_study_sets` chỉ là một dòng liên kết
  mở thêm quyền đọc; bộ vẫn là một dòng duy nhất trong `topics` do chủ sửa ở Thư viện.
  Nhân bản thì bản trong nhóm đứng yên trong khi bản gốc được sửa tiếp. Vì vậy quyền đọc
  phải gắn ở **đúng một chỗ** — nhánh thứ ba của `readableSetWhere` trong
  `library.access.ts`, có lọc cả nhóm bị chặn lẫn bộ bị chặn. Chỉ trưởng nhóm chia sẻ và
  gỡ, và chỉ chia sẻ được bộ **của chính mình** (kể cả riêng tư); trong nhóm bộ nào cũng
  mang nhãn "Nội bộ", còn ở Thư viện chế độ của nó giữ nguyên.
- **Gỡ chia sẻ không xoá tiến độ.** `user_vocab_progress` giữ nguyên để chia sẻ lại là
  học tiếp được — cùng nguyên tắc với việc chuyển một bộ về riêng tư.

### Chức năng cho quản trị viên

Quản trị viên **vận hành hệ thống, không phải người học**: đăng nhập bằng tài khoản
`ADMIN` sẽ vào thẳng `/admin`, không thấy màn hình học, streak hay XP (route guard
`Learner` trong `fe/src/routes/AppRoutes.tsx` đẩy admin về khu quản trị).

- **Tổng quan hệ thống** (`/admin`) — quy mô người dùng, người hoạt động 1/7/30 ngày, cơ cấu hoạt động, kho nội dung, tình trạng kết nối DB, uptime API
- **Quản lý tài khoản** (`/admin/users`) — tìm kiếm/lọc/sắp xếp (theo tên, **tên tài khoản** hoặc email), xem hồ sơ chi tiết, đổi vai trò, khoá–mở khoá, xoá
- **Quản lý yêu cầu** (`/admin/requests`) — duyệt hoặc từ chối (kèm lý do) yêu cầu cấp lại mật khẩu; tab Nhật ký ghi ai xử lý, lúc nào, vì sao
- **Lượt truy cập** (`/admin/access`) — nhật ký đăng nhập (cả lần thất bại), lượt truy cập theo ngày, phiên đang mở
- **Nội dung học tập** (`/admin/content`) — bộ thẻ "Hệ thống" (chủ đề, từ vựng); không sửa được bộ người học tự tạo
- **Kiểm duyệt bộ thẻ** (`/admin/study-sets`) — xem báo cáo vi phạm, chặn/mở chặn bộ thẻ công khai, bỏ qua báo cáo
- **Quản lý tính năng** (`/admin/features`) — bật/tắt từng tính năng của người học

Ba quy tắc an toàn bắt buộc giữ khi sửa module này (đã cài trong `admin.service.ts`):
không tự hạ quyền/khoá/xoá chính mình, không xoá hay hạ quyền **quản trị viên hoạt
động cuối cùng** (mất hết admin thì phải sửa tay trong DB mới vào lại được), và khoá
tài khoản thì **thu hồi luôn refresh token** — nếu không, người bị khoá vẫn dùng tiếp
tới khi token hết hạn 30 ngày.

**Quản trị viên KHÔNG đặt mật khẩu hộ người dùng.** Endpoint
`POST /admin/users/:id/reset-password` đã bị gỡ bỏ, đừng thêm lại. Việc cấp lại mật khẩu
chỉ đi qua màn "Quản lý yêu cầu": quản trị viên **duyệt**, còn mật khẩu mới do chính người
dùng đặt. Hai lý do: giữ cả hai đường là hai cách làm cùng một việc, và đường cũ là cách
duy nhất khiến quản trị viên **biết** mật khẩu của người dùng rồi phải tự tìm kênh báo lại.
Toàn bộ luồng mô tả trong `docs/luong-quen-mat-khau.md` — đọc file đó trước khi sửa.

### Quản lý tính năng (`/admin/features`)

Quản trị viên bật/tắt từng tính năng của người học bằng công tắc. Tắt thì mục biến mất
khỏi sidebar và gõ thẳng URL ra trang 404. Toàn bộ thiết kế:
`docs/ke-hoach-quan-ly-tinh-nang.md` — đọc trước khi sửa.

Sáu quyết định bắt buộc giữ:

- **Danh mục ở `shared/src/constants/features.ts`, trạng thái ở bảng `feature_flags`.**
  Thêm tính năng mới là thêm code, không phải thêm dòng DB. Chuyển danh mục xuống DB thì
  deploy xong tính năng mới sẽ im lặng không chạy vì quên chèn dòng ở production.
- **Thiếu dòng trong `feature_flags` nghĩa là BẬT.** Đừng đổi thành mặc định tắt.
- **`requireFeature` trả 404, không trả 403** — với người học, tính năng đã tắt là không
  tồn tại, không phải "có nhưng bạn không được phép". Guard gắn ở chỗ mount router trong
  `app.ts`; riêng `REPORT` gắn trên đúng route `/statistics/report` vì trang Tổng quan
  luôn phải chạy.
- **Không có cờ cho `auth`, `admin`, `profile`, `notifications` và trang Tổng quan.** Tắt
  được chúng là tự khoá cửa nhà mình.
- **`/community` có `adminBypass`; `/topics` không gắn cờ nào.** Tắt Cộng đồng không được
  khoá luôn người kiểm duyệt, tắt Thư viện không được làm quản trị viên mất khả năng soạn
  bộ "Hệ thống" (`/topics` giờ chỉ cho quản trị viên).
- **Tắt là đảo ngược được.** Không dọn `ActivityLog`, không xoá `Goal`/`Habit`, không
  tính lại streak — bật lại là người học thấy lại đúng chỗ đang dở.

Ở FE có ba mức dùng cờ, đừng lẫn: hiển thị (`useFeature`) mặc định BẬT khi chưa biết để
giao diện không nháy; gọi API (`useFeatureQueryEnabled`) thì CHỜ biết chắc; chặn route
(`Gated`) thì chưa biết là chưa vẽ gì.

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
├── fe/                # Web (React + Vite) — features/{auth,goals,habits,library,study,statistics,notifications,admin}/
├── be/                # Backend (Node + Prisma) — modules/{...cùng tên feature với fe...}/
├── mobile/            # React Native (Expo) — thêm sau, cùng tên feature
├── shared/            # @enghabit/shared: schemas (Zod), constants/enum, srs/ (SM-2), streak/ (tính streak)
├── docs/              # ERD, API spec, architecture notes
└── .github/workflows/ # CI
```

Bên trong `be/src/modules/<feature>/`: `routes.ts → controller.ts → service.ts → schema.ts`.
Bên trong `fe/src/features/<feature>/`: `components/`, `hooks/`, `api.ts`, `types.ts`.

Tên feature/module phải **giống hệt nhau giữa `fe` và `be`** (`auth`, `goals`, `habits`, `library`, `study`, `statistics`, `notifications`, `rewards`, `leaderboard`, `feature-flags`, `admin`) — không đổi tên tuỳ tiện giữa hai phía.

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
  - `dev`: hai cách, chọn theo số máy cùng làm (xem `README.md` > Bước 4)
    - **Database `enghabit_dev` trên cùng service Aiven** — nhiều máy dùng chung một bộ dữ liệu. Đặt `connection_limit=3` vì trần 76 kết nối giờ chia cho nhiều máy cộng với Render.
    - **MySQL local** qua Docker (`mysql:8`) hoặc XAMPP — mỗi máy một bộ dữ liệu riêng, chạy được khi không có mạng.
  - `production`: database `defaultdb` trên Aiven, connection string cấu hình qua biến môi trường trên Render, không đặt trong file commit lên git
- **`defaultdb` và `enghabit_dev` phải tách bạch.** Dev và production ở chung service Aiven (gói free chỉ cho một service mỗi loại) nhưng **không được** chung database: máy dev ghi vào `defaultdb` là ghi thẳng vào dữ liệu người dùng thật, và một lần `migrate` chạy nhầm là đổi schema production.
- **Đổi schema** chỉ được thực hiện qua `prisma migrate dev` (chỉ khi DB dev là MySQL local) và `prisma migrate deploy` (mọi trường hợp còn lại) — không sửa tay bảng/cột trực tiếp trên MySQL, kể cả qua GUI.
- **Không chạy `prisma migrate dev` lên database dùng chung.** `migrate dev` được phép xoá và tạo lại database khi thấy lệch; trên DB dùng chung là xoá sạch dữ liệu của mọi máy. Dùng `pnpm db:deploy`.
- **Đồng bộ máy sau `git pull` do hook `.githooks/post-merge` lo** — tự chạy `pnpm install`, `build:shared`, `migrate deploy`, `prisma generate` tuỳ theo commit đụng vào đâu. Mỗi máy bật một lần bằng `pnpm hooks:install`. Hook cố ý **không** chạy seed, vì seed đặt lại dữ liệu mẫu về trạng thái gốc.
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

- **Không dùng `confirm()`, `alert()`, `prompt()` của trình duyệt.** Hỏi xác nhận thì gọi
  `useConfirm()` (`shared/components/ConfirmDialog`), báo kết quả thì gọi `useToast()`.
  Lý do: hộp thoại gốc không theo bảng màu và chế độ tối của app, khoá cứng cả tab trong
  lúc chờ, không đặt được nhãn nút, và bị chặn hoàn toàn trên vài trình duyệt di động —
  người dùng bấm nút mà không có gì xảy ra.

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
- **Nền hệ thống là xanh pastel `#E7EFFA` — SÁNG ở chế độ sáng, navy `#141B26` ở chế độ tối.**
  Vẫn có hai bộ token chữ và dùng nhầm vẫn là lỗi im lặng: `content` (`--text*`, chữ **trong thẻ**,
  nền trắng) và `on-page` (`--on-page*`, chữ **ngoài thẻ**: sidebar, thanh trên cùng, tiêu đề trang).
  Hai nền khác độ sáng nên bậc chữ mờ không dùng chung được, và ở chế độ tối nền hệ thống còn tối
  hơn thẻ — ngược chiều với chế độ sáng.
- **Thẻ phải luôn có `border-line`.** Nền hệ thống và thẻ giờ đều sáng nên chỉ chênh nhau 1.16:1;
  bỏ viền, chỉ dựa vào bóng đổ, là thẻ tan vào nền.
- **`--brand` (`#6090CF`) chỉ đạt 3.29:1 trên nền trắng** — không dùng làm chữ. Link trong thẻ dùng
  `--brand-strong`, link trên nền hệ thống dùng `--on-page-link`. Đây đã là bậc sáng nhất còn đạt
  3:1 để làm nền nút; pastel nhạt hơn sẽ khiến nút chìm vào thẻ.
- **Panel đăng nhập luôn sáng ở cả hai chế độ**, nên chữ trên đó dùng `--on-brand` (tối ở cả hai
  chế độ), tuyệt đối không dùng `--ink` — token này lật theo chế độ và sẽ thành chữ sáng trên nền
  sáng (1.47:1).
- Thang màu biểu đồ (`--series-*`) và thang lịch hoạt động là hai bộ riêng, đã qua kiểm tra
  phân biệt cho người mù màu và tính đơn điệu độ sáng. Không hoán đổi thứ tự.
- **Tên hệ thống hiển thị là `ENG//HABIT`**, luôn dùng qua component `Wordmark`, không tự chèn thẻ
  `img` và không gõ tay chuỗi `ENG//HABIT` thành chữ. Tên là **ảnh** (`fe/public/wordmark.png` bản
  navy, `wordmark-dark.png` bản sáng màu) đã tách nền trong suốt từ bản thiết kế gốc — vì là ảnh
  nên **màu không đổi theo token**; đổi màu chữ của chính tên hệ thống thì phải chạy lại
  `fe/scripts/make-wordmark.py`.
  Chọn file theo **nền đang đứng**: khung app dùng `on="auto"` vì nền hệ thống pastel giờ sáng ở
  chế độ sáng và tối ở chế độ tối — component vẽ cả hai ảnh rồi để CSS ẩn bớt một theo đúng bộ
  selector của token. Panel đăng nhập `on="light"` vì nền ở đó luôn sáng. Tên gói npm
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
  `rewards`, `library`, `study`, `habits`, `goals`, `statistics`, cùng
  `/notifications/settings`. Ẩn trên giao diện là chưa đủ: token admin gọi thẳng API vẫn
  điểm danh lấy xu hay ghi `ActivityLog` được. `/topics` giờ ngược lại — chỉ quản trị viên
  đọc, để soạn bộ "Hệ thống". Ngoại lệ cố ý mở cho cả hai vai trò: danh sách
  `/notifications` (quản trị viên vẫn nhận thông báo hệ thống trong chuông).
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
- FE: mỗi feature lớn (`study`, `community`...) có Error Boundary cục bộ, tránh lỗi 1 feature làm crash toàn app.
- Debug cron/notification: xem log riêng của `be/src/jobs`, không lẫn với log của module `notifications` (module này giữ **nội dung và lưu trữ** thông báo + cấu hình nhắc nhở, nhưng **không chứa lịch trình gửi**).
- Không nhận được nhắc nhở: kiểm tra theo thứ tự (1) `notification_settings.is_enabled` — công tắc tổng, tắt là im hết; (2) bảng `reminders`: có mốc nào `is_enabled` và `days_of_week` chứa thứ hôm nay không; (3) `User.timezone` — giờ nhắc tính theo giờ user, không phải giờ máy chủ; (4) hôm đó user đã có `ActivityLog` chưa (đã học thì hệ thống cố ý im lặng); (5) bảng `notifications` xem `dedupe_key` (`DAILY_REMINDER:<reminderId>:<local_date>`) của ngày đó đã tồn tại chưa.

## Quy tắc commit Git

Format bắt buộc:

```text
<Hành_động>_<Tên_module>_<Tên_tính_năng>_<Mô_tả_cập_nhật_ngắn>
```

- **`Hành_động`**: một trong `Them` (thêm mới), `Sua` (sửa lỗi), `Capnhat` (cập nhật/chỉnh sửa logic có sẵn), `Xoa` (xoá), `Taicautruc` (refactor), `Taillieu` (docs), `Kiemthu` (test).
- **`Tên_module`**: `<app>-<module>` theo đúng tên đã quy ước ở trên, vd `BE-Habits`, `FE-Flashcards`, `Shared-Srs`, `Mobile-Lessons`. Nếu đụng nhiều module, nối bằng dấu `+`: `BE-Habits+FE-Habits`.
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
