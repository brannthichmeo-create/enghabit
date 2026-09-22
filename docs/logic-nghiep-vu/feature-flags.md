# Module `feature-flags` — Quản lý tính năng

> **Mã nguồn:** `be/src/modules/feature-flags/` (`feature.service.ts`, `feature.guard.ts`),
> `shared/src/constants/features.ts`, `be/src/app.ts` (chỗ gắn guard)
> **Màn hình:** `/admin/features`; phía người học không có màn riêng (ảnh hưởng sidebar và route)
> **Quyền:** đọc `GET /features` cho cả hai vai trò; ghi qua `/admin/features` chỉ `ADMIN`
> **Đặc tả chi tiết:** `docs/ke-hoach-quan-ly-tinh-nang.md`

## 1. Vai trò

Cho quản trị viên bật/tắt từng tính năng của người học. Tắt thì mục biến khỏi sidebar, gõ thẳng
URL ra trang 404, và API tương ứng trả 404. Đây là module **cắt ngang** gần như mọi module học tập.

## 2. Dữ liệu

| Nơi | Nội dung |
| --- | --- |
| `shared/src/constants/features.ts` | **Danh mục** tính năng (khoá, nhãn, mô tả, route, phụ thuộc) — nằm trong mã nguồn |
| Bảng `feature_flags` | Chỉ **trạng thái**: `key`, `is_enabled`, `updated_by_id`. **Thiếu dòng nghĩa là BẬT** |
| `activity_logs` | Đọc để đếm người dùng gần đây của từng tính năng |

## 3. Chức năng và cách hoạt động

### 3.1 Danh mục và phụ thuộc

| Khoá | Nhãn | Route bị khoá | Phụ thuộc |
| --- | --- | --- | --- |
| `VOCABULARY` | Thư viện | `/library` | — |
| `LEARN` | Học | `/learn` | `VOCABULARY` |
| `FLASHCARDS` | Ôn tập | `/review` | `VOCABULARY` |
| `HABITS` | Thói quen | `/habits` | — |
| `GOALS` | Mục tiêu | `/goals` | — |
| `TODO` | Việc cần làm | `/todos` | — (cố ý không phụ thuộc `HABITS`) |
| `REPORT` | Báo cáo | `/report` | — |
| `LEADERBOARD` | Bảng xếp hạng | `/leaderboard` | — |
| `COMMUNITY` | Cộng đồng | `/community` | — |
| `GROUPS` | Nhóm lớp | `/groups` | `COMMUNITY` |
| `REWARDS` | Phần thưởng | (nằm trong Tổng quan) | — |
| `SHOP` | Cửa hàng | `/shop`, `/wallet`, `/inventory` | `REWARDS` |

**Không có cờ:** `auth`, `admin`, `profile`, `notifications`, trang Tổng quan — tắt được là tự
khoá cửa.

### 3.2 Đọc trạng thái — `getFlags()`, `isEnabled(key)`

Đọc bảng, bắt đầu từ "mọi thứ bật", ghi đè bằng các dòng có khoá hợp lệ (khoá lạ còn sót bị bỏ
qua). Cache trong bộ nhớ **30 giây**; ghi thì xoá cache của tiến trình hiện tại ngay.

### 3.3 Guard — `requireFeature(key, {adminBypass?})`

Gắn ở chỗ mount router trong `app.ts`. Tắt → **404** (không phải 403): với người học, tính năng
tắt là không tồn tại.

| Nhánh API | Guard |
| --- | --- |
| `/goals`, `/habits`, `/todos`, `/rewards`, `/leaderboard`, `/groups` | Cờ tương ứng |
| `/library`, `/study` | `VOCABULARY`; bên trong `study` kiểm thêm `LEARN` / `FLASHCARDS` theo nguồn |
| `/shop` | `SHOP` (trừ route ảnh công khai) |
| `/community` | `COMMUNITY` với `adminBypass` |
| `/statistics/report` | `REPORT` (gắn trên đúng route này) |
| `/statistics` còn lại, `/topics`, `/admin`, `/auth`, `/notifications` | Không có |

