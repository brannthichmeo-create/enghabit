/**
 * Thuật toán lặp cách quãng SM-2 (SuperMemo 2) cho ôn tập flashcard.
 *
 * Định nghĩa đúng một lần tại đây:
 * - be: chấm kết quả review, tính ngày ôn kế tiếp để lưu vào UserVocabProgress
 * - fe/mobile: preview "lần ôn tới là khi nào" ngay trên UI mà không cần gọi API
 */

import { addDays, type LocalDate } from '../date/local-date.js';
import { ReviewQuality } from '../constants/enums.js';

export interface SrsState {
  /** Số lần ôn đúng liên tiếp. Reset về 0 khi trả lời sai. */
  repetitions: number;
  /** Khoảng cách tới lần ôn kế tiếp, tính bằng ngày. */
  intervalDays: number;
  /** Hệ số dễ nhớ. Càng cao thì khoảng ôn giãn ra càng nhanh. */
  easeFactor: number;
  nextReviewDate: LocalDate;
}

/** Ngưỡng dưới của easeFactor theo đặc tả SM-2 — không để khoảng ôn co lại vô hạn. */
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;

/** Điểm từ 3 trở lên được coi là nhớ được. */
const PASSING_QUALITY = ReviewQuality.CORRECT_HARD;

/** Trạng thái SRS cho một từ vựng vừa được thêm vào danh sách học. */
export function initialSrsState(today: LocalDate): SrsState {
  return {
    repetitions: 0,
    intervalDays: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    nextReviewDate: today,
  };
}

/**
 * Tính trạng thái SRS mới sau một lần ôn.
 *
 * @param state   trạng thái hiện tại của từ đó với user này
 * @param quality mức độ nhớ do user tự đánh giá (0-5)
 * @param today   ngày local của user, dùng làm mốc tính nextReviewDate
 */
export function reviewCard(state: SrsState, quality: ReviewQuality, today: LocalDate): SrsState {
  const easeFactor = nextEaseFactor(state.easeFactor, quality);

  // Trả lời sai: học lại từ đầu, ôn lại ngay ngày hôm sau.
  if (quality < PASSING_QUALITY) {
    return { repetitions: 0, intervalDays: 1, easeFactor, nextReviewDate: addDays(today, 1) };
  }

  const repetitions = state.repetitions + 1;
  const intervalDays = nextInterval(repetitions, state.intervalDays, easeFactor);

  return { repetitions, intervalDays, easeFactor, nextReviewDate: addDays(today, intervalDays) };
}

/** Công thức easeFactor của SM-2, chặn dưới ở 1.3. */
function nextEaseFactor(current: number, quality: ReviewQuality): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return Math.max(MIN_EASE_FACTOR, Number((current + delta).toFixed(4)));
}

/** Hai lần đầu dùng khoảng cố định 1 và 6 ngày, từ lần thứ ba mới nhân theo easeFactor. */
function nextInterval(repetitions: number, previousInterval: number, easeFactor: number): number {
  if (repetitions === 1) return 1;
  if (repetitions === 2) return 6;
  return Math.round(previousInterval * easeFactor);
}

/** Từ này đã tới hạn ôn chưa. */
export function isDue(state: SrsState, today: LocalDate): boolean {
  return state.nextReviewDate <= today;
}
