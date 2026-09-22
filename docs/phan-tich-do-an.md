# PHÂN TÍCH MÃ NGUỒN HỆ THỐNG ENG//HABIT

> Tài liệu hỗ trợ viết báo cáo Đồ án Khoa học Máy tính.
> Toàn bộ nội dung dẫn chứng từ mã nguồn thực tế trong repo, **rà soát lại ngày 21/09/2026**
> (commit `d41342b`), **cập nhật 22/09/2026** (commit `47d14b1`: mục tiêu và thói quen đợt 1–2,
> đăng nhập so khớp chính xác, trang Tổng quan, nhật ký thao tác quản trị, màn Nội dung học tập):
> 3 package (`shared`, `be`, `fe`); 22 migration; 38 bảng dữ liệu, 18 enum; 17 module backend;
> 16 feature frontend có mã; 156 endpoint API (+ `/health`); 32 route giao diện; 2 tiến trình nền;
> 19 tệp kiểm thử.
>
> Bản trước (04/09/2026) còn mô tả module `lessons`, `quizzes`, `flashcards` — ba module này đã
> được thay bằng **Thư viện** (`library`) và **Học / Ôn tập** (`study`) ngày 12–15/09/2026.

## Bộ tài liệu

| Tệp | Nội dung | Dùng cho phần nào của báo cáo | Tình trạng |
| --- | --- | --- | --- |
| `docs/phan-tich-do-an.md` (tệp này) | Phân tích tổng thể A–E | Các chương chính | Cập nhật 22/09 |
| `docs/logic-nghiep-vu/` | Logic nghiệp vụ **từng module**: cách hoạt động, liên kết, ảnh hưởng dây chuyền | Chương "Phân tích chức năng", "Thiết kế xử lý" | Mới 21/09, cập nhật 22/09 |
| `docs/chuc-nang-va-luong-nghiep-vu.md` | Danh mục chức năng, sơ đồ use case và sơ đồ luồng (Mermaid), ma trận quyền | Chương "Phân tích yêu cầu" | Cập nhật 22/09 |
| `docs/architecture.md` | Lý do của các quyết định kiến trúc | Chương "Thiết kế kiến trúc" | Cập nhật 21/09 |
| `docs/use-case/` | 102 use case, đặc tả, ma trận truy vết, sơ đồ PlantUML | Phụ lục use case | 20/09 — chưa có Việc cần làm |
| `docs/phu-luc-erd.md` | ERD Mermaid | Phụ lục ERD | **Lạc hậu** (23 bảng; hiện 38) |
| `docs/phu-luc-api.md` | Danh mục endpoint | Phụ lục API | **Lạc hậu** (76 endpoint; hiện 156) — nhóm Mục tiêu, Thói quen, nhật ký thao tác đã cập nhật |
| `docs/ke-hoach-*.md`, `docs/luong-quen-mat-khau.md` | Đặc tả chi tiết từng phân hệ | Tham khảo | Theo từng phân hệ |

---

# PHẦN A — THÔNG TIN TỔNG QUAN

## A1. Tên hệ thống và mục đích

**Tên hiển thị: `ENG//HABIT`** (English Learning Habit Building Application). Tên gói npm là
`@enghabit/*`. Tên luôn hiển thị qua component `fe/src/shared/components/Wordmark.tsx`.

**Vấn đề cốt lõi:** người học tiếng Anh thường không thiếu tài liệu mà thiếu **cơ chế duy trì
thói quen học đều đặn**. Hệ thống kết hợp bốn mảng:

1. **Học** — thư viện bộ thẻ (bộ Hệ thống và bộ người học tự soạn), học bằng flashcard hoặc trắc
   nghiệm, ôn lặp cách quãng theo SM-2.
2. **Tự quản lý** — mục tiêu, thói quen có check-in, việc cần làm trong ngày.
3. **Theo dõi và động viên** — chuỗi ngày học, XP và cấp độ, thống kê, báo cáo có chấm điểm hiệu
   quả, bảng xếp hạng, điểm danh nhận xu, nhiệm vụ ngày, vật phẩm giữ chuỗi, cửa hàng vật phẩm
   trang trí, nhắc nhở theo giờ địa phương.
4. **Học cùng nhau** — diễn đàn Cộng đồng, nhóm lớp có bảng tin, tài liệu và bộ thẻ chia sẻ.

## A2. Công nghệ sử dụng

### Frontend (`fe/package.json`)

| Thư viện | Phiên bản | Vai trò |
| --- | --- | --- |
| `react`, `react-dom` | 18.3 | Thư viện giao diện |
| `vite` | 6.0 | Build tool, dev server (proxy `/api` sang backend) |
| `typescript` | 5.7 | Strict mode |
| `react-router-dom` | 6.28 | Định tuyến, guard theo vai trò và cờ tính năng |
| `@tanstack/react-query` | 5.62 | Server state, cache (`staleTime` 30 giây) |
| `zustand` | 5.0 | Client state: phiên đăng nhập |
| `axios` | 1.7 | HTTP client, tự refresh token |
| `tailwindcss` | 3.4 | CSS; màu khai báo dạng kênh ở `fe/src/index.css` |
| `lucide-react` | 1.37 | Bộ icon |
| `read-excel-file` | 9.3 | Đọc tệp Excel khi nhập thẻ |
| `vitest` | 2.1 | Kiểm thử |

### Backend (`be/package.json`)

- **Node.js ≥ 20**, TypeScript ESM, **Express 4.21** (chốt Express thay Fastify: tài liệu nhiều,
  quy mô vài trăm người dùng không cần hiệu năng của Fastify).

| Thư viện | Vai trò |
| --- | --- |
| `@prisma/client` 6.2 | ORM — mọi kết nối MySQL đi qua đây |
| `bcryptjs` | Băm mật khẩu (10 vòng) |
| `jsonwebtoken` | Access token |
| `zod` | Validate đầu vào, schema dùng chung ở `shared/` |
| `helmet`, `cors`, `cookie-parser` | Header bảo mật, CORS, cookie refresh token |
| `pino`, `pino-http` | Log có cấu trúc, mỗi request một `x-request-id` |
| `node-cron` | Hai tiến trình nền |
| `tsx` | Chạy TypeScript ở dev |

### Database

- **MySQL** qua Prisma, charset `utf8mb4`. Dev: database `enghabit_dev` trên Aiven hoặc MySQL local;
  production: database `defaultdb` trên Aiven (bắt buộc TLS).
- **38 bảng + 18 enum** (mục C1). Model Prisma `PascalCase` số ít, `@@map` sang bảng `snake_case`
  số nhiều.
- Bắt buộc `connection_limit` trong `DATABASE_URL`; `be/src/lib/prisma.ts` export **một** Prisma
  Client dùng chung.

### Package dùng chung `@enghabit/shared`

Build bằng `tsup` ra `dist/`; `fe` và `be` import bản build. Chứa: 18 tệp Zod schema; enum nghiệp
vụ; danh mục tính năng; thuật toán SM-2 (`srs/`); chuỗi ngày (`streak/`); XP và cấp độ (`level/`);
phần thưởng (`rewards/`); học và ôn (`study/`: nhóm Yếu, trắc nghiệm, nhập thẻ); báo cáo và điểm
hiệu quả (`report/`); hạn mục tiêu (`goal/`); đề cập `@` (`mention/`); tệp đính kèm, ảnh đại diện,
cửa hàng (`attachment/`, `avatar/`, `shop/`); kiểu `LocalDate`.

### Dịch vụ ngoài và hạ tầng

| Thành phần | Nơi chạy |
| --- | --- |
| Web (SPA) | Vercel (`vercel.json`) |
| API + 2 cron | Render (`render.yaml`: build `shared` rồi `be`; start = `migrate deploy` → nạp danh mục cửa hàng `--soft` → `node dist/server.js`) |
| MySQL | Aiven |
| Push notification | **OneSignal** — chỉ là kênh gửi; lịch gửi do cron của hệ thống quyết định |
| CI | GitHub Actions: cài, build `shared`, `prisma generate`, typecheck, kiểm bản dịch, test, build |

**Không có**: cổng thanh toán, dịch vụ gửi email, đăng nhập OAuth, phát âm từ vựng (nút phát âm
bằng Web Speech API thuộc module `lessons` cũ đã gỡ cùng module).

## A3. Kiến trúc hệ thống

### Mô hình

**Monorepo pnpm workspace + kiến trúc phân lớp theo module nghiệp vụ.** Một tiến trình Express
duy nhất (không phải microservice); frontend là SPA tách riêng.

Backend phân lớp cố định:

```text
routes.ts      định tuyến + middleware (requireAuth, requireRole, requireFeature, validate)
controller.ts  đọc request, gọi service, trả response — KHÔNG chứa nghiệp vụ
service.ts     toàn bộ nghiệp vụ + truy cập DB qua Prisma
schema (Zod)   nằm ở shared/, dùng chung FE–BE
```

