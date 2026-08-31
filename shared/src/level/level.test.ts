import { describe, expect, it } from 'vitest';
import { ActivityType } from '../constants/enums.js';
import { levelFromXp, totalXpForLevel, xpForLevel, xpFromActivityCounts } from './level.js';

describe('levelFromXp', () => {
  it('người chưa học gì ở cấp 1', () => {
    const state = levelFromXp(0);
    expect(state.level).toBe(1);
    expect(state.xpInLevel).toBe(0);
    expect(state.xpToNextLevel).toBe(100);
    expect(state.progressPercent).toBe(0);
  });

  it('chưa đủ XP thì vẫn ở cấp 1', () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(99).progressPercent).toBe(99);
  });

  it('đủ đúng ngưỡng thì lên cấp và XP trong cấp về 0', () => {
    const state = levelFromXp(100);
    expect(state.level).toBe(2);
    expect(state.xpInLevel).toBe(0);
    expect(state.xpToNextLevel).toBe(160);
  });

  it('mỗi cấp sau cần nhiều XP hơn cấp trước', () => {
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(160);
    expect(xpForLevel(4)).toBe(220);
  });

  it('tính đúng cấp ở mốc cao', () => {
    // Cấp 5 cần 100 + 160 + 220 + 280 = 760 XP tích luỹ
    expect(totalXpForLevel(5)).toBe(760);
    expect(levelFromXp(760).level).toBe(5);
    expect(levelFromXp(759).level).toBe(4);
  });

  it('XP âm hoặc lẻ được xử lý an toàn', () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(-50).xp).toBe(0);
    expect(levelFromXp(150.7).xp).toBe(150);
  });

  it('tiến độ luôn nằm trong khoảng 0-100', () => {
    for (const xp of [0, 1, 99, 100, 500, 5000, 100000]) {
      const p = levelFromXp(xp).progressPercent;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });
});

describe('xpFromActivityCounts', () => {
  it('cộng đúng theo trọng số từng loại hoạt động', () => {
    const xp = xpFromActivityCounts({
      [ActivityType.FLASHCARD_REVIEWED]: 10, // 40
      [ActivityType.VOCAB_LEARNED]: 5, // 40
      [ActivityType.QUIZ_COMPLETED]: 2, // 40
      [ActivityType.HABIT_CHECKIN]: 3, // 36
    });
    expect(xp).toBe(156);
  });

  it('loại không có mặt thì tính bằng 0', () => {
    expect(xpFromActivityCounts({})).toBe(0);
    expect(xpFromActivityCounts({ [ActivityType.QUIZ_COMPLETED]: 1 })).toBe(20);
  });

  it('quiz cho nhiều XP hơn flashcard vì tốn công hơn', () => {
    const quiz = xpFromActivityCounts({ [ActivityType.QUIZ_COMPLETED]: 1 });
    const flashcard = xpFromActivityCounts({ [ActivityType.FLASHCARD_REVIEWED]: 1 });
    expect(quiz).toBeGreaterThan(flashcard);
  });
});
