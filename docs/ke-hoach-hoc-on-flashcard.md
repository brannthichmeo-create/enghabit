# Đặc tả: Thư viện bộ thẻ, Học và Ôn tập

> Bản đặc tả đã chốt cho hệ thống học bằng flashcard, dựng lại thay cho module `lessons`
> đã gỡ ngày 12/09/2026.
>
> Nguồn: prompt "Xây dựng hệ thống Học tập, Ôn tập và Khám phá Flashcard", đã đối chiếu
> với mã nguồn và sửa các chỗ giả định sai. Mọi quyết định dưới đây đã được xác nhận qua
> sáu đợt câu hỏi ngày 15/09/2026.
>
> **Thay thế** `docs/ke-hoach-module-hoc-tap.md` ở các điểm mâu thuẫn (xem mục 11).
>
> Tài liệu này chỉ mô tả **cái gì** và **vì sao**. Kế hoạch triển khai theo phase chưa lập.

---

## 1. Phạm vi

### 1.1 Làm

| # | Tính năng |
|---|---|
| F1 | Người học tự tạo bộ thẻ, chọn PUBLIC hoặc PRIVATE |
| F2 | Thư viện: tab **Khám phá** (bộ PUBLIC) và tab **Của tôi** (bộ tự tạo) |
| F3 | Tìm kiếm bộ thẻ PUBLIC, thẻ xem trước có tác giả |
| F4 | Trang chi tiết bộ thẻ, chia sẻ bằng liên kết |
| F5 | Báo cáo bộ thẻ vi phạm, quản trị viên xử lý |
| F6 | Màn **Học**: chế độ Flashcard và Trắc nghiệm |
| F7 | Màn **Ôn tập**: bốn nhóm Mới / Tới hạn / Quá hạn / Yếu |
| F8 | Cram Mode: ôn nhanh không đổi lịch SRS |
| F9 | Lịch sử ôn và thống kê học/ôn theo từng người |
| F10 | Chủ bộ thẻ nhập nhiều thẻ một lần từ file `.csv` hoặc `.xlsx` |

### 1.2 Không làm

Audio, phát âm, Text-to-Speech, gõ lại từ, chính tả, nghe chép, luyện theo ngữ cảnh,
Đúng/Sai, sinh thẻ hoặc câu hỏi bằng AI, luyện nói, bài tập ngữ pháp, Guest (người chưa
đăng nhập), đánh giá sao, bình luận, yêu thích.

Nhu cầu nào trong số này xuất hiện sau thì ghi vào mục "Future Enhancement", không code.

---

## 2. Hiện trạng mã nguồn — những chỗ prompt gốc giả định sai

Đọc kỹ trước khi làm, vì prompt gốc viết như thể hệ thống đã có "Study Set" và "Flashcard".

| Prompt gốc giả định | Thực tế |
|---|---|
| Có entity Study Set, Flashcard | Không có. Nội dung là `Topic` + `Vocabulary`. "Flashcard" chỉ là màn ôn trên `Vocabulary` |
| Người dùng đã tạo được bộ thẻ | Chỉ quản trị viên soạn qua `/admin/content`. `topic.routes.ts` cho người học đọc |
| Có vai trò Guest | Không. Mọi route nằm trong `RequireAuth` |
| Flashcard không có audio | `Vocabulary.audioUrl` **có cột**, `DueCard` còn trả về, nhưng không từ nào có dữ liệu |
| SRS có state NEW/LEARNING/REVIEW/RELEARNING, bước theo phút | SM-2 trong `shared/src/srs/sm2.ts`, lịch theo **ngày** (`nextReviewDate` kiểu `DATE`) |
| Again/Hard/Good/Easy là tính năng mới | Đã có ở `FlashcardPage.tsx`, ứng với `ReviewQuality` 0 / 3 / 4 / 5 |
| Có Rating, Comment, Favorite, Activity riêng | Không có. Hoạt động học đi qua `ActivityLog` |

**Tái dùng, không làm lại:** SM-2 (`reviewCard`, `initialSrsState`, `isDue`),
`UserVocabProgress`, `recordActivity`, `todayLocalDate`, cờ tính năng, `Modal`, `useToast`,
`useConfirm`, mẫu tìm kiếm `contains` và mẫu chặn có lý do của nhóm lớp.

