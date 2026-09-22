# Module `shop` — Cửa hàng, Ví, Kho vật phẩm

> **Mã nguồn:** `be/src/modules/shop/` (`shop.service.ts`, `shop.frame.ts`, `shop.catalog.ts`,
> `shop.catalog-data.ts`, `shop.frame-image.ts`, `shop.mascot-image.ts`),
> `be/src/modules/admin/admin-shop.service.ts`, `be/src/scripts/seed-shop.ts`, `shared/src/shop/`
> **Màn hình:** `/shop`, `/wallet`, `/inventory`; quản trị: `/admin/shop`
> **Cờ tính năng:** `SHOP` (một cờ cho cả ba màn), phụ thuộc `REWARDS`. `/admin/shop` không chịu cờ
> **Quyền:** `/shop/*` chỉ `USER`, trừ `GET /shop/items/:id/image` công khai
> **Đặc tả chi tiết:** `docs/ke-hoach-cua-hang-vat-pham.md`

## 1. Vai trò

**Đầu ra** thứ hai của xu (sau vật phẩm giữ chuỗi): người học dùng xu mua vật phẩm trang trí,
xem lịch sử thu chi và chọn vật phẩm hiển thị. Loại **khung viền ảnh đại diện** là vật phẩm duy
nhất người khác nhìn thấy, nên module này cung cấp dữ liệu cho Cộng đồng, Bảng xếp hạng và Nhóm.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `shop_item_types` | Ghi (admin) | Danh mục **loại** nằm dưới DB: `slug` (MASCOT, AVATAR_FRAME…) không sửa được sau khi tạo; `is_active` |
| `shop_items` | Ghi (admin) | `price` (0 hợp lệ), `is_active` (đang bán) |
| `shop_item_images` | Ghi (admin) | Ảnh blob tối đa 300 KB, bảng riêng |
| `user_items` | Ghi | Sổ sở hữu: `@@unique([userId, itemId])`, `price_paid` = giá **lúc mua** |
| `user_item_favorites` | Ghi | Yêu thích, **độc lập** với sở hữu |
| `user_equipped_items` | Ghi | Khoá chính `(user_id, type_id)` — **mỗi loại đúng một vật phẩm** đang dùng |
| `coin_transactions` | Ghi (chung với `rewards`) | Mua là một **dòng âm**, `dedupe_key = SHOP_ITEM:<itemId>` |

## 3. Chức năng và cách hoạt động

### 3.1 Xem cửa hàng — `GET /shop/types`, `GET /shop/items`

- Chỉ loại và vật phẩm đang bán; riêng vật phẩm **đã sở hữu** vẫn hiện dù đã ngừng bán.
- Mỗi vật phẩm trả sẵn ba cờ của người xem: `isOwned`, `isFavorite`, `isEquipped` — FE không tự ghép.
- Lọc theo loại, yêu thích, đã sở hữu, `hideOwned` (cửa hàng mặc định ẩn món đã có), tìm theo tên.

### 3.2 Mua — `POST /shop/items/:id/buy`

Trong **một transaction** có `SELECT ... FOR UPDATE` trên dòng `users`:

1. Vật phẩm không tồn tại hoặc ngừng bán (kể cả loại bị tắt) → 404.
2. Đã sở hữu → 409.
3. Số dư < giá → 400 "Cần N xu, bạn mới có M".
4. Ghi dòng trừ `-price` (lý do `SHOP_PURCHASE`, khoá `SHOP_ITEM:<itemId>`) **trước**, rồi ghi
   `user_items` với `price_paid`.
5. Trùng unique → 409 "Bạn đã sở hữu vật phẩm này".

Mỗi vật phẩm mua **một lần vĩnh viễn**. Khoá `dedupe_key` chặn trừ tiền hai lần; khoá dòng `users`
chặn hai lệnh mua **hai món khác nhau** cùng lúc làm số dư âm.

### 3.3 Yêu thích — `PUT /shop/items/:id/favorite`

Nhận trạng thái **đích** (`favorite: true/false`), không phải lệnh đảo — bấm nhanh hai lần vẫn
cho kết quả đúng.

### 3.4 Kho và chọn dùng — `GET /shop/inventory`, `PUT`/`DELETE /shop/equipped/:typeId`

- Kho trả vật phẩm đã mua, bản đồ `typeId → itemId` đang dùng, và `equippedBySlug` cho FE.
- Chọn dùng: phải sở hữu và đúng loại; `upsert` theo khoá chính `(user_id, type_id)`.
- Gỡ: xoá dòng đang dùng, không đụng kho.
- FE hiển thị các `slug` đã biết (`KnownItemSlug`), loại lạ có nhánh mặc định và không làm vỡ màn.

