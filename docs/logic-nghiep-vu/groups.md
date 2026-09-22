# Module `groups` — Nhóm lớp

> **Mã nguồn:** `be/src/modules/groups/group.service.ts`, `shared/src/schemas/group.schema.ts`
> **Màn hình:** `/groups` (tab Nhóm của tôi, Khám phá, Chờ duyệt — tab nằm trên URL `?tab=`),
> `/groups/:id` (Bảng tin, Tài liệu nhóm, Flashcard, Thành viên, Yêu cầu, Cài đặt)
> **Cờ tính năng:** `GROUPS`, phụ thuộc `COMMUNITY`
> **Quyền:** FE chỉ cho `USER` (guard `Learner`); quyền chi tiết theo **vai trò trong từng nhóm**
> (`LEADER` / `MEMBER`). Quản trị viên dùng `/admin/groups`

## 1. Vai trò

Không gian trao đổi nội bộ do người học tự lập, tách khỏi diễn đàn chung. Nhóm gom ba thứ của
module khác lại một chỗ: bảng tin (bài của `community` có `group_id`), tài liệu (tệp đính kèm của
các bài đó) và bộ thẻ trưởng nhóm chia sẻ (bộ của `library`).

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `groups` | Ghi | `code` 8 chữ số unique; `visibility` PUBLIC/PRIVATE; `require_approval`; `blocked_at`, `blocked_reason` do admin đặt |
| `group_members` | Ghi | `role` LEADER/MEMBER; `@@unique([groupId, userId])` |
| `group_join_requests` | Ghi | **Một dòng cho mỗi cặp (nhóm, người)**; xin lại thì cập nhật chính dòng đó. `reject_reason` bắt buộc khi từ chối |
| `group_study_sets` | Ghi | Chỉ là liên kết mở quyền đọc, **không nhân bản** bộ thẻ. `@@unique([groupId, topicId])` |
| `posts`, `post_attachments` | Đọc | Tài liệu nhóm |
| `topics` | Đọc | Bộ thẻ để chia sẻ (chỉ bộ của chính trưởng nhóm) |
| `activity_logs`, `user_streaks` | Đọc | Số hoạt động và chuỗi ở danh sách thành viên |

## 3. Chức năng và cách hoạt động

### 3.1 Tạo nhóm — `POST /groups`

Sinh mã 8 chữ số bằng `randomInt` của `node:crypto` (thử tối đa 5 lần nếu trùng). Tạo nhóm và
thêm người tạo làm **trưởng nhóm** trong cùng một lệnh.

### 3.2 Tìm và vào nhóm

| Endpoint | Quy tắc |
| --- | --- |
| `GET /groups/search` | Chỉ nhóm `PUBLIC`, **chưa bị chặn**, tìm theo tên |
| `GET /groups/code/:code` | Tìm bằng mã — cách **duy nhất** vào nhóm riêng tư |
| `POST /groups/:id/join` | Nhóm bị chặn → 403. Đã là thành viên → trả trạng thái. Nhóm **tắt** phê duyệt → vào thẳng. Nhóm **bật** phê duyệt → upsert yêu cầu về `PENDING` (xoá lý do cũ), báo mọi trưởng nhóm `GROUP_JOIN_REQUEST` |
| `GET /groups/mine/requests` | Tab Chờ duyệt: yêu cầu đang chờ và bị từ chối (kèm lý do), trừ nhóm mình đã là thành viên |

Mã nhóm chỉ hiện **bên trong** trang nhóm, không hiện trên thẻ ở danh sách.

### 3.3 Trưởng nhóm duyệt — `POST /groups/:id/requests/:userId/approve|reject`

1. Chỉ trưởng nhóm. Từ chối **bắt buộc có lý do**.
2. `updateMany` có điều kiện `status = PENDING` — hai trưởng nhóm bấm cùng lúc thì một người nhận 404.
3. Duyệt → `addMemberRecord` (`createMany … skipDuplicates`, đồng thời khép mọi yêu cầu cũ của người đó).
4. Thông báo cho người xin: `GROUP_JOIN_APPROVED` (link vào nhóm) hoặc `GROUP_JOIN_REJECTED`
   (link tới `/groups?tab=pending`, nơi có lý do và nút xin lại).

### 3.4 Quản lý thành viên — chỉ trưởng nhóm

| Endpoint | Quy tắc |
| --- | --- |
| `POST /groups/:id/members` | Thêm thẳng bằng tên tài khoản hoặc email; báo người được thêm |
| `PATCH /groups/:id/members/:userId/role` | Phong / hạ trưởng nhóm. Một nhóm có thể có nhiều trưởng nhóm |
| `DELETE /groups/:id/members/:userId` | Xoá thành viên và xoá luôn yêu cầu cũ để họ xin lại được từ đầu |
| `POST /groups/:id/leave` | Ai cũng rời được |

**Nhóm luôn còn ít nhất một trưởng nhóm:** `assertNotLastLeader` chặn hạ quyền, rời nhóm hoặc
bị xoá khi đó là trưởng nhóm cuối cùng.

### 3.5 Sửa, xoá nhóm — `PATCH`/`DELETE /groups/:id`

Chỉ trưởng nhóm. Sửa bị chặn khi nhóm đang bị chặn. Xoá nhóm cascade thành viên, yêu cầu, bài
đăng (kèm tệp), liên kết bộ thẻ.

### 3.6 Tài liệu nhóm — `GET /groups/:id/documents`