---

## 3. Quyết định đã chốt

### 3.1 Nội dung và sở hữu

| Mã | Quyết định | Lý do |
|---|---|---|
| D-01 | Người học tự tạo bộ thẻ, PUBLIC hoặc PRIVATE | Yêu cầu sản phẩm |
| D-02 | **Mở rộng `Topic`**: thêm `ownerId` và `visibility`. Không tạo bảng StudySet/Flashcard | Một kho nội dung duy nhất; SRS và `UserVocabProgress` dùng lại nguyên vẹn. Hai kho song song sẽ cần hai bảng tiến độ và lệch nhau |
| D-03 | Thẻ giữ cấu trúc từ vựng: từ + nghĩa bắt buộc, phiên âm + câu ví dụ tuỳ chọn. Bộ có tên, mô tả, trình độ | Không đổi cột. Ứng dụng học tiếng Anh, không cần thẻ tổng quát |
| D-04 | Bộ thẻ của quản trị viên: `ownerId` null, PUBLIC, tác giả hiển thị **"Hệ thống"** | Không lộ tên tài khoản quản trị cho người học |
| D-05 | Chủ bộ thẻ bị **xoá**: bộ thẻ xoá theo (cascade). Bị **khoá**: bộ thẻ ẩn khỏi Khám phá, mở khoá thì hiện lại | Khoá là biện pháp đảo ngược được, xoá thì không |
| D-06 | Người học **báo cáo** bộ thẻ vi phạm, quản trị viên có hàng chờ xử lý | Nội dung công khai do người dùng tạo phải kiểm duyệt được |

### 3.2 Học và Ôn tập

| Mã | Quyết định | Lý do |
|---|---|---|
| D-07 | Chỉ hai dạng: `FLASHCARD` và `MULTIPLE_CHOICE` | Sinh được từ mọi bộ thẻ tự tạo, không cần câu ví dụ hay audio |
| D-08 | Trắc nghiệm hai chiều (từ → nghĩa, nghĩa → từ). Phương án nhiễu lấy từ **cùng bộ**, loại phương án trùng nội dung đáp án. Bộ dưới 4 thẻ chỉ có chế độ Flashcard | Nhiễu khác chủ đề thì đoán ra ngay. Không tạo câu 2–3 lựa chọn |
| D-09 | Trắc nghiệm: **server chấm từng câu**, đáp án không gửi xuống client trước | Phản hồi ngay mà không lộ đáp án qua DevTools |
| D-10 | Kết quả ở màn Học **cập nhật SRS** qua `reviewCard()` | Một thẻ một trạng thái nhớ. Hai lịch ôn riêng sẽ lệch nhau mà không ai phát hiện |
| D-11 | Người học **tự chọn nhóm** để học: Mới / Tới hạn / Quá hạn / Yếu. Không trộn tự động | Người học chủ động quyết định mình cần gì |
| D-12 | Giữ **SM-2 theo ngày**, `nextReviewDate` kiểu `DATE` | Khớp quy ước `local_date`. AGAIN nghĩa là ôn lại ngày mai, không có mốc phút |
| D-13 | Nhóm Yếu dựa trên **cột đếm mới trong `UserVocabProgress`** | Một bảng, không cần tính lại từ lịch sử mỗi lần đọc |
| D-14 | **Không lưu phiên.** Mỗi thẻ chấm và ghi ngay; tải lại trang là phiên mới | Không mất kết quả, không cần bảng phiên, không có Pause/Resume |
| D-15 | Cram Mode **không đổi SRS và không ghi `ActivityLog`** | Chặn cày XP và streak bằng cách ôn đi ôn lại một bộ |

### 3.3 Tích hợp với phần đang chạy