Lỗi nghiệp vụ ném ra từ service dưới dạng `AppError`; **chỉ** `error-handler.ts` chuyển thành HTTP.

### Các quyết định thiết kế cốt lõi

Trích và mở rộng từ `docs/architecture.md`:

1. **`ActivityLog` là nguồn sự thật duy nhất của hoạt động học.** Chỉ `recordActivity()` được ghi.
   Chuỗi ngày, XP, cấp độ, thống kê, bảng xếp hạng, mục tiêu, nhiệm vụ ngày, nhắc nhở đều suy ra
   từ bảng này. `user_streaks` chỉ là cache, luôn dựng lại được.
2. **Ngày học tính theo `local_date`**, không theo UTC. Mỗi dòng `activity_logs` lưu cả
   `occurred_at` (UTC) và `local_date` (theo múi giờ người học lúc ghi).
3. **Domain logic ở `shared/`** (SM-2, streak, XP, nhiệm vụ, báo cáo) — định nghĩa một lần, FE
   xem trước, BE tính chính thức.
4. **Không lưu số liệu dẫn xuất.** XP, số dư xu (= `SUM(coin_transactions.amount)`), tiến độ mục
   tiêu, tiến độ nhiệm vụ, số tim — đều tính lúc đọc.
5. **Chống trùng bằng ràng buộc unique của DB**, không bằng đọc-rồi-ghi (`dedupe_key`,
   `attempt_key`, `pending_key`, `used_on_date`, `pending_user_id`).
6. **Đảo ngược được thay vì xoá**: khoá tài khoản, chặn nhóm, chặn bộ thẻ, ngừng bán vật phẩm,
   tắt tính năng — đều giữ nguyên dữ liệu.
7. **Quyền đọc bộ thẻ ở đúng một chỗ** (`library.access.readableSetWhere`); không có quyền → 404.
8. **Quản trị viên không phải người học**: chặn ở ba tầng — guard FE, `requireRole(USER)` ở router
   BE, lọc vai trò trong cron.

Chi tiết từng module và cách chúng móc vào nhau: `docs/logic-nghiep-vu/README.md`.

### Cấu trúc thư mục

```text
enghabit/
├── shared/src/                  @enghabit/shared
│   ├── constants/               enums.ts, features.ts (danh mục cờ tính năng)
│   ├── schemas/                 18 tệp Zod schema
│   ├── srs/ streak/ level/      SM-2, chuỗi ngày, XP–cấp độ
│   ├── study/ report/ goal/     học–ôn, báo cáo, hạn mục tiêu
│   ├── rewards/ shop/           phần thưởng, cửa hàng
│   ├── mention/ attachment/ avatar/ encoding/ date/
│
├── be/
│   ├── prisma/                  schema.prisma (37 model), 20 migration, seed.ts + seed-data/,
│   │                            scripts/recompute-streak.ts
│   └── src/
│       ├── app.ts, server.ts    khởi tạo Express, gắn guard cờ tính năng, khởi động cron
│       ├── config/ lib/ common/ env (Zod), prisma singleton, logger, lỗi, middleware
│       ├── modules/             17 module (xem B1)
│       ├── jobs/                reminder.job.ts, streak-freeze.job.ts, onesignal.client.ts
│       └── scripts/             seed-shop.ts (chạy khi deploy)
│
├── fe/src/
│   ├── routes/AppRoutes.tsx     31 route + guard RequireAuth / PublicOnly / Learner / Admin / Feature / Gated
│   ├── features/<tên>/          api.ts → hooks.ts → components/
│   └── shared/                  AppLayout, Sidebar, Breadcrumb, Modal, ConfirmDialog, Toast,
│                                FeatureErrorBoundary, i18n (Việt–Anh), api-client, focus-trap
│
├── docs/                        tài liệu (mục "Bộ tài liệu")
└── mobile/                      CHƯA scaffold (dự kiến React Native + Expo)
```

Tên module ở `be/src/modules/<x>` và `fe/src/features/<x>` phải giống hệt nhau. Hai thư mục
`fe/src/features/flashcards/` và `fe/src/features/vocabulary/` hiện rỗng (sót lại sau khi gỡ màn cũ).

---

# PHẦN B — CHỨC NĂNG HỆ THỐNG

## B1. Các nhóm chức năng

Đọc từ `be/src/app.ts`. Mọi API dưới tiền tố `/api/v1`.

| # | Nhóm chức năng | Endpoint gốc | Module | Vai trò | Cờ tính năng | Số endpoint |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tài khoản, phiên, quên mật khẩu | `/auth` | `auth` | Khách, cả hai | — | 11 |
| 2 | Trạng thái cờ tính năng | `/features` | `feature-flags` | Cả hai | — | 1 |
| 3 | Mục tiêu | `/goals` | `goals` | USER | `GOALS` | 8 |
| 4 | Thói quen | `/habits` | `habits` | USER | `HABITS` | 7 |
| 5 | Việc cần làm | `/todos` | `todos` | USER | `TODO` | 5 |
| 6 | Bộ Hệ thống (đọc) | `/topics` | `topics` | ADMIN | — | 3 |
| 7 | Thư viện bộ thẻ | `/library` | `library` | USER | `VOCABULARY` | 12 |
| 8 | Học, Ôn tập, Cram | `/study` | `study` | USER | `VOCABULARY` + `LEARN`/`FLASHCARDS` | 7 |
| 9 | Thống kê, Báo cáo | `/statistics` | `statistics` | USER | `REPORT` (chỉ `/report`) | 5 |
| 10 | Thông báo, nhắc nhở | `/notifications` | `notifications` | Cả hai (cấu hình: USER) | — | 13 |
| 11 | Phần thưởng | `/rewards` | `rewards` | USER | `REWARDS` | 4 |
| 12 | Cửa hàng, ví, kho | `/shop` | `shop` | USER (ảnh: công khai) | `SHOP` | 9 |
| 13 | Bảng xếp hạng | `/leaderboard` | `leaderboard` | USER | `LEADERBOARD` | 1 |
| 14 | Cộng đồng | `/community` | `community` | Cả hai | `COMMUNITY` (admin bỏ qua) | 8 |
| 15 | Nhóm lớp | `/groups` | `groups` | Người học (theo vai trò trong nhóm) | `GROUPS` | 20 |
| 16 | Quản trị | `/admin` | `admin` | ADMIN | — | 42 |
| — | Kiểm tra sức khoẻ | `/health` | `app.ts` | Công khai | — | 1 |

Module nội bộ không có router: `activity-logs`. Hai tiến trình nền: **nhắc nhở** (15 phút/lượt) và
**tiêu vật phẩm giữ chuỗi** (30 phút/lượt).

## B2. Cây chức năng

Chi tiết endpoint và quy tắc: `docs/chuc-nang-va-luong-nghiep-vu.md` mục 3; cách hoạt động từng
module: `docs/logic-nghiep-vu/`.

