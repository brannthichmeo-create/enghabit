# Kế hoạch: Cửa hàng, Ví cá nhân và Kho vật phẩm

> **ĐÃ TRIỂN KHAI** ngày 18/09/2026. Tài liệu này là đặc tả của tính năng đang chạy —
> đọc trước khi sửa. Phần "Thứ tự làm" ở cuối giữ lại để tra lịch sử.
>
> Đọc trước: `CLAUDE.md` (mục *Cửa hàng, Ví và Kho vật phẩm*, *Phần thưởng động viên*,
> *Quản lý tính năng*, *Checklist bắt buộc khi thêm một màn hình mới*) và
> `docs/color-rules.md`.
>
> **Bốn chỗ bản triển khai khác bản kế hoạch đầu tiên**, đều có lý do ghi tại chỗ:
>
> 1. **Ảnh vật phẩm có endpoint CÔNG KHAI** (mục 2.6) — thẻ `<img>` không gửi được header
>    `Authorization`. Bản kế hoạch không nhận ra điều này.
> 2. **Khoá dòng `SELECT ... FOR UPDATE`** thay cho "kiểm tra lại số dư trước khi commit"
>    (mục 2.3) — dùng lại đúng thủ pháp `buyStreakFreeze` đã có sẵn.
> 3. **Seed TỰ VẼ ảnh linh vật**, không lấy từ koboyo.com (mục 8) — tránh hẳn chuyện giấy
>    phép, và không đưa tệp nhị phân vào git.
> 4. **Có một linh vật giá 0 xu** (mục 7) — người mới có 0 xu, nếu món rẻ nhất là 300 thì
>    ngày đầu cửa hàng chỉ để ngắm và kho vật phẩm rỗng trơn.

---

## 1. Mục tiêu và phạm vi

Hệ thống hiện có sổ cái xu (`coin_transactions`) với ba nguồn thu — điểm danh, nhiệm vụ
ngày — và đúng **một** đầu ra duy nhất là vật phẩm giữ chuỗi. Xu vào nhiều hơn ra, nên
người học tích được một số dư không dùng vào việc gì. Cửa hàng là đầu ra thứ hai và là
phần thưởng *nhìn thấy được*: mua linh vật (mascot) rồi chọn một con để hiển thị trong
giao diện học.

Ba màn hình mới cho người học và một màn hình cho quản trị viên:

| Màn hình | Đường dẫn | Vai trò | Nội dung |
|---|---|---|---|
| Cửa hàng | `/shop` | Người học | Danh sách vật phẩm theo loại, mua bằng xu, bấm yêu thích |
| Ví của tôi | `/wallet` | Người học | Số dư xu, lịch sử biến động Thu/Chi, lọc theo loại |
| Kho vật phẩm | `/inventory` | Người học | Tab **Yêu thích** + tab **Của tôi** (data grid, chọn sử dụng) |
| Quản lý cửa hàng | `/admin/shop` | Quản trị viên | CRUD loại vật phẩm và vật phẩm |

Ngoài phạm vi lần này: tặng vật phẩm giữa người dùng, bán lại lấy lại xu, vật phẩm có
hạn dùng, gói combo, giảm giá theo đợt. Thiết kế dưới đây không chặn các thứ đó về sau.

---

## 2. Bảy quyết định thiết kế bắt buộc giữ

Đây là phần quan trọng nhất của tài liệu. Mỗi quyết định kèm lý do, để người sửa sau
biết vì sao không nên làm ngược lại.

### 2.1. Mua hàng KHÔNG ghi `ActivityLog`

Cùng nguyên tắc với điểm danh và nhận thưởng nhiệm vụ (xem `rewards.service.ts`). Mua
một con mascot không giúp ai nhớ thêm từ vựng; ghi vào `ActivityLog` thì bấm nút mua là
đủ giữ chuỗi ngày, và toàn bộ thống kê học tập sẽ nói dối.

### 2.2. Chống mua trùng bằng `dedupeKey` của sổ cái xu có sẵn

