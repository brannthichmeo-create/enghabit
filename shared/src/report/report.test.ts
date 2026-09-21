import { describe, expect, it } from 'vitest';
import { ActivityType, GoalPeriod, GoalType } from '../constants/enums.js';
import {
  EffectivenessLevel,
  GOAL_ACTIVITY_TYPE,
  effectivenessScore,
  evaluateEffectiveness,
  expectedForRange,
  isCumulativeGoal,
} from './report.js';

describe('isCumulativeGoal', () => {
  it('mục tiêu đếm hoạt động thì cộng dồn được', () => {
    expect(isCumulativeGoal(GoalType.VOCAB_PER_DAY)).toBe(true);
    expect(isCumulativeGoal(GoalType.LESSONS_PER_WEEK)).toBe(true);
  });

  it('mục tiêu chuỗi ngày thì không cộng dồn', () => {
    expect(isCumulativeGoal(GoalType.STREAK_TARGET)).toBe(false);
  });
});

describe('expectedForRange', () => {
  it('mục tiêu ngày nhân theo số ngày trong khoảng', () => {
    expect(expectedForRange(GoalType.VOCAB_PER_DAY, GoalPeriod.DAILY, 10, 7)).toBe(70);
  });

  it('mục tiêu tuần làm tròn LÊN số tuần', () => {
    // 10 ngày là hai tuần đã bắt đầu, không phải 1,43 tuần
    expect(expectedForRange(GoalType.LESSONS_PER_WEEK, GoalPeriod.WEEKLY, 3, 10)).toBe(6);
    expect(expectedForRange(GoalType.LESSONS_PER_WEEK, GoalPeriod.WEEKLY, 3, 7)).toBe(3);
  });

  it('mục tiêu chuỗi ngày giữ nguyên chỉ tiêu, không nhân lên', () => {
    expect(expectedForRange(GoalType.STREAK_TARGET, GoalPeriod.DAILY, 30, 7)).toBe(30);
    expect(expectedForRange(GoalType.STREAK_TARGET, GoalPeriod.DAILY, 30, 90)).toBe(30);
  });

  it('mục tiêu cộng dồn chia đều chỉ tiêu cho cả đời mục tiêu', () => {
    // 1500 từ trong 100 ngày, xem 7 ngày → 105
    expect(expectedForRange(GoalType.VOCAB_PER_DAY, GoalPeriod.TOTAL, 1500, 7, 100)).toBe(105);
    // khoảng dài hơn cả mục tiêu thì chỉ tiêu là toàn bộ, không vượt quá
    expect(expectedForRange(GoalType.VOCAB_PER_DAY, GoalPeriod.TOTAL, 1500, 200, 100)).toBe(1500);
  });

  it('mục tiêu cộng dồn không có hạn thì không quy đổi được', () => {
    expect(expectedForRange(GoalType.VOCAB_PER_DAY, GoalPeriod.TOTAL, 1500, 7)).toBe(0);
  });

  it('khoảng rỗng thì chỉ tiêu bằng 0', () => {
    expect(expectedForRange(GoalType.VOCAB_PER_DAY, GoalPeriod.DAILY, 10, 0)).toBe(0);
    expect(expectedForRange(GoalType.VOCAB_PER_DAY, GoalPeriod.DAILY, 10, -3)).toBe(0);
  });
});

describe('effectivenessScore', () => {
  it('chưa đặt mục tiêu thì chấm hoàn toàn theo mức độ đều đặn', () => {
    expect(effectivenessScore(70, null)).toBe(70);
  });

  it('có mục tiêu thì tính đều đặn 60% và đạt mục tiêu 40%', () => {
    expect(effectivenessScore(100, 50)).toBe(80);
    expect(effectivenessScore(50, 100)).toBe(70);
  });

  it('học đều được chấm cao hơn học dồn dù cùng tỷ lệ đạt mục tiêu', () => {
    const đều = effectivenessScore(100, 60);
    const dồn = effectivenessScore(30, 60);
    expect(đều).toBeGreaterThan(dồn);
  });

  it('cắt trần giá trị vượt khoảng 0-100', () => {
    expect(effectivenessScore(180, 200)).toBe(100);
    expect(effectivenessScore(-20, -5)).toBe(0);
  });
});

describe('evaluateEffectiveness', () => {
  it('xếp loại theo ngưỡng 80 / 60 / 40', () => {
    expect(evaluateEffectiveness(95)).toBe(EffectivenessLevel.EXCELLENT);
    expect(evaluateEffectiveness(80)).toBe(EffectivenessLevel.EXCELLENT);
    expect(evaluateEffectiveness(79)).toBe(EffectivenessLevel.GOOD);
    expect(evaluateEffectiveness(60)).toBe(EffectivenessLevel.GOOD);
    expect(evaluateEffectiveness(40)).toBe(EffectivenessLevel.FAIR);
    expect(evaluateEffectiveness(39)).toBe(EffectivenessLevel.LOW);
    expect(evaluateEffectiveness(0)).toBe(EffectivenessLevel.LOW);
  });
});

describe('GOAL_ACTIVITY_TYPE', () => {
  it('mỗi loại mục tiêu đếm được ánh xạ tới đúng một loại hoạt động', () => {
    expect(GOAL_ACTIVITY_TYPE[GoalType.VOCAB_PER_DAY]).toBe(ActivityType.VOCAB_LEARNED);
    expect(GOAL_ACTIVITY_TYPE[GoalType.MINUTES_PER_DAY]).toBe(ActivityType.FLASHCARD_REVIEWED);
    expect(GOAL_ACTIVITY_TYPE[GoalType.LESSONS_PER_WEEK]).toBe(ActivityType.QUIZ_COMPLETED);
  });
});
