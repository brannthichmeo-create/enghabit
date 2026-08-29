import { z } from 'zod';
import { ReviewQuality, VocabLevel } from '../constants/enums.js';
import { idSchema } from './common.schema.js';

export const createTopicSchema = z.object({
  name: z.string().trim().min(1, 'Tên chủ đề không được để trống').max(120),
  description: z.string().trim().max(1000).optional(),
  level: z.nativeEnum(VocabLevel),
});
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = createTopicSchema.partial();
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

export const createVocabularySchema = z.object({
  topicId: idSchema,
  word: z.string().trim().min(1, 'Từ không được để trống').max(100),
  meaning: z.string().trim().min(1, 'Nghĩa không được để trống').max(500),
  phonetic: z.string().trim().max(100).optional(),
  example: z.string().trim().max(500).optional(),
  audioUrl: z.string().url('Đường dẫn audio không hợp lệ').max(500).optional(),
});
export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;

export const updateVocabularySchema = createVocabularySchema.partial().omit({ topicId: true });
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;

/** Đánh dấu đã học một từ — đưa từ đó vào danh sách ôn tập SRS. */
export const learnVocabularySchema = z.object({
  vocabularyId: idSchema,
});
export type LearnVocabularyInput = z.infer<typeof learnVocabularySchema>;

/** Gửi kết quả một lần ôn flashcard. */
export const reviewFlashcardSchema = z.object({
  vocabularyId: idSchema,
  quality: z.nativeEnum(ReviewQuality),
});
export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
