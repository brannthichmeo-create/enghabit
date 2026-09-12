-- Gỡ toàn bộ module bài học để dựng lại từ đầu.
--
-- Ba bảng này chỉ được module `lessons` đọc và ghi; không bảng nào khác tham chiếu tới
-- chúng, nên xoá thẳng được, không cần gỡ khoá ngoại trước. Chiều ngược lại thì có:
-- cả ba đều trỏ tới `users`, `topics`, `vocabularies` — xoá bảng con là khoá ngoại đi
-- theo, các bảng cha không bị ảnh hưởng.

DROP TABLE IF EXISTS `lesson_progress`;
DROP TABLE IF EXISTS `mistakes`;
DROP TABLE IF EXISTS `exam_attempts`;

-- Enum `ExerciseType` chỉ được cột `mistakes.exercise_type` dùng. MySQL lưu enum ngay
-- trong định nghĩa cột chứ không phải kiểu độc lập, nên xoá bảng là enum biến mất theo.
-- Không có lệnh DROP TYPE nào cần chạy.

-- KHÔNG đụng tới:
--   * `activity_logs` — vẫn giữ các dòng QUIZ_COMPLETED cũ. Đó là lịch sử hoạt động
--     có thật, và streak cùng thống kê của người dùng tính từ bảng này.
--   * `notifications.type` — giá trị MISTAKES_PENDING giữ nguyên trong enum. Sau khi gỡ
--     module thì không còn ai sinh ra loại này nữa, nhưng các thông báo CŨ đã gửi vẫn
--     đang mang giá trị đó; bỏ khỏi enum sẽ làm chúng không đọc được.