Ngoài guard, ba chỗ tự hỏi cờ: `study` (theo nguồn), `shop.frame` (tắt `SHOP` thì ẩn khung viền
của mọi người), cron nhắc nhở (tắt `FLASHCARDS` thì không nhắc ôn thẻ; tắt `HABITS` thì bỏ cả lượt
nhắc theo giờ của thói quen).

### 3.4 Bật/tắt — `PATCH /admin/features/:key`

- **Tắt:** tắt lây toàn bộ cây phụ thuộc (đệ quy) trong một transaction, trả danh sách
  `alsoDisabled`.
- **Bật:** không bật lây; thiếu điều kiện thì 400 "Phải bật X trước khi bật tính năng này".
- Ghi `updated_by_id` để màn quản trị hiện ai đổi lần cuối, và **một** dòng nhật ký thao tác
  (`FEATURE_ENABLED` / `FEATURE_DISABLED`) cho cờ được bấm, kèm danh sách cờ bị tắt lây trong
  `changes`. Bấm vào công tắc đã ở đúng trạng thái thì không ghi. Xem ở tab Nhật ký của
  `/admin/features`.

### 3.5 Màn quản trị — `GET /admin/features`

Mỗi tính năng kèm: trạng thái, ai đổi và lúc nào, đang bị chặn bởi cờ nào, và **số người học có
hoạt động trong 7 ngày** (đếm từ `activity_logs`; tính năng không sinh hoạt động trả 0) để hộp
xác nhận tắt nói được "đang có N người dùng".

### 3.6 Ba mức dùng cờ ở FE

| Mức | Hàm | Khi chưa biết trạng thái |
| --- | --- | --- |
| Hiển thị | `useFeature` | Coi như BẬT (giao diện không nháy) |
| Gọi API | `useFeatureQueryEnabled` | CHỜ biết chắc |
| Chặn route | `Gated` | Chưa vẽ gì |

## 4. Liên kết với module khác

Mọi module học tập bị chặn bởi guard; `study`, `shop`, cron nhắc nhở gọi `isEnabled`; `admin`
cung cấp đường ghi. Xem bảng 3.3.

## 5. Ảnh hưởng dây chuyền

Tắt một tính năng **không** dọn `activity_logs`, không xoá `goals`/`habits`/`todos`, không tính
lại streak, không đụng sổ cái xu. Bật lại là người học thấy lại đúng chỗ đang dở. Ảnh hưởng cụ thể:

| Tắt | Hệ quả ngoài màn hình của chính nó |
| --- | --- |
| `VOCABULARY` | `LEARN`, `FLASHCARDS` tắt theo; số thẻ tới hạn không còn gọi; cron không nhắc ôn |
| `COMMUNITY` | `GROUPS` tắt theo (nhóm dùng chung bài đăng) |
| `REWARDS` | `SHOP` tắt theo → khung viền của mọi người ẩn |
| `SHOP` | Khung viền ẩn ở Cộng đồng, Bảng xếp hạng, Nhóm |
| `FLASHCARDS` | Lời nhắc hằng ngày không nhắc ôn thẻ, trỏ về `/` |

Với nhiều instance backend, tiến trình khác thấy thay đổi sau tối đa 30 giây.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Danh mục trong mã nguồn, trạng thái trong DB; thiếu dòng nghĩa là bật.
2. Guard trả 404, không 403.
3. Không thêm cờ cho `auth`, `admin`, `profile`, `notifications`, Tổng quan.
4. `/community` giữ `adminBypass`; `/topics` và `/admin/shop` không gắn cờ.
5. Tắt là đảo ngược được — không xoá hay tính lại dữ liệu.

## 7. Điểm cần lưu ý

- Job tiêu vật phẩm giữ chuỗi không kiểm cờ `REWARDS`; cảnh báo chuỗi không kiểm cờ `LEARN` trước
  khi trỏ link `/learn`; nhiệm vụ `DO_HABIT` vẫn hiện khi `HABITS` tắt.