Bảng `coin_transactions` đã có `@@unique([userId, dedupeKey])`. Một lần mua ghi một dòng
với `dedupeKey = "SHOP_ITEM:<itemId>"` và `amount` âm. Vì mỗi vật phẩm chỉ mua **một
lần vĩnh viễn**, khoá này vừa là khoá chống bấm hai lần vừa là khoá chống sở hữu trùng —
hai request về cùng lúc thì một cái ăn lỗi unique của MySQL, đúng như cách `checkIn` và
`claimMission` đang làm. Không kiểm tra bằng đọc-rồi-ghi.

Hệ quả cố ý: vật phẩm **không có số lượng**, đã sở hữu là không hiện nút mua nữa. Nếu
sau này có vật phẩm tiêu hao (mua nhiều lần) thì khoá phải đổi thành
`SHOP_ITEM:<itemId>:<uuid>` và bảng sở hữu bỏ ràng buộc unique — ghi rõ ở đây để lần đó
không ai sửa nhầm khoá của mascot.

### 2.3. Số dư vẫn là `SUM(amount)`, không thêm cột số dư

Giữ nguyên quy tắc hiện có. Trừ xu là **ghi một dòng âm**, không phải giảm một cột.

Việc kiểm tra "đủ xu không" và việc ghi dòng trừ xu nằm trong **cùng một transaction có
khoá dòng user** — `SELECT id FROM users WHERE id = ? FOR UPDATE`, đúng thủ pháp mà
`buyStreakFreeze` đã dùng. Không khoá thì hai lệnh mua hai vật phẩm **khác nhau** về cùng
lúc đều thấy đủ tiền và số dư thành âm; khoá `dedupeKey` không cứu được trường hợp đó vì
hai khoá khác nhau.

Đây là ngoại lệ có chủ ý của quy tắc "mọi truy vấn qua Prisma Client": Prisma không có API
khoá dòng nên phải dùng `$executeRaw`, nhưng vẫn đi qua kết nối của Prisma.

### 2.4. Danh mục **loại** vật phẩm nằm dưới DB, khác với danh mục tính năng

`FeatureKey` nằm trong mã nguồn vì thêm tính năng mới là thêm code. Loại vật phẩm thì
ngược lại: đề bài nói rõ **quản trị viên tự thêm loại mới**, và thêm loại không cần code
mới. Vì vậy có bảng `shop_item_types`.

Bù lại, FE cần biết mỗi loại hiển thị ở đâu trong giao diện. Giải pháp: bảng có cột
`slug` (`MASCOT`, `FRAME`, `THEME`...), FE giữ một bản đồ `slug → chỗ hiển thị` và
**có nhánh mặc định**: loại lạ vẫn mua được, vẫn nằm trong kho, vẫn chọn được, chỉ
không gắn vào chỗ nào trong giao diện cho tới khi có code cho nó. Loại lạ không được
làm vỡ màn hình — cùng tinh thần với "dòng `feature_flags` mang khoá lạ thì bỏ qua".

### 2.5. Mỗi loại chỉ dùng được một vật phẩm — ràng buộc ở DB, không ở tầng code

Bảng `user_equipped_items` có khoá chính `(user_id, type_id)`. Chọn dùng con khác là
`upsert` đúng một dòng. Nếu để tầng service tự xoá-rồi-ghi thì hai request cùng lúc có
thể để lại hai dòng cho cùng một loại, và giao diện sẽ vẽ hai con mascot chồng nhau.

### 2.6. Ảnh vật phẩm lưu trong DB, bảng riêng — theo đúng tiền lệ `user_avatars`

Nền tảng deploy dùng ổ đĩa tạm: ghi ảnh ra thư mục máy chủ là mỗi lần deploy lại mất
sạch. Bảng `shop_item_images` tách khỏi `shop_items` vì cùng lý do với `user_avatars` —
`findMany` danh sách cửa hàng không được kéo theo hàng megabyte nhị phân.

Đường dẫn ảnh là `GET /shop/items/:id/image`, trả kèm `ETag` dựng từ `updated_at` và
`Cache-Control: public, max-age=31536000, immutable` với URL có tham số phiên bản
(`?v=<updated_at>`) — ảnh cửa hàng ai cũng xem và gần như không đổi.