| Mã | Quyết định | Lý do |
|---|---|---|
| D-16 | Route `/library`, `/learn`, `/review`. **Gỡ `/flashcards`** | Ba màn tách bạch: nơi chứa bộ thẻ, nơi học, nơi ôn |
| D-17 | `ActivityLog` **mỗi thẻ một dòng**, như `/flashcards` đang ghi | Thống kê và XP cũ so sánh được với mới |
| D-18 | Bảng **`CardReview`** riêng cho lịch sử ôn và độ chính xác | `ActivityLog` không có đúng/sai, rating, thời gian trả lời. Streak, XP, thống kê ngày vẫn tính từ `ActivityLog` |
| D-19 | `GoalType.LESSONS_PER_WEEK` đổi nghĩa thành **"số phiên học mỗi tuần"**: kết thúc một phiên Học ghi thêm một dòng `QUIZ_COMPLETED` | Nối lại mục tiêu đang không có nguồn. Giữ tên enum vì `activity_logs` còn dữ liệu cũ |
| D-20 | Kiểm thử: unit test `shared` + test service BE | Dự án chỉ có vitest ở `shared`; E2E cần dựng hạ tầng mới |

### 3.4 Mặc định do người phân tích đặt — chưa xác nhận riêng

Sửa ở đây nếu không đúng ý.

| Mã | Mặc định |
|---|---|
| A-01 | `Vocabulary.audioUrl`: giữ cột, không dùng, không xoá |
| A-02 | `/library` thay `/vocabulary`. Cờ tính năng: `VOCABULARY` thành Thư viện, `FLASHCARDS` thành Ôn tập, thêm một cờ cho Học. Trạng thái bật/tắt hiện có được giữ |
| A-03 | Bộ PRIVATE không có nút chia sẻ |
| A-04 | Tìm kiếm dùng `contains` trên tên và mô tả, có phân trang, từ khoá tối đa 100 ký tự |
| A-05 | Quy đổi trắc nghiệm sang `ReviewQuality`: đúng = 4, sai = 1. Không cho 5 vì chọn 1 trong 4 có 25% đoán mò |
| A-06 | Quản trị viên không học và không tạo bộ thẻ ở `/library`; vẫn soạn bộ "Hệ thống" qua `/admin/content` |

### 3.5 Quyết định phát sinh khi triển khai

| Mã | Quyết định | Lý do |
|---|---|---|
| I-01 | Thẻ chưa từng học ghi `VOCAB_LEARNED`, thẻ đã có lịch ghi `FLASHCARD_REVIEWED` | Mục tiêu "số từ mỗi ngày" và nhiệm vụ ngày "Học từ mới" / "Ôn 10 thẻ" tiếp tục đếm đúng như trước |
| I-02 | Mã câu hỏi mã hoá AES-256-GCM thay cho bảng phiên | Server chấm từng câu mà không lộ vị trí đáp án và không cần lưu phiên (D-09, D-14). Chỉ ký HMAC là không đủ vì base64 đọc được |
| I-03 | `activity_logs.dedupe_key` (unique theo người, cho phép null) | Chặn bấm "kết thúc phiên" hai lần thành hai phiên Học |
| I-04 | Khám phá ẩn bộ công khai chưa có thẻ nào | Mở bộ rỗng từ kết quả tìm kiếm chỉ làm người học mất công |
| I-05 | Bộ "Hệ thống" không nhận báo cáo và không bị chặn | Quản trị viên sửa thẳng ở `/admin/content`, không có chủ để thông báo |
| I-06 | Bộ mới tạo mặc định RIÊNG TƯ | Bộ vừa tạo còn trống; để công khai sẵn thì người khác mở ra thấy bộ rỗng |
| I-07 | Ôn tập không chọn bộ: nhóm Mới chỉ lấy thẻ trong bộ đã bắt đầu học | Lấy mọi thẻ chưa học của mọi bộ công khai là đổ cả thư viện vào nhóm Mới |
| I-08 | Màn quản trị ở `/admin/study-sets` ("Kiểm duyệt bộ thẻ"); chi tiết bộ thẻ ở `/library/:id` | Theo mẫu `/admin/groups` và `/groups/:id` |
| I-09 | Nhập thẻ từ file: nút ở đầu màn `/library`. Trình duyệt đọc file (`shared/study/card-import.ts` + `read-excel-file`), xem trước từng dòng, rồi nhập vào bộ MỚI (`POST /library/sets/import`, tạo bộ và thẻ trong một transaction) hoặc bộ CÓ SẴN của mình (`POST /library/sets/:id/cards/import`) | File không lên server nên không phải lưu hay quét tệp; người dùng thấy dòng lỗi trước khi nhập; nhập lỗi không để lại bộ rỗng |
| I-10 | Nhận `.csv` UTF-8 (tự đoán dấu `,` `;` tab) và `.xlsx` (sheet đầu). Tối đa 2 MB, 500 thẻ mỗi lần. CSV không phải UTF-8 thì từ chối | Excel Windows lưu CSV bằng bảng mã cũ; đọc bừa là chữ Việt vỡ mà không ai báo |
| I-11 | Dòng tên cột nhận cả tiếng Việt lẫn tiếng Anh, chỉ công nhận khi có đủ cột Từ và Nghĩa; không có thì đọc theo thứ tự Từ, Nghĩa, Phiên âm, Câu ví dụ | Thẻ đầu tiên có từ "word" không bị nuốt thành tên cột |
| I-12 | Trùng = cùng từ VÀ cùng nghĩa (không phân biệt hoa thường, khoảng trắng); thẻ trùng bị bỏ qua, không ghi đè. BE chống trùng lại bằng cùng khoá `cardImportKey` | Một từ nhiều nghĩa là nhiều thẻ có chủ ý; ghi đè sẽ xoá mất sửa tay của chủ bộ |

