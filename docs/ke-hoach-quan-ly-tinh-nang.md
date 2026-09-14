# Thiết kế chức năng "Quản lý tính năng"

> Quản trị viên bật/tắt từng tính năng của người học bằng công tắc. Tắt rồi thì mục đó biến
> mất khỏi sidebar, và truy cập thẳng bằng URL sẽ ra trang 404 cho tới khi bật lại.
>
> Khảo sát mã nguồn ngày 14/09/2026. **Đã dựng xong ngày 15/09/2026** — tài liệu này
> mô tả đúng mã nguồn hiện tại, không còn là kế hoạch.

---

## 1. Mục tiêu và phạm vi

### 1.1 Yêu cầu

- Quản trị viên có màn hình `/admin/features`, mỗi tính năng một dòng kèm công tắc.
- Tắt một tính năng: người học không thấy mục đó trong sidebar nữa.
- Người học gõ thẳng URL của tính năng đã tắt: hiện trang 404, không vào được.
- Bật lại: mọi thứ trở về như cũ, không mất dữ liệu.

### 1.2 Nguyên tắc chi phối toàn bộ thiết kế

**Tắt tính năng là biện pháp đảo ngược được, không phải xoá.** Cùng tinh thần với chặn
nhóm và khoá tài khoản: dữ liệu học của người dùng (`ActivityLog`, `UserVocabProgress`,
`Habit`, `Goal`) **không bị đụng tới**. Tắt rồi bật lại là người học thấy lại đúng chỗ họ
đang dở.

**Ẩn trên giao diện là chưa đủ — phải khoá cả API.** Đây là lỗi lặp lại nhiều lần trong
dự án này (xem `CLAUDE.md`, mục chặn nhóm và mục chặn module học tập ở tầng router). Giấu
mục trên sidebar mà để nguyên endpoint thì người dùng gọi thẳng API vẫn ghi `ActivityLog`,
vẫn nhận xu, và số liệu thống kê sẽ nói dối.

**Trạng thái bật/tắt là cấu hình hệ thống, không phải cấu hình cá nhân.** Một công tắc áp
cho toàn bộ người học. Không có chuyện tắt tính năng cho riêng một nhóm người.

---

## 2. Danh mục tính năng — nguồn sự thật nằm ở `shared/`

### 2.1 Tách "danh sách có những tính năng nào" khỏi "tính năng nào đang bật"

| Thứ | Nằm ở đâu | Vì sao |
|---|---|---|
| **Danh mục** (key, nhãn, mô tả, route, phụ thuộc) | `shared/src/constants/features.ts` | Là hằng số của mã nguồn: thêm tính năng mới là thêm code, không phải thêm dòng trong DB |
| **Trạng thái** (bật/tắt, ai đổi, lúc nào) | bảng `feature_flags` | Là dữ liệu vận hành, quản trị viên đổi lúc chạy |

Trộn hai thứ này vào một bảng DB sẽ dẫn tới cảnh: deploy bản mới có tính năng mới, nhưng
tính năng đó không chạy vì quên chèn dòng vào DB production — một lỗi im lặng, chỉ phát
hiện khi người dùng phàn nàn.

### 2.2 Cấu trúc danh mục

```ts
// shared/src/constants/features.ts

/** Khoá tính năng — phải khớp cột `key` của bảng feature_flags. */
export const FeatureKey = {
  VOCABULARY: 'VOCABULARY',
  FLASHCARDS: 'FLASHCARDS',
  HABITS: 'HABITS',
  GOALS: 'GOALS',
  REPORT: 'REPORT',
  LEADERBOARD: 'LEADERBOARD',
  COMMUNITY: 'COMMUNITY',
  GROUPS: 'GROUPS',
  REWARDS: 'REWARDS',
} as const;
export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey];

export interface FeatureDefinition {
  key: FeatureKey;
  /** Nhãn hiển thị — GIỐNG HỆT nhãn ở Sidebar, TRAILS và route guard. */
  label: string;
  /** Một câu giải thích người học mất gì khi tắt. Hiện dưới nhãn ở màn quản trị. */
  description: string;
  /** Đường dẫn FE bị khoá khi tắt. Khớp theo tiền tố. */
  routes: string[];
  /** Tính năng này cần tính năng khác đang bật mới có nghĩa. */
  dependsOn?: FeatureKey[];
}
```

