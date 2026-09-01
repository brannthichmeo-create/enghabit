-- CreateTable
CREATE TABLE `coin_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` ENUM('DAILY_CHECKIN', 'MISSION_CLAIM', 'STREAK_FREEZE_PURCHASE') NOT NULL,
    `dedupe_key` VARCHAR(120) NOT NULL,
    `local_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coin_transactions_user_id_local_date_idx`(`user_id`, `local_date`),
    UNIQUE INDEX `coin_transactions_user_id_dedupe_key_key`(`user_id`, `dedupe_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `streak_freezes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `purchased_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `used_on_date` DATE NULL,

    INDEX `streak_freezes_user_id_idx`(`user_id`),
    UNIQUE INDEX `streak_freezes_user_id_used_on_date_key`(`user_id`, `used_on_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coin_transactions` ADD CONSTRAINT `coin_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `streak_freezes` ADD CONSTRAINT `streak_freezes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
