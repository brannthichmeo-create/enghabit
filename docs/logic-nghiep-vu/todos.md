# Module `todos` — Việc cần làm trong ngày

> **Mã nguồn:** `be/src/modules/todos/todo.service.ts`, `shared/src/schemas/todo.schema.ts`
> **Màn hình:** `/todos`; bảng thả xuống trên thanh trên cùng; huy hiệu trên sidebar
> **Cờ tính năng:** `TODO` (không phụ thuộc `HABITS`) · **Quyền:** chỉ `USER`
> **Đặc tả chi tiết:** `docs/ke-hoach-viec-can-lam.md`

## 1. Vai trò

Sổ tay việc vặt trong ngày của người học: ghi, đánh dấu xong, dời ngày, dọn việc đã xong. Đây
là module **cô lập nhất** hệ thống: không gọi module nào khác, không ghi `ActivityLog`, không
sinh thông báo.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `todos` | Ghi | `title` (≤ 200 ký tự), `local_date` (ngày việc thuộc về), `is_done`, `done_at` (do BE đặt) |

Không có bảng nào khác đọc `todos`. Không có endpoint đọc việc của người khác.

## 3. Chức năng và cách hoạt động

### 3.1 Danh sách — `GET /todos?date=`

1. Ngày mặc định là hôm nay theo múi giờ người học.
2. Trả các việc của ngày đó theo `created_at` tăng dần — **không** đẩy việc đã xong xuống cuối
   (danh sách nhảy chỗ lúc bấm tích làm người dùng bấm nhầm dòng kế tiếp).
3. Chỉ khi đang xem **hôm nay**: kèm khối `overdue` — việc chưa xong của các ngày trước, tối đa
   20 việc, ngày gần nhất lên đầu. Thiếu khối này thì việc quên làm hôm qua biến mất lặng lẽ.

### 3.2 Thêm — `POST /todos`

Tối đa **50 việc mỗi ngày** (`MAX_TODOS_PER_DAY`).

### 3.3 Sửa — `PATCH /todos/:id`

Sửa tên, đánh dấu xong/chưa xong, hoặc dời sang ngày khác. `done_at` do BE đặt: chuyển sang xong
thì `now()`, bỏ xong thì `null`; bấm "xong" lần nữa khi đã xong **không** làm mới mốc.

### 3.4 Xoá — `DELETE /todos/:id`, `DELETE /todos/done?date=`

Xoá một việc, hoặc xoá mọi việc đã xong của một ngày. Route `/done` phải khai báo **trước**
`/:id` — Express khớp theo thứ tự, đặt sau thì `done` bị hiểu là id.

### 3.5 Đồng bộ ba chỗ hiển thị (FE)

Trang `/todos`, bảng thả xuống và huy hiệu sidebar dùng **chung một khoá cache**
`todoKeys.day(today)`. Ba chỗ đọc chung một ô cache nên không thể lệch và chỉ tốn một request.

## 4. Liên kết với module khác

| Module | Chiều | Nội dung |
| --- | --- | --- |
| `feature-flags` | bị chặn | `requireFeature(TODO)` |
| `auth` | dùng dữ liệu | `users.timezone` để tính "hôm nay" |
| `activity-logs` | **cố ý không liên kết** | Bấm tích một dòng không phải hoạt động học |
| `habits` | **cố ý không liên kết** | Việc lặp theo lịch là `habits`; không thêm "việc lặp lại" ở đây |

## 5. Ảnh hưởng dây chuyền

Không có. Tạo, xong, xoá một việc không đổi chuỗi ngày, XP, nhiệm vụ, mục tiêu, thống kê hay
nhắc nhở. Xoá tài khoản cascade xoá `todos`.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Không ghi `ActivityLog` ở bất kỳ đâu trong module — gõ "abc" rồi bấm tích không được giữ chuỗi.
2. Không thêm việc lặp lại.
3. Ba chỗ hiển thị dùng chung `todoKeys.day(today)`; không tách endpoint đếm riêng cho huy hiệu.
4. `GET /todos` trả kèm `overdue` khi xem hôm nay, hiển thị trong thẻ riêng.
5. `DELETE /todos/done` khai báo trước `DELETE /todos/:id`.

## 7. Điểm cần lưu ý

- Bộ tài liệu use case ở `docs/use-case/` sinh trước khi có module này nên chưa có Việc cần làm.
