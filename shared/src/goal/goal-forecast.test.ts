import { describe, expect, it } from 'vitest';
import { forecastGoal } from './goal-forecast.js';

describe('forecastGoal', () => {
  it('suy ngày đạt từ tốc độ trung bình kể từ ngày bắt đầu', () => {
    // 10 ngày (1 → 10/9) học 100 từ = 10 từ/ngày, còn 400 từ → 40 ngày nữa
    const result = forecastGoal({
      targetValue: 500,
      currentValue: 100,
      startDate: '2026-09-01',
      endDate: '2026-12-31',
      today: '2026-09-10',
    });
    expect(result.dailyPace).toBe(10);
    expect(result.projectedDate).toBe('2026-10-20');
    expect(result.onTrack).toBe(true);
  });

  it('báo trễ hạn và nói rõ mỗi ngày cần bao nhiêu để kịp', () => {
    const result = forecastGoal({
      targetValue: 500,
      currentValue: 100,
      startDate: '2026-09-01',
      endDate: '2026-09-29',
      today: '2026-09-10',
    });
    expect(result.onTrack).toBe(false);
    // còn 400 từ, còn 20 ngày tính cả hôm nay
    expect(result.requiredPerDay).toBe(20);
  });

  it('chưa có tiến độ thì không dự báo được ngày đạt, và có hạn là chắc chắn trễ', () => {
    const result = forecastGoal({
      targetValue: 500,
      currentValue: 0,
      startDate: '2026-09-10',
      endDate: '2026-09-30',
      today: '2026-09-10',
    });
    expect(result.projectedDate).toBeNull();
    expect(result.onTrack).toBe(false);
  });

  it('không có hạn thì không so kịp hay trễ', () => {
    const result = forecastGoal({
      targetValue: 100,
      currentValue: 50,
      startDate: '2026-09-01',
      endDate: null,
      today: '2026-09-05',
    });
    expect(result.onTrack).toBeNull();
    expect(result.requiredPerDay).toBeNull();
    expect(result.projectedDate).toBe('2026-09-10');
  });

  it('đã đủ chỉ tiêu thì đạt ngay hôm nay', () => {
    const result = forecastGoal({
      targetValue: 100,
      currentValue: 120,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      today: '2026-09-05',
    });
    expect(result.projectedDate).toBe('2026-09-05');
    expect(result.onTrack).toBe(true);
    expect(result.requiredPerDay).toBe(0);
  });
});
