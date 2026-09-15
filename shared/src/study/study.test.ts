import { describe, expect, it } from 'vitest';
import { ReviewQuality } from '../constants/enums.js';
import {
  RATING_QUALITY,
  ReviewRating,
  accuracyPercent,
  applyAnswerCounters,
  dueStatusOf,
  isMastered,
  isPassingQuality,
  isWeakCard,
  qualityForMultipleChoice,
} from './study.js';

const EMPTY = { lapses: 0, correctCount: 0, wrongCount: 0 };

describe('quy đổi kết quả sang ReviewQuality', () => {
  it('bốn nút giữ đúng ánh xạ của màn ôn flashcard cũ', () => {
    expect(RATING_QUALITY[ReviewRating.AGAIN]).toBe(ReviewQuality.BLACKOUT);
    expect(RATING_QUALITY[ReviewRating.HARD]).toBe(ReviewQuality.CORRECT_HARD);
    expect(RATING_QUALITY[ReviewRating.GOOD]).toBe(ReviewQuality.CORRECT);
    expect(RATING_QUALITY[ReviewRating.EASY]).toBe(ReviewQuality.PERFECT);
  });

  it('trắc nghiệm đúng ra 4, không phải 5', () => {
    expect(qualityForMultipleChoice(true)).toBe(ReviewQuality.CORRECT);
  });

  it('trắc nghiệm sai ra điểm dưới ngưỡng qua', () => {
    expect(isPassingQuality(qualityForMultipleChoice(false))).toBe(false);
  });

  it('Hard vẫn tính là nhớ được', () => {
    expect(isPassingQuality(RATING_QUALITY[ReviewRating.HARD])).toBe(true);
  });
});

describe('applyAnswerCounters', () => {
  it('trả lời đúng chỉ tăng số lần đúng', () => {
    expect(applyAnswerCounters(EMPTY, ReviewQuality.CORRECT)).toEqual({ lapses: 0, correctCount: 1, wrongCount: 0 });
  });

  it('trả lời sai tăng cả số lần quên và số lần sai', () => {
    expect(applyAnswerCounters(EMPTY, ReviewQuality.BLACKOUT)).toEqual({ lapses: 1, correctCount: 0, wrongCount: 1 });
  });

  it('không đổi bộ đếm truyền vào', () => {
    const before = { ...EMPTY };
    applyAnswerCounters(before, ReviewQuality.BLACKOUT);
    expect(before).toEqual(EMPTY);
  });
});

describe('isWeakCard', () => {
  it('quên 2 lần là yếu dù tỷ lệ sai thấp', () => {
    expect(isWeakCard({ lapses: 2, correctCount: 20, wrongCount: 2 })).toBe(true);
  });

  it('quên 1 lần, làm chưa đủ 3 lần thì chưa yếu', () => {
    expect(isWeakCard({ lapses: 1, correctCount: 0, wrongCount: 1 })).toBe(false);
  });

  it('tỷ lệ sai đúng 40% trên 5 lần là yếu', () => {
    expect(isWeakCard({ lapses: 1, correctCount: 3, wrongCount: 2 })).toBe(true);
  });

  it('tỷ lệ sai dưới 40% không yếu', () => {
    expect(isWeakCard({ lapses: 1, correctCount: 4, wrongCount: 1 })).toBe(false);
  });

  it('thẻ chưa làm lần nào không yếu', () => {
    expect(isWeakCard(EMPTY)).toBe(false);
  });
});

describe('dueStatusOf', () => {
  it('trước hôm nay là quá hạn', () => {
    expect(dueStatusOf('2026-09-14', '2026-09-15')).toBe('OVERDUE');
  });

  it('đúng hôm nay là tới hạn', () => {
    expect(dueStatusOf('2026-09-15', '2026-09-15')).toBe('DUE');
  });

  it('sau hôm nay là chưa tới hạn', () => {
    expect(dueStatusOf('2026-09-16', '2026-09-15')).toBe('LATER');
  });
});

describe('isMastered', () => {
  it('cần đủ cả số lần nhớ lẫn khoảng cách', () => {
    expect(isMastered({ repetitions: 5, intervalDays: 21 })).toBe(true);
    expect(isMastered({ repetitions: 4, intervalDays: 30 })).toBe(false);
    expect(isMastered({ repetitions: 6, intervalDays: 20 })).toBe(false);
  });
});

describe('accuracyPercent', () => {
  it('chưa làm câu nào thì 0', () => {
    expect(accuracyPercent(0, 0)).toBe(0);
  });

  it('làm tròn tới phần trăm', () => {
    expect(accuracyPercent(2, 3)).toBe(67);
  });
});
