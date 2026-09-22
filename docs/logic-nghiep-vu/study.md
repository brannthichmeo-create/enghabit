# Module `study` — Học, Ôn tập, Cram

> **Mã nguồn:** `be/src/modules/study/` (`study.service.ts`, `question-token.ts`),
> `shared/src/srs/sm2.ts`, `shared/src/study/` (`study.ts`, `multiple-choice.ts`)
> **Màn hình:** `/learn` (Học một bộ), `/review` (Ôn tập, Cram, thống kê, lịch sử);
> huy hiệu số thẻ cần ôn trên sidebar
> **Cờ tính năng:** cả nhánh `/study` chịu `VOCABULARY`; bên trong service kiểm thêm
> `LEARN` (nguồn `LEARN`) hoặc `FLASHCARDS` (nguồn `REVIEW`, `CRAM`)
> **Quyền:** chỉ `USER`
> **Đặc tả chi tiết:** `docs/ke-hoach-hoc-on-flashcard.md`

## 1. Vai trò

Biến nội dung của Thư viện thành **hoạt động học có ghi nhận**: phát câu hỏi, chấm, cập nhật
lịch ôn theo SM-2 và ghi `ActivityLog`. Đây là một trong hai nguồn sinh hoạt động học (nguồn
kia là `habits`), nên mọi thay đổi ở đây lan ra streak, XP, mục tiêu, nhiệm vụ và thống kê.

## 2. Dữ liệu

| Bảng | Quyền | Ghi chú |
| --- | --- | --- |
| `user_vocab_progress` | Ghi | **Một thẻ, một trạng thái nhớ** dù làm ở Học hay Ôn tập: `repetitions`, `interval_days`, `ease_factor`, `next_review_date` (DATE), bộ đếm `lapses`, `correct_count`, `wrong_count` |
| `card_reviews` | Ghi | Lịch sử từng lần làm: chế độ, đúng/sai, `quality`, khoảng ôn trước/sau, `attempt_key` (unique theo người), `session_key` |
| `activity_logs` | Ghi (qua `recordActivity`) | `VOCAB_LEARNED`, `FLASHCARD_REVIEWED`, `QUIZ_COMPLETED` |
| `topics`, `vocabularies` | Đọc (qua `readableSetWhere`) | Nguồn thẻ |

`card_reviews` **chỉ** phục vụ lịch sử và độ chính xác. Streak, XP và thống kê ngày vẫn đọc
`activity_logs` — đếm hoạt động từ `card_reviews` là tạo nguồn số liệu thứ hai.

## 3. Chức năng và cách hoạt động

### 3.1 Ba nguồn (`StudySource`) — khác nhau ở chỗ có ghi hay không

| Nguồn | Màn | Ghi SRS | Ghi `card_reviews` | Ghi `ActivityLog` | Cờ |
| --- | --- | --- | --- | --- | --- |
| `LEARN` — Học một bộ | `/learn` | Có | Có, kèm `session_key` | Có | `LEARN` |
| `REVIEW` — Ôn tập | `/review` | Có | Có | Có | `FLASHCARDS` |
| `CRAM` — Luyện nhanh | `/review` | **Không** | **Không** | **Không** | `FLASHCARDS` |

Cram chỉ chấm để người học biết đúng sai. Ghi vào là cày được XP và streak vô hạn.

### 3.2 Phát đề — `POST /study/questions`

1. Kiểm cờ theo `source`; có `setId` thì kiểm `findReadableSet`.
2. Trắc nghiệm trên một bộ cần bộ có **≥ 4 thẻ**.
3. Chọn thẻ theo nhóm (`StudyGroup`), tối đa `limit` (mặc định 20, trần 50):

   | Nhóm | Điều kiện |
   | --- | --- |
   | `NEW` | Thẻ chưa có `user_vocab_progress`. Không chọn bộ thì chỉ lấy trong **các bộ đã bắt đầu học** — không đổ cả thư viện vào |
   | `DUE` | `next_review_date = hôm nay` |
   | `OVERDUE` | `next_review_date < hôm nay` |
   | `WEAK` | `lapses ≥ 2`, hoặc đã làm ≥ 3 lần và tỷ lệ sai ≥ 40% (`isWeakCard`) |
   | `ALL` | Mọi thẻ đọc được, xáo trộn |