### 2.3 Danh mục cụ thể

| Khoá | Nhãn | Route FE | Prefix API | Phụ thuộc |
|---|---|---|---|---|
| `VOCABULARY` | Từ vựng | `/vocabulary` | `/topics` (chỉ với vai trò `USER`) | — |
| `FLASHCARDS` | Ôn tập | `/flashcards` | `/flashcards` | `VOCABULARY` |
| `HABITS` | Thói quen | `/habits` | `/habits` | — |
| `GOALS` | Mục tiêu | `/goals` | `/goals` | — |
| `REPORT` | Báo cáo | `/report` | `/statistics/report` | — |
| `LEADERBOARD` | Bảng xếp hạng | `/leaderboard` | `/leaderboard` | — |
| `COMMUNITY` | Cộng đồng | `/community` | `/community` (chỉ với vai trò `USER`) | — |
| `GROUPS` | Nhóm lớp | `/groups` | `/groups` | `COMMUNITY` |
| `REWARDS` | Phần thưởng | — (nằm trong Tổng quan) | `/rewards` | — |

**Những thứ CỐ Ý không có trong danh mục** — tắt được chúng là tự khoá cửa nhà mình:

- `auth` — tắt là không ai đăng nhập được, kể cả quản trị viên.
- `admin` — tắt là mất luôn chính màn hình để bật lại.
- `profile`, `notifications` — người dùng luôn phải đổi được mật khẩu và đọc được thông
  báo hệ thống, kể cả khi mọi tính năng học đã tắt.
- `statistics` (phần Tổng quan) — là trang chủ của người học. Tắt thì đăng nhập xong rơi
  vào 404 ngay.

Danh mục là một mảng hằng, nên không có cách nào để quản trị viên tắt nhầm những thứ trên:
chúng không xuất hiện trên màn hình quản lý.

### 2.4 Hai nhánh dùng chung hai vai trò — `/topics` và `/community`

Cả hai mở cho quản trị viên (xem `CLAUDE.md`): `/topics` để soạn nội dung ở
`/admin/content`, `/community` để kiểm duyệt diễn đàn. Vì vậy hai cờ `VOCABULARY` và
`COMMUNITY` **chỉ chặn request mang vai trò `USER`** (`adminBypass`). Chặn cả hai vai trò
là tắt Từ vựng xong quản trị viên không soạn được từ mới — đúng lúc họ cần soạn nhất — và
tắt diễn đàn xong thì bỏ lại đống bài cần dọn mà không ai vào dọn được.

`GROUPS` **không** có bypass: quản trị viên quản lý nhóm ở `/admin/groups`, còn `/groups`
là khu của người học và vốn đã bọc guard `Learner`.

Đây là lý do middleware kiểm tra cờ phải chạy **sau** `requireAuth` và biết `req.user.role`.

---

## 3. Dữ liệu

### 3.1 Bảng `feature_flags`

```prisma
/// Trạng thái bật/tắt của một tính năng. Danh sách tính năng nằm ở
/// shared/src/constants/features.ts — bảng này CHỈ giữ trạng thái.
model FeatureFlag {
  id        Int      @id @default(autoincrement())
  /// Khớp FeatureKey ở shared. Khoá lạ (của bản cũ) bị bỏ qua khi đọc.
  key       String   @unique @db.VarChar(50)
  isEnabled Boolean  @default(true) @map("is_enabled")

  /// Ai bật/tắt lần gần nhất. Null = chưa ai đụng tới kể từ khi seed.
  updatedById Int?     @map("updated_by_id")
  updatedBy   User?    @relation(fields: [updatedById], references: [id], onDelete: SetNull)
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("feature_flags")
}
```

`onDelete: SetNull` vì xoá tài khoản quản trị viên không được phép xoá theo trạng thái
tính năng của cả hệ thống.

### 3.2 Thiếu dòng nghĩa là BẬT

Đọc trạng thái = duyệt danh mục ở `shared/`, tra dòng tương ứng trong DB; **không có dòng
thì coi như bật**. Hệ quả:

