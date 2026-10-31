-- Lịch cá nhân: lưu chuỗi lịch và ngoại lệ từng lần xuất hiện.
-- Không liên kết tới ActivityLog, streak, XP hoặc bảng điểm thưởng.

CREATE TABLE `personal_calendars` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `notes` VARCHAR(200) NOT NULL DEFAULT '',
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `recurrence` ENUM('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'NONE',
    `recurrence_ends_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `personal_calendars_user_id_starts_at_idx`(`user_id`, `starts_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `personal_calendar_exceptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `calendar_id` INTEGER NOT NULL,
    `occurrence_key` VARCHAR(30) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(100) NULL,
    `notes` VARCHAR(200) NULL,
    `overridden_start` DATETIME(3) NULL,
    `overridden_end` DATETIME(3) NULL,

    UNIQUE INDEX `personal_calendar_exceptions_calendar_id_occurrence_key_key`(`calendar_id`, `occurrence_key`),
    INDEX `personal_calendar_exceptions_calendar_id_idx`(`calendar_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `personal_calendars` ADD CONSTRAINT `personal_calendars_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `personal_calendar_exceptions` ADD CONSTRAINT `personal_calendar_exceptions_calendar_id_fkey` FOREIGN KEY (`calendar_id`) REFERENCES `personal_calendars`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