```text
ENG//HABIT
├── 1. Tài khoản (auth)
│   ├── Đăng ký (email + tên tài khoản unique; tạo sẵn streak, cấu hình nhắc, mốc 20:00)
│   ├── Đăng nhập bằng email hoặc tên tài khoản, so khớp chính xác (ghi nhật ký mọi lượt)
│   ├── Làm mới phiên (xoay vòng refresh token), đăng xuất
│   ├── Hồ sơ, múi giờ, ảnh đại diện (≤ 200 KB), đổi mật khẩu (thu hồi mọi phiên)
│   └── Quên mật khẩu: gửi yêu cầu → admin duyệt / từ chối → tự đặt mật khẩu mới (7 ngày)
│
├── 2. Học tập
│   ├── Thư viện (library): khám phá bộ công khai, bộ của tôi, tạo/sửa/xoá bộ, công khai ↔ riêng tư,
│   │   thêm/sửa/xoá thẻ, nhập bộ/thẻ từ tệp (≤ 500 dòng), báo cáo vi phạm
│   ├── Học một bộ (study, LEARN): Flashcard hoặc Trắc nghiệm; kết thúc phiên
│   ├── Ôn tập (study, REVIEW): nhóm Mới / Tới hạn / Quá hạn / Yếu; thống kê; lịch sử
│   └── Cram (study, CRAM): luyện nhanh, không ghi nhận gì
│
├── 3. Tự quản lý
│   ├── Thói quen (habits): hằng ngày / theo thứ / N lần mỗi tuần; tự tích (check-in kèm lượng, ghi
│   │   chú, bù ≤ 7 ngày) hoặc tự động (đạt khi học trong app); mức tối thiểu cho ngày bận; gắn vào
│   │   mục tiêu; tạm dừng; tỷ lệ hoàn thành; nhắc theo giờ riêng
│   ├── Mục tiêu (goals): 4 loại × chu kỳ ngày / tuần / cộng dồn tới hạn; tiến độ tính từ hoạt động,
│   │   dự báo ngày đạt; gia hạn, tạm dừng / tiếp tục, kết thúc (đạt hoặc thôi theo dõi)
│   └── Việc cần làm (todos): ≤ 50 việc/ngày, việc quá hạn, dọn việc đã xong
│
├── 4. Theo dõi
│   ├── Tổng quan (statistics): biểu đồ ngày/tuần/tháng, chuỗi, cấp độ, lịch hoạt động
│   ├── Báo cáo (statistics, REPORT): khoảng tự chọn ≤ 366 ngày, so kỳ trước, đối chiếu mục tiêu, điểm hiệu quả
│   └── Bảng xếp hạng (leaderboard): tuần / tháng / toàn thời gian, theo XP hoặc số hoạt động
│
├── 5. Động viên
│   ├── Phần thưởng (rewards): điểm danh +50 xu, 3 nhiệm vụ ngày +20 xu, vật phẩm giữ chuỗi 200 xu (≤ 3)
│   ├── (nền) Tự tiêu vật phẩm cứu chuỗi khi bỏ lỡ đúng một ngày
│   └── Cửa hàng (shop): mua vật phẩm, yêu thích, kho, chọn dùng mỗi loại một món, ví thu–chi,
│       khung viền ảnh đại diện người khác nhìn thấy
│
├── 6. Xã hội
│   ├── Cộng đồng (community): bảng tin chung, đăng bài ≤ 3 tệp, bình luận, thả tim, xoá, tải tệp
│   └── Nhóm lớp (groups): tạo, tìm nhóm công khai, vào nhóm riêng tư bằng mã 8 số, xin vào / duyệt,
│       nhiều trưởng nhóm, bảng tin nội bộ, nhắc bằng @, tài liệu nhóm, bộ thẻ chia sẻ
│
├── 7. Thông báo (notifications)
│   ├── Chuông, trang thông báo, đọc / đọc tất cả / xoá
│   ├── Công tắc tổng, cảnh báo chuỗi, nhắc ôn thẻ; tối đa 10 mốc nhắc theo giờ và thứ
│   └── (nền) Nhắc học theo mốc; cảnh báo chuỗi sắp đứt lúc 21:30; nhắc theo giờ của từng thói quen
│
└── 8. Quản trị (admin)
    ├── Tổng quan hệ thống: bốn con số chính, Việc cần xử lý, xu hướng 30 ngày
    ├── Tài khoản: tìm, lọc, chi tiết, đổi vai trò, khoá / mở khoá, xoá
    ├── Quản lý yêu cầu cấp lại mật khẩu (+ nhật ký)
    ├── Lượt truy cập, nhật ký đăng nhập
    ├── Nội dung học tập: bộ Hệ thống hiện như Thư viện, tạo / sửa / xoá bộ và thẻ, luôn công khai
    ├── Kiểm duyệt bộ thẻ: bỏ qua báo cáo, chặn / mở chặn
    ├── Quản lý nhóm: xem, cảnh báo, chặn / mở chặn
    ├── Quản lý cửa hàng: loại, vật phẩm, ảnh
    ├── Quản lý tính năng: bật / tắt, tắt lây theo phụ thuộc
    ├── Gửi thông báo tới tất cả hoặc theo vai trò
    └── Nhật ký thao tác: tab Nhật ký trong từng màn quản lý (chỉ thêm, không sửa, không xoá)
```

## B3. Các tác nhân

| Tác nhân | Là ai | Phạm vi |
| --- | --- | --- |
| **Khách** | Chưa đăng nhập | `/login`, `/register`, `/forgot-password` |
| **Người học** (`USER`) | Vai trò mặc định khi đăng ký | Nhóm 1–7 |
| **Trưởng nhóm** | Người học có vai trò `LEADER` **trong một nhóm** | Duyệt, quản lý thành viên, cài đặt nhóm, chia sẻ bộ thẻ — vai trò theo nhóm, không phải vai trò hệ thống |
| **Quản trị viên** (`ADMIN`) | Người vận hành | Nhóm 8, cộng tài khoản cá nhân, chuông thông báo, kiểm duyệt Cộng đồng. **Không** có chuỗi, XP, xu, nhắc nhở học |
| **Hệ thống (cron)** | 2 tiến trình nền | Nhắc học, cảnh báo chuỗi, tiêu vật phẩm giữ chuỗi |
| **OneSignal** | Dịch vụ ngoài | Kênh đẩy push |

Ba quy tắc an toàn của quản trị viên (`admin.service.ts`): không tự hạ quyền / khoá / xoá chính
mình; không hạ quyền, khoá hay xoá **quản trị viên hoạt động cuối cùng**; khoá tài khoản thì **thu
hồi mọi refresh token**. Quản trị viên **không** đặt mật khẩu hộ người dùng.

## B4. Các use case quan trọng nhất

Sơ đồ use case và sơ đồ luồng Mermaid: `docs/chuc-nang-va-luong-nghiep-vu.md` mục 2 và 4.
Bộ đặc tả đầy đủ 102 use case: `docs/use-case/USE-CASE-SPECIFICATIONS.md`.

### UC-01. Đăng ký tài khoản

- **Tác nhân:** Khách · **Tiền điều kiện:** email và tên tài khoản chưa tồn tại
- **Luồng chính:** nhập tên, tên tài khoản, email, mật khẩu (8–72 ký tự, có chữ và số) → FE và BE
  cùng validate bằng `registerSchema` → BE kiểm trùng để báo đúng trường → tạo `users` (bcrypt) cùng
  `user_streaks`, `notification_settings`, một mốc nhắc 20:00 → cấp access token (15 phút) và
  refresh token (30 ngày, lưu hash) → vào trang Tổng quan.
- **Ngoại lệ:** trùng email / tên tài khoản → 409 (kể cả khi hai người đăng ký cùng lúc, nhờ unique).

### UC-02. Đăng nhập

- **Tác nhân:** Người học, Quản trị viên
- **Luồng chính:** nhập email **hoặc** tên tài khoản và mật khẩu → so khớp **chính xác** (tên tài
  khoản phân biệt hoa thường và khoảng trắng, email không phân biệt hoa thường; BE kiểm lại trong JS
  vì collation MySQL tự bỏ qua hoa thường và khoảng trắng cuối) → không có tài khoản hoặc sai mật
  khẩu: ghi `login_events` và trả 401 **cùng một thông báo** → tài khoản khoá: 403 kèm lý do → thành
  công: ghi `login_events`, cập nhật `last_login_at`, cấp phiên → `ADMIN` vào `/admin`, `USER` vào `/`.
- **Hậu điều kiện:** mọi lượt thử đều có một dòng nhật ký cho màn Lượt truy cập.

### UC-03. Học một bộ thẻ

- **Tác nhân:** Người học · **Tiền điều kiện:** đọc được bộ (`readableSetWhere`); trắc nghiệm cần ≥ 4 thẻ
- **Luồng chính:**
  1. Chọn bộ, chế độ (Flashcard / Trắc nghiệm) → `POST /study/questions` (nguồn `LEARN`).
  2. BE chọn thẻ, dựng phương án nhiễu **cùng bộ**, gắn mỗi câu một mã AES-GCM chứa đáp án.
  3. Mỗi câu: `POST /study/answers` → BE giải mã, kiểm quyền lại, quy ra chất lượng SM-2, và trong
     một transaction ghi `card_reviews`, cập nhật `user_vocab_progress`, `recordActivity`
     (`VOCAB_LEARNED` nếu thẻ mới, `FLASHCARD_REVIEWED` nếu đã có lịch).
  4. Bấm kết thúc → `POST /study/sessions/finish` → ghi một `QUIZ_COMPLETED` với
     `dedupe_key = SESSION:<sessionKey>`, số câu đọc lại từ `card_reviews`.
- **Hậu điều kiện:** chuỗi, XP, nhiệm vụ ngày, mục tiêu cập nhật; thẻ có lịch ôn.

### UC-04. Ôn tập theo SM-2

- **Tác nhân:** Người học · **Tiền điều kiện:** có thẻ thuộc nhóm đang chọn
- **Luồng chính:** `/review` hiện 4 nhóm (Mới, Tới hạn, Quá hạn, Yếu) → chọn nhóm → phát đề như
  UC-03 với nguồn `REVIEW` → người học tự chấm AGAIN / HARD / GOOD / EASY (quality 0 / 3 / 4 / 5) →
  `reviewCard`: sai thì ôn lại sau 1 ngày; đúng thì 1 ngày, 6 ngày, rồi nhân `ease_factor` (≥ 1.3).
