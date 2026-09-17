-- Cửa hàng vật phẩm, ví cá nhân và kho vật phẩm.
--
-- Chỉ THÊM bảng và thêm một giá trị vào enum CoinReason — không xoá cột, không đổi kiểu
-- dữ liệu cũ, nên chạy an toàn trên DB dùng chung.
--
-- Ví KHÔNG có bảng mới: số dư vẫn là SUM(amount) của `coin_transactions` và lịch sử
-- chính là các dòng của bảng đó. Thêm cột số dư là tạo thêm một chỗ có thể lệch với sổ
-- cái mà không nhanh hơn đáng kể (xem docs/ke-hoach-cua-hang-vat-pham.md).

-- AlterTable — lý do chi xu mới cho sổ cái
ALTER TABLE `coin_transactions` MODIFY `reason` ENUM('DAILY_CHECKIN', 'MISSION_CLAIM', 'STREAK_FREEZE_PURCHASE', 'SHOP_PURCHASE') NOT NULL;

-- CreateTable
CREATE TABLE `shop_item_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(30) NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `description` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shop_item_types_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `price` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `shop_items_type_id_is_active_sort_order_idx`(`type_id`, `is_active`, `sort_order`),
    INDEX `shop_items_created_by_id_fkey`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable — ảnh tách bảng riêng như `user_avatars`: danh sách cửa hàng là truy vấn
-- chạy nhiều nhất, để chung thì mỗi lần liệt kê kéo theo hàng megabyte không dùng tới.
CREATE TABLE `shop_item_images` (
    `item_id` INTEGER NOT NULL,
    `data` MEDIUMBLOB NOT NULL,
    `mime_type` VARCHAR(30) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `price_paid` INTEGER NOT NULL,
    `purchased_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_items_item_id_idx`(`item_id`),
    UNIQUE INDEX `user_items_user_id_item_id_key`(`user_id`, `item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_item_favorites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_item_favorites_item_id_idx`(`item_id`),
    UNIQUE INDEX `user_item_favorites_user_id_item_id_key`(`user_id`, `item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable — khoá chính (user_id, type_id) là thứ ép "mỗi loại chỉ dùng một vật phẩm".
-- Ép bằng mã trong service thì hai request cùng lúc để lại hai dòng cho cùng một loại.
CREATE TABLE `user_equipped_items` (
    `user_id` INTEGER NOT NULL,
    `type_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_equipped_items_item_id_idx`(`item_id`),
    INDEX `user_equipped_items_type_id_idx`(`type_id`),
    PRIMARY KEY (`user_id`, `type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shop_items` ADD CONSTRAINT `shop_items_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `shop_item_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_items` ADD CONSTRAINT `shop_items_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_item_images` ADD CONSTRAINT `shop_item_images_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — RESTRICT: đã có người mua thì vật phẩm không xoá cứng được nữa, chỉ
-- ngừng bán bằng `is_active`. Xoá thứ người dùng đã trả xu là thiệt hại không đảo ngược.
ALTER TABLE `user_items` ADD CONSTRAINT `user_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_items` ADD CONSTRAINT `user_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_item_favorites` ADD CONSTRAINT `user_item_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_item_favorites` ADD CONSTRAINT `user_item_favorites_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_equipped_items` ADD CONSTRAINT `user_equipped_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_equipped_items` ADD CONSTRAINT `user_equipped_items_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `shop_item_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_equipped_items` ADD CONSTRAINT `user_equipped_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
