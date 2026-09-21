import { describe, expect, it } from 'vitest';
import { HabitFrequency } from '../constants/enums.js';
import { habitPeriodStart, isScheduledDay, isoWeekday } from './habit-schedule.js';

describe('isoWeekday', () => {
  it('thứ Hai là 1, Chủ nhật là 7', () => {
    expect(isoWeekday('2026-09-21')).toBe(1);
    expect(isoWeekday('2026-09-27')).toBe(7);
  });
});

describe('isScheduledDay', () => {
  it('thói quen hằng ngày và hằng tuần làm được mọi ngày', () => {
    expect(isScheduledDay({ frequency: HabitFrequency.DAILY, customDays: null }, '2026-09-27')).toBe(true);
    expect(isScheduledDay({ frequency: HabitFrequency.WEEKLY, customDays: null }, '2026-09-23')).toBe(true);
  });

  it('thói quen theo thứ chỉ đến hạn vào các thứ đã chọn', () => {
    const schedule = { frequency: HabitFrequency.CUSTOM, customDays: [1, 3, 5] };
    expect(isScheduledDay(schedule, '2026-09-21')).toBe(true); // T2
    expect(isScheduledDay(schedule, '2026-09-22')).toBe(false); // T3
    expect(isScheduledDay(schedule, '2026-09-25')).toBe(true); // T6
  });

  it('thói quen theo thứ mà chưa chọn thứ nào thì không bao giờ đến hạn', () => {
    expect(isScheduledDay({ frequency: HabitFrequency.CUSTOM, customDays: null }, '2026-09-21')).toBe(false);
  });
});

describe('habitPeriodStart', () => {
  it('thói quen hằng tuần tính từ thứ Hai', () => {
    expect(habitPeriodStart(HabitFrequency.WEEKLY, '2026-09-24')).toBe('2026-09-21');
  });

  it('các loại còn lại tính trong ngày', () => {
    expect(habitPeriodStart(HabitFrequency.DAILY, '2026-09-24')).toBe('2026-09-24');
    expect(habitPeriodStart(HabitFrequency.CUSTOM, '2026-09-24')).toBe('2026-09-24');
  });
});
