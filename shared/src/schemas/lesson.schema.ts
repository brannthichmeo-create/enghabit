import { z } from 'zod';
import { ExerciseType } from '../constants/exercise.js';
import { idSchema } from './common.schema.js';

/**
 * Lộ trình học và bài tập.
 *
 * Bài học KHÔNG lưu thành nội dung trong DB — nó được sinh ra từ danh sách từ vựng
 * của chủ đề theo quy tắc cố định. DB chỉ lưu tiến độ và lỗi sai. Nhờ vậy admin
 * chỉ cần quản lý từ vựng như cũ, thêm từ là lộ trình tự dài ra.
 */

// --- Đề bài gửi cho client ---

interface ExerciseBase {
  /** Định danh trong phiên học, dùng làm key khi nộp bài. */
  id: string;
  type: ExerciseType;
  vocabularyId: number;
  prompt: string;
}

export interface ChoiceExercise extends ExerciseBase {
  type: typeof ExerciseType.CHOOSE_MEANING | typeof ExerciseType.CHOOSE_WORD;
  /** Nội dung hiển thị (từ hoặc nghĩa, tuỳ dạng). */
  question: string;
  options: string[];
  phonetic?: string | null;
}

export interface MatchPairsExercise extends ExerciseBase {
  type: typeof ExerciseType.MATCH_PAIRS;
  /** Các từ ở cột trái và nghĩa ở cột phải, đã xáo trộn độc lập. */
  words: { id: number; text: string }[];
  meanings: { id: number; text: string }[];
}

export interface ArrangeWordsExercise extends ExerciseBase {
  type: typeof ExerciseType.ARRANGE_WORDS;
  /** Các mảnh câu đã xáo trộn. */
  tokens: string[];
  /** Nghĩa của câu, làm gợi ý. */
  hint: string;
}

export interface FillBlankExercise extends ExerciseBase {
  type: typeof ExerciseType.FILL_BLANK;
  /** Câu có chỗ trống, đánh dấu bằng "___". */
  sentence: string;
  options: string[];
  hint: string;
}

export interface TypeWordExercise extends ExerciseBase {
  type: typeof ExerciseType.TYPE_WORD;
  question: string;
  /** Chữ cái đầu, để bài không quá khó. */
  firstLetter: string;
}

/**
 * Bài nghe.
 *
 * `speakText` BẮT BUỘC phải gửi xuống client vì giọng đọc của trình duyệt chạy ở
 * phía client — không có chữ thì không đọc được. Đánh đổi: người dùng mở DevTools
 * có thể thấy đáp án.
 *
 * Chấp nhận đánh đổi này vì: (1) giải pháp thay thế là tự tạo hàng trăm file âm
 * thanh, quá tốn cho quy mô dự án; (2) việc CHẤM ĐIỂM vẫn ở backend nên không thể
 * làm giả kết quả; (3) người cố tình xem đáp án chỉ tự hại việc học của mình.
 *
 * Giao diện TUYỆT ĐỐI không được hiển thị `speakText` — trừ khi trình duyệt không
 * đọc được, lúc đó hiện chữ còn hơn để người học kẹt.
 */
export interface ListenExercise extends ExerciseBase {
  type: typeof ExerciseType.LISTEN_TYPE | typeof ExerciseType.LISTEN_CHOOSE;
  /** Chữ để trình duyệt đọc. Không được render ra màn hình. */
  speakText: string;
  /** Đường dẫn audio do admin nhập; null thì client tự đọc bằng trình duyệt. */
  audioUrl: string | null;
  /** Chỉ có ở dạng chọn nghĩa. */
  options?: string[];
  /** Chỉ có ở dạng gõ lại: số chữ cái, để người học ước lượng độ dài. */
  letterCount?: number;
}

export type Exercise =
  | ChoiceExercise
  | ListenExercise
  | MatchPairsExercise
  | ArrangeWordsExercise
  | FillBlankExercise
  | TypeWordExercise;

// --- Lộ trình ---

export interface LessonSummary {
  topicId: number;
  /** Thứ tự bài trong chủ đề, bắt đầu từ 0. */
  index: number;
  title: string;
  wordCount: number;
  isCompleted: boolean;
  /** Mở khoá khi bài trước đã hoàn thành. Bài đầu tiên của chủ đề luôn mở. */
  isUnlocked: boolean;
  bestScore: number | null;
}

export interface PathTopic {
  topicId: number;
  name: string;
  description: string | null;
  level: string;
  lessons: LessonSummary[];
  completedLessons: number;
}

export interface LessonDetail {
  topicId: number;
  index: number;
  title: string;
  exercises: Exercise[];
}

// --- Nộp bài ---

/**
 * Client gửi ĐÁP ÁN ĐÃ CHỌN, không gửi đúng/sai.
 *
 * Backend tự chấm bằng cách đối chiếu với bản ghi từ vựng — client không được
 * quyết định mình đúng hay sai, vì kết quả đó ảnh hưởng tới streak và thống kê.
 */
export const submitLessonSchema = z.object({
  topicId: idSchema,
  index: z.number().int().min(0),
  answers: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        vocabularyId: idSchema,
        type: z.nativeEnum(ExerciseType),
        /** Đáp án dạng chữ, dùng cho mọi dạng trừ ghép cặp. */
        value: z.string().max(500).optional(),
        /** Đáp án của bài ghép cặp: danh sách cặp từ - nghĩa mà user đã nối. */
        pairs: z.array(z.object({ wordId: idSchema, meaningId: idSchema })).max(10).optional(),
      }),
    )
    .min(1, 'Phải có ít nhất một câu trả lời'),
});
export type SubmitLessonInput = z.infer<typeof submitLessonSchema>;

export interface LessonResult {
  correct: number;
  total: number;
  percentage: number;
  passed: boolean;
  /** Kết quả từng câu do backend chấm, để client hiện lại chỗ sai. */
  details: { exerciseId: string; isCorrect: boolean }[];
  /** Bài kế tiếp vừa được mở khoá, nếu có. */
  nextLesson: { topicId: number; index: number } | null;
}

// --- Ôn lại câu sai ---

export interface MistakeItem {
  vocabularyId: number;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  topicName: string;
  /** Số lần trả lời sai từ này mà chưa sửa được. */
  timesWrong: number;
}

export const practiceMistakesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type PracticeMistakesInput = z.infer<typeof practiceMistakesSchema>;
