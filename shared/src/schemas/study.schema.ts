import { z } from 'zod';
import type { LocalDate } from '../date/local-date.js';
import type { ChoiceDirection } from '../study/multiple-choice.js';
import {
  MAX_RESPONSE_MS,
  MULTIPLE_CHOICE_OPTIONS,
  ReviewRating,
  STUDY_BATCH_DEFAULT,
  STUDY_BATCH_MAX,
  StudyGroup,
  StudyMode,
  StudySource,
} from '../study/study.js';
import { idSchema } from './common.schema.js';

/**
 * Học, Ôn tập và Cram Mode — chung một bộ API vì cả ba cùng lấy thẻ và chấm theo một cách.
 * Đặc tả: docs/ke-hoach-hoc-on-flashcard.md.
 */

export const studyQuestionsSchema = z
  .object({
    source: z.nativeEnum(StudySource),
    /** Bắt buộc với Học; Ôn tập bỏ trống thì lấy thẻ từ mọi bộ đang học. */
    setId: idSchema.optional(),
    group: z.nativeEnum(StudyGroup),
    mode: z.nativeEnum(StudyMode),
    limit: z.number().int().min(1).max(STUDY_BATCH_MAX).default(STUDY_BATCH_DEFAULT),
  })
  .superRefine((value, ctx) => {
    if (value.source === StudySource.LEARN && value.setId === undefined) {
      ctx.addIssue({ code: 'custom', path: ['setId'], message: 'Chọn bộ thẻ để học' });
    }
    const isCram = value.source === StudySource.CRAM;
    if (value.group === StudyGroup.ALL && !isCram) {
      ctx.addIssue({ code: 'custom', path: ['group'], message: 'Chỉ Cram Mode được ôn toàn bộ bộ thẻ' });
    }
    if (isCram && value.group !== StudyGroup.ALL && value.group !== StudyGroup.WEAK) {
      ctx.addIssue({ code: 'custom', path: ['group'], message: 'Cram Mode chỉ ôn toàn bộ hoặc thẻ yếu' });
    }
    if (value.group === StudyGroup.ALL && value.setId === undefined) {
      ctx.addIssue({ code: 'custom', path: ['setId'], message: 'Chọn bộ thẻ để ôn toàn bộ' });
    }
  });
export type StudyQuestionsInput = z.infer<typeof studyQuestionsSchema>;

export const submitAnswerSchema = z
  .object({
    /** Mã câu hỏi do server cấp. Client không đọc được nội dung bên trong. */
    token: z.string().min(1).max(2000),
    /** Chế độ Flashcard. */
    rating: z.nativeEnum(ReviewRating).optional(),
    /** Chế độ trắc nghiệm. */
    choiceIndex: z.number().int().min(0).max(MULTIPLE_CHOICE_OPTIONS - 1).optional(),
    responseMs: z.number().int().min(0).max(MAX_RESPONSE_MS).optional(),
    /** Chỉ phiên Học gửi — dùng để ghi một dòng "hoàn thành phiên" khi kết thúc. */
    sessionKey: z.string().uuid().optional(),
  })
  .refine((value) => (value.rating === undefined) !== (value.choiceIndex === undefined), {
    message: 'Gửi đúng một trong hai: đánh giá hoặc phương án đã chọn',
  });
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export const finishSessionSchema = z.object({
  sessionKey: z.string().uuid(),
});
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;

export const reviewHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type ReviewHistoryQueryInput = z.infer<typeof reviewHistoryQuerySchema>;

// --- Kiểu dữ liệu trả về ---

export interface FlashcardQuestion {
  kind: typeof StudyMode.FLASHCARD;
  token: string;
  setId: number;
  setName: string;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
}

/** Câu trắc nghiệm — KHÔNG có thẻ nào là đáp án đúng. */
export interface MultipleChoiceQuestionView {
  kind: typeof StudyMode.MULTIPLE_CHOICE;
  token: string;
  setId: number;
  setName: string;
  direction: ChoiceDirection;
  prompt: string;
  /** Chỉ có ở chiều từ → nghĩa: phiên âm thuộc về từ đang hỏi. */
  phonetic: string | null;
  options: string[];
}

export type StudyQuestion = FlashcardQuestion | MultipleChoiceQuestionView;

export interface StudyQuestionsResult {
  questions: StudyQuestion[];
  /** Thẻ bị bỏ qua vì bộ của nó không đủ thẻ để sinh câu trắc nghiệm. */
  skipped: number;
}

export interface AnswerResult {
  /** Null ở chế độ Flashcard — người học tự chấm. */
  isCorrect: boolean | null;
  /** Null ở chế độ Flashcard. */
  correctIndex: number | null;
  correctAnswer: string;
  /** Null ở Cram Mode — lịch ôn không đổi. */
  nextReviewDate: LocalDate | null;
  intervalDays: number | null;
  /** true nghĩa là câu này đã được ghi từ trước (bấm hai lần, mạng gửi lại). */
  duplicate: boolean;
}

export interface FinishSessionResult {
  /** false khi phiên không có câu nào được ghi, hoặc đã kết thúc từ trước. */
  logged: boolean;
  answered: number;
  correct: number;
}

/** Số thẻ trong bốn nhóm của màn Ôn tập, tính trên mọi bộ người học đang học. */
export interface StudyOverview {
  new: number;
  due: number;
  overdue: number;
  weak: number;
  /** Ngày ôn gần nhất sắp tới. Null nếu chưa học thẻ nào. */
  nextReviewDate: LocalDate | null;
}

export interface StudyStats {
  learning: {
    sessions: number;
    cardsLearned: number;
    answered: number;
    correct: number;
    wrong: number;
    accuracy: number;
    timeMs: number;
  };
  review: {
    totalReviews: number;
    due: number;
    overdue: number;
    weak: number;
    mastered: number;
    learning: number;
    accuracy: number;
    nextReviewDate: LocalDate | null;
  };
}

export interface CardReviewRow {
  id: number;
  setId: number;
  setName: string;
  word: string;
  meaning: string;
  mode: StudyMode;
  isCorrect: boolean;
  intervalBefore: number;
  intervalAfter: number;
  reviewedAt: string;
}
