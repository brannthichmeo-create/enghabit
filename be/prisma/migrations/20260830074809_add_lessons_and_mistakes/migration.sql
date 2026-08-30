-- CreateTable
CREATE TABLE `lesson_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `topic_id` INTEGER NOT NULL,
    `lesson_index` INTEGER NOT NULL,
    `best_score` INTEGER NOT NULL DEFAULT 0,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lesson_progress_user_id_topic_id_idx`(`user_id`, `topic_id`),
    UNIQUE INDEX `lesson_progress_user_id_topic_id_lesson_index_key`(`user_id`, `topic_id`, `lesson_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mistakes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `vocabulary_id` INTEGER NOT NULL,
    `exercise_type` ENUM('CHOOSE_MEANING', 'CHOOSE_WORD', 'MATCH_PAIRS', 'ARRANGE_WORDS', 'FILL_BLANK', 'TYPE_WORD') NOT NULL,
    `times_wrong` INTEGER NOT NULL DEFAULT 1,
    `times_correct` INTEGER NOT NULL DEFAULT 0,
    `last_wrong_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mistakes_user_id_last_wrong_at_idx`(`user_id`, `last_wrong_at`),
    UNIQUE INDEX `mistakes_user_id_vocabulary_id_exercise_type_key`(`user_id`, `vocabulary_id`, `exercise_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mistakes` ADD CONSTRAINT `mistakes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mistakes` ADD CONSTRAINT `mistakes_vocabulary_id_fkey` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabularies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