**Bản triển khai KHÔNG lấy ảnh từ https://koboyo.com/page-mascot.** Đồ án có thể công bố,
mà ảnh tải từ một trang bất kỳ thì không rõ giấy phép — rủi ro thật, không phải rủi ro
giấy tờ. Thay vào đó seed **tự vẽ** 20 linh vật bằng `makeMascotPng` (PNG nền trong suốt,
128×128, dựng từ hai màu trong `be/prisma/seed-data/shop.ts`). Hệ quả phụ đều tốt: không
có tệp nhị phân trong git, và nhìn mảng màu là biết linh vật trông thế nào khi đọc diff.

Muốn dùng ảnh thật (của koboyo hay bất kỳ nguồn nào **có giấy phép cho phép**) thì không
phải sửa dòng code nào: quản trị viên tải ảnh lên ở `/admin/shop`, ảnh đó ghi đè hình tự
sinh. Kiến trúc không phụ thuộc nguồn ảnh.

### 2.7. Vật phẩm giữ chuỗi **không** chuyển vào cửa hàng

`streak_freezes` có logic riêng (giới hạn `MAX_STREAK_FREEZES` trong kho, job tự tiêu,
`recompute-streak` phải đọc bảng này). Nó là vật phẩm *tiêu hao có tác dụng cơ chế*,
còn vật phẩm cửa hàng là *trang trí, sở hữu vĩnh viễn*. Gộp hai thứ vào một bảng là kéo
theo cả `usedOnDate` và giới hạn kho vào mô hình không cần chúng. Màn `/shop` **có thể**
hiện một thẻ dẫn sang khu Phần thưởng cho vật phẩm giữ chuỗi, nhưng nút mua vẫn gọi
`POST /rewards/streak-freeze/buy` như cũ.

---

## 3. Mô hình dữ liệu

Tất cả theo quy ước hiện có: model `PascalCase` số ít, `@@map` sang `snake_case` số
nhiều, `@map` cho cột.

### 3.1. `ShopItemType` → `shop_item_types`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | Int, PK | |
| `slug` | VarChar(30), unique | `MASCOT`, `FRAME`... FE tra bản đồ hiển thị theo cột này |
| `label` | VarChar(60) | Nhãn tiếng Việt hiện trên tab của cửa hàng |
| `description` | VarChar(255), null | Một câu mô tả loại này dùng để làm gì |
| `sortOrder` | Int | Thứ tự tab |
| `isActive` | Boolean, mặc định true | Tắt thì loại biến mất khỏi cửa hàng, **không** thu hồi vật phẩm đã mua |
| `createdAt` / `updatedAt` | DateTime | |

### 3.2. `ShopItem` → `shop_items`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | Int, PK | |
| `typeId` | Int, FK → `shop_item_types`, `onDelete: Restrict` | Xoá loại đang có vật phẩm phải bị chặn |
| `name` | VarChar(100) | |
| `description` | VarChar(500), null | |
| `price` | Int | Xu. `>= 0`, kiểm ở Zod |
| `isActive` | Boolean | Ngừng bán. Người đã mua vẫn dùng được |
| `sortOrder` | Int | |
| `createdById` | Int?, FK → `users`, `onDelete: SetNull` | Quản trị viên tạo |
| `createdAt` / `updatedAt` | DateTime | |

Index: `@@index([typeId, isActive, sortOrder])`.

**Không có xoá cứng khi vật phẩm đã có người sở hữu.** Quan hệ `user_items → shop_items`
đặt `onDelete: Restrict`; service trả lỗi rõ ràng và gợi ý dùng `isActive = false`.
Xoá cứng chỉ cho phép với vật phẩm chưa ai mua. Cùng tinh thần với "chặn nhóm thay vì
xoá nhóm" — mất vật phẩm người dùng đã trả xu là thiệt hại không đảo ngược được.

### 3.3. `ShopItemImage` → `shop_item_images`

`itemId` (PK, FK cascade), `data Bytes @db.MediumBlob`, `mimeType VarChar(30)`,
`updatedAt`. Giới hạn kích thước và danh sách định dạng đặt ở `shared/src/shop/shop.ts`
(ví dụ 300 KB, `image/png | image/webp | image/jpeg`), dùng chung cho cả kiểm phía FE
lẫn phía BE — không viết hai ngưỡng.

