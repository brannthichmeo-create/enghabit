# Module `community` — Diễn đàn Cộng đồng (và bảng tin nhóm)

> **Mã nguồn:** `be/src/modules/community/` (`community.service.ts`, `mention.service.ts`),
> `shared/src/attachment/`, `shared/src/mention/`, `shared/src/schemas/community.schema.ts`
> **Màn hình:** `/community`; tab Bảng tin và Tài liệu nhóm trong `/groups/:id`
> **Cờ tính năng:** `COMMUNITY`, có `adminBypass`. Tắt thì `GROUPS` tắt theo
> **Quyền:** **cả hai vai trò** (quản trị viên vào để trả lời và kiểm duyệt)

## 1. Vai trò

Diễn đàn hỏi đáp chung, đồng thời là **bảng tin của mọi nhóm lớp**: bài nhóm dùng lại đúng
module này chứ không có bảng bài viết thứ hai, nên tệp đính kèm, bình luận, thả tim chỉ có một
bản triển khai. Ranh giới giữa hai không gian là cột `posts.group_id`.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `posts` | Ghi | `group_id` null = bài chung; có giá trị = bài nội bộ nhóm. Nội dung là **văn bản thuần** |
| `post_comments` | Ghi | Phẳng, không lồng nhau |
| `post_likes` | Ghi | `@@unique([postId, userId])`; số tim = đếm dòng |
| `post_attachments` | Ghi | Tệp blob. Chỉ `getAttachmentContent` được đọc cột `data` |
| `group_members`, `groups` | Đọc (qua `groups.isMember`) | Kiểm tư cách thành viên với bài nhóm |

## 3. Chức năng và cách hoạt động

### 3.1 Danh sách — `GET /community/posts`

1. Có `groupId` → kiểm thành viên (không phải → **404**, không 403, để người ngoài không dò ra
   id nhóm riêng tư).
2. Điều kiện gốc: `group_id = query.groupId ?? null` — **dòng duy nhất** giữ bài nhóm không lọt ra
   diễn đàn chung.
3. Bộ lọc cộng dồn: bài của tôi, bài đã thích, có tệp, chưa ai trả lời, tìm theo tiêu đề/nội dung.
4. Sắp xếp: mới nhất, hoặc nhiều tim nhất; luôn có khoá phụ `id` để phân trang ổn định.
5. Không trả ảnh đại diện tác giả (tốn băng thông); trả cấp độ (`statistics.getLevelsFor`, bỏ qua
   quản trị viên) và khung viền (`shop.getEquippedFrameUrls`) — một truy vấn mỗi loại cho cả trang.

### 3.2 Chi tiết — `GET /community/posts/:id`

Kiểm thành viên nếu là bài nhóm — chặn cả đường vào thẳng bằng id. Trả toàn bộ bình luận.

### 3.3 Đăng bài — `POST /community/posts`

1. Bài nhóm → kiểm thành viên.
2. Tối đa **3 tệp**, mỗi tệp **900 KB**; chỉ JPEG, PNG, WebP, GIF, PDF, TXT (`shared/attachment`).
   BE kiểm lại dù FE đã kiểm; tên tệp được làm sạch.
3. Transaction: ghi bài, rồi ghi **từng tệp một** (gộp một câu INSERT nhiều tệp vượt
   `max_allowed_packet` 1 MB của MySQL).
4. Sau khi lưu: `notifyMentions` (mục 3.6).
5. Nhánh `/api/v1/community` có trần thân request 5 MB (base64 làm phình ~33%).

### 3.4 Bình luận, thả tim, xoá

| Endpoint | Quy tắc |
| --- | --- |
| `POST /community/posts/:id/comments` | Kiểm thành viên nếu bài nhóm; gửi thông báo đề cập |
| `POST /community/posts/:id/like` | **Đảo trạng thái**; trùng unique coi như thành công |
| `DELETE /community/posts/:id`, `/comments/:id` | Tác giả hoặc **quản trị viên**. Xoá bài cascade bình luận, tim, tệp. Quản trị viên xoá nội dung **của người khác** (`isModeration`) thì ghi `POST_DELETED` / `COMMENT_DELETED` vào nhật ký thao tác trong cùng transaction; tự xoá bài của mình thì không |