---

## 4. Quy tắc nghiệp vụ

### 4.1 Bộ thẻ

| Mã | Quy tắc |
|---|---|
| BR-SET-01 | Bộ PRIVATE chỉ chủ xem, học, ôn, sửa, xoá |
| BR-SET-02 | Bộ PUBLIC: mọi người học đã đăng nhập xem, học, ôn được; chỉ chủ sửa, xoá |
| BR-SET-03 | Quyền kiểm tra **ở backend**. Không truy vấn hết rồi lọc PRIVATE ở frontend |
| BR-SET-04 | Người không có quyền mở bộ thẻ nhận **404**, không nhận 403 — bộ PRIVATE với người ngoài là không tồn tại |
| BR-SET-05 | PUBLIC → PRIVATE: người khác mất quyền ngay; thẻ của bộ đó rời khỏi mọi nhóm ôn của họ; `UserVocabProgress` và `CardReview` giữ nguyên. Mở PUBLIC lại là học tiếp đúng chỗ dở |
| BR-SET-06 | PRIVATE → PUBLIC: xuất hiện trong tìm kiếm ngay lần đọc kế tiếp, không có độ trễ |
| BR-SET-07 | Xoá bộ thẻ: xoá thẻ, `UserVocabProgress` và `CardReview` liên quan (cascade). `ActivityLog` giữ nguyên để streak và thống kê không đổi |
| BR-SET-08 | Bộ thẻ bị quản trị viên chặn: ẩn khỏi tìm kiếm, người ngoài nhận 404, chủ vẫn thấy kèm lý do chặn |
| BR-SET-09 | Bộ "Hệ thống" (`ownerId` null) chỉ quản trị viên sửa |

### 4.2 Ma trận quyền

Không có Guest (xem mục 2).

| Thao tác | Chủ | Người học khác | Quản trị viên |
|---|:-:|:-:|:-:|
| Xem / tìm bộ PUBLIC | ✓ | ✓ | ✓ (khu quản trị) |
| Xem bộ PRIVATE | ✓ | ✗ (404) | ✗ |
| Học / Ôn bộ PUBLIC | ✓ | ✓ | ✗ |
| Học / Ôn bộ PRIVATE | ✓ | ✗ | ✗ |
| Sửa / Xoá / Đổi chế độ | ✓ | ✗ | chỉ bộ "Hệ thống" |
| Chia sẻ | bộ PUBLIC | bộ PUBLIC | — |
| Báo cáo vi phạm | — | bộ PUBLIC | — |
| Chặn / Mở chặn | ✗ | ✗ | ✓ |

### 4.3 Học