- Deploy bản có tính năng mới: tính năng chạy ngay, không cần chạy seed hay migration dữ
  liệu. Không bao giờ có cảnh "tính năng mới im lặng vì quên chèn dòng".
- Dòng có `key` không nằm trong danh mục (còn sót từ bản cũ): bị bỏ qua khi đọc, không
  gây lỗi. Dọn sau cũng được.

`be/prisma/seed.ts` vẫn `upsert` đủ các khoá để màn hình quản trị có dữ liệu đẹp ngay sau
khi clone, nhưng seed là tiện nghi chứ không phải điều kiện để chạy.

---

## 4. Backend

### 4.1 Module `feature-flags`

Tên module giống hệt nhau hai phía (`be/src/modules/feature-flags`,
`fe/src/features/feature-flags`) như mọi module khác:

```
be/src/modules/feature-flags/
├── feature.routes.ts     # GET /features (mọi người đã đăng nhập)
├── feature.service.ts    # đọc/ghi trạng thái, cache, kiểm tra phụ thuộc
├── feature.guard.ts      # middleware requireFeature()
└── feature.schema.ts     # schema Zod cho thân request bật/tắt
```

Phần **đọc** (`GET /api/v1/features`) đặt ở module này. Phần **ghi** đặt trong
`admin.routes.ts` (`GET`/`PATCH /api/v1/admin/features`) vì mọi route `/admin/*` đã đi qua
role-guard sẵn — không dựng thêm một lối vào có quyền quản trị ở module khác.

### 4.2 API

| Method | Đường dẫn | Vai trò | Trả về |
|---|---|---|---|
| `GET` | `/api/v1/features` | đã đăng nhập | `{ "VOCABULARY": true, "FLASHCARDS": false, ... }` — chỉ khoá và trạng thái |
| `GET` | `/api/v1/admin/features` | `ADMIN` | mảng đầy đủ: khoá, nhãn, mô tả, phụ thuộc, trạng thái, ai đổi lần cuối, lúc nào |
| `PATCH` | `/api/v1/admin/features/:key` | `ADMIN` | `{ isEnabled: boolean }` → trạng thái sau khi đổi, kèm danh sách tính năng bị tắt lây |

`GET /features` cố ý **không** trả nhãn và mô tả: chữ trên giao diện người học đi qua `t()`
ở FE, lấy nhãn từ BE là đưa một chuỗi không dịch được vào sidebar.

### 4.3 Middleware `requireFeature`

```ts
// be/src/modules/features/feature.guard.ts

/**
 * Chặn một nhánh API khi tính năng đã tắt. Trả 404 chứ không phải 403:
 * tính năng đã tắt thì với người học nó không tồn tại, không phải "có nhưng
 * bạn không được phép".
 *
 * `adminBypass` dành cho nhánh dùng chung hai vai trò (/topics, /community): quản
 * trị viên vẫn phải soạn nội dung và kiểm duyệt được khi tính năng đã tắt.
 */
export const requireFeature =
  (key: FeatureKey, opts: { adminBypass?: boolean } = {}): RequestHandler =>
  async (req, _res, next) => {
    if (opts.adminBypass && req.user?.role === UserRole.ADMIN) return next();
    if (await featureService.isEnabled(key)) return next();
    next(new NotFoundError());
  };
```

Gắn tại chỗ mount router trong `app.ts`, một dòng một nhánh — nhìn một chỗ là biết nhánh
nào chịu cờ nào:

```ts
api.use('/flashcards', requireAuth, requireFeature(FeatureKey.FLASHCARDS), flashcardRoutes);
api.use('/topics', requireAuth, requireFeature(FeatureKey.VOCABULARY, { adminBypass: true }), topicRoutes);
api.use('/community', requireAuth, requireFeature(FeatureKey.COMMUNITY, { adminBypass: true }), communityRoutes);
```

`requireAuth` phải đứng trước vì guard cần `req.user.role` cho `adminBypass`. Các router
bên trong vẫn giữ nguyên `requireAuth`, `requireRole` của chúng — gọi hai lần vô hại, và
bỏ đi ở router con là tạo ra endpoint không được bảo vệ nếu sau này ai đó mount lại chỗ khác.

