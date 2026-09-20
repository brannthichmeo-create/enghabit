# Việc cần làm (module `todos`)

Danh sách việc trong ngày của người học, mở được từ thanh điều hướng (trang riêng) và từ
thanh trên cùng (bảng thả xuống, không rời màn hình đang mở).

Đọc file này trước khi sửa module `be/src/modules/todos` hoặc `fe/src/features/todos`.

## Vấn đề cần giải quyết

Người học đang làm dở một việc — học một bộ thẻ, đọc một bài — thì nhớ ra một việc khác
phải làm hôm nay. Hai lối thoát hiện có đều dở: ghi ra giấy thì lát nữa quên mất, còn tạo
một `Habit` thì sai hẳn ý nghĩa (thói quen là việc LẶP LẠI có lịch, không phải việc vặt
làm một lần).

Vì vậy tính năng này phải đạt hai điều cùng lúc:

1. Ghi và đánh dấu xong được **mà không rời màn hình đang mở**.
2. Cái thấy trên thanh trên cùng và cái thấy ở trang `/todos` **luôn là một**.

## Ranh giới với `habits` — quyết định quan trọng nhất

| | `habits` | `todos` |
|---|---|---|
| Ý nghĩa | Việc lặp lại theo lịch | Việc vặt của một ngày |
| Ghi `ActivityLog` | **Có** | **Không** |
| Ảnh hưởng streak / XP | Có | Không |
| Vòng đời | Sống lâu dài, có tần suất | Xong là xoá được |

**Module `todos` không ghi `ActivityLog` ở bất kỳ đâu.** Đây là cùng một luật với module
`rewards`, và lý do cũng y hệt: nếu bấm tích một dòng mà nối được chuỗi ngày, thì gõ
"abc" rồi bấm tích là đủ giữ streak vô hạn mà không học chữ nào — và mọi con số thống kê
học tập sau đó đều nói dối.

Hệ quả: **không thêm "việc lặp lại" vào module này.** Việc lặp theo lịch đã là `Habit`.
Dựng thêm cơ chế lặp thứ hai là hai chỗ cùng nhắc người dùng làm một chuyện, và người
dùng sẽ không hiểu tại sao có hai danh sách.

## Dữ liệu

Một bảng `todos`, không có bảng phụ.

| Cột | Ghi chú |
|---|---|
| `user_id` | Việc cần làm là ghi chú riêng tư. Mọi truy vấn lọc `userId` ngay trong câu lệnh, không có endpoint nào đọc việc của người khác. |
| `title` | `VARCHAR(200)`. |
| `local_date` | Kiểu `DATE`, là ngày việc thuộc về theo timezone user. Cùng quy ước với `ActivityLog.local_date`: **không convert timezone trong SQL**. |
| `is_done` | |
| `done_at` | Mốc UTC, do **backend** đặt. Client gửi lên thì đồng hồ máy người dùng sai là dữ liệu sai theo. Chỉ để hiển thị — không ai tính thống kê từ cột này. |

Hai chỉ mục: `(user_id, local_date)` cho danh sách một ngày, và
`(user_id, is_done, local_date)` cho truy vấn việc quá hạn.

Trần `MAX_TODOS_PER_DAY = 50` (ở `shared/src/schemas/todo.schema.ts`) để một vòng lặp gọi
API không bơm được vạn dòng vào DB.

## API

Mount ở `app.ts`: `requireAuth` → `requireFeature(FeatureKey.TODO)` → router, và router tự
chặn `requireRole(UserRole.USER)` — quản trị viên không có việc cần làm trong ngày.

| Endpoint | Việc |
|---|---|
| `GET /todos?date=` | Danh sách một ngày. Bỏ trống `date` = hôm nay theo timezone user. |
| `POST /todos` | Thêm việc. |
| `PATCH /todos/:id` | Đổi tên, bấm tích, hoặc **dời sang ngày khác** (`date`). |
| `DELETE /todos/done?date=` | Xoá mọi việc đã xong của một ngày. |
| `DELETE /todos/:id` | Xoá một việc. |

