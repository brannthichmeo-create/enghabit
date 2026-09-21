-- Đợt 2 của mục tiêu và thói quen.
--
-- Chỉ THÊM cột và thêm một giá trị enum, không đổi hay xoá gì đang có, nên chạy an toàn
-- trên DB dùng chung: code cũ trên máy khác bỏ qua các cột mới và vẫn chạy.
--
-- - goals.period thêm TOTAL: mục tiêu cộng dồn tới hạn ("thuộc 1500 từ trước Tết").
-- - goals.paused_at: tạm dừng mục tiêu, tiếp tục thì hạn lùi đúng số ngày đã dừng.
-- - habits.auto_activity: thói quen tự hoàn thành từ ActivityLog. Loại này KHÔNG ghi
--   habit_check_ins — trạng thái chấm lại từ activity_logs mỗi lần đọc.
-- - habits.target_amount / min_amount / unit: lượng mỗi lần và mức tối thiểu cho ngày bận.
-- - habits.times_per_week: thói quen hằng tuần làm N lần.
-- - habits.goal_id: thói quen phục vụ mục tiêu nào. Xoá mục tiêu thì chỉ mất liên kết.
-- - habit_check_ins.amount: lượng đã làm trong lần check-in đó.

-- AlterTable
ALTER TABLE `goals` ADD COLUMN `paused_at` DATE NULL,
    MODIFY `period` ENUM('DAILY', 'WEEKLY', 'TOTAL') NOT NULL;

-- AlterTable
ALTER TABLE `habits` ADD COLUMN `auto_activity` ENUM('VOCAB_LEARNED', 'FLASHCARD_REVIEWED', 'QUIZ_COMPLETED', 'HABIT_CHECKIN') NULL,
    ADD COLUMN `goal_id` INTEGER NULL,
    ADD COLUMN `min_amount` INTEGER NULL,
    ADD COLUMN `target_amount` INTEGER NULL,
    ADD COLUMN `times_per_week` INTEGER NULL,
    ADD COLUMN `unit` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `habit_check_ins` ADD COLUMN `amount` INTEGER NULL;

-- CreateIndex
CREATE INDEX `habits_goal_id_idx` ON `habits`(`goal_id`);

-- AddForeignKey
ALTER TABLE `habits` ADD CONSTRAINT `habits_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
