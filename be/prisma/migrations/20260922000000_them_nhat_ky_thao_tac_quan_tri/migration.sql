-- Nhật ký thao tác của quản trị viên (xem model AdminAuditLog).
--
-- Chỉ THÊM một bảng mới, không đụng bảng hay cột nào đang có, nên chạy an toàn trên DB
-- dùng chung. Bảng chỉ thêm dòng: không có API nào sửa hay xoá nhật ký.

-- CreateTable
CREATE TABLE `admin_audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_id` INTEGER NULL,
    `actor_name` VARCHAR(100) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `target_type` VARCHAR(30) NOT NULL,
    `target_id` VARCHAR(60) NULL,
    `target_label` VARCHAR(200) NULL,
    `changes` JSON NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_audit_logs_created_at_idx`(`created_at`),
    INDEX `admin_audit_logs_actor_id_created_at_idx`(`actor_id`, `created_at`),
    INDEX `admin_audit_logs_target_type_created_at_idx`(`target_type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_audit_logs` ADD CONSTRAINT `admin_audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