### 3.5 Ví — `GET /shop/wallet`

Không có bảng ví: số dư và lịch sử chính là `coin_transactions`.

- Bộ lọc Thu = `amount > 0`, Chi = `amount <= 0` (dòng 0 xu của vật phẩm miễn phí thuộc Chi).
- Tổng thu, tổng chi tính trên toàn lịch sử, không theo bộ lọc.
- Tên vật phẩm của dòng mua lấy từ `dedupe_key`, một truy vấn cho cả trang.

### 3.6 Ảnh vật phẩm — `GET /shop/items/:id/image` (công khai)

Mount trước nhánh có guard vì `<img>` không gửi được token. URL dạng
`/shop/items/<id>/image?v=<updated_at>` (dưới gốc API; FE tự ghép `API_BASE_URL`), cache một năm,
header `Cross-Origin-Resource-Policy: cross-origin`.

### 3.7 Khung viền ảnh đại diện — `shop.frame.ts`

`getEquippedFrameUrls(userIds)` trả URL khung đang đeo của **nhiều người trong một truy vấn**.
Tắt cờ `SHOP` thì trả rỗng — không ai thấy khung của ai. Khung là PNG vuông, tâm trong suốt, phóng
to `AVATAR_FRAME_SCALE = 1.3` lần so với ảnh đại diện; component `Avatar` là chỗ duy nhất vẽ khung.

### 3.8 Quản trị cửa hàng — `/admin/shop`

- CRUD loại và vật phẩm, tải/gỡ ảnh.
- **Không xoá được** loại còn vật phẩm, hay vật phẩm đã có người mua (`onDelete: Restrict`) — chỉ
  tắt `is_active`.
- Danh mục 20 linh vật nằm trong mã nguồn (`shop.catalog-data.ts`) và tự nạp khi deploy
  (`startCommand` chạy `seed-shop --soft`); không ghi đè vật phẩm quản trị viên đã sửa.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `rewards` | dùng chung | `coin_transactions` | Rewards sinh xu, Shop tiêu xu; cùng quy ước khoá dòng |
| `community` | được gọi | `getEquippedFrameUrls` | Khung của tác giả bài, bình luận (cả bảng tin nhóm) |
| `leaderboard` | được gọi | `getEquippedFrameUrls` | Khung trong bảng xếp hạng |
| `groups` | được gọi | `getEquippedFrameUrls` | Khung ở danh sách thành viên |
| `admin` | được gọi | `imageUrlFor`, `admin-shop.service` | Soạn danh mục; khung ở chi tiết nhóm quản trị |
| `feature-flags` | gọi đi / bị chặn | `isEnabled(SHOP)`, `requireFeature(SHOP)` | |
| `activity-logs` | **cố ý không liên kết** | | Mua hàng không phải hoạt động học |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Mua vật phẩm | Số dư giảm (thanh trên cùng, `/wallet`, khả năng mua vật phẩm giữ chuỗi ở khu phần thưởng). FE làm mới `shopKeys` và `rewardsKeys` |
| Đổi / gỡ vật phẩm đang dùng | Với khung viền: người khác thấy khung mới ở Cộng đồng, Bảng xếp hạng, Nhóm. FE làm mới `communityKeys`, `leaderboardKeys`, `groupKeys` |
| Admin ngừng bán | Món biến khỏi cửa hàng; người đã mua vẫn giữ, vẫn dùng |
| Admin đổi giá | Chỉ ảnh hưởng lần mua sau; lịch sử ví đọc `price_paid` nên không đổi |
| Tắt `SHOP` (hoặc `REWARDS`) | Ba màn 404; khung viền của mọi người ẩn; dữ liệu giữ nguyên, bật lại là hiện lại |

## 6. Quy tắc bắt buộc giữ khi sửa

1. Không ghi `ActivityLog`, không cộng XP.
2. Trừ xu là ghi một dòng âm; số dư luôn là `SUM(amount)`.
3. Kiểm số dư và ghi trong transaction có khoá dòng `users`.
4. "Mỗi loại một vật phẩm" ép bằng khoá chính, không xoá-rồi-ghi trong service.
5. Không xoá thứ người dùng đã trả xu.
6. Khung của người khác chỉ lấy qua `getEquippedFrameUrls`, theo lô cho cả trang.
7. Danh mục cửa hàng nằm trong `src/` để được biên dịch vào `dist`.

## 7. Điểm cần lưu ý

- Hai bản `getCoinBalance` giống hệt nhau ở `rewards.service` và `shop.service`; sửa một bên phải
  nhớ sửa bên kia (hoặc gom về một chỗ).