| Mã | Quy tắc |
|---|---|
| BR-LEARN-01 | Người học chọn bộ thẻ, chọn nhóm (Mới / Tới hạn / Quá hạn / Yếu), chọn chế độ (Flashcard / Trắc nghiệm) |
| BR-LEARN-02 | Nhóm rỗng thì không cho bắt đầu, hiện trạng thái trống |
| BR-LEARN-03 | Mỗi thẻ gửi kết quả ngay khi trả lời; server chấm, cập nhật `UserVocabProgress`, ghi `CardReview` và một dòng `ActivityLog` trong **cùng transaction** |
| BR-LEARN-04 | Đáp án trắc nghiệm chỉ trả về **sau** khi người học đã chọn |
| BR-LEARN-05 | Gửi trùng cùng một câu (bấm hai lần, mạng chập chờn) không được tính hai lần |
| BR-LEARN-06 | Kết thúc phiên Học ghi thêm một dòng `QUIZ_COMPLETED` (D-19). Phiên có 0 câu trả lời thì không ghi |
| BR-LEARN-07 | Chế độ Flashcard: người học tự chấm bằng bốn nút Again / Hard / Good / Easy |

### 4.4 Ôn tập và SRS

**Bốn nhóm** — tính theo `todayLocalDate(User.timezone)` ở backend:

| Nhóm | Điều kiện |
|---|---|
| Mới | Thẻ trong bộ người học đang xem, chưa có `UserVocabProgress` |
| Tới hạn | `nextReviewDate = hôm nay` |
| Quá hạn | `nextReviewDate < hôm nay` |
| Yếu | `lapses >= 2`, hoặc tỷ lệ sai ≥ 40% khi đã làm ít nhất 3 lần |

Một thẻ có thể vừa Quá hạn vừa Yếu; hai nhóm không loại trừ nhau.

**Nút đánh giá → `ReviewQuality`** (giữ đúng ánh xạ `FlashcardPage.tsx` đang dùng):

| Nút | Quality | Kết quả SM-2 |
|---|:-:|---|
| Again | 0 | `repetitions` về 0, ôn lại ngày mai, tăng `lapses` |
| Hard | 3 | Qua, interval tăng ít, `easeFactor` giảm |
| Good | 4 | Qua, interval tăng bình thường |
| Easy | 5 | Qua, interval tăng nhiều, `easeFactor` tăng |

| Mã | Quy tắc |
|---|---|
| BR-SRS-01 | Chỉ gọi `reviewCard()` của `shared/srs`. Không tự viết công thức giãn cách ở nơi khác |
| BR-SRS-02 | Backend là nguồn duy nhất tính ngày ôn. Frontend chỉ hiển thị |
| BR-SRS-03 | Ôn một thẻ nhiều lần trong ngày: mỗi lần là một lần gọi `reviewCard()` và một dòng `CardReview` |
| BR-SRS-04 | User A và User B học cùng thẻ có `UserVocabProgress` riêng. Không lưu trạng thái học trên `Vocabulary` |
| BR-SRS-05 | Scheduler đặt sau một hàm thuần trong `shared` để sau này thay bằng FSRS mà không đổi chỗ gọi |

### 4.5 Cram Mode

| Mã | Quy tắc |
|---|---|
| BR-CRAM-01 | Ôn toàn bộ bộ thẻ, nhóm Yếu, hoặc giới hạn số thẻ |
| BR-CRAM-02 | Không gọi `reviewCard()`, không ghi `UserVocabProgress`, `CardReview`, `ActivityLog` |
| BR-CRAM-03 | Giao diện ghi rõ "Không ảnh hưởng lịch ôn" để người học không nhầm |

### 4.6 Báo cáo và kiểm duyệt

| Mã | Quy tắc |
|---|---|
| BR-MOD-01 | Chỉ báo cáo được bộ PUBLIC của người khác |
| BR-MOD-02 | Một người báo cáo một bộ tối đa một lần khi báo cáo đó còn chờ xử lý |
| BR-MOD-03 | Quản trị viên chặn thì **bắt buộc ghi lý do**, viết cho người dùng cuối đọc — chủ bộ thẻ thấy nguyên văn |
| BR-MOD-04 | Không có "xoá bộ thẻ" ở phía quản trị. Chặn đảo ngược được, xoá thì mất dữ liệu (cùng lý do với nhóm lớp) |
| BR-MOD-05 | Chặn hoặc bỏ qua báo cáo đều sinh thông báo qua `notification.service.createNotification()` |

---

## 5. Thay đổi dữ liệu (mức đặc tả)

Chỉ nêu trường cần có. Tên cột, kiểu và migration chốt khi lập kế hoạch triển khai.

