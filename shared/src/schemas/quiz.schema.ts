import { z } from 'zod';
import { idSchema } from './common.schema.js';

export const createQuizSchema = z.object({
  topicId: idSchema,
  title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(200),
});
export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const createQuizQuestionSchema = z
  .object({
    questionText: z.string().trim().min(1, 'Câu hỏi không được để trống').max(1000),
    options: z.array(z.string().trim().min(1)).min(2, 'Cần ít nhất 2 lựa chọn').max(6),
    /** Chỉ số của đáp án đúng trong mảng options. */
    correctIndex: z.number().int().min(0),
  })
  .refine((data) => data.correctIndex < data.options.length, {
    message: 'Đáp án đúng phải nằm trong danh sách lựa chọn',
    path: ['correctIndex'],
  });
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;

/** Bài nộp của user: mỗi câu hỏi kèm chỉ số lựa chọn đã chọn. */
export const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: idSchema,
        selectedIndex: z.number().int().min(0),
      }),
    )
    .min(1, 'Phải trả lời ít nhất một câu'),
});
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;

export interface QuizResult {
  attemptId: number;
  score: number;
  total: number;
  /** 0-100, đã làm tròn. */
  percentage: number;
  details: { questionId: number; selectedIndex: number; correctIndex: number; isCorrect: boolean }[];
}