### 3.4. `UserItem` → `user_items` (sổ sở hữu)

`id`, `userId`, `itemId`, `purchasedAt`, `pricePaid Int`.

- `@@unique([userId, itemId])` — một người sở hữu một vật phẩm đúng một lần.
- `pricePaid` lưu giá **tại thời điểm mua**: quản trị viên đổi giá về sau không được
  làm sai lịch sử ví. Đây là lý do lịch sử ví không join sang `shop_items.price`.

### 3.5. `UserItemFavorite` → `user_item_favorites`

`userId`, `itemId`, `createdAt`, `@@unique([userId, itemId])`.

Yêu thích **độc lập hoàn toàn** với sở hữu: bỏ thích không ảnh hưởng vật phẩm đã mua,
mua rồi vẫn giữ nguyên trạng thái thích. Tab Yêu thích chỉ là một bộ lọc khác của cùng
danh mục cửa hàng, nên "đồng bộ trạng thái mua với cửa hàng" là chuyện tự nhiên — cả
hai màn đọc cùng một nguồn, không có bản sao trạng thái nào cả.

### 3.6. `UserEquippedItem` → `user_equipped_items`

`userId`, `typeId`, `itemId`, `updatedAt`, `@@id([userId, typeId])`.

Ràng buộc nghiệp vụ kiểm ở service: `itemId` phải thuộc `typeId` đó **và** phải nằm
trong `user_items` của chính người đó. Bỏ trang bị = xoá dòng.

### 3.7. Sửa enum có sẵn

```prisma
enum CoinReason {
  DAILY_CHECKIN
  MISSION_CLAIM
  STREAK_FREEZE_PURCHASE
  SHOP_PURCHASE   // mới, amount âm
}
```

Không đổi tên ba giá trị cũ — `coin_transactions` còn dữ liệu mang chúng.

### 3.8. Migration

Một migration `add_shop`, chạy bằng `pnpm db:deploy` (DB dev dùng chung thì **không**
chạy `migrate dev`). Thêm giá trị vào enum MySQL là `ALTER TABLE ... MODIFY`, an toàn
với dữ liệu sẵn có.

---

## 4. Backend — module `shop`

Thư mục `be/src/modules/shop/`: `shop.routes.ts → shop.controller.ts → shop.service.ts
→ shop.schema.ts`. Không viết nghiệp vụ trong route hay controller.