**Chỉ `REPORT` cần gắn ở tầng sâu hơn**, vì nó là một nhánh con của `statistics` (trang
Tổng quan vẫn phải chạy khi tắt Báo cáo): đặt `requireFeature` ngay trên route
`/statistics/report` trong `statistics.routes.ts`.

### 4.4 Cache và độ trễ lan truyền

Mỗi request có guard mà truy vấn DB một lần là thêm một truy vấn cho mọi request — trong
khi dữ liệu này đổi vài tháng một lần.

- `feature.service` giữ một `Map<FeatureKey, boolean>` trong bộ nhớ, TTL **30 giây**.
- `PATCH` xoá cache **của tiến trình đang chạy** ngay lập tức.
- Tiến trình khác (nếu sau này chạy nhiều instance) thấy thay đổi chậm nhất sau 30 giây.

**Ghi rõ độ trễ này ở màn hình quản trị** ("Thay đổi có hiệu lực trong vòng 30 giây"), vì
không nói thì quản trị viên sẽ bấm tắt, thử ngay, thấy vẫn vào được, rồi bấm lại vài lần.

### 4.5 Phụ thuộc giữa các tính năng

Xử lý ở service, không ở controller:

- **Tắt một tính năng** thì tắt luôn các tính năng phụ thuộc nó, trong **cùng một
  transaction**. Tắt `VOCABULARY` mà để `FLASHCARDS` bật là người học mở Ôn tập ra và
  thấy một màn hình rỗng vĩnh viễn — không có từ nào để ôn.
- **Bật một tính năng** khi tính năng nó phụ thuộc còn tắt: trả `400` kèm tên tính năng
  cần bật trước. Không tự động bật lây theo chiều ngược lại — bật thêm thứ quản trị viên
  không yêu cầu là làm thay họ.
- `PATCH` trả về danh sách bị tắt lây để FE báo lại cho đúng.

### 4.6 Các job định kỳ

`be/src/jobs/reminder.job.ts` đang nhắc "thẻ đến hạn ôn". Nhánh nhắc đó phải kiểm tra cờ
`FLASHCARDS` trước khi tạo thông báo — nhắc người dùng đi làm một việc mà bấm vào thì ra
404 là cách nhanh nhất khiến họ tắt thông báo.

Kiểm tra ở **job**, không ở chỗ tạo cấu hình nhắc nhở — cùng lý do với việc lọc vai trò
`USER` trong job đó: cấu hình có từ trước khi tính năng bị tắt.

### 4.7 Những thứ CỐ Ý không đổi

- **`ActivityLog` cũ giữ nguyên.** Tắt Ôn tập không xoá lịch sử ôn tập. Thống kê tháng
  trước vẫn hiện đúng số liệu đã có, biểu đồ không tự nhiên thủng một mảng.
- **Streak vẫn tính như cũ.** Tắt hết tính năng học thì người dùng không học được nữa nên
  chuỗi sẽ đứt. Đó là hệ quả đúng của việc quản trị viên tắt tính năng, không phải bug —
  và `recompute-streak` vẫn tái tạo ra đúng con số đó từ `ActivityLog`.
- **Mục tiêu và thói quen đã đặt vẫn nằm trong DB.** Bật lại là thấy lại nguyên vẹn.

---

## 5. Frontend

### 5.1 Nạp trạng thái

`fe/src/features/feature-flags/`:

```
├── feature-flag.api.ts     # GET /features
├── feature-flag.hooks.ts   # useFeatureFlags(), useFeature(key)
└── components/FeatureGate.tsx
```

Dùng TanStack Query, một khoá duy nhất `['feature-flags']`:

- `staleTime` 60 giây, `refetchOnWindowFocus: true`. Người học đang mở app lúc quản trị
  viên tắt tính năng sẽ thấy mục biến mất ở lần quay lại tab kế tiếp, không cần tải lại trang.
- **Hiển thị** (`useFeature`, `useFeatureFlags`): chưa có dữ liệu thì coi mọi tính năng
  là **bật**. Mạng chậm mà mặc định tắt là cả sidebar nháy một cái rồi mới hiện đủ mục —
  trông như lỗi.
- **Gọi API** (`useFeatureQueryEnabled`): chưa biết thì **chưa gọi**. Gọi lạc quan rồi
  tính năng hoá ra đang tắt là một lỗi 404 đỏ trong console mỗi lần mở app — thứ khiến
  người sau đi truy một lỗi không có thật.