4. Chế độ **Flashcard**: trả mặt trước/sau thẻ. Chế độ **Trắc nghiệm**: `buildMultipleChoice`
   dựng 4 phương án, **nhiễu lấy từ cùng bộ của từng thẻ**, hướng hỏi ngẫu nhiên (từ → nghĩa
   hoặc nghĩa → từ). Thẻ không dựng được đề bị bỏ qua và đếm vào `skipped`.
5. Mỗi câu kèm **mã câu hỏi** mã hoá AES-256-GCM (`question-token.ts`) chứa `userId`, `cardId`,
   `source`, `mode`, và với trắc nghiệm là `correctIndex`. Client không đọc, không sửa được mã;
   mã hết hạn sau 24 giờ. Chỉ ký là không đủ vì base64 đọc được.

### 3.3 Chấm một câu — `POST /study/answers`

1. Giải mã token, kiểm `userId` khớp, kiểm cờ theo `source` trong token.
2. **Kiểm quyền lại** qua `readableSetWhere`: bộ có thể vừa chuyển riêng tư, bị chặn hoặc bị xoá.
3. Quy ra chất lượng SM-2:
   - Flashcard tự chấm: `AGAIN → 0`, `HARD → 3`, `GOOD → 4`, `EASY → 5`.
   - Trắc nghiệm: đúng → 4 (không phải 5 vì có 25% đoán mò), sai → 1.
4. `CRAM` → trả đúng/sai và đáp án, **dừng**.
5. `attempt_key = SHA-256(token)`. Đã có `card_reviews` với khoá này → trả lại kết quả lần đầu
   (`duplicate = true`).
6. Trong **một transaction**:
   - Ghi `card_reviews` **trước** (gửi trùng thì vấp unique ngay, chưa đụng SRS).
   - `reviewCard(before, quality, today)` của `shared/srs`: sai (< 3) → lặp lại từ đầu, ôn sau 1
     ngày; đúng → lần 1 cách 1 ngày, lần 2 cách 6 ngày, từ lần 3 nhân `ease_factor` (chặn dưới 1.3).
   - Cập nhật bộ đếm (`applyAnswerCounters`) và tạo/cập nhật `user_vocab_progress`.
   - `recordActivity`: thẻ **chưa từng học** → `VOCAB_LEARNED`; đã có lịch → `FLASHCARD_REVIEWED`.
7. Trùng unique ở bảng tiến độ (hai câu khác nhau của cùng một thẻ mới nộp cùng lúc) → 409.

Không có bước "nộp cả phiên": mỗi câu ghi ngay, rời màn giữa chừng không mất kết quả.

### 3.4 Kết thúc phiên Học — `POST /study/sessions/finish`

1. Đếm câu và số đúng **từ `card_reviews`** theo `session_key` — không tin client.
2. Chưa trả lời câu nào → không ghi gì.
3. `recordActivity(QUIZ_COMPLETED, value = số đúng, dedupeKey = SESSION:<sessionKey>)` — bấm
   kết thúc hai lần không thành hai phiên. Đây là nguồn của mục tiêu "Số phiên học mỗi tuần".
4. Lời gọi này **không truyền `tx`**, nên đây là chỗ duy nhất hiện nay kích hoạt thông báo
   `GOAL_ACHIEVED` và việc tự kết thúc mục tiêu chuỗi / cộng dồn khi đạt (xem `activity-logs.md`
   mục 7).

### 3.5 Tổng quan, thống kê, lịch sử

| Endpoint | Nội dung |
| --- | --- |
| `GET /study/overview` | Số thẻ Mới / Tới hạn / Quá hạn / Yếu và ngày ôn gần nhất |
| `GET /study/due-count` | Tới hạn + quá hạn (huy hiệu sidebar) |
| `GET /study/stats` | Học: số phiên, thẻ đã học, câu đúng/sai, độ chính xác, thời gian; Ôn tập: tổng lượt, đã thuộc (`repetitions ≥ 5` và khoảng ≥ 21 ngày), đang học, độ chính xác |
| `GET /study/history` | Phân trang `card_reviews`; thẻ của bộ đã riêng tư/bị chặn tự rời khỏi lịch sử |