- **Biến thể Cram:** nguồn `CRAM` chấm đúng/sai nhưng **không ghi** SRS, lịch sử hay hoạt động.

### UC-05. Tạo bộ thẻ, báo cáo và kiểm duyệt

- **Tác nhân:** Người học (chủ bộ, người báo cáo), Quản trị viên
- **Luồng chính:** chủ bộ tạo bộ công khai, thêm thẻ tay hoặc nhập từ tệp (BE chống trùng bằng
  `cardImportKey`) → người khác báo cáo (`pending_key` unique; mọi admin nhận `STUDY_SET_REPORTED`)
  → admin chặn (bắt buộc lý do; mọi báo cáo chờ khép lại; chủ bộ nhận `STUDY_SET_BLOCKED`) hoặc bỏ qua.
- **Hậu điều kiện:** bộ bị chặn biến khỏi Thư viện, Ôn tập, số thẻ tới hạn, lời nhắc của mọi người
  trừ chủ; tiến độ của mọi người giữ nguyên.

### UC-06. Check-in thói quen (kể cả bù)

- **Tác nhân:** Người học · **Tiền điều kiện:** là chủ thói quen; thói quen tự tích, đang theo dõi;
  chưa check-in ngày đó
- **Luồng chính:** `POST /habits/:id/check-in` (tuỳ chọn `date`, `amount`, `note`) → cấm ngày tương
  lai, chỉ bù trong 7 ngày → lượng bỏ trống là làm đủ, thấp hơn mức tối thiểu thì 400 → transaction:
  ghi `habit_check_ins`; nếu ngày đó **chưa có** dòng `HABIT_CHECKIN` nào thì
  `recordActivity(HABIT_CHECKIN, localDate = date, dedupeKey = HABIT_CHECKIN:<date>)` → ghi bù thì
  dựng lại chuỗi từ đầu.
- **Hậu điều kiện:** lần đầu trong ngày: +12 XP, nhiệm vụ `DO_HABIT` hoàn thành, chuỗi có thể được
  vá; các lần sau trong cùng ngày chỉ ghi `habit_check_ins`.
- **Biến thể thói quen tự động:** không có check-in (400) — trạng thái chấm thẳng từ `activity_logs`
  của loại hoạt động nó bám theo.

### UC-07. Xem Tổng quan và Báo cáo

- **Tác nhân:** Người học
- **Luồng chính:** `/` gọi song song `summary`, `streak`, `level`, `calendar` → số liệu gom
  `activity_logs` theo `local_date`, ngày trống điền 0; chuỗi qua `displayStreak`; cấp độ từ toàn
  bộ lịch sử → `/report` chọn khoảng ≤ 366 ngày → so kỳ liền trước, đối chiếu mục tiêu, tính điểm
  hiệu quả (60% độ đều đặn + 40% đạt mục tiêu).

### UC-08. Điểm danh và nhận thưởng nhiệm vụ

- **Tác nhân:** Người học
- **Luồng chính:** `GET /rewards` chấm 3 nhiệm vụ từ `activity_logs` hôm nay → bấm Nhận →
  `POST /rewards/missions/claim` → BE **chấm lại** → ghi `+20` với khoá `MISSION:<id>:<ngày>` →
  trùng khoá → 409.
- **Hậu điều kiện:** số dư tăng; **không** ghi `ActivityLog`, **không** cộng XP.

### UC-09. Mua vật phẩm cửa hàng và đeo khung viền

- **Tác nhân:** Người học
- **Luồng chính:** `POST /shop/items/:id/buy` → transaction khoá dòng `users` → kiểm còn bán, chưa
  sở hữu, đủ xu → ghi dòng âm (`SHOP_ITEM:<id>`) rồi `user_items` (giá lúc mua) → ở `/inventory` chọn
  dùng khung viền → `user_equipped_items` upsert theo `(user, loại)`.
- **Hậu điều kiện:** khung hiện ở Cộng đồng, Bảng xếp hạng, danh sách thành viên nhóm.

### UC-10. Vào nhóm lớp và học bộ thẻ được chia sẻ

- **Tác nhân:** Người học, Trưởng nhóm
- **Luồng chính:** tìm nhóm công khai hoặc nhập mã 8 số → xin vào → nhóm tắt phê duyệt: vào ngay;
  bật: chờ trưởng nhóm duyệt / từ chối (bắt buộc lý do, hiện ở tab Chờ duyệt) → trưởng nhóm chia sẻ
  bộ thẻ của mình → thành viên đọc và học được bộ đó qua nhánh 3 của `readableSetWhere`.
- **Ràng buộc:** nhóm luôn còn ít nhất một trưởng nhóm; nhóm bị chặn khoá toàn bộ nội dung.

### UC-11. Hệ thống gửi nhắc nhở (cron)

- **Tác nhân:** Hệ thống · **Tiền điều kiện:** người dùng `USER`, công tắc tổng bật
- **Luồng chính:** mỗi 15 phút → với mỗi mốc nhắc: đúng thứ, trong cửa sổ 15 phút, **hôm nay chưa
  học** → soạn nội dung theo việc tồn (thẻ cần ôn / chuỗi) → `createNotification` với
  `DAILY_REMINDER:<reminderId>:<ngày>` → lưu mới thì đẩy push → 21:30 giờ địa phương: cảnh báo chuỗi
  sắp đứt nếu chuỗi > 0 và chưa học → thói quen có giờ nhắc: tới giờ, đến hạn và **chính thói quen
  đó** chưa xong trong kỳ thì nhắc (`DAILY_REMINDER:HABIT-<habitId>:<ngày>`), kể cả khi đã học trong app.

### UC-12. Quản trị viên khoá tài khoản

- **Tác nhân:** Quản trị viên · **Tiền điều kiện:** không phải chính mình; không phải admin hoạt động cuối cùng
- **Luồng chính:** `PATCH /admin/users/:id/status` → đặt `LOCKED` → thu hồi mọi refresh token →
  ghi nhật ký thao tác `USER_LOCKED` trong cùng transaction.
- **Hậu điều kiện:** không đăng nhập, không refresh được (403); bộ công khai của họ biến khỏi Khám
  phá; rời bảng xếp hạng; dữ liệu học giữ nguyên.

### UC-13. Tắt một tính năng

- **Tác nhân:** Quản trị viên
- **Luồng chính:** `PATCH /admin/features/:key` → tắt lây các tính năng phụ thuộc trong một
  transaction → xoá cache cờ → người học: mục biến khỏi sidebar, route ra 404, API trả 404.
- **Hậu điều kiện:** không xoá dữ liệu; bật lại là thấy lại đúng chỗ đang dở.

---

# PHẦN C — DỮ LIỆU VÀ CƠ SỞ DỮ LIỆU

## C1. Danh sách bảng

Trích từ `be/prisma/schema.prisma`. **PK** khoá chính, **FK** khoá ngoại, **UQ** ràng buộc duy nhất.
Mọi `DateTime` lưu UTC; cột `DATE` là ngày local.

### Nhóm 1 — Người dùng và xác thực (5 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `users` | `name`, `username`, `email`, `password_hash`, `role` (USER/ADMIN), `status` (ACTIVE/LOCKED), `last_login_at`, `timezone` | UQ `email`, UQ `username` |
| `user_avatars` | `user_id` (PK+FK), `data` MEDIUMBLOB, `mime_type` | 1-1; tách bảng để truy vấn danh sách không kéo blob |
| `login_events` | `user_id` (NULL được), `email`, `success`, `reason`, `ip_address`, `user_agent` | FK `SetNull` — xoá người dùng vẫn giữ nhật ký |
| `refresh_tokens` | `token_hash`, `expires_at`, `revoked_at` | UQ `token_hash`; chỉ lưu SHA-256 |
| `password_reset_requests` | `status` (PENDING/APPROVED/REJECTED), `pending_user_id`, `reviewed_by_id`, `reviewed_at`, `reject_reason`, `used_at` | UQ `pending_user_id` — một người tối đa một yêu cầu chờ |

### Nhóm 2 — Tự quản lý (4 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `goals` | `type`, `target_value`, `period` (DAILY/WEEKLY/TOTAL), `start_date`, `end_date`, `status`, `paused_at` | Tiến độ không lưu. Tạm dừng là cột `paused_at`, không phải một giá trị `status` |
| `habits` | `name`, `frequency`, `custom_days` (JSON), `times_per_week`, `auto_activity`, `target_amount`, `min_amount`, `unit`, `reminder_time`, `is_active`, `goal_id` | FK `goal_id` `SetNull`. `auto_activity` có giá trị = thói quen tự động, không có check-in |
| `habit_check_ins` | `habit_id`, `user_id`, `local_date`, `amount`, `note` | UQ `(habit_id, local_date)`; chỉ thói quen tự tích |
| `todos` | `title`, `local_date`, `is_done`, `done_at` | Không ghi `ActivityLog` |