### 3.5 Tải tệp — `GET /community/attachments/:id`

Chỗ **duy nhất** đọc cột `data`. Kiểm thành viên nếu tệp thuộc bài nhóm. `Content-Type` lấy từ
giá trị đã lưu (đã qua danh sách trắng), không bao giờ từ client. FE tải bằng fetch kèm token.

### 3.6 Đề cập `@` — `mention.service.ts`

1. Chỉ áp dụng cho bài / bình luận **trong nhóm**.
2. **BE tự tách** người được nhắc từ nội dung (tiêu đề + nội dung với bài) bằng `matchMentions`
   của `shared/mention` — cùng hàm FE dùng cho ô gợi ý. Không nhận danh sách từ FE.
3. Ứng viên = thành viên nhóm (`groups.listMentionTargets`); `@all` = cả nhóm; không nhắc chính mình.
4. Tạo `MENTIONED` cho từng người, khoá `MENTIONED:POST:<postId>:<userId>` hoặc
   `MENTIONED:COMMENT:<commentId>:<userId>`; link dẫn tới trang nhóm.
5. Lỗi ở bước này **chỉ ghi log** — bài đã lưu, không được báo "đăng thất bại".

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `groups` | gọi đi | `isMember`, `listMentionTargets` | Quyền đọc/ghi bài nhóm; ứng viên đề cập |
| `groups` | được dùng | `post_attachments` của bài có `group_id` | Tab "Tài liệu nhóm" là chính các tệp này |
| `notifications` | gọi đi | `createNotification` | `MENTIONED` |
| `statistics` | gọi đi | `getLevelsFor` | Cấp độ cạnh tên tác giả |
| `shop` | gọi đi | `getEquippedFrameUrls` | Khung viền tác giả |
| `admin` | dùng | Quyền xoá mọi bài | Kiểm duyệt; `adminBypass` khi tắt cờ |
| `admin` | gọi đi | `recordAdminAction` | Nhật ký xoá bài / bình luận của người khác; quản trị viên xem ở tab Nhật ký của `/community` |
| `feature-flags` | bị chặn | `requireFeature(COMMUNITY, {adminBypass})`; `GROUPS` phụ thuộc `COMMUNITY` | |
| `activity-logs` | **cố ý không liên kết** | | Đăng bài không phải hoạt động học |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Đăng bài có tệp trong nhóm | Tệp xuất hiện ở tab Tài liệu nhóm; người được `@` nhận thông báo |
| Xoá bài | Mất bình luận, tim và **tệp** — tài liệu nhóm tương ứng biến mất |
| Nhóm bị chặn | `isMember` trả false với mọi người → bài, bình luận, tim, tệp của nhóm đều khoá |
| Tắt `COMMUNITY` | Người học mất diễn đàn **và** nhóm lớp mất bảng tin (cờ `GROUPS` tắt theo); quản trị viên vẫn vào được |

## 6. Quy tắc bắt buộc giữ khi sửa

1. Lọc `groupId: query.groupId ?? null` và kiểm thành viên ở **cả năm** lối: danh sách, chi tiết,
   bình luận, thả tim, tải tệp.
2. Không `select`/`include` cột `data` ngoài `getAttachmentContent`.
3. Nội dung là văn bản thuần; FE hiển thị bằng text node.
4. Khoá cache FE `communityKeys.list` phải chứa `groupId`.
5. Người được nhắc do BE tách từ nội dung; lỗi đề cập không làm hỏng việc đăng bài.

## 7. Điểm cần lưu ý

- Không có chức năng sửa bài hay bình luận; không có báo cáo bài vi phạm (quản trị viên chỉ xoá).
