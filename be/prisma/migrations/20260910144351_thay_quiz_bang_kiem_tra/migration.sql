-- DropForeignKey
ALTER TABLE `quiz_attempts` DROP FOREIGN KEY `quiz_attempts_quiz_id_fkey`;

-- DropForeignKey
ALTER TABLE `quiz_attempts` DROP FOREIGN KEY `quiz_attempts_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `quiz_questions` DROP FOREIGN KEY `quiz_questions_quiz_id_fkey`;

-- DropForeignKey
ALTER TABLE `quizzes` DROP FOREIGN KEY `quizzes_topic_id_fkey`;

-- DropTable
DROP TABLE `quiz_attempts`;

-- DropTable
DROP TABLE `quiz_questions`;

-- DropTable
DROP TABLE `quizzes`;

-- CreateTable
CREATE TABLE `exam_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `topic_id` INTEGER NOT NULL,
    `correct` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_attempts_user_id_completed_at_idx`(`user_id`, `completed_at`),
    INDEX `exam_attempts_topic_id_idx`(`topic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

