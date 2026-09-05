-- Viết tay thay vì để `prisma migrate dev` sinh, vì `username` là cột BẮT BUỘC và
-- UNIQUE thêm vào bảng `users` đang có dữ liệu. Prisma không tự sinh được bước điền
-- giá trị cho các dòng cũ nên nó dừng lại với thông báo "not possible to execute".
--
-- Ba bước dưới đây không gộp được: thêm cột cho phép NULL -> điền -> mới siết ràng buộc.

-- AlterTable: thêm cột, tạm cho phép NULL
ALTER TABLE `users` ADD COLUMN `username` VARCHAR(50) NULL;

-- Điền tên tài khoản từ phần trước dấu @ của email
UPDATE `users` SET `username` = LEFT(SUBSTRING_INDEX(`email`, '@', 1), 40);

-- Khử trùng: hai email khác nhau vẫn có thể cho cùng một tên
-- (user@enghabit.com và user@hello.yahoo đều ra "user"). Chỉ những tên bị trùng
-- mới phải nối thêm id, để các tên còn lại giữ được dạng sạch.
--
-- Bảng dẫn xuất có GROUP BY nên MySQL buộc phải materialize nó trước; nhờ vậy
-- không vướng lỗi 1093 "You can't specify target table for update in FROM clause".
UPDATE `users` AS u
INNER JOIN (
    SELECT `username` AS dup FROM `users` GROUP BY `username` HAVING COUNT(*) > 1
) AS d ON u.`username` = d.dup
SET u.`username` = CONCAT(u.`username`, '_', u.`id`);

-- Giờ mọi dòng đã có giá trị và không trùng nhau, siết được ràng buộc
ALTER TABLE `users` MODIFY COLUMN `username` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_username_key` ON `users`(`username`);

-- AlterTable: thêm loại thông báo cho yêu cầu cấp lại mật khẩu
ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM('DAILY_REMINDER', 'STREAK_AT_RISK', 'REVIEW_DUE', 'MISTAKES_PENDING', 'GOAL_ACHIEVED', 'ANNOUNCEMENT', 'PASSWORD_RESET_REQUEST') NOT NULL;

-- CreateTable
CREATE TABLE `password_reset_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `pending_user_id` INTEGER NULL,
    `reviewed_by_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `reject_reason` VARCHAR(500) NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_requests_pending_user_id_key`(`pending_user_id`),
    INDEX `password_reset_requests_user_id_idx`(`user_id`),
    INDEX `password_reset_requests_status_created_at_idx`(`status`, `created_at`),
    INDEX `password_reset_requests_reviewed_at_idx`(`reviewed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_requests` ADD CONSTRAINT `password_reset_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SetNull chứ không Cascade — xoá tài khoản quản trị viên không được
-- phép làm bốc hơi nhật ký phê duyệt, chỉ mất thông tin "ai làm" chứ không mất sự kiện.
ALTER TABLE `password_reset_requests` ADD CONSTRAINT `password_reset_requests_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