Không có bảng riêng, không có đường tải lên riêng: liệt kê `post_attachments` của các bài có
`group_id` này (không kéo cột `data`), mới nhất trước, tìm theo tên tệp. Tải về qua
`/community/attachments/:id` — nơi đã kiểm tư cách thành viên.

### 3.7 Bộ thẻ trong nhóm — `GET`/`POST /groups/:id/study-sets`, `DELETE …/:setId`

- Mọi thành viên xem; chỉ trưởng nhóm chia sẻ và gỡ; nhóm bị chặn thì không chia sẻ/gỡ được.
- Chỉ chia sẻ được bộ **của chính mình** (kể cả riêng tư), bộ đó không đang bị chặn.
- Chia sẻ tạo một dòng `group_study_sets` và báo mọi thành viên `GROUP_STUDY_SET_SHARED`.
- Quyền đọc bộ được mở ở **đúng một chỗ**: nhánh thứ ba của `readableSetWhere` (`library.access.ts`).
- Gỡ chia sẻ **không xoá tiến độ** — chia sẻ lại là học tiếp.

### 3.8 Đề cập — `GET /groups/:id/mentions`

Danh sách thành viên làm ứng viên cho ô gợi ý `@`. `community.mention.service` dùng lại đúng hàm
này để chấm lại lúc gửi thông báo, nên ô gợi ý và người thật sự được báo không thể lệch.

### 3.9 Nhóm bị chặn (do quản trị viên)

`isMember` trả **false với mọi người**, kể cả trưởng nhóm → bài, bình luận, tim, tệp, tài liệu,
bộ thẻ chia sẻ đều khoá. Ngoài ra chặn riêng: sửa nhóm, xin vào, chia sẻ/gỡ bộ thẻ; nhóm biến khỏi
tìm kiếm. Thành viên vẫn mở được trang nhóm để **đọc lý do chặn** (viết cho người dùng cuối).

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `community` | được gọi | `isMember`, `listMentionTargets` | Bảng tin nhóm, đề cập |
| `community` | dùng | `posts`, `post_attachments` | Bảng tin và Tài liệu nhóm |
| `library` | mở quyền | `group_study_sets` → `readableSetWhere` | Thành viên đọc/học bộ được chia sẻ |
| `study` | gián tiếp | `readableSetWhere` | Học/Ôn tập bộ của nhóm ghi `ActivityLog` như mọi bộ khác |
| `notifications` | gọi đi | `createNotification` | `GROUP_JOIN_REQUEST`, `GROUP_JOIN_APPROVED`, `GROUP_JOIN_REJECTED`, `GROUP_STUDY_SET_SHARED` |
| `shop` | gọi đi | `getEquippedFrameUrls` | Khung viền ở danh sách thành viên |
| `admin` | bị tác động | `admin-group.service` | Xem, cảnh báo, chặn / mở chặn |
| `feature-flags` | bị chặn | `requireFeature(GROUPS)`; phụ thuộc `COMMUNITY` | |

## 5. Ảnh hưởng dây chuyền

| Hành động | Ảnh hưởng |
| --- | --- |
| Chia sẻ bộ thẻ | Mọi thành viên thấy bộ ở tab Flashcard, học được ở `/learn`, thẻ vào nhóm Ôn tập của họ sau khi bắt đầu học |
| Gỡ chia sẻ / rời nhóm / bị xoá khỏi nhóm | Người đó mất quyền đọc bộ (trừ khi bộ công khai) → thẻ rời Ôn tập, số thẻ tới hạn, lời nhắc; tiến độ giữ nguyên |
| Xoá nhóm | Mất toàn bộ bài và **tài liệu** nhóm; thành viên mất quyền đọc các bộ chia sẻ |
| Nhóm bị chặn | Khoá toàn bộ nội dung như trên, bật lại là trở lại như cũ |
| Tắt `COMMUNITY` | `GROUPS` tắt theo |

FE sau các thao tác nhóm làm mới cache `groups`, `community`, `library`, `study`.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Nhóm luôn còn ít nhất một trưởng nhóm.
2. Mã nhóm sinh bằng `node:crypto`, không `Math.random`; chỉ hiện bên trong nhóm.
3. Bài nhóm không lọt ra diễn đàn chung (bộ lọc nằm ở `community`).
4. Tài liệu nhóm không có bảng riêng; chia sẻ bộ thẻ không nhân bản.
5. Từ chối bắt buộc có lý do; xin lại xoá lý do cũ.
6. Tab của `/groups` nằm trên URL.

## 7. Điểm cần lưu ý (phát hiện khi rà soát)

- **Backend không chặn quản trị viên** ở `/groups/*`: router chỉ có `requireAuth`, không có
  `requireRole(USER)`. Giao diện chặn bằng guard `Learner`, nhưng token quản trị gọi thẳng API vẫn
  tạo và tham gia nhóm được — lệch với quy ước "quản trị viên không dùng khu nhóm".
- **Trưởng nhóm xoá được nhóm đang bị chặn** (`deleteGroup` chỉ kiểm `assertLeader`). Chặn là biện
  pháp đảo ngược được của quản trị viên, nhưng trưởng nhóm có thể xoá luôn bằng chứng vi phạm.
- Khi nhóm bị chặn, trưởng nhóm vẫn thêm thành viên, đổi vai trò, xoá thành viên và duyệt yêu cầu
  được (các hàm này không gọi `assertNotBlocked`). Cần xác nhận đây có phải chủ ý.
- Cột chuỗi ở danh sách thành viên đọc thẳng cache `user_streaks`, không qua `displayStreak`.
