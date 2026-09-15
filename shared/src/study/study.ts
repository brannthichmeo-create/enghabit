/**
 * Quy tắc Học và Ôn tập bộ thẻ — domain logic dùng chung cho be / fe / mobile.
 *
 * `be` dùng để chấm và phân nhóm chính thức; `fe` dùng để hiển thị nhãn và xem trước.
 * Thuật toán giãn cách vẫn là SM-2 ở `shared/srs` — file này chỉ quy đổi kết quả sang
 * đầu vào của SM-2 và định nghĩa các nhóm thẻ. Đặc tả: docs/ke-hoach-hoc-on-flashcard.md.
 */

import { ReviewQuality } from '../constants/enums.js';
import type { LocalDate } from '../date/local-date.js';

/** Hai cách làm một thẻ. Không có dạng nào khác (xem mục "Không làm" của đặc tả). */
export const StudyMode = {
  FLASHCARD: 'FLASHCARD',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
} as const;
export type StudyMode = (typeof StudyMode)[keyof typeof StudyMode];

/** Nhóm thẻ người học tự chọn để học. `ALL` chỉ dùng cho Cram Mode. */
export const StudyGroup = {
  NEW: 'NEW',
  DUE: 'DUE',
  OVERDUE: 'OVERDUE',
  WEAK: 'WEAK',
  ALL: 'ALL',
} as const;
export type StudyGroup = (typeof StudyGroup)[keyof typeof StudyGroup];

/**
 * Nơi phiên bắt đầu. Quyết định kết quả có được ghi hay không:
 * - LEARN, REVIEW: cập nhật SRS, ghi lịch sử và ActivityLog
 * - CRAM: không ghi gì cả
 */
export const StudySource = {
  LEARN: 'LEARN',
  REVIEW: 'REVIEW',
  CRAM: 'CRAM',
} as const;
export type StudySource = (typeof StudySource)[keyof typeof StudySource];

/** Bốn nút tự chấm ở chế độ Flashcard. */
export const ReviewRating = {
  AGAIN: 'AGAIN',
  HARD: 'HARD',
  GOOD: 'GOOD',
  EASY: 'EASY',
} as const;
export type ReviewRating = (typeof ReviewRating)[keyof typeof ReviewRating];

/**
 * Nút đánh giá → đầu vào SM-2. Giữ đúng ánh xạ màn ôn flashcard cũ đã dùng, để lịch ôn
 * của người dùng hiện có không đổi nghĩa giữa hai phiên bản.
 */
export const RATING_QUALITY: Record<ReviewRating, ReviewQuality> = {
  [ReviewRating.AGAIN]: ReviewQuality.BLACKOUT,
  [ReviewRating.HARD]: ReviewQuality.CORRECT_HARD,
  [ReviewRating.GOOD]: ReviewQuality.CORRECT,
  [ReviewRating.EASY]: ReviewQuality.PERFECT,
};

/**
 * Kết quả trắc nghiệm → đầu vào SM-2.
 *
 * Đúng chỉ được 4, không được 5: chọn 1 trong 4 phương án có 25% đoán mò, nên một lần
 * chọn đúng không chứng minh được "nhớ ngay lập tức" như nút Easy.
 */
export function qualityForMultipleChoice(isCorrect: boolean): ReviewQuality {
  return isCorrect ? ReviewQuality.CORRECT : ReviewQuality.INCORRECT;
}

/** Cùng ngưỡng với SM-2: từ 3 trở lên là nhớ được. */
export function isPassingQuality(quality: ReviewQuality): boolean {
  return quality >= ReviewQuality.CORRECT_HARD;
}

// ---------------------------------------------------------------------------
// Bộ đếm đúng/sai — nguồn dữ liệu của nhóm Yếu
// ---------------------------------------------------------------------------

export interface CardCounters {
  /** Số lần quên (quality dưới 3). */
  lapses: number;
  correctCount: number;
  wrongCount: number;
}

