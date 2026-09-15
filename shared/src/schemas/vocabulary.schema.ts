import { z } from 'zod';
import { VocabLevel } from '../constants/enums.js';
import { idSchema } from './common.schema.js';

/**
 * Soạn bộ thẻ "Hệ thống" ở khu quản trị. Bộ người học tự tạo dùng study-set.schema.ts.
 */

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
