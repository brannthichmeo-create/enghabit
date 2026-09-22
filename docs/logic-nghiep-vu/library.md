# Module `library` (+ `topics`) — Thư viện bộ thẻ

> **Mã nguồn:** `be/src/modules/library/` (`library.service.ts`, `library.access.ts`),
> `be/src/modules/topics/` (bộ Hệ thống), `shared/src/schemas/study-set.schema.ts`,
> `shared/src/study/card-import.ts`
> **Màn hình:** `/library` (tab Khám phá, Của tôi), `/library/:id`; quản trị: `/admin/content`,
> `/admin/content/:id`
> **Cờ tính năng:** `VOCABULARY` (hiển thị là "Thư viện"). Tắt thì `LEARN` và `FLASHCARDS` tắt theo
> **Quyền:** `/library` chỉ `USER`; `/topics` chỉ `ADMIN`
> **Đặc tả chi tiết:** `docs/ke-hoach-hoc-on-flashcard.md`

## 1. Vai trò

Nơi chứa **nội dung học**: bộ thẻ và thẻ. Người học khám phá bộ công khai, tự soạn bộ riêng
(công khai hoặc riêng tư), nhập thẻ từ tệp và báo cáo bộ vi phạm. Module này cũng giữ
**định nghĩa duy nhất về quyền đọc bộ thẻ** mà `study` và cron nhắc nhở dùng lại.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `topics` | Ghi (bộ của người học) | **Bộ thẻ = `Topic`.** `owner_id` null là bộ **Hệ thống** do quản trị viên soạn; có giá trị là bộ người học. `visibility` PUBLIC/PRIVATE; `blocked_at`, `blocked_reason` do quản trị viên đặt |
| `vocabularies` | Ghi | **Thẻ = `Vocabulary`**: `word`, `meaning`, `phonetic`, `example` |
| `study_set_reports` | Ghi | Báo cáo vi phạm, `pending_key` unique chống báo cáo trùng |
| `user_vocab_progress` | Đọc | Tiến độ từng thẻ để hiện ở trang chi tiết |
| `group_study_sets`, `group_members`, `groups` | Đọc | Nhánh quyền "được chia sẻ vào nhóm" |

`created_by_id` giữ nghĩa cũ (ai bấm tạo) và **không** dùng để hiển thị tác giả — tác giả là
`owner_id`.

## 3. Chức năng và cách hoạt động

### 3.1 Quyền đọc bộ thẻ — `library.access.ts`

Ba điều kiện, gộp bằng `OR` trong `readableSetWhere(userId)`:

1. **Của chính mình** — kể cả riêng tư hoặc đang bị chặn (chủ cần thấy lý do để sửa).
2. **Công khai hợp lệ** (`publicSetWhere`): `PUBLIC`, chưa bị chặn, và chủ còn `ACTIVE`
   (bộ Hệ thống không có chủ nên luôn thoả).
3. **Được chia sẻ vào một nhóm mình là thành viên**, nhóm đó chưa bị chặn, bộ chưa bị chặn.

Điều kiện nằm **ngay trong câu truy vấn**, không lọc ở FE. Người không có quyền nhận **404**,
không nhận 403 — với họ, bộ riêng tư không tồn tại. Các hàm tiện ích: `findReadableSet`,
`findOwnedSet` (chỉ chủ), `startedSetWhere` (bộ đã bắt đầu học).

### 3.2 Khám phá và Của tôi

| Endpoint | Cách làm |
| --- | --- |
| `GET /library/sets` | Chỉ `publicSetWhere`, bỏ bộ chưa có thẻ; tìm theo tên/mô tả; xếp theo số thẻ giảm dần rồi mới cập nhật |
| `GET /library/sets/mine` | Mọi bộ `owner_id = mình`, kể cả riêng tư và bị chặn |
| `GET /library/sets/:id` | Kiểm `findReadableSet` → trả thẻ, tiến độ (`summarizeProgress` của `study`: mới / tới hạn / quá hạn / yếu / đã thuộc), `canMultipleChoice` (≥ 4 thẻ), `hasPendingReport` |

### 3.3 Soạn bộ thẻ — chỉ chủ bộ

| Endpoint | Quy tắc |
| --- | --- |
| `POST /library/sets` | Tạo bộ, `owner_id = created_by_id = mình` |
| `PATCH /library/sets/:id` | Sửa tên, mô tả, cấp độ, **đổi PUBLIC ↔ PRIVATE**. Chuyển riêng tư không cần dọn gì: truy vấn của người khác đã lọc qua `readableSetWhere`, tiến độ của họ giữ nguyên |
| `DELETE /library/sets/:id` | Cascade xoá thẻ, `user_vocab_progress`, `card_reviews`, báo cáo, liên kết chia sẻ nhóm. **`activity_logs` giữ nguyên** (không có FK) |
| `POST /library/sets/:id/cards`, `PATCH`/`DELETE /library/cards/:id` | Thêm, sửa, xoá thẻ. Xoá thẻ cascade tiến độ và lịch sử của mọi người học thẻ đó |

### 3.4 Nhập thẻ từ tệp

- FE đọc tệp (CSV/Excel qua `read-excel-file`), tách thẻ và cho xem trước; giới hạn 500 dòng,
  tệp 2 MB (`CARD_IMPORT_MAX_ROWS`, `CARD_IMPORT_MAX_FILE_BYTES`).
- `POST /library/sets/import` tạo bộ mới + thẻ trong **một transaction** (lỗi giữa chừng không
  để lại bộ rỗng). `POST /library/sets/:id/cards/import` thêm vào bộ có sẵn.