`DELETE /todos/done` **bắt buộc khai trước `DELETE /todos/:id`** trong `todo.routes.ts`:
Express khớp theo thứ tự khai báo, đặt sau thì nó rơi vào nhánh `/:id` với id = `"done"`
và người dùng nhận lỗi "ID không hợp lệ" cho một nút hoàn toàn hợp lệ.

Không có endpoint "đếm việc còn lại" riêng. Huy hiệu trên sidebar và trên thanh trên cùng
đọc thẳng từ danh sách đã tải — xem mục dưới.

### `GET /todos` trả kèm việc quá hạn

```
{ date, items: TodoRow[], overdue: TodoRow[] }
```

`overdue` là việc **chưa xong của các ngày trước `date`**, tối đa `MAX_OVERDUE_TODOS = 20`,
và **chỉ có giá trị khi `date` là hôm nay**. Hai lý do:

- Không có khối này thì việc quên làm hôm qua biến mất lặng lẽ lúc sang ngày mới. Người
  dùng chỉ phát hiện khi đã muộn.
- Lật về một ngày trong quá khứ thì "quá hạn so với ngày đó" là khái niệm không ai cần —
  người dùng mở ngày cũ để xem lại mình đã làm gì, không phải để dọn nợ.

Ở giao diện, việc quá hạn nằm trong **thẻ riêng**, không trộn vào danh sách hôm nay: nó
thuộc ngày khác, trộn vào rồi bấm xong sẽ ghi nhận nhầm ngày. Dời sang hôm nay là thao
tác có chủ đích nên có nút riêng (`PATCH` với `date` = hôm nay).

## Frontend — ba chỗ hiện, một ô cache

Trang `/todos`, bảng thả xuống trên thanh trên cùng và huy hiệu trên sidebar dùng **cùng
một khoá** `todoKeys.day(today)`.

Đây là toàn bộ cơ chế "đồng bộ đồng thời": ba component **không giữ state riêng rồi đồng
bộ với nhau** — chúng đọc chung một ô cache của TanStack Query, nên chúng không thể lệch.
Bấm tích ở bảng thả xuống là trang phía sau đổi theo ngay, và ngược lại. Ba chỗ cũng chỉ
tốn **một** request.

Khác chuông thông báo ở một điểm: chuông chỉ tải nội dung khi người dùng mở nó, còn ở đây
danh sách tải sẵn vì chính nó là nguồn của con số trên huy hiệu. Một ngày tối đa 50 dòng
chữ ngắn nên không đáng tách thêm một endpoint đếm riêng.

Bốn điều khác cần giữ:

- **`TodoItem` là component dùng chung cho cả trang lẫn bảng thả xuống.** Nhờ vậy ô tích
  nằm đúng một chỗ và chữ gạch ngang theo đúng một luật. Bảng thả xuống chỉ truyền
  `compact` để bỏ nút sửa/xoá — vào trang để làm những việc đó.
- **Bấm tích cập nhật lạc quan** (`useUpdateTodo`), và vá vào **mọi** ngày đang có trong
  cache: một việc quá hạn nằm đồng thời ở khối `overdue` của hôm nay và ở `items` của ngày
  nó thuộc về. Hỏng thì `onError` trả cache về đúng như trước khi bấm.
- **Danh sách KHÔNG đẩy việc đã xong xuống cuối.** Danh sách nhảy chỗ ngay lúc vừa bấm
  tích khiến người dùng mất dấu mình đang ở đâu và bấm nhầm dòng kế tiếp. Việc đã xong chỉ
  đổi cách hiển thị.
- **Ô thêm việc chỉ tự trống khi server đã nhận.** Trống ngay lúc bấm rồi request hỏng là
  người dùng mất luôn câu vừa gõ.

## Cờ tính năng

`FeatureKey.TODO`, nhãn **Việc cần làm**, route `/todos`. Không `dependsOn` gì cả: dù
trông giống `habits`, hai tính năng độc lập — tắt cái này không được kéo theo cái kia.

Tắt thì mục biến mất khỏi sidebar, nút trên thanh trên cùng biến mất, gõ thẳng `/todos` ra
404, và API trả 404 (`requireFeature`). Bật lại là mọi việc đã ghi còn nguyên — không dọn
dữ liệu khi tắt.
