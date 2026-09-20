-- Việc cần làm trong ngày (module `todos`).
--
-- Chỉ THÊM một bảng mới, không đụng bảng hay cột nào đang có, nên chạy an toàn trên DB
-- dùng chung.
--
-- Bảng này KHÔNG liên quan tới `activity_logs`: đánh dấu xong một việc không phải hoạt
-- động học, không nối chuỗi ngày và không cộng XP (xem be/src/modules/todos).

-- CreateTable
CREATE TABLE `todos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `local_date` DATE NOT NULL,
    `is_done` BOOLEAN NOT NULL DEFAULT false,
    `done_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `todos_user_id_local_date_idx`(`user_id`, `local_date`),
    INDEX `todos_user_id_is_done_local_date_idx`(`user_id`, `is_done`, `local_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `todos` ADD CONSTRAINT `todos_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
