-- Chia sẻ tài liệu và bộ thẻ trong nhóm lớp, kèm đề cập (@mention).
--
-- Chỉ THÊM bảng và giá trị enum, không xoá cột hay đổi kiểu dữ liệu cũ nên chạy an
-- toàn trên DB dùng chung.
--
-- Tài liệu nhóm KHÔNG có bảng mới: nó là tệp đính kèm (`post_attachments`) của các bài
-- có `group_id`, chỉ cần một câu truy vấn khác.

-- AlterTable — hai loại thông báo mới
ALTER TABLE `notifications` MODIFY `type` ENUM('DAILY_REMINDER', 'STREAK_AT_RISK', 'REVIEW_DUE', 'MISTAKES_PENDING', 'GOAL_ACHIEVED', 'ANNOUNCEMENT', 'GROUP_WARNING', 'GROUP_BLOCKED', 'GROUP_UNBLOCKED', 'GROUP_JOIN_REQUEST', 'GROUP_JOIN_APPROVED', 'GROUP_JOIN_REJECTED', 'PASSWORD_RESET_REQUEST', 'STUDY_SET_REPORTED', 'STUDY_SET_BLOCKED', 'STUDY_SET_UNBLOCKED', 'STUDY_SET_REPORT_RESOLVED', 'MENTIONED', 'GROUP_STUDY_SET_SHARED') NOT NULL;

-- CreateTable
CREATE TABLE `group_study_sets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `topic_id` INTEGER NOT NULL,
    `shared_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `group_study_sets_group_id_created_at_idx`(`group_id`, `created_at`),
    INDEX `group_study_sets_topic_id_idx`(`topic_id`),
    UNIQUE INDEX `group_study_sets_group_id_topic_id_key`(`group_id`, `topic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `group_study_sets` ADD CONSTRAINT `group_study_sets_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_study_sets` ADD CONSTRAINT `group_study_sets_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_study_sets` ADD CONSTRAINT `group_study_sets_shared_by_id_fkey` FOREIGN KEY (`shared_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
