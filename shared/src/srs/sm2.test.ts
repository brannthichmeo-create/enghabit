import { describe, expect, it } from 'vitest';
import { ReviewQuality } from '../constants/enums.js';
import { initialSrsState, isDue, reviewCard } from './sm2.js';

const TODAY = '2026-03-10';

describe('reviewCard', () => {
  it('lần ôn đúng đầu tiên đặt khoảng cách 1 ngày', () => {
    const next = reviewCard(initialSrsState(TODAY), ReviewQuality.CORRECT, TODAY);
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.nextReviewDate).toBe('2026-03-11');
  });

  it('lần ôn đúng thứ hai đặt khoảng cách 6 ngày', () => {
    let state = reviewCard(initialSrsState(TODAY), ReviewQuality.CORRECT, TODAY);
    state = reviewCard(state, ReviewQuality.CORRECT, '2026-03-11');
    expect(state.intervalDays).toBe(6);
    expect(state.nextReviewDate).toBe('2026-03-17');
  });

  it('từ lần thứ ba trở đi khoảng cách được nhân theo easeFactor', () => {
    let state = reviewCard(initialSrsState(TODAY), ReviewQuality.CORRECT, TODAY);
    state = reviewCard(state, ReviewQuality.CORRECT, '2026-03-11');
    const third = reviewCard(state, ReviewQuality.CORRECT, '2026-03-17');
    expect(third.intervalDays).toBe(Math.round(6 * third.easeFactor));
  });

  it('trả lời sai reset repetitions và hẹn ôn lại ngày mai', () => {
    let state = reviewCard(initialSrsState(TODAY), ReviewQuality.CORRECT, TODAY);
    state = reviewCard(state, ReviewQuality.CORRECT, '2026-03-11');
    const failed = reviewCard(state, ReviewQuality.INCORRECT, '2026-03-17');
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(1);
    expect(failed.nextReviewDate).toBe('2026-03-18');
  });

  it('easeFactor không bao giờ xuống dưới 1.3', () => {
    let state = initialSrsState(TODAY);
    for (let i = 0; i < 10; i += 1) {
      state = reviewCard(state, ReviewQuality.BLACKOUT, TODAY);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('trả lời dễ làm easeFactor tăng, trả lời khó làm giảm', () => {
    const base = initialSrsState(TODAY);
    expect(reviewCard(base, ReviewQuality.PERFECT, TODAY).easeFactor).toBeGreaterThan(base.easeFactor);
    expect(reviewCard(base, ReviewQuality.CORRECT_HARD, TODAY).easeFactor).toBeLessThan(base.easeFactor);
  });
});

describe('isDue', () => {
  it('từ mới thêm là tới hạn ngay', () => {
    expect(isDue(initialSrsState(TODAY), TODAY)).toBe(true);
  });

  it('chưa tới ngày hẹn thì chưa tới hạn', () => {
    const state = reviewCard(initialSrsState(TODAY), ReviewQuality.CORRECT, TODAY);
    expect(isDue(state, TODAY)).toBe(false);
    expect(isDue(state, '2026-03-11')).toBe(true);
  });
});