| Bảng | Thay đổi |
|---|---|
| `topics` | Thêm `owner_id` (null = Hệ thống, cascade khi xoá chủ), `visibility` (`PUBLIC` / `PRIVATE`), thông tin chặn (lý do, thời điểm, người chặn). `created_by_id` giữ nguyên: vẫn ghi quản trị viên đã tạo bộ "Hệ thống", nhưng không dùng để hiển thị tác giả |
| `user_vocab_progress` | Thêm `lapses`, `correct_count`, `wrong_count` |
| `card_reviews` (mới) | `user_id`, `vocabulary_id`, chế độ (`FLASHCARD` / `MULTIPLE_CHOICE`), đúng/sai, quality, thời gian trả lời, interval trước và sau, `reviewed_at`. Không lưu nội dung câu hỏi |
| `study_set_reports` (mới) | Người báo cáo, bộ thẻ, lý do, trạng thái, người xử lý, thời điểm |

**Cố ý không tạo:** bảng StudySet/Flashcard riêng (D-02), bảng phiên học (D-14), thang
mastery riêng, bảng câu hỏi (câu hỏi sinh động), bảng `Mistake` (D-13 thay thế).

**Dữ liệu cũ:** 5 chủ đề hiện có nhận `owner_id` null và `visibility = PUBLIC`.
`UserVocabProgress` cũ nhận `lapses = 0` và hai bộ đếm = 0.

---

## 6. Ràng buộc dự án phải giữ

Prompt gốc không nhắc các điểm này; tất cả bắt buộc theo `CLAUDE.md`.

- Mọi hoạt động học đi qua `recordActivity` của `activity-logs.service`.
- `requireRole(UserRole.USER)` ở router của Học, Ôn và các thao tác tạo bộ thẻ. Quản trị
  viên không có XP, streak, tiến độ.
- Cờ tính năng: danh mục ở `shared/src/constants/features.ts`; tắt thì trả 404; thiếu dòng
  trong `feature_flags` nghĩa là bật.
- Checklist màn hình mới: route + guard, `TRAILS`, bản dịch trong `en.ts`, nhãn giống hệt
  nhau ở Sidebar / `TRAILS` / route, token màu `content*` và `on-page*`.
- `pnpm build:shared` sau mỗi lần sửa `shared`; `check:i18n` và `typecheck` trước khi commit.
- Tên module giống hệt nhau giữa `be` và `fe`.
- Không dùng `confirm()`, `alert()`, `prompt()`.
- Ba chỗ đã gỡ khi xoá `lessons`, cân nhắc nối lại: thẻ "Việc hôm nay" ở `DashboardPage`,
  mục sidebar, nhánh nhắc trong `reminder.job.ts`.

---

## 7. Giao diện

| Màn | Route | Nội dung |
|---|---|---|
| Thư viện | `/library` | Tab Khám phá (tìm kiếm + thẻ xem trước) và tab Của tôi (bộ tự tạo, nút tạo bộ) |
| Chi tiết bộ thẻ | `/library/:id` | Tên, mô tả, tác giả, số thẻ, chế độ; nút Học, Ôn, Chia sẻ, Báo cáo tuỳ quyền. Người không phải chủ thấy bản chỉ đọc |
| Học | `/learn` | Chọn bộ → nhóm → chế độ → phiên → kết quả |
| Ôn tập | `/review` | Bốn nhóm kèm số lượng → phiên → kết quả; lối vào Cram Mode |
| Quản trị | `/admin/...` | Hàng chờ báo cáo bộ thẻ, chặn / mở chặn |

**Thẻ xem trước tối thiểu:** tên bộ, tác giả (bắt buộc), số thẻ, mô tả nếu có.

**Kết quả phiên:** tổng số thẻ, đúng, sai, độ chính xác, thời gian, danh sách thẻ cần củng cố.

**Trạng thái phải có:** đang tải, trống, lỗi, không tìm thấy, bị chặn; tìm kiếm có thêm
đang tìm và không có kết quả; chi tiết bộ thẻ phân biệt chủ / không phải chủ và PUBLIC / PRIVATE.

---

## 8. Thống kê