### Nhóm 3 — Nội dung và học (5 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `topics` (bộ thẻ) | `name`, `description`, `level`, `owner_id`, `visibility`, `blocked_at`, `blocked_reason`, `blocked_by_id`, `created_by_id` | `owner_id` NULL = bộ Hệ thống; FK chủ `Cascade` |
| `vocabularies` (thẻ) | `topic_id`, `word`, `meaning`, `phonetic`, `example`, `audio_url` | FK `Cascade` |
| `user_vocab_progress` | `repetitions`, `interval_days`, `ease_factor`, `next_review_date` (DATE), `lapses`, `correct_count`, `wrong_count` | UQ `(user_id, vocabulary_id)` |
| `card_reviews` | `mode`, `is_correct`, `quality`, `response_ms`, `interval_before`, `interval_after`, `attempt_key`, `session_key` | UQ `(user_id, attempt_key)`; chỉ phục vụ lịch sử |
| `study_set_reports` | `topic_id`, `reporter_id`, `reason`, `status`, `pending_key`, `resolved_by_id` | UQ `pending_key` |

### Nhóm 4 — Hoạt động và chuỗi ngày (2 bảng) — quan trọng nhất

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `activity_logs` | `type` (4 loại), `ref_id` (**không FK**, đa hình), `value`, `occurred_at` (UTC), `local_date` (DATE), `dedupe_key` | UQ `(user_id, dedupe_key)`; index `(user_id, local_date)`, `(user_id, type, local_date)`. **Nguồn sự thật** |
| `user_streaks` | `user_id` (PK+FK), `current_streak`, `longest_streak`, `last_active_date` | **Cache** — dựng lại từ `activity_logs` + `streak_freezes` |

### Nhóm 5 — Thông báo (4 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `notification_settings` | `is_enabled`, `remind_streak_at_risk`, `remind_review_due`, `last_sent_date` | UQ `user_id` (1-1); `last_sent_date` còn ghi nhưng không ai đọc |
| `reminders` | `label`, `time_of_day`, `days_of_week` (JSON), `is_enabled` | UQ `(user_id, time_of_day)`; tối đa 10 mỗi người |
| `notifications` | `type` (19 loại), `title`, `body`, `link`, `read_at`, `dedupe_key` | UQ `(user_id, dedupe_key)` |
| `user_devices` | `player_id`, `platform` (web/ios/android) | UQ `player_id` |

### Nhóm 6 — Phần thưởng (2 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `coin_transactions` | `amount` (dương thu, âm chi), `reason`, `dedupe_key`, `local_date` | UQ `(user_id, dedupe_key)`. **Sổ cái** — số dư = `SUM(amount)` |
| `streak_freezes` | `purchased_at`, `used_on_date` (NULL = còn trong kho) | UQ `(user_id, used_on_date)` |

### Nhóm 7 — Cộng đồng (4 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `posts` | `author_id`, `title`, `body` (văn bản thuần), `group_id` | `group_id` NULL = bài chung |
| `post_comments` | `post_id`, `author_id`, `body` | Phẳng |
| `post_likes` | `post_id`, `user_id` | UQ `(post_id, user_id)` |
| `post_attachments` | `data` MEDIUMBLOB, `mime_type`, `file_name`, `size_bytes` | Chỉ một hàm được đọc `data` |

### Nhóm 8 — Nhóm lớp (4 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `groups` | `code` CHAR(8), `name`, `visibility`, `require_approval`, `created_by_id`, `blocked_*` | UQ `code`; FK người tạo `SetNull` |
| `group_members` | `group_id`, `user_id`, `role` (LEADER/MEMBER) | UQ `(group_id, user_id)` |
| `group_join_requests` | `status`, `message`, `reject_reason`, `decided_by_id` | UQ `(group_id, user_id)` — một dòng mỗi cặp |
| `group_study_sets` | `group_id`, `topic_id`, `shared_by_id` | UQ `(group_id, topic_id)`; chỉ mở quyền đọc |

### Nhóm 9 — Cửa hàng (6 bảng)

| Bảng | Cột chính | Ràng buộc, ghi chú |
| --- | --- | --- |
| `shop_item_types` | `slug`, `label`, `sort_order`, `is_active` | UQ `slug` |
| `shop_items` | `type_id`, `name`, `price`, `is_active` | FK loại `Restrict` |
| `shop_item_images` | `item_id` (PK+FK), `data`, `mime_type` | ≤ 300 KB |
| `user_items` | `user_id`, `item_id`, `price_paid`, `purchased_at` | UQ `(user_id, item_id)`; FK vật phẩm `Restrict` |
| `user_item_favorites` | `user_id`, `item_id` | UQ `(user_id, item_id)` |
| `user_equipped_items` | `user_id`, `type_id`, `item_id` | **PK `(user_id, type_id)`** — mỗi loại một món |

### Nhóm 10 — Hệ thống (2 bảng)

| Bảng | Cột chính | Ghi chú |
| --- | --- | --- |
| `feature_flags` | `key`, `is_enabled`, `updated_by_id` | UQ `key`. Thiếu dòng nghĩa là BẬT |
| `admin_audit_logs` | `actor_id`, `actor_name`, `action`, `target_type`, `target_id`, `target_label`, `changes` (JSON), `note`, `created_at` | Nhật ký thao tác quản trị, **chỉ thêm**. FK `actor_id` `SetNull`; tên người và đối tượng chụp lại lúc ghi. `action`, `target_type` là chuỗi (danh mục trong mã nguồn), không phải enum |

**Tổng: 38 bảng, 18 enum** (`UserRole`, `UserStatus`, `GoalType`, `GoalPeriod`, `GoalStatus`,
`HabitFrequency`, `ActivityType`, `VocabLevel`, `NotificationType`, `StudySetVisibility`,
`StudySetReportStatus`, `StudyMode`, `GroupVisibility`, `GroupMemberRole`, `GroupJoinStatus`,
`PasswordResetStatus`, `DevicePlatform`, `CoinReason`).

## C2. Quan hệ giữa các bảng

### Quan hệ 1-1

`users` ↔ `user_avatars`, `user_streaks`, `notification_settings`; `shop_items` ↔ `shop_item_images`.

### Quan hệ 1-N — hành vi khi xoá bản ghi cha

| Hành vi | Các quan hệ |
| --- | --- |
| **Cascade** | `users` → gần như mọi bảng của người đó (mục tiêu, thói quen, việc cần làm, hoạt động, tiến độ, lịch sử ôn, xu, vật phẩm, thông báo, bài, bình luận, tim, thành viên nhóm, **bộ thẻ sở hữu**); `topics` → `vocabularies`, báo cáo, liên kết nhóm; `vocabularies` → tiến độ, lịch sử ôn; `habits` → check-in; `posts` → bình luận, tim, tệp; `groups` → thành viên, yêu cầu, bài, liên kết bộ thẻ |
| **SetNull** — giữ bản ghi, chỉ mất "ai làm" | `login_events.user_id`, `topics.created_by_id`, `topics.blocked_by_id`, `groups.created_by_id`, `groups.blocked_by_id`, `group_join_requests.decided_by_id`, `group_study_sets.shared_by_id`, `password_reset_requests.reviewed_by_id`, `study_set_reports.resolved_by_id`, `shop_items.created_by_id`, `feature_flags.updated_by_id`, `habits.goal_id` (xoá mục tiêu chỉ mất liên kết), `admin_audit_logs.actor_id` |
| **Restrict** — chặn xoá | `shop_items.type_id` (loại còn vật phẩm), `user_items.item_id` (vật phẩm đã có người mua) |

### Quan hệ N-N qua bảng nối có thuộc tính

| Cặp | Bảng nối | Thuộc tính |
| --- | --- | --- |
| `users` ↔ `vocabularies` | `user_vocab_progress` | Trạng thái SM-2, bộ đếm đúng/sai |
| `users` ↔ `vocabularies` (từng lần) | `card_reviews` | Chế độ, đúng/sai, khoảng ôn trước/sau |
| `users` ↔ `groups` | `group_members`, `group_join_requests` | Vai trò; trạng thái xin vào |
| `groups` ↔ `topics` | `group_study_sets` | Người chia sẻ |
| `users` ↔ `shop_items` | `user_items`, `user_item_favorites` | Giá lúc mua; yêu thích |
| `users` ↔ `shop_item_types` | `user_equipped_items` | Vật phẩm đang dùng |
| `users` ↔ `posts` | `post_likes` | — |

### Quan hệ đa hình (không FK, có chủ ý)

`activity_logs.ref_id` trỏ tới `vocabularies.id` (học / ôn), `topics.id` (hoàn thành phiên Học) hoặc
`habits.id` (check-in) tuỳ `type`. Nhờ không có FK, xoá bộ thẻ hay thói quen **không** làm mất lịch
sử hoạt động, XP hay chuỗi ngày.