- **Chặn route** (`Gated`): chưa biết thì **chưa vẽ gì**. Vẽ lạc quan nghĩa là dựng hẳn
  màn hình của tính năng đang tắt, nó kịp gọi API và nhận 404, rồi mới bị thay bằng trang
  404 — người dùng thấy trang chớp một cái.

### 5.2 Chặn route

Thêm một lớp bọc cạnh `Learner` trong `AppRoutes.tsx`:

```tsx
/** Trang thuộc một tính năng bật/tắt được — tắt thì đúng nghĩa là không tồn tại. */
function Gated({ flag, name, children }: { flag: FeatureKey; name: string; children: JSX.Element }) {
  const enabled = useFeature(flag);
  if (!enabled) return <Feature name="Không tìm thấy trang"><NotFoundPage /></Feature>;
  return <Learner name={name}>{children}</Learner>;
}
```

Dùng như:

```tsx
<Route path="/flashcards" element={<Gated flag={FeatureKey.FLASHCARDS} name="Ôn tập"><FlashcardPage /></Gated>} />
```

Ba điểm quan trọng:

- **Hiện `NotFoundPage`, không `Navigate` về "/".** Đẩy lặng lẽ về trang chủ khiến người
  dùng tưởng mình bấm hụt. 404 nói rõ: đường dẫn này không có gì.
- **Dùng đúng `NotFoundPage` sẵn có**, không dựng trang "tính năng đã tắt" riêng. Một là
  đỡ một màn hình phải dịch; hai là không tiết lộ cho người dùng rằng hệ thống có tính
  năng đó nhưng đang tắt — thông tin ấy chỉ làm họ đi hỏi.
- **Breadcrumb phải bỏ nhánh cũ.** `/flashcards` vẫn tra ra "Ôn tập" trong bản đồ route,
  mà chính màn hình đó là thứ không tồn tại — nên `NotFoundPage` gọi
  `useBreadcrumbTail(..., true)` để giữ đúng mục gốc rồi nối thẳng "Không tìm thấy trang".
- **`Gated` bọc ngoài `Learner`**, nên quản trị viên vào `/flashcards` vẫn bị đẩy về
  `/admin` như trước, bất kể cờ bật hay tắt.

### 5.3 Sidebar

`mainItems` và `habitItems` gắn thêm trường `flag?: FeatureKey`, rồi lọc:

```ts
const flags = useFeatureFlags();
const visible = mainItems.filter((item) => !item.flag || flags[item.flag]);
```

Nếu lọc xong nhóm "Duy trì" rỗng (tắt cả Thói quen, Mục tiêu và Báo cáo) thì **ẩn luôn
nhãn nhóm** — một tiêu đề nhóm đứng trơ không có mục nào dưới trông như giao diện vỡ.

### 5.4 Các chỗ khác trỏ tới tính năng đã tắt

Lọc theo cờ, nếu không thì người dùng vẫn có đường đi vòng vào một trang 404:

| Chỗ | Việc phải làm |
|---|---|
| `DashboardPage` — thẻ "Việc hôm nay", ô thẻ đến hạn | Ẩn phần liên quan tới tính năng đã tắt |
| `QuickStats` (thanh trên cùng) | Không gọi API của tính năng đã tắt — `useDueCount(isLearner && flags.FLASHCARDS)` |
| Thông báo cũ trong chuông | **Giữ nguyên, không lọc.** Thông báo đã gửi là chuyện đã xảy ra; bấm vào ra 404 đúng như mọi liên kết cũ khác. Lọc lịch sử là viết lại lịch sử |
| Trang cá nhân | Ẩn các khối thống kê của tính năng đã tắt |

### 5.5 Màn hình `/admin/features`

Một thẻ, mỗi tính năng một dòng:

- Bên trái: nhãn (đậm) + mô tả một dòng bên dưới, chữ `content-muted`.
- Bên phải: công tắc, dùng lại component `Switch` đã có ở
  `fe/src/features/notifications/components/ReminderSettings.tsx` — **tách ra
  `fe/src/shared/components/ui.tsx` trước khi dùng ở nơi thứ hai**, không copy-paste.