Router gắn `requireAuth, requireRole(UserRole.USER)` **ngay ở tầng router**, như
`rewards.routes.ts`. Ẩn trên giao diện là chưa đủ: token quản trị viên gọi thẳng API
vẫn mua được vật phẩm. Kèm `requireFeature(FeatureKey.SHOP)` ở chỗ mount trong `app.ts`.

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/shop/types` | Loại đang bật, kèm số vật phẩm |
| GET | `/shop/items?typeId=&favorite=&owned=&q=&page=` | Danh sách, **mỗi dòng kèm `isOwned`, `isFavorite`, `isEquipped`** |
| POST | `/shop/items/:id/buy` | Mua. 402/400 khi thiếu xu, 409 khi đã sở hữu |
| POST | `/shop/items/:id/favorite` | Bật/tắt yêu thích (idempotent theo trạng thái gửi lên) |
| GET | `/shop/items/:id/image` | Ảnh, có ETag |
| GET | `/shop/inventory` | Vật phẩm đã sở hữu + đang dùng, cho tab **Của tôi** |
| PUT | `/shop/equipped/:typeId` | Chọn dùng một vật phẩm cho loại đó |
| DELETE | `/shop/equipped/:typeId` | Bỏ dùng |
| GET | `/wallet` | Số dư + lịch sử phân trang, lọc `direction=IN\|OUT`, khoảng ngày |

Ba cờ `isOwned`/`isFavorite`/`isEquipped` trả **ngay trong danh sách** chứ không để FE
gọi thêm một API "danh sách id đã mua" rồi tự ghép — ghép ở FE là chỗ sinh ra cảnh mua
xong nút vẫn ghi "Mua".

`GET /wallet` đọc thẳng `coin_transactions`, join `user_items` + `shop_items` để lấy tên
vật phẩm cho dòng chi. Nhãn hiển thị của từng `CoinReason` do FE dịch qua `t()`, BE chỉ
trả enum — **không** trả câu tiếng Việt dựng sẵn, nếu không giao diện tiếng Anh sẽ lòi
ra tiếng Việt.

Admin: thêm vào module `admin` có sẵn (`/admin/shop/types`, `/admin/shop/items`, có
upload ảnh dạng `multipart` hoặc base64 như luồng avatar hiện dùng), đi qua role-guard
`ADMIN` như mọi route `/admin/*`.

### `shared/src/shop/shop.ts`

Dùng chung FE/BE: `shopItemDedupeKey(itemId)`, ngưỡng kích thước ảnh và danh sách MIME,
Zod schema (`createShopItemSchema`, `buyItemSchema`, `walletQuerySchema` — lưu ý query
boolean phải dùng `z.preprocess`, **không** `z.coerce.boolean()`), type
`ShopItemView`/`WalletEntry`, và hằng `EQUIP_SLOT_BY_SLUG` cho bản đồ hiển thị. Nhớ
`pnpm build:shared` sau mỗi lần sửa.

---

## 5. Frontend

`fe/src/features/shop/` — `components/`, `hooks/`, `shop.api.ts`, `shop.types.ts`. Ví và
Kho vật phẩm nằm chung feature này vì dùng chung khoá cache và cùng vòng đời dữ liệu
(mua một món là cả ba màn phải đổi).

### 5.1. Khoá cache và luồng đồng bộ

```
shopKeys.types()
shopKeys.items(filters)     // filters CHỨA typeId, favorite, owned, q, page
shopKeys.inventory()
shopKeys.wallet(filters)
rewardsKeys.summary()       // đã có, giữ số dư ở thanh trên cùng
```

Sau khi mua thành công: `invalidate` cả năm khoá trên. Đây chính là cơ chế "bấm mua ở
tab Yêu thích thì cửa hàng cũng cập nhật" — không có state riêng nào để lệch. `filters`
**bắt buộc** nằm trong khoá `items`, thiếu là tab Yêu thích và tab Tất cả dùng chung một
ô cache (đúng lỗi đã gặp với `communityKeys.list` và `groupId`).

### 5.2. Ba màn hình

**`/shop`** — tab theo loại (từ `/shop/types`), lưới thẻ vật phẩm: ảnh, tên, giá kèm
icon xu, nút trái tim, nút chính đổi theo trạng thái: `Mua` → `Đang dùng` / `Đã sở hữu`
(bấm để chọn dùng). Nút mua vô hiệu khi thiếu xu, kèm dòng "Còn thiếu {n} xu". Xác nhận
mua bằng `useConfirm()` — **không** `confirm()` của trình duyệt. Kết quả báo bằng
`useToast()`.

**`/wallet`** — thẻ số dư lớn ở trên, dưới là bảng lịch sử: ngày, diễn giải, loại
(Thu/Chi), số xu. Thu màu chuỗi dương, chi màu cảnh báo — lấy từ token trong
`docs/color-rules.md`, không đặt hex tại chỗ. Bộ lọc Tất cả / Thu / Chi + khoảng ngày.
Ngày giờ định dạng qua `useLocale()`, không hardcode `'vi-VN'`.

**`/inventory`** — hai tab:
- *Yêu thích*: cùng component thẻ với cửa hàng, gọi `/shop/items?favorite=true`. Vì
  dùng lại đúng component đó nên nút mua, trạng thái sở hữu và nút chọn dùng hành xử y
  hệt, không phải viết lần thứ hai.
- *Của tôi*: data grid — ảnh nhỏ, tên, loại, giá đã trả, ngày mua, cột "Sử dụng" là
  radio theo từng loại. Chọn một dòng thì dòng đang dùng cùng loại tự bỏ chọn (do
  `PUT /shop/equipped/:typeId` ghi đè). Có empty state dẫn sang `/shop`.

### 5.3. Nơi mascot hiện ra

Bắt đầu bằng đúng hai chỗ, đều là màn của người học: thẻ chào ở trang **Tổng quan** và
**trang cá nhân**. Component `EquippedMascot` đọc `/shop/inventory` (loại `MASCOT`), tự
trả `null` khi chưa chọn gì — không có mascot thì bố cục phải nguyên vẹn, không hở một
khoảng trống.

Quản trị viên **không** gọi các hook này (`useEquipped(isLearner)`), đúng như
`useLevel(isLearner)` đang làm — gọi rồi bỏ đi chỉ tốn request và làm log nhiễu.

### 5.4. Checklist bắt buộc cho mỗi màn hình mới (CLAUDE.md)

1. Route + guard `Learner` / `Feature` trong `AppRoutes.tsx`, đặt `name` đúng tên màn.
2. Thêm `TRAILS` trong `fe/src/shared/lib/breadcrumbs.ts`.
3. Mọi chữ qua `t()` **và thêm bản dịch vào `fe/src/shared/i18n/en.ts`** — kể cả nhãn
   loại vật phẩm nằm trong bảng hằng số (script không quét được nhóm này). Tên vật phẩm
   do quản trị viên nhập là **dữ liệu động, không đưa qua `t()`**.
4. Nhãn ở `Sidebar`, `TRAILS` và `name` của route giống hệt nhau: *Cửa hàng*, *Ví của
   tôi*, *Kho vật phẩm*.
5. Chữ trong thẻ dùng `content*`, chữ trên nền hệ thống dùng `on-page*`. Thẻ vật phẩm
   luôn có `border-line`.
6. `pnpm --filter @enghabit/fe check:i18n` và `typecheck`.

---

## 6. Cờ tính năng

Thêm vào `shared/src/constants/features.ts`:

```ts
SHOP: 'SHOP'
```

```ts
{
  key: FeatureKey.SHOP,
  label: 'Cửa hàng',
  description: 'Dùng xu mua vật phẩm trang trí, xem ví và kho vật phẩm đã mua.',
  routes: ['/shop', '/wallet', '/inventory'],
  dependsOn: [FeatureKey.REWARDS],
}
```

Một cờ cho cả ba màn: không có xu thì ví và kho đều vô nghĩa, tách ba cờ chỉ tạo ra tổ
hợp trạng thái không ai cần. `dependsOn: [REWARDS]` vì xu sinh ra từ đó. `/admin/shop`
**không** gắn cờ — tắt cửa hàng phía người học không được làm quản trị viên mất chỗ
soạn vật phẩm (cùng lý do với `/topics`).

Tắt cửa hàng **không** hoàn xu, không xoá `user_items`, không bỏ trang bị. Bật lại là
thấy nguyên trạng.

---

## 7. Cân bằng kinh tế xu

Thu hiện tại tối đa: 50 (điểm danh) + 60 (ba nhiệm vụ) = **110 xu/ngày**. Chi hiện tại:
vật phẩm giữ chuỗi 200 xu.

Đề xuất ba bậc giá, đặt trong seed chứ không hardcode trong code:

| Bậc | Giá | Ngày tích luỹ | Ý nghĩa |
|---|---|---|---|
| Tặng | 0 | ngay lập tức | Một con duy nhất, cho người mới đi trọn vòng mua → chọn dùng |
| Thường | 300 | ~3 ngày | Mua được sớm, tạo cảm giác cửa hàng dùng được ngay |
| Hiếm | 800 | ~7 ngày | Mục tiêu một tuần |
| Đặc biệt | 2000 | ~18 ngày | Mục tiêu dài, cho người học đều |

Con 0 xu **đã triển khai** ("Cú Xanh"): người mới có 0 xu, nếu món rẻ nhất cũng là 300 thì
ngày đầu cửa hàng chỉ là quầy hàng để ngắm và kho vật phẩm rỗng trơn. Giá 0 vẫn đi qua
đúng luồng mua — vẫn ghi một dòng sổ cái (0 xu) nên ví có dấu vết, và vẫn chặn mua hai lần
bằng `dedupeKey`.

**Dòng 0 xu xếp vào CHI, không xếp vào THU.** Bộ lọc Chi của màn Ví phải là `amount <= 0`:
nếu Thu là `> 0` mà Chi là `< 0` thì dòng 0 xu không khớp bộ lọc nào và biến mất khỏi **cả
hai** tab. Lỗi này đã xảy ra thật khi chạy thử và được sửa ở `shop.service.getWallet`.

---

## 8. Seed

`be/prisma/seed.ts` phải idempotent (`upsert`), theo đúng cách các phần seed hiện có
đang làm:

- 1 loại `MASCOT` (label *Linh vật*).
- 20 vật phẩm mascot. Không `upsert` được vì `shop_items` không có unique cho
  `(typeId, name)` — seed tra `findFirst` rồi mới tạo. Đây là script chạy tay, thêm vài
  câu truy vấn tra cứu không đáng để ràng buộc thêm lược đồ.
- Ảnh: `makeMascotPng` vẽ tại chỗ, không đọc tệp và không tải mạng (xem 2.6).
- Cho tài khoản người dùng mẫu: 2 vật phẩm đã mua (kèm dòng `coin_transactions` tương
  ứng, đúng `dedupeKey`, để ví có dữ liệu thật), 3 vật phẩm yêu thích, 1 vật phẩm đang
  dùng. Nhớ cộng đủ xu cho tài khoản đó trước, nếu không số dư seed ra âm.

---

## 9. Kiểm thử

- `shared`: `shopItemDedupeKey`, Zod schema (giá âm, MIME lạ, query boolean `'false'`).
- `be` (`shop.service.test.ts` đặt cạnh file nguồn): mua khi thiếu xu → lỗi, số dư
  không đổi; mua hai lần → lần hai 409 và **chỉ một** dòng `coin_transactions`; hai lệnh
  mua đồng thời hai vật phẩm khi chỉ đủ tiền một → đúng một cái thành công; chọn dùng
  vật phẩm chưa sở hữu → 404/400; chọn dùng lần hai cùng loại → vẫn đúng một dòng
  `user_equipped_items`; quản trị viên gọi API mua → 403.
- Kiểm tra bằng tay: tắt cờ `SHOP` rồi gõ thẳng `/wallet` → phải ra 404, không phải 403.

---

## 10. Thứ tự làm và chia commit

Mỗi commit tự nó phải build và chạy được.

1. `Them_Shared-Shop_MoHinhVatPham_Thêm hằng số, Zod schema và khoá chống trùng cho cửa hàng`
2. `Them_BE-Shop_LuocDoDuLieu_Thêm bảng loại vật phẩm, vật phẩm, sở hữu, yêu thích và trang bị`
3. `Them_BE-Shop_MuaVatPham_Thêm API cửa hàng, ví và kho vật phẩm`
4. `Them_BE-Admin_QuanLyCuaHang_Thêm CRUD loại vật phẩm và vật phẩm cho quản trị viên`
5. `Them_FE-Shop_CuaHang_Thêm màn cửa hàng mua vật phẩm bằng xu`
6. `Them_FE-Shop_ViCaNhan_Thêm màn ví hiển thị số dư và lịch sử thu chi`
7. `Them_FE-Shop_KhoVatPham_Thêm kho vật phẩm hai tab yêu thích và của tôi`
8. `Them_FE-Admin_QuanLyCuaHang_Thêm màn quản trị cửa hàng`
9. `Them_BE-Seed_DuLieuCuaHang_Thêm 20 linh vật mẫu và dữ liệu ví cho tài khoản mẫu`

Trước mỗi commit đụng chữ trên giao diện: `pnpm --filter @enghabit/fe check:i18n`.

---

## 11. Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Bản quyền ảnh mascot từ koboyo.com | Kiểm tra giấy phép trước khi lấy; không rõ thì dùng bộ ảnh mở hoặc tự vẽ |
| Số dư âm khi mua đồng thời | Đọc và ghi số dư trong cùng transaction, kiểm tra lại trước khi commit (2.3) |
| Ảnh làm phình DB | Giới hạn kích thước ở `shared`, bảng ảnh tách riêng, `ETag` + cache dài |
| Xoá vật phẩm người dùng đã mua | `onDelete: Restrict`, chỉ cho ngừng bán bằng `isActive` |
| Loại vật phẩm mới chưa có code hiển thị | FE có nhánh mặc định, loại lạ không làm vỡ màn hình (2.4) |