/** Bộ đếm sau một lần trả lời. Không đổi bộ đếm cũ. */
export function applyAnswerCounters(counters: CardCounters, quality: ReviewQuality): CardCounters {
  if (isPassingQuality(quality)) {
    return { ...counters, correctCount: counters.correctCount + 1 };
  }
  return {
    lapses: counters.lapses + 1,
    correctCount: counters.correctCount,
    wrongCount: counters.wrongCount + 1,
  };
}

/** Quên từ 2 lần trở lên là thẻ yếu. */
export const WEAK_MIN_LAPSES = 2;
/** Tỷ lệ sai chỉ có ý nghĩa khi đã làm đủ số lần này — sai 1/1 chưa nói lên điều gì. */
export const WEAK_MIN_ATTEMPTS = 3;
export const WEAK_WRONG_RATIO = 0.4;

/** Thẻ yếu: quên nhiều lần, hoặc tỷ lệ sai cao trên đủ số lần làm. */
export function isWeakCard(counters: CardCounters): boolean {
  if (counters.lapses >= WEAK_MIN_LAPSES) return true;
  const attempts = counters.correctCount + counters.wrongCount;
  return attempts >= WEAK_MIN_ATTEMPTS && counters.wrongCount / attempts >= WEAK_WRONG_RATIO;
}

// ---------------------------------------------------------------------------
// Tới hạn / Quá hạn
// ---------------------------------------------------------------------------

export type DueStatus = 'OVERDUE' | 'DUE' | 'LATER';

/**
 * Thẻ đã có lịch ôn đang ở đâu so với hôm nay.
 *
 * `today` BẮT BUỘC là ngày theo timezone của người học (`todayLocalDate`), không phải
 * ngày máy chủ. So sánh chuỗi 'YYYY-MM-DD' chính là so sánh ngày.
 */
export function dueStatusOf(nextReviewDate: LocalDate, today: LocalDate): DueStatus {
  if (nextReviewDate < today) return 'OVERDUE';
  if (nextReviewDate === today) return 'DUE';
  return 'LATER';
}

/** Ngưỡng "đã thuộc". Suy từ SM-2, không lưu thành cột riêng. */
export const MASTERED_MIN_REPETITIONS = 5;
export const MASTERED_MIN_INTERVAL_DAYS = 21;

export function isMastered(state: { repetitions: number; intervalDays: number }): boolean {
  return state.repetitions >= MASTERED_MIN_REPETITIONS && state.intervalDays >= MASTERED_MIN_INTERVAL_DAYS;
}

/** Tỷ lệ phần trăm đúng, làm tròn. Chưa làm câu nào thì 0. */
export function accuracyPercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

// ---------------------------------------------------------------------------
// Giới hạn
// ---------------------------------------------------------------------------

/** Số phương án của một câu trắc nghiệm. */
export const MULTIPLE_CHOICE_OPTIONS = 4;
/** Bộ ít hơn số thẻ này thì không đủ phương án nhiễu — chỉ có chế độ Flashcard. */
export const MIN_CARDS_FOR_MULTIPLE_CHOICE = MULTIPLE_CHOICE_OPTIONS;

/** Số thẻ một lượt tải. Hết lượt thì người học tải lượt mới. */
export const STUDY_BATCH_DEFAULT = 20;
export const STUDY_BATCH_MAX = 50;

/** Thời gian trả lời lớn hơn mức này coi như bỏ đi làm việc khác, không tính vào thời gian học. */
export const MAX_RESPONSE_MS = 10 * 60 * 1000;

export const STUDY_SET_SEARCH_MAX_LENGTH = 100;

/**
 * Số thẻ tối đa một lần nhập từ file. Trần thân request ở BE (app.ts) tính theo con số
 * này — tăng thì phải tính lại trần đó.
 */
export const CARD_IMPORT_MAX_ROWS = 500;
/** Kích thước file nhập tối đa. File đọc ngay trên trình duyệt, không tải lên server. */
export const CARD_IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;
