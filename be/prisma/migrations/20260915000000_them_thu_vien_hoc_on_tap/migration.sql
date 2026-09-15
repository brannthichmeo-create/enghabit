-- Thư viện bộ thẻ, Học và Ôn tập (docs/ke-hoach-hoc-on-flashcard.md).
-- Chỉ THÊM cột/bảng/giá trị enum, không xoá hay đổi kiểu dữ liệu cũ nên chạy an toàn trên DB dùng chung.
-- 5 chủ đề hiện có nhận owner_id = NULL (bộ "Hệ thống") và visibility = PUBLIC nhờ giá trị mặc định.

-- AlterTable
ALTER TABLE `topics` ADD COLUMN `blocked_at` DATETIME(3) NULL,
    ADD COLUMN `blocked_by_id` INTEGER NULL,
    ADD COLUMN `blocked_reason` VARCHAR(500) NULL,
    ADD COLUMN `owner_id` INTEGER NULL,
    ADD COLUMN `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE `user_vocab_progress` ADD COLUMN `correct_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lapses` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `wrong_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `activity_logs` ADD COLUMN `dedupe_key` VARCHAR(80) NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('DAILY_REMINDER', 'STREAK_AT_RISK', 'REVIEW_DUE', 'MISTAKES_PENDING', 'GOAL_ACHIEVED', 'ANNOUNCEMENT', 'GROUP_WARNING', 'GROUP_BLOCKED', 'GROUP_UNBLOCKED', 'GROUP_JOIN_REQUEST', 'GROUP_JOIN_APPROVED', 'GROUP_JOIN_REJECTED', 'PASSWORD_RESET_REQUEST', 'STUDY_SET_REPORTED', 'STUDY_SET_BLOCKED', 'STUDY_SET_UNBLOCKED', 'STUDY_SET_REPORT_RESOLVED') NOT NULL;

-- CreateTable
CREATE TABLE `card_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `vocabulary_id` INTEGER NOT NULL,
    `mode` ENUM('FLASHCARD', 'MULTIPLE_CHOICE') NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `quality` INTEGER NOT NULL,
    `response_ms` INTEGER NULL,
    `interval_before` INTEGER NOT NULL,
    `interval_after` INTEGER NOT NULL,
    `attempt_key` CHAR(64) NOT NULL,
    `session_key` CHAR(36) NULL,
    `reviewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `card_reviews_user_id_reviewed_at_idx`(`user_id`, `reviewed_at`),
    INDEX `card_reviews_user_id_session_key_idx`(`user_id`, `session_key`),
    INDEX `card_reviews_vocabulary_id_idx`(`vocabulary_id`),
    UNIQUE INDEX `card_reviews_user_id_attempt_key_key`(`user_id`, `attempt_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_set_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topic_id` INTEGER NOT NULL,
    `reporter_id` INTEGER NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `pending_key` VARCHAR(40) NULL,
    `resolved_by_id` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `study_set_reports_pending_key_key`(`pending_key`),
    INDEX `study_set_reports_status_created_at_idx`(`status`, `created_at`),
    INDEX `study_set_reports_topic_id_idx`(`topic_id`),
    INDEX `study_set_reports_reporter_id_idx`(`reporter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `topics_owner_id_idx` ON `topics`(`owner_id`);

-- CreateIndex
CREATE INDEX `topics_visibility_blocked_at_idx` ON `topics`(`visibility`, `blocked_at`);

-- CreateIndex
CREATE UNIQUE INDEX `activity_logs_user_id_dedupe_key_key` ON `activity_logs`(`user_id`, `dedupe_key`);

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_blocked_by_id_fkey` FOREIGN KEY (`blocked_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_reviews` ADD CONSTRAINT `card_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_reviews` ADD CONSTRAINT `card_reviews_vocabulary_id_fkey` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_set_reports` ADD CONSTRAINT `study_set_reports_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_set_reports` ADD CONSTRAINT `study_set_reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_set_reports` ADD CONSTRAINT `study_set_reports_resolved_by_id_fkey` FOREIGN KEY (`resolved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