- Dưới nhãn, khi đã có người đổi: "Tắt bởi <tên> · <thời gian>" qua `timeAgo`.
- Dòng của tính năng đang bị khoá vì phụ thuộc (ví dụ `FLASHCARDS` khi `VOCABULARY` tắt):
  công tắc `disabled`, kèm một dòng giải thích cần bật gì trước.
- Đầu trang: một dòng ghi "Thay đổi có hiệu lực trong vòng 30 giây".

**Tắt phải hỏi xác nhận bằng `useConfirm()`**, không phải `confirm()` của trình duyệt.
Nội dung hộp thoại nêu rõ hai điều: số người học đang dùng tính năng đó trong 7 ngày qua
(đếm từ `ActivityLog`, có sẵn dữ liệu), và danh sách tính năng sẽ bị tắt lây. Bật lại thì
không cần hỏi — bật là hành động khôi phục.

Báo kết quả bằng `useToast()`.

### 5.6 Checklist màn hình mới (bắt buộc, theo `CLAUDE.md`)

1. Route `/admin/features` bọc `Admin`, `name="Quản lý tính năng"`.
2. `TRAILS`: `'/admin/features': [{ label: 'Quản lý tính năng' }]`.
3. `en.ts`: dịch "Quản lý tính năng" và toàn bộ chữ mới, gồm cả **nhãn + mô tả của từng
   tính năng trong `features.ts`** — nhóm nhãn trong bảng dữ liệu này script kiểm tra
   không quét được, phải tự thêm.
4. Nhãn ở `Sidebar` (mục mới, biểu tượng `ToggleRight`), `TRAILS` và `name` của route
   giống hệt nhau.
5. Màu: chữ trong thẻ dùng `content*`; thẻ có `border-line`.
6. Chạy `pnpm --filter @enghabit/fe check:i18n` và `typecheck`.

---

## 6. Thứ tự làm

| Bước | Việc | Xong khi |
|---|---|---|
| 1 | `shared/src/constants/features.ts` + schema Zod, `pnpm build:shared` | `FeatureKey` import được ở cả hai phía |
| 2 | Model `FeatureFlag` + migration + seed | `npx prisma studio` thấy bảng có đủ dòng |
| 3 | `feature.service` (đọc + cache) và `GET /features` | Gọi API trả về đủ khoá |
| 4 | `requireFeature` + gắn vào `app.ts` | Sửa tay `is_enabled=false` trong DB thì API trả 404 |
| 5 | Phần ghi trong `admin.routes.ts` + kiểm tra phụ thuộc | Tắt `VOCABULARY` thì `FLASHCARDS` tắt theo |
| 6 | FE: hooks + `Gated` + lọc sidebar | Tắt trong DB thì mục biến mất, gõ URL ra 404 |
| 7 | FE: màn `/admin/features` + breadcrumb + i18n | Bấm công tắc, tải lại trang người học thấy đổi |
| 8 | Lọc `reminder.job.ts`, `DashboardPage`, `QuickStats` | Tắt Ôn tập thì không còn nhắc thẻ đến hạn |

Bước 1–4 tự nó đã là một hệ thống chạy được (bật/tắt bằng cách sửa DB). Mỗi bước là một
commit biên dịch được, đúng quy tắc commit của dự án.

---

## 7. Những quyết định cần giữ khi sửa module này

- **Danh sách tính năng ở `shared/`, trạng thái ở DB.** Không chuyển danh sách xuống DB.
- **Thiếu dòng trong `feature_flags` nghĩa là bật.** Không đổi thành mặc định tắt.
- **Guard trả 404, không trả 403.** Với người học, tính năng đã tắt là không tồn tại.
- **Không có cờ cho `auth`, `admin`, `profile`, `notifications`, trang Tổng quan.** Tắt
  được chúng là tự khoá cửa nhà mình.
- **`/topics` và `/community` có `adminBypass`.** Tắt Từ vựng không được làm quản trị
  viên mất khả năng soạn nội dung, tắt Cộng đồng không được khoá luôn người kiểm duyệt.
- **Tắt tính năng không đụng tới dữ liệu người học.** Không dọn `ActivityLog`, không xoá
  `Goal`/`Habit`, không tính lại streak.
