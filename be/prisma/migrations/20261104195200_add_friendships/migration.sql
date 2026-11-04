ALTER TABLE `users`
  ADD COLUMN `public_id` CHAR(8) NULL;

CREATE UNIQUE INDEX `users_public_id_key` ON `users`(`public_id`);

CREATE TABLE `friendships` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `requester_id` INTEGER NOT NULL,
  `addressee_id` INTEGER NOT NULL,
  `pair_key` VARCHAR(21) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `accepted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `friendships_pair_key_key`(`pair_key`),
  INDEX `friendships_addressee_id_status_idx`(`addressee_id`, `status`),
  INDEX `friendships_requester_id_status_idx`(`requester_id`, `status`),
  CONSTRAINT `friendships_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friendships_addressee_id_fkey` FOREIGN KEY (`addressee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
