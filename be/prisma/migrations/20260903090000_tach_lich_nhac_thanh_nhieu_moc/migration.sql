-- Tách lịch nhắc ra bảng riêng: mỗi người đặt được nhiều mốc trong ngày.
--
-- Thứ tự ba bước dưới đây là bắt buộc: tạo bảng mới → CHUYỂN DỮ LIỆU CŨ SANG → mới
-- được xoá cột. Đảo thứ tự là mất sạch giờ nhắc người dùng đã đặt.

-- CreateTable
CREATE TABLE `reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `label` VARCHAR(60) NULL,
    `time_of_day` VARCHAR(5) NOT NULL,
    `days_of_week` JSON NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reminders_user_id_idx`(`user_id`),
    UNIQUE INDEX `reminders_user_id_time_of_day_key`(`user_id`, `time_of_day`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Chuyển lịch nhắc đang có thành mốc đầu tiên của mỗi người.
-- `is_enabled` của mốc để true và giữ nguyên công tắc tổng ở notification_settings:
-- người đang tắt nhắc nhở vẫn tắt, bật lại là thấy đúng giờ cũ của mình.
INSERT INTO `reminders` (`user_id`, `time_of_day`, `days_of_week`, `is_enabled`, `created_at`, `updated_at`)
SELECT `user_id`, `time_of_day`, `days_of_week`, true, NOW(3), NOW(3)
FROM `notification_settings`;

-- AlterTable
ALTER TABLE `notification_settings` DROP COLUMN `days_of_week`,
    DROP COLUMN `time_of_day`;