| Học | Ôn tập |
|---|---|
| Tổng số thẻ đã học, đúng, sai, độ chính xác | Tổng lượt ôn, số thẻ Tới hạn / Quá hạn / Yếu |
| Thời gian học, số phiên | Độ chính xác, số thẻ đã thuộc / đang ôn, ngày ôn kế tiếp |

- Số phiên đọc từ `ActivityLog` loại `QUIZ_COMPLETED`.
- Độ chính xác và thời gian đọc từ `CardReview`.
- "Đã thuộc" suy từ SM-2: `repetitions >= 5` và `intervalDays >= 21`. Không lưu cột mastery.
- Chỉ dựng phần khớp giao diện thống kê hiện có.

---

## 9. Trường hợp biên phải xử lý

- Bộ thẻ 0 thẻ: không học, không ôn, hiện trạng thái trống.
- Bộ thẻ 1–3 thẻ: chỉ chế độ Flashcard (D-08).
- Hai thẻ cùng nghĩa trong một bộ: không dùng thẻ kia làm phương án nhiễu.
- Thẻ hoặc bộ thẻ bị xoá khi người khác đang học: câu gửi lên trả 404, phiên báo lỗi rõ ràng.
- Bộ chuyển PRIVATE khi người khác đang học: câu kế tiếp trả 404.
- Chủ bị khoá: bộ thẻ ẩn; người đang học nhận 404.
- ID không hợp lệ, từ khoá rỗng, từ khoá quá dài, ký tự đặc biệt trong tìm kiếm.
- Bấm hai lần, gửi trùng, hai tab cùng học một bộ (BR-LEARN-05).
- Múi giờ khác nhau: nhóm Tới hạn / Quá hạn tính theo `User.timezone`.
- Mất mạng giữa phiên: kết quả các thẻ đã gửi được giữ (D-14).

---

## 10. Kiểm thử

| Tầng | Nội dung |
|---|---|
| `shared` (vitest) | Ánh xạ nút → quality; quy đổi trắc nghiệm → quality; phân nhóm Mới / Tới hạn / Quá hạn / Yếu ở các ranh giới; sinh trắc nghiệm (bộ < 4 thẻ, phương án trùng, hai chiều) |
| Service BE | Bộ PRIVATE trả 404 cho người ngoài ở mọi lối vào (xem, học, ôn, sửa, xoá, tìm kiếm); PUBLIC → PRIVATE ẩn thẻ khỏi nhóm ôn; hai người học cùng thẻ có tiến độ riêng; Cram không ghi gì; gửi trùng không tính hai lần |
| Hồi quy | Streak, XP, bảng xếp hạng, nhiệm vụ ngày vẫn đếm đúng khi `/flashcards` bị gỡ |

Không dựng E2E trong đợt này. Không kiểm tra bằng Playwright trừ khi được yêu cầu.

---

## 11. Đối chiếu với `docs/ke-hoach-module-hoc-tap.md`

Tài liệu cũ được gộp có chọn lọc. Điểm nào mâu thuẫn thì tài liệu này thắng.

| Kế hoạch cũ | Tài liệu này |
|---|---|
| Sáu dạng bài (có `TYPE_WORD`, `FILL_BLANK`, `MATCH_PAIRS`, `LISTEN_TYPE`) | Chỉ Flashcard + Trắc nghiệm (D-07) |
| Bảng `Mistake` theo từng dạng bài | Bỏ; cột đếm trong `UserVocabProgress` (D-13) |
| Người học tự tạo bộ thẻ: ngoài phạm vi | Trong phạm vi (D-01) |
| Nộp cả phiên, server chấm một lần | Chấm từng câu (D-09, BR-LEARN-03) |
| Server tự chọn từ theo thứ tự ưu tiên | Người học tự chọn nhóm (D-11) |
| `ActivityLog` mỗi phiên một dòng | Mỗi thẻ một dòng + một dòng kết thúc phiên (D-17, D-19) |
| Bảng `StudySession` | Không lưu phiên (D-14) |
| Module `study`, route `/study` | `/library`, `/learn`, `/review` (D-16) |

**Giữ lại từ kế hoạch cũ:** một thẻ một trạng thái nhớ (D-10); không có thang mastery riêng;
chỉ gọi `reviewCard()`; phương án nhiễu lấy từ cùng bộ; không có ngân hàng câu hỏi soạn tay.
