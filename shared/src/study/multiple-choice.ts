/**
 * Sinh câu hỏi trắc nghiệm từ một bộ thẻ.
 *
 * Hàm thuần, nhận `random` từ ngoài để test được. Chạy ở backend: đáp án đúng không
 * bao giờ gửi xuống client trước khi người học chọn.
 */

import { MULTIPLE_CHOICE_OPTIONS } from './study.js';

export const ChoiceDirection = {
  /** Hiện từ, chọn nghĩa. */
  WORD_TO_MEANING: 'WORD_TO_MEANING',
  /** Hiện nghĩa, chọn từ. */
  MEANING_TO_WORD: 'MEANING_TO_WORD',
} as const;
export type ChoiceDirection = (typeof ChoiceDirection)[keyof typeof ChoiceDirection];

export interface ChoiceCard {
  id: number;
  word: string;
  meaning: string;
}

export interface MultipleChoiceQuestion {
  direction: ChoiceDirection;
  prompt: string;
  /** Thẻ ứng với từng phương án, đúng thứ tự hiển thị. */
  optionCardIds: number[];
  options: string[];
  correctIndex: number;
}

/**
 * Chuẩn hoá để so trùng nội dung: bỏ hoa/thường và khoảng trắng thừa.
 * "Lời chào" và "lời  chào " là cùng một đáp án.
 */
export function normalizeChoiceText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Xáo trộn Fisher–Yates. Trả mảng mới, không đổi mảng gốc. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

export function pickDirection(random: () => number = Math.random): ChoiceDirection {
  return random() < 0.5 ? ChoiceDirection.WORD_TO_MEANING : ChoiceDirection.MEANING_TO_WORD;
}

/**
 * Dựng một câu trắc nghiệm cho `target`, lấy phương án nhiễu từ `pool` (cùng bộ thẻ).
 *
 * Bỏ qua thẻ nhiễu nếu:
 * - trùng nội dung đáp án với thẻ đích hoặc với một phương án đã chọn — hai phương án
 *   giống hệt nhau thì câu hỏi có hai đáp án đúng;
 * - trùng nội dung ĐỀ với thẻ đích — hai thẻ cùng từ "bank" khác nghĩa thì nghĩa của thẻ
 *   kia cũng đúng với đề "bank", câu hỏi thành mơ hồ.
 *
 * Không đủ phương án nhiễu hợp lệ thì trả null, KHÔNG sinh câu 2–3 lựa chọn: người học
 * đoán 50/50 thì kết quả chấm không nói lên được họ có nhớ hay không.
 */
export function buildMultipleChoice(
  target: ChoiceCard,
  pool: readonly ChoiceCard[],
  direction: ChoiceDirection,
  random: () => number = Math.random,
): MultipleChoiceQuestion | null {
  const answerOf = (card: ChoiceCard): string =>
    direction === ChoiceDirection.WORD_TO_MEANING ? card.meaning : card.word;
  const promptOf = (card: ChoiceCard): string =>
    direction === ChoiceDirection.WORD_TO_MEANING ? card.word : card.meaning;

  const targetPrompt = normalizeChoiceText(promptOf(target));
  const usedAnswers = new Set([normalizeChoiceText(answerOf(target))]);
  const distractors: ChoiceCard[] = [];

  for (const card of shuffle(pool, random)) {
    if (distractors.length === MULTIPLE_CHOICE_OPTIONS - 1) break;
    if (card.id === target.id) continue;
    if (normalizeChoiceText(promptOf(card)) === targetPrompt) continue;

    const answer = normalizeChoiceText(answerOf(card));
    if (usedAnswers.has(answer)) continue;

    usedAnswers.add(answer);
    distractors.push(card);
  }

  if (distractors.length < MULTIPLE_CHOICE_OPTIONS - 1) return null;

  const ordered = shuffle([target, ...distractors], random);
  return {
    direction,
    prompt: promptOf(target),
    optionCardIds: ordered.map((card) => card.id),
    options: ordered.map(answerOf),
    correctIndex: ordered.findIndex((card) => card.id === target.id),
  };
}
