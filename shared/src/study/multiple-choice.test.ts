import { describe, expect, it } from 'vitest';
import { ChoiceDirection, buildMultipleChoice, normalizeChoiceText, shuffle, type ChoiceCard } from './multiple-choice.js';

/** Bộ sinh số giả ngẫu nhiên có hạt giống — kết quả test không đổi giữa các lần chạy. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const CARDS: ChoiceCard[] = [
  { id: 1, word: 'greeting', meaning: 'lời chào' },
  { id: 2, word: 'appointment', meaning: 'cuộc hẹn' },
  { id: 3, word: 'grocery', meaning: 'hàng tạp hoá' },
  { id: 4, word: 'neighbour', meaning: 'hàng xóm' },
  { id: 5, word: 'weather', meaning: 'thời tiết' },
];

const target = CARDS[0] as ChoiceCard;

describe('buildMultipleChoice', () => {
  it('sinh đủ 4 phương án, đúng một đáp án', () => {
    const q = buildMultipleChoice(target, CARDS, ChoiceDirection.WORD_TO_MEANING, seeded(1));
    expect(q).not.toBeNull();
    expect(q?.options).toHaveLength(4);
    expect(q?.options[q.correctIndex]).toBe('lời chào');
    expect(q?.optionCardIds[q.correctIndex]).toBe(1);
  });

  it('chiều từ → nghĩa hiện từ làm đề', () => {
    const q = buildMultipleChoice(target, CARDS, ChoiceDirection.WORD_TO_MEANING, seeded(2));
    expect(q?.prompt).toBe('greeting');
  });

  it('chiều nghĩa → từ hiện nghĩa làm đề và phương án là từ', () => {
    const q = buildMultipleChoice(target, CARDS, ChoiceDirection.MEANING_TO_WORD, seeded(3));
    expect(q?.prompt).toBe('lời chào');
    expect(q?.options[q.correctIndex]).toBe('greeting');
  });

  it('phương án không trùng nhau', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const q = buildMultipleChoice(target, CARDS, ChoiceDirection.WORD_TO_MEANING, seeded(seed));
      const normalized = (q?.options ?? []).map(normalizeChoiceText);
      expect(new Set(normalized).size).toBe(normalized.length);
    }
  });

  it('bộ dưới 4 thẻ không sinh được câu hỏi', () => {
    expect(buildMultipleChoice(target, CARDS.slice(0, 3), ChoiceDirection.WORD_TO_MEANING)).toBeNull();
  });

  it('thẻ trùng nội dung đáp án không làm phương án nhiễu', () => {
    const pool: ChoiceCard[] = [
      target,
      { id: 10, word: 'hello', meaning: 'Lời  chào ' },
      { id: 11, word: 'hi', meaning: 'lời chào' },
      { id: 2, word: 'appointment', meaning: 'cuộc hẹn' },
      { id: 3, word: 'grocery', meaning: 'hàng tạp hoá' },
    ];
    // Chỉ còn 2 phương án nhiễu hợp lệ nên phải trả null
    expect(buildMultipleChoice(target, pool, ChoiceDirection.WORD_TO_MEANING)).toBeNull();
  });

  it('thẻ trùng nội dung đề không làm phương án nhiễu — tránh câu hỏi mơ hồ', () => {
    const pool: ChoiceCard[] = [...CARDS, { id: 20, word: 'Greeting', meaning: 'thiệp chúc mừng' }];
    for (let seed = 0; seed < 50; seed += 1) {
      const q = buildMultipleChoice(target, pool, ChoiceDirection.WORD_TO_MEANING, seeded(seed));
      expect(q?.optionCardIds).not.toContain(20);
    }
  });

  it('không tính chính thẻ đích là phương án nhiễu', () => {
    const q = buildMultipleChoice(target, CARDS, ChoiceDirection.WORD_TO_MEANING, seeded(7));
    expect(q?.optionCardIds.filter((id) => id === 1)).toHaveLength(1);
  });
});

describe('shuffle', () => {
  it('giữ nguyên phần tử và không đổi mảng gốc', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, seeded(9));
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});
