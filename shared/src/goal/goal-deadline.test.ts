import { describe, expect, it } from 'vitest';
import { GoalTimelineState, goalTimeline, isGoalInEffect } from './goal-deadline.js';

describe('goalTimeline', () => {
  it('mục tiêu không có hạn thì luôn còn hiệu lực sau ngày bắt đầu', () => {
    expect(goalTimeline('2026-09-01', null, '2027-01-01')).toEqual({
      state: GoalTimelineState.ACTIVE,
      daysLeft: null,
    });
  });

  it('đếm số ngày còn lại tới hạn', () => {
    expect(goalTimeline('2026-09-01', '2026-09-30', '2026-09-19').daysLeft).toBe(11);
  });

  it('ngày hạn vẫn còn hiệu lực, còn 0 ngày', () => {
    expect(goalTimeline('2026-09-01', '2026-09-19', '2026-09-19')).toEqual({
      state: GoalTimelineState.ACTIVE,
      daysLeft: 0,
    });
  });

  it('qua ngày hạn một ngày là hết hạn', () => {
    expect(goalTimeline('2026-09-01', '2026-09-18', '2026-09-19').state).toBe(GoalTimelineState.EXPIRED);
  });

  it('chưa tới ngày bắt đầu thì chưa hiệu lực', () => {
    expect(goalTimeline('2026-10-01', null, '2026-09-19').state).toBe(GoalTimelineState.UPCOMING);
  });
});

describe('isGoalInEffect', () => {
  it('chỉ đo tiến độ khi mục tiêu đang hiệu lực', () => {
    expect(isGoalInEffect('2026-09-01', '2026-09-30', '2026-09-19')).toBe(true);
    expect(isGoalInEffect('2026-01-01', '2026-01-31', '2026-09-19')).toBe(false);
    expect(isGoalInEffect('2027-01-01', null, '2026-09-19')).toBe(false);
  });
});
