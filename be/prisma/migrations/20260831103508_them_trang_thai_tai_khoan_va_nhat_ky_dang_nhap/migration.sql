-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `login_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `email` VARCHAR(190) NOT NULL,
    `success` BOOLEAN NOT NULL,
    `reason` VARCHAR(32) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_events_created_at_idx`(`created_at`),
    INDEX `login_events_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `login_events` ADD CONSTRAINT `login_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