`countDueCards` là bản không kiểm cờ, dùng cho cron nhắc nhở.

## 4. Liên kết với module khác

| Module | Chiều | Qua đâu | Nội dung |
| --- | --- | --- | --- |
| `library` | dùng | `readableSetWhere`, `findReadableSet`, `startedSetWhere` | Mọi truy vấn thẻ |
| `library` | được gọi | `summarizeProgress` | Tiến độ trang chi tiết bộ |
| `activity-logs` | gọi đi | `recordActivity` | Ghi hoạt động học, cập nhật streak |
| `feature-flags` | gọi đi | `isEnabled(LEARN / FLASHCARDS)` | Tắt thì 404 |
| Cron nhắc nhở | được gọi | `countDueCards` | Nội dung lời nhắc "Bạn có N thẻ cần ôn" |
| `goals` | gián tiếp | `activity_logs` | `VOCAB_PER_DAY` đếm `VOCAB_LEARNED`; `MINUTES_PER_DAY` (hiển thị "Số lượt ôn tập") đếm `FLASHCARD_REVIEWED`; `LESSONS_PER_WEEK` (hiển thị "Số phiên học") đếm `QUIZ_COMPLETED` — theo ngày, tuần hoặc cộng dồn |
| `habits` | gián tiếp | `activity_logs` | Thói quen tự động bám theo ba loại hoạt động trên tự đạt khi học đủ lượng |
| `rewards` | gián tiếp | `activity_logs` | Nhiệm vụ "Học 5 thẻ mới", "Ôn 10 thẻ" |
| `statistics`, `leaderboard` | gián tiếp | `activity_logs` | XP, cấp độ, thứ hạng, biểu đồ |
| `groups` | gián tiếp | `group_study_sets` | Thành viên học được bộ trưởng nhóm chia sẻ |

## 5. Ảnh hưởng dây chuyền

Mỗi câu trả lời Học/Ôn tập (không phải Cram):

- Đổi lịch ôn của thẻ → số thẻ tới hạn ở sidebar, `/review`, trang chi tiết bộ, lời nhắc cron.
- Thêm 1 dòng `activity_logs` → chuỗi ngày, XP (+8 hoặc +4), thứ hạng, nhiệm vụ ngày, tiến độ
  mục tiêu, biểu đồ Tổng quan và Báo cáo.
- Là hoạt động đầu tiên trong ngày → cron nhắc nhở và cảnh báo chuỗi im lặng tới hết ngày.
- Thói quen tự động cùng loại có thể đạt → lời nhắc theo giờ của thói quen đó im.

FE sau khi trả lời làm mới cache `study`, `library` và `statistics`.

## 6. Quy tắc bắt buộc giữ khi sửa

1. Chỉ gọi `reviewCard()` của `shared/srs` — không tự viết công thức giãn cách.
2. Lịch ôn tính theo **ngày** (`next_review_date` kiểu DATE), không có mốc phút.
3. Đáp án không rời server trước khi trả lời — mã hoá, không chỉ ký.
4. Mỗi câu chấm và ghi ngay; `card_reviews.@@unique([userId, attemptKey])` chặn bấm hai lần.
5. Cram không ghi gì cả.
6. Không đổi tên enum `ActivityType` — `activity_logs` còn dữ liệu cũ.

## 7. Điểm cần lưu ý

- FE sau khi trả lời không làm mới cache `rewards` và `goals`, nên thanh nhiệm vụ ngày và thanh
  tiến độ mục tiêu có thể trễ tới lần tải lại kế tiếp (`staleTime` 30 giây).
- `GET /study/stats` không kiểm cờ `FLASHCARDS`/`LEARN` như các endpoint còn lại (chỉ chịu cờ
  `VOCABULARY` của cả nhánh).
- Hằng `MAX_FLASHCARDS_PER_SESSION` trong `shared/src/constants/index.ts` không còn ai dùng.