## C3. Migration và dữ liệu mẫu

`be/prisma/migrations/` có **22 migration** — đọc tên là thấy lịch sử phát triển:

| # | Migration | Nội dung |
| --- | --- | --- |
| 1 | `20260829192029_init` | Schema nền: người dùng, mục tiêu, thói quen, chủ đề, từ vựng, SRS, quiz, hoạt động, chuỗi |
| 2 | `20260830074809_add_lessons_and_mistakes` | Lộ trình bài học, từ sai (đã gỡ ở #14) |
| 3 | `20260830103836_add_listening_exercises` | Hai dạng bài nghe (đã gỡ cùng #14) |
| 4 | `20260831103508_them_trang_thai_tai_khoan_va_nhat_ky_dang_nhap` | `UserStatus`, `login_events` |
| 5 | `20260831112553_them_thong_bao_trong_ung_dung` | `notifications` + `dedupe_key` |
| 6 | `20260901170612_them_phan_thuong_diem_danh_nhiem_vu_freeze` | `coin_transactions`, `streak_freezes` |
| 7 | `20260903090000_tach_lich_nhac_thanh_nhieu_moc` | Bảng `reminders` (nhiều mốc) |
| 8 | `20260903120000_them_anh_dai_dien` | `user_avatars` |
| 9 | `20260904090117_them_cong_dong_dien_dan` | `posts`, `post_comments`, `post_likes`, `post_attachments` |
| 10 | `20260905020000_them_ten_tai_khoan_va_yeu_cau_cap_lai_mat_khau` | `users.username`, `password_reset_requests` |
| 11 | `20260906034029_them_nhom_lop` | `groups`, `group_members`, `group_join_requests`, `posts.group_id` |
| 12 | `20260906055839_them_chan_nhom` | Cột chặn nhóm |
| 13 | `20260910144351_thay_quiz_bang_kiem_tra` | Bỏ `quizzes`, `quiz_questions`, `quiz_attempts`; thêm `exam_attempts` |
| 14 | `20260912030000_go_module_bai_hoc` | Gỡ `exam_attempts`, `lesson_progress`, `mistakes` |
| 15 | `20260914000000_them_quan_ly_tinh_nang` | `feature_flags` |
| 16 | `20260915000000_them_thu_vien_hoc_on_tap` | Chủ bộ, chế độ, chặn bộ thẻ; `card_reviews`; `study_set_reports`; bộ đếm ở tiến độ; `activity_logs.dedupe_key` |
| 17 | `20260917000000_them_chia_se_tai_lieu_flashcard_nhom` | `group_study_sets` |
| 18 | `20260917100000_them_cua_hang_vat_pham` | Sáu bảng cửa hàng, lý do xu `SHOP_PURCHASE` |
| 19 | `20260920000000_them_ly_do_tu_choi_vao_nhom` | `group_join_requests.reject_reason` |
| 20 | `20260920100000_them_viec_can_lam` | `todos` |
| 21 | `20260921000000_them_thoi_quen_tu_dong_muc_tieu_tich_luy` | `goals.paused_at`, chu kỳ `TOTAL`; thói quen tự động, lượng, mức tối thiểu, N lần/tuần, `habits.goal_id`; `habit_check_ins.amount` |
| 22 | `20260922000000_them_nhat_ky_thao_tac_quan_tri` | `admin_audit_logs` |

**Quy trình đổi schema:** `prisma migrate dev` chỉ với MySQL local; database dùng chung và
production dùng `migrate deploy`. Production chạy `migrate deploy` tự động trong `startCommand` của
Render. Không sửa tay bảng, kể cả qua GUI.

**Dữ liệu mẫu** (`be/prisma/seed.ts`, idempotent): tài khoản `admin@enghabit.com`,
`user@enghabit.com` (45 ngày lịch sử, chuỗi hiện tại 10 / dài nhất 18), `newbie@enghabit.com` và sáu
thành viên cộng đồng — cùng mật khẩu `A1234567`; bộ thẻ Hệ thống và bộ người học; lịch sử ôn chạy
SM-2 thật; bài đăng, nhóm, yêu cầu cấp lại mật khẩu, phần thưởng, cửa hàng, khung viền, cờ tính năng.
Danh mục 20 linh vật của cửa hàng còn được nạp riêng lên production mỗi lần khởi động
(`seed-shop --soft`).

---

# PHẦN D — GIAO DIỆN VÀ LUỒNG XỬ LÝ

## D1. Các màn hình

Đọc từ `fe/src/routes/AppRoutes.tsx`: **32 route** + trang 404.

| Nhóm (guard) | Màn hình |
| --- | --- |
| Công khai (`PublicOnly`) | `/login`, `/register`, `/forgot-password` |
| Người học (`Learner`) | `/` Tổng quan |
| Người học + cờ (`Gated`) | `/report` Báo cáo · `/habits` Thói quen · `/goals` Mục tiêu · `/todos` Việc cần làm · `/library`, `/library/:id` Thư viện · `/learn` Học · `/review` Ôn tập · `/leaderboard` Bảng xếp hạng · `/shop` Cửa hàng · `/wallet` Ví của tôi · `/inventory` Kho vật phẩm · `/groups`, `/groups/:id` Nhóm lớp |
| Cả hai vai trò | `/community` Cộng đồng (admin bỏ qua cờ) · `/profile` Trang cá nhân · `/notifications` Thông báo |
| Quản trị (`Admin`) | `/admin` Tổng quan hệ thống · `/admin/users` Tài khoản · `/admin/access` Lượt truy cập · `/admin/content`, `/admin/content/:id` Nội dung học tập · `/admin/groups` Quản lý nhóm · `/admin/study-sets` Kiểm duyệt bộ thẻ · `/admin/shop` Quản lý cửa hàng · `/admin/requests` Quản lý yêu cầu · `/admin/features` Quản lý tính năng · `/admin/announcements` Gửi thông báo. Mỗi màn quản lý có tab **Nhật ký** (`?tab=log`), không có route nhật ký riêng |

**Khung chung** (`AppLayout.tsx`): sidebar thu gọn được (mục theo vai trò và cờ, có huy hiệu số thẻ
cần ôn và việc cần làm), breadcrumb tự sinh từ `shared/lib/breadcrumbs.ts`, thanh trên cùng (chuỗi,
việc cần làm, chuông, xu, cấp độ, ngôn ngữ, giao diện — xếp theo bề ngang màn hình), nút lên đầu
trang, Modal và ngăn kéo có bẫy focus, lối tắt "Bỏ qua tới nội dung", Error Boundary theo từng màn.
Giao diện song ngữ Việt–Anh (khoá dịch là câu tiếng Việt), chế độ sáng/tối, màu đã kiểm tương phản
WCAG (`docs/color-rules.md`).

## D2. Luồng xử lý ba chức năng quan trọng nhất

### Luồng 1 — Trả lời một thẻ và cập nhật chuỗi ngày (xương sống hệ thống)

```text
Bước 1 │ Người học chọn mức nhớ (Flashcard) hoặc phương án (Trắc nghiệm)
       │   -> study.hooks: useMutation
       ▼
Bước 2 │ POST /api/v1/study/answers {token, rating | choiceIndex, sessionKey?, responseMs?}
       │   -> helmet, cors, express.json, pinoHttp (x-request-id)
       │   -> requireAuth, requireFeature(VOCABULARY), requireRole(USER), validateBody
       ▼
Bước 3 │ study.service.submitAnswer()
       │   decodeQuestionToken: giải mã AES-GCM, kiểm userId, kiểm hạn 24 giờ
       │   assertSourceEnabled(source): LEARN hoặc FLASHCARDS còn bật
       │   Kiểm quyền LẠI: thẻ thuộc bộ trong readableSetWhere(userId)
       ▼
Bước 4 │ grade(): quy ra quality 0-5
       │   CRAM -> trả đúng/sai, DỪNG, không ghi gì
       │   attempt_key = SHA-256(token); đã có -> trả kết quả lần đầu
       ▼
Bước 5 │ prisma.$transaction:
       │   ├─ INSERT card_reviews                 (unique chặn gửi trùng)
       │   ├─ reviewCard(before, quality, today)  <- SM-2 ở shared/srs
       │   ├─ UPSERT user_vocab_progress          (lịch ôn + bộ đếm lapses/đúng/sai)
       │   └─ recordActivity({type, refId, tx})
       │        ├─ INSERT activity_logs (occurred_at UTC + local_date)   <- NGUỒN SỰ THẬT
       │        └─ applyActivity -> UPSERT user_streaks                   <- cache
       ▼
Kết quả│ {isCorrect, correctIndex, correctAnswer, nextReviewDate, intervalDays}
       │ FE làm mới cache study, library, statistics -> huy hiệu, chuỗi, XP đổi theo
```

Vì sao cùng một transaction: tiến độ đổi mà chuỗi chưa đổi là dữ liệu lệch không cách nào phát hiện.

### Luồng 2 — Đăng nhập và duy trì phiên

```text
Bước 1 │ POST /auth/login {identifier, password} -> validateBody(loginSchema)
       ▼
Bước 2 │ findByIdentifier: email HOẶC username, rồi kiểm lại khớp CHÍNH XÁC trong JS
       │   (collation utf8mb4_unicode_ci bỏ qua hoa thường và khoảng trắng cuối — "User " vẫn
       │   khớp "user" nếu chỉ tin DB; email thì không phân biệt hoa thường)
       │   không có  -> LoginEvent(NO_ACCOUNT)     -> 401
       │   sai mk    -> LoginEvent(WRONG_PASSWORD) -> 401 (cùng thông báo)
       │   LOCKED    -> LoginEvent(LOCKED)         -> 403 "liên hệ quản trị viên"
       ▼
Bước 3 │ Thành công: LoginEvent(success) + users.last_login_at
       │ signAccessToken({sub, role, timezone})   JWT 15 phút
       │ issueRefreshToken(userId)                48 byte ngẫu nhiên, lưu SHA-256, 30 ngày
       ▼
Bước 4 │ Cookie httpOnly (production: SameSite=None; Secure — FE và API khác tên miền)
       │ FE lưu access token trong Zustand; ADMIN -> /admin, USER -> /
       ▼
Bước 5 │ [15 phút sau] 401 -> api-client gom mọi request 401 vào MỘT lần POST /auth/refresh
       │   rotateRefreshToken: thu hồi token cũ, cấp token mới; LOCKED thì chặn ngay
       ▼
Kết quả│ Request gốc được thử lại; refresh thất bại -> xoá phiên -> về /login
```

### Luồng 3 — Nhận thưởng nhiệm vụ ngày (chống gian lận, chống nhận trùng)

```text
Bước 1 │ GET /rewards: song song số dư (SUM amount), khoá đã nhận hôm nay,
       │   số hoạt động hôm nay theo loại, kho vật phẩm giữ chuỗi
       ▼
Bước 2 │ evaluateMissions (shared/rewards): học 5 thẻ mới / ôn 10 thẻ / check-in 1 thói quen
       │   Tiến độ KHÔNG lưu — chấm từ activity_logs mỗi lần đọc
       ▼
Bước 3 │ POST /rewards/missions/claim {missionId}
       │   claimMission CHẤM LẠI ở BE; chưa đạt -> 400
       ▼
Bước 4 │ INSERT coin_transactions (+20, dedupe_key = MISSION:<id>:<local_date>)
       │   Unique (user_id, dedupe_key) là thứ DUY NHẤT chống trùng; trùng -> 409
       ▼
Kết quả│ Số dư tăng. KHÔNG ghi activity_logs, KHÔNG cộng XP.
```

## D3. Xử lý lỗi và validation

### Validation — hai lớp, một định nghĩa

- Zod schema ở `shared/` — FE validate trước khi gửi, BE validate lại mọi request
  (`validateBody`, `validateQuery`, `validateParams`), dữ liệu đã chuẩn hoá được gán lại vào request.
- Ba lớp kiểm tra bổ sung không thay thế nhau: **nghiệp vụ trong service** (sở hữu, số dư, nhiệm vụ
  đã đạt, trưởng nhóm cuối cùng, admin cuối cùng); **ràng buộc DB** (thứ duy nhất chặn race
  condition); **chấm lại ở server** (đáp án trong mã hoá, số câu phiên Học, tiến độ nhiệm vụ).
- Query boolean dùng `z.preprocess` (không dùng `z.coerce.boolean()` vì `Boolean('false') === true`).

### Xử lý lỗi backend

`AppError(statusCode, message, code)` với 5 lớp con (400, 401, 403, 404, 409). `errorHandler` là nơi
duy nhất chuyển lỗi thành HTTP: `ZodError` → 400 kèm từng trường; `AppError` → đúng mã; Prisma
`P2002` → 409, `P2025` → 404, `P2003` → 400; lỗi khác → 500 (stack chỉ lộ ở dev). Mọi phản hồi lỗi
kèm `requestId`. Tầng job khoan dung hơn: một người gửi push lỗi không làm dừng cả lượt quét.

### Xử lý lỗi frontend

Error Boundary riêng từng màn; `getErrorMessage()` lấy thông báo tiếng Việt từ backend; tự refresh
token khi 401; không dùng `alert/confirm/prompt` của trình duyệt (`useConfirm`, `useToast`); guard
6 loại; backend fail-fast khi thiếu biến môi trường và kiểm DB trước khi mở cổng.

### Kiểm thử tự động

**19 tệp test** (`vitest`), đặt cạnh tệp nguồn: 17 ở `shared/` (SM-2, streak, cấp độ, phần thưởng,
ảnh đại diện, tệp đính kèm, danh mục tính năng, hạn mục tiêu, dự báo mục tiêu, lịch thói quen, schema
đăng nhập, đề cập, báo cáo, cửa hàng, học–ôn, trắc nghiệm, nhập thẻ), 1 ở `be/` (`question-token.test.ts`), 1 ở `fe/` (i18n). CI chạy typecheck,
kiểm bản dịch, test và build ở mỗi lần push.

---

# PHẦN E — ĐÁNH GIÁ VÀ GỢI Ý CHO BÁO CÁO

## E1. Hạn chế hiện tại

### Phát hiện khi rà soát 21/09/2026 (logic lệch với thiết kế)

Chi tiết và dẫn chứng: `docs/logic-nghiep-vu/README.md` mục "Phát hiện khi rà soát".

1. **Thông báo "Đã đạt mục tiêu" chỉ bắn khi kết thúc phiên Học.** `recordActivity` chỉ kiểm mục
   tiêu khi người gọi không truyền `tx`; Ôn tập và check-in thói quen đều truyền `tx`. Hệ quả kéo
   theo: mục tiêu chuỗi / cộng dồn của người chỉ ôn tập không tự chuyển `COMPLETED`.
2. ~~Giờ nhắc riêng của thói quen không có tác dụng~~ — **đã sửa 22/09/2026**: cron nhắc nhở có lượt
   quét thứ ba theo `habits.reminder_time`.
3. **Cảnh báo chuỗi sắp đứt dùng cache chuỗi**, có thể cảnh báo một chuỗi đã đứt.
4. **API nhóm lớp không chặn vai trò ADMIN** ở backend (chỉ giao diện chặn).
5. **Trưởng nhóm xoá được nhóm đang bị chặn**, và vẫn quản lý thành viên khi nhóm bị chặn.

Phát hiện thêm ngày 22/09/2026 (không đánh số để giữ nguyên số vá bên dưới): **trang Báo cáo vẫn
chấm mục tiêu trong những ngày tạm dừng** — quãng dừng kéo tỷ lệ đạt xuống.

### Về phạm vi chức năng

6. **Chưa có ứng dụng mobile** — kiến trúc đã chuẩn bị (`shared/` build sẵn, `user_devices.platform`
   có `ios`/`android`, refresh token nhận được qua body).
7. **Quên mật khẩu cần quản trị viên duyệt tay** vì không có dịch vụ email. Lượt duyệt gắn với tài
   khoản chứ không gắn với người đã chứng minh danh tính.
8. **Không xác thực email khi đăng ký.**
9. **Không đo thời gian học thực tế** — mục tiêu `MINUTES_PER_DAY` thực chất đếm lượt ôn; chỉ có
   `response_ms` từng câu.
10. **Không sửa được bài đăng / bình luận**; diễn đàn chung không có báo cáo bài vi phạm.
11. **Chưa có phát âm** ở màn Học / Ôn tập (nút phát âm cũ gỡ cùng module `lessons`); cột
    `vocabularies.audio_url` nhận được qua API quản trị nhưng không màn nào phát.

### Về bảo mật

12. **Không giới hạn số lần đăng nhập** — dò mật khẩu được ghi nhận (`login_events`) nhưng không bị chặn.
13. **Không phát hiện tái sử dụng refresh token** (chưa có "họ token").
14. ~~Không có nhật ký thao tác quản trị~~ — **đã có từ 22/09/2026** (`admin_audit_logs`, tab Nhật
    ký trong từng màn quản lý). Còn thiếu: chính sách lưu trữ, bảng chỉ lớn dần.
15. **Xoá tài khoản là xoá cứng**, cascade gần hết dữ liệu, kể cả bộ thẻ họ sở hữu và tiến độ của
    những người khác trên bộ đó.
16. **Tệp và ảnh lưu blob trong MySQL** (ảnh đại diện, tệp đính kèm, ảnh vật phẩm) — hợp lý với ổ đĩa
    tạm của gói free nhưng làm DB phình nhanh.

### Về hiệu năng và khả năng mở rộng

17. **Nhiều số liệu tính lại mỗi lần đọc** (cấp độ, bảng xếp hạng toàn thời gian, tổng quan quản trị)
    — đánh đổi có chủ ý để không lệch số liệu; `countActiveUsers`, `dailyActivity` còn kéo dòng về
    bộ nhớ rồi mới đếm.
18. **Cron xử lý tuần tự** từng mốc nhắc; số người dùng tăng mạnh thì một lượt có thể vượt 15 phút.
19. **Cron tiêu vật phẩm 30 phút/lượt** — người mở app đầu ngày có thể thấy chuỗi về 0 trước khi được cứu.

### Về kiểm thử và tài liệu

20. **Backend gần như chưa có test** (1 tệp) — chống nhận trùng xu, mua hàng khoá dòng, tiêu vật
    phẩm, quyền nhóm, quyền bộ thẻ chưa được kiểm chứng tự động, dù `runReminderTick` và
    `runStreakFreezeTick` đã được tách ra để test.
21. **Không có test tích hợp / E2E, không có OpenAPI.** Phụ lục ERD và API chưa theo kịp schema hiện tại.

## E2. Đề xuất hướng phát triển

### Ưu tiên cao — sửa lệch logic và vá lỗ hổng

1. **Sửa thông báo đạt mục tiêu** (vá #1): gọi `notifyAchievedGoals` sau khi transaction của
   `study.submitAnswer` và `habits.checkIn` commit, hoặc cho `recordActivity` nhận callback sau commit.
2. ~~Quyết định số phận `habits.reminder_time`~~ (vá #2) — đã làm: thêm lượt quét thứ ba vào
   `reminder.job.ts`.
3. **Cảnh báo chuỗi dùng `displayStreak`** (vá #3) — và thống nhất ở mọi chỗ hiện chuỗi.
4. **Thêm `requireRole(USER)` cho `/groups`** và chặn xoá / quản lý thành viên khi nhóm bị chặn (vá #4, #5).
5. **Rate limit đăng nhập** (vá #12) — dữ liệu đã có sẵn trong `login_events`.
6. **Soft-delete tài khoản** (vá #15). Nhật ký thao tác quản trị (vá #14) đã có.
7. **Test backend** cho các chỗ khó nhất (vá #20): `claimMission`, `buyItem`, `consumeFreezeIfNeeded`,
   `assertNotLastAdmin`, `assertNotLastLeader`, `readableSetWhere`, `submitAnswer`.

### Ưu tiên trung bình — hoàn thiện chức năng

8. **Ứng dụng mobile React Native + Expo** (vá #6) — hướng phát triển tự nhiên nhất.
9. **Quên mật khẩu qua email** và xác thực email khi đăng ký (vá #7, #8).
10. **Đo thời gian học** (vá #9) — cộng `response_ms` theo phiên hoặc thêm `duration_seconds`.
11. **Báo cáo bài đăng vi phạm** theo mô hình kiểm duyệt bộ thẻ (vá #10).

### Ưu tiên thấp — mở rộng

12. Tối ưu truy vấn thống kê bằng `groupBy` / `COUNT(DISTINCT)`; cron xử lý theo lô (vá #17, #18).
13. Cache ngắn hạn cho bảng xếp hạng — chỉ là cache xoá được, không phải bảng tổng hợp.
14. Chuyển blob sang object storage khi rời gói free (vá #16).
15. OpenAPI sinh từ Zod schema; dựng lại phụ lục ERD/API tự động từ mã nguồn (vá #21).
16. Mở rộng trò chơi hoá: huy hiệu, thử thách theo nhóm, thêm loại vật phẩm (danh mục loại đã nằm
    dưới DB nên thêm loại không cần deploy).

## E3. Gợi ý hướng tiếp cận cho báo cáo

### Nên chọn hướng chức năng hay hướng đối tượng?

**Khuyến nghị: hướng chức năng làm chủ đạo, bổ sung Use Case Diagram và Sequence Diagram của UML.**

- **Mã backend là mã hướng chức năng.** Mọi service là tập hợp `export async function`; cây lớp duy
  nhất là `AppError` và 5 lớp con. Vẽ Class Diagram nghiệp vụ sẽ phải bịa ra lớp không có trong mã.
- **Prisma model là bản ghi dữ liệu**, hành vi nằm ở service — đúng mô hình "dữ liệu + hàm xử lý".
- **Ranh giới chức năng rõ sẵn:** 17 module backend trùng tên feature frontend; sơ đồ phân rã chức
  năng gần như vẽ lại từ cây thư mục.
- **`activity_logs` là kho dữ liệu trung tâm điển hình** — nhiều tiến trình cùng ghi, nhiều tiến trình
  cùng đọc; đây đúng là thứ DFD sinh ra để mô tả. Tương tự với `coin_transactions` và `notifications`.
- Use Case Diagram hợp với phân quyền nhiều tác nhân (Khách, Người học, Trưởng nhóm, Quản trị viên,
  Cron); Sequence Diagram hợp với luồng nhiều lớp (FE → routes → controller → service → Prisma → shared).

Nếu trường bắt buộc thuần hướng đối tượng: nêu rõ hệ thống chọn mô hình hàm cho tầng nghiệp vụ, các
"lớp" trong thiết kế được hiện thực thành module hàm — nói thẳng điều này tốt hơn vẽ Class Diagram giả.

### Các biểu đồ phù hợp nhất

| # | Biểu đồ | Vì sao | Lấy dữ liệu từ |
| --- | --- | --- | --- |
| 1 | **Sơ đồ phân rã chức năng (BFD)** | 8 nhóm, 16 phân hệ, ranh giới rõ | Mục B2 |
| 2 | **ERD** | 38 bảng, đủ 1-1 / 1-N / N-N, có điểm đáng bình luận: quan hệ đa hình `ref_id`, ba hành vi xoá Cascade / SetNull / Restrict, khoá chính ghép `(user_id, type_id)` | `be/prisma/schema.prisma`, mục C1–C2 |
| 3 | **Use Case Diagram** | 5 tác nhân, quyền cưỡng chế ở router | `docs/use-case/`, `docs/chuc-nang-va-luong-nghiep-vu.md` |
| 4 | **DFD mức 0 và mức 1** | Ba kho trung tâm (`activity_logs`, `coin_transactions`, `notifications`) | `docs/logic-nghiep-vu/README.md` — bản đồ phụ thuộc và "sáu trục" |
| 5 | **Sequence Diagram (3–4 cái)** | (a) trả lời thẻ + cập nhật chuỗi; (b) đăng nhập + refresh xoay vòng; (c) cron nhắc nhở + OneSignal; (d) mua vật phẩm có khoá dòng | Mục D2, `docs/chuc-nang-va-luong-nghiep-vu.md` mục 4 |
| 6 | **Sơ đồ triển khai** | Vercel — Render (API + cron) — Aiven MySQL — OneSignal | Mục A2 |

Nên có thêm nếu còn chỗ: **State Diagram** (thẻ theo SM-2; vòng đời chuỗi có vật phẩm giữ chuỗi; yêu
cầu cấp lại mật khẩu; yêu cầu vào nhóm; báo cáo bộ thẻ), **Activity Diagram** cho cron nhắc nhở,
**Package Diagram** cho quan hệ `shared` ← `be`, `shared` ← `fe`.

### Điểm nên làm nổi bật

1. **Một nguồn sự thật và dữ liệu dẫn xuất** — `activity_logs` là nguồn; chuỗi là cache dựng lại
   được; XP, số dư xu, tiến độ mục tiêu và nhiệm vụ **cố ý không lưu**.
2. **Xử lý múi giờ bằng `local_date`** — "một ngày học" là ngày của người học, tính một lần lúc ghi.
3. **Chống trùng và chống tranh chấp bằng DB** — năm khoá unique khác nhau cho năm luồng; khoá dòng
   `SELECT … FOR UPDATE` khi trừ xu.
4. **Ranh giới "cái gì là hoạt động học"** — Học, Ôn tập, check-in thói quen được ghi; Cram, điểm danh,
   mua hàng, việc cần làm, đăng bài thì **không**, và lý do của từng quyết định.
5. **Đảo ngược được thay vì xoá** — khoá, chặn, ngừng bán, tắt tính năng đều giữ nguyên dữ liệu.
6. **Bảo mật theo tầng** — quyền đọc bộ thẻ trong câu truy vấn (404 thay vì 403), đáp án mã hoá
   AES-GCM, tệp chỉ phục vụ theo MIME đã lưu, quản trị viên bị chặn khỏi API học tập ở router.

---

*Tài liệu sinh từ phân tích mã nguồn thực tế, cập nhật ngày 21/09/2026.*
