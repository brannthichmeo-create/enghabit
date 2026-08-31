-- AlterTable
ALTER TABLE `notification_settings` ADD COLUMN `remind_review_due` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `remind_streak_at_risk` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('DAILY_REMINDER', 'STREAK_AT_RISK', 'REVIEW_DUE', 'MISTAKES_PENDING', 'GOAL_ACHIEVED', 'ANNOUNCEMENT') NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` VARCHAR(500) NOT NULL,
    `link` VARCHAR(120) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dedupe_key` VARCHAR(120) NOT NULL,

    INDEX `notifications_user_id_read_at_idx`(`user_id`, `read_at`),
    UNIQUE INDEX `notifications_user_id_dedupe_key_key`(`user_id`, `dedupe_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