- BE **chống trùng lại** bằng `cardImportKey(word, meaning)` dùng chung với FE: bỏ thẻ trùng
  thẻ đã có và trùng nhau trong cùng lần nhập; trả `{created, skipped}`.
- Hai route này có trần thân request riêng 3 MB (khai báo ở `app.ts`).

### 3.5 Báo cáo vi phạm — `POST /library/sets/:id/reports`

1. Chỉ báo cáo được bộ **công khai hợp lệ**; không báo cáo bộ của chính mình; bộ Hệ thống
   không nhận báo cáo.
2. Ghi `study_set_reports` với `pending_key = "<setId>:<reporterId>"`. Trùng khoá → 409 "đã báo
   cáo, đang xem xét".
3. Báo mọi quản trị viên `ACTIVE`: `STUDY_SET_REPORTED`, khoá `STUDY_SET_REPORTED:<reportId>`.
4. Quản trị viên xử lý ở `/admin/study-sets` (xem `admin.md`).

### 3.6 Bộ Hệ thống — module `topics` + `admin`

- `GET /topics`, `/topics/:id`, `/topics/:id/vocabulary` chỉ cho `ADMIN`, chỉ trả bộ `owner_id` null.
- Ghi qua `/admin/topics` và `/admin/vocabulary` (`assertSystemTopic`, `assertSystemVocabulary`).
  Mỗi lần tạo, sửa, xoá ghi một dòng nhật ký thao tác trong cùng transaction (xem `admin.md`).
- Bộ Hệ thống **luôn công khai**: `createTopic` ghi `visibility = PUBLIC` tường minh, biểu mẫu
  phía quản trị không có lựa chọn chế độ. Mô tả để trống lưu là `null`.
- Giao diện `/admin/content` và `/admin/content/:id` **dùng lại thành phần của Thư viện**
  (`StudySetCard`, `StudySetFormDialog` với `publicOnly`, `CardFormView`) — quản trị viên thấy bộ
  thẻ đúng như người học thấy ở tab Khám phá. Sửa ở đây là bên người học đổi theo ngay, vì cùng
  một dòng `topics`, không có bản sao nào để đồng bộ.
- Quản trị viên **không sửa được** bộ người học; xử lý vi phạm bằng chặn.
- `/topics` không chịu cờ nào: tắt Thư viện không được làm quản trị viên mất chỗ soạn nội dung.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `study` | được dùng | `readableSetWhere`, `findReadableSet`, `startedSetWhere` | Phát đề, chấm, đếm thẻ tới hạn, lịch sử — tất cả lọc qua quyền này |
| `study` | gọi đi | `summarizeProgress` | Tiến độ trên trang chi tiết bộ |
| `groups` | bị đọc / đọc | `group_study_sets` | Nhánh quyền thứ ba; trưởng nhóm chia sẻ bộ của mình vào nhóm |
| `notifications` | gọi đi | `createNotification` | `STUDY_SET_REPORTED` cho admin |
| `admin` (kiểm duyệt) | bị tác động | `topics.blocked_at`, `study_set_reports` | Chặn / mở chặn, bỏ qua báo cáo |
| `admin` (nội dung) | cùng bảng | `topics` với `owner_id` null | Bộ Hệ thống |
| `auth` / `admin` | bị tác động | `users.status` | Chủ bị khoá thì bộ công khai của họ biến khỏi Khám phá |
| Cron nhắc nhở | gián tiếp | `study.countDueCards` | Chỉ đếm thẻ của bộ còn đọc được |
| `feature-flags` | bị chặn | `requireFeature(VOCABULARY)` ở `/library` và `/study` | |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Chuyển bộ sang riêng tư | Người khác mất bộ khỏi Khám phá, Ôn tập, số thẻ tới hạn, lịch sử ôn, lời nhắc — ở lần đọc kế tiếp. Tiến độ của họ **giữ nguyên**, mở lại là học tiếp |
| Xoá bộ / xoá thẻ | Mất vĩnh viễn tiến độ SRS và lịch sử `card_reviews` của **mọi** người học bộ đó; XP và chuỗi không đổi (vì `activity_logs` giữ nguyên) |
| Bộ bị chặn | Như chuyển riêng tư với mọi người trừ chủ; nhóm đang chia sẻ bộ đó cũng ẩn nó |
| Chủ bị khoá tài khoản | Bộ công khai của họ biến khỏi Khám phá; thành viên nhóm được chia sẻ vẫn đọc được (nhánh 3 không lọc trạng thái chủ) |
| Tắt `VOCABULARY` | `/library`, `/study`, Học và Ôn tập trả 404; dữ liệu giữ nguyên |

## 6. Quy tắc bắt buộc giữ khi sửa

1. Mọi truy vấn bộ thẻ/thẻ của người học phải lọc qua `readableSetWhere` **trong câu truy vấn**.
2. Không có quyền → 404, không phải 403.
3. Không dựng bảng StudySet/Flashcard riêng — bộ thẻ là `topics`, thẻ là `vocabularies`.
4. Chống báo cáo trùng bằng unique `pending_key`, không đọc-rồi-ghi.
5. Bộ Hệ thống không nhận báo cáo và không bị chặn.

## 7. Điểm cần lưu ý

- Xoá một thẻ đang được nhiều người học là thao tác phá huỷ lặng lẽ: không có xác nhận phía BE
  về số người bị ảnh hưởng.
- Nhánh quyền "chia sẻ vào nhóm" không lọc trạng thái khoá của chủ bộ, khác nhánh công khai.
  Nếu muốn khoá tài khoản ẩn luôn nội dung trong nhóm thì phải thêm điều kiện ở `groupSharedSetWhere`.
