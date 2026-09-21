import { describe, expect, it } from 'vitest';
import { HabitFrequency } from '../constants/enums.js';
import {
  HabitDayLevel,
  habitAmountsError,
  habitDayLevel,
  habitPeriodStart,
  isHabitPeriodDone,
  isScheduledDay,
  isoWeekday,
} from './habit-schedule.js';

describe('habitDayLevel', () => {
  const amounts = { targetAmount: 20, minAmount: 5 };

  it('đủ lượng là làm đủ, đạt mức tối thiểu vẫn tính là đã làm', () => {
    expect(habitDayLevel(amounts, 20)).toBe(HabitDayLevel.FULL);
    expect(habitDayLevel(amounts, 7)).toBe(HabitDayLevel.MINIMUM);
    expect(habitDayLevel(amounts, 4)).toBeNull();
  });

  it('tích không kèm lượng thì coi là làm đủ', () => {
    expect(habitDayLevel(amounts, null)).toBe(HabitDayLevel.FULL);
  });

  it('thói quen không có lượng: làm một lần là đủ', () => {
    expect(habitDayLevel({ targetAmount: null, minAmount: null }, 1)).toBe(HabitDayLevel.FULL);
    expect(habitDayLevel({ targetAmount: null, minAmount: null }, 0)).toBeNull();
  });
});

describe('habitAmountsError', () => {
  it('mức tối thiểu cần có lượng mỗi lần và phải nhỏ hơn nó', () => {
    expect(habitAmountsError({ targetAmount: null, minAmount: 5 })).not.toBeNull();
    expect(habitAmountsError({ targetAmount: 5, minAmount: 5 })).not.toBeNull();
    expect(habitAmountsError({ targetAmount: 20, minAmount: 5 })).toBeNull();
    expect(habitAmountsError({ targetAmount: null, minAmount: null })).toBeNull();
  });
});

describe('isHabitPeriodDone', () => {
  it('thói quen hằng ngày chỉ xét đúng ngày đó', () => {
    const daily = { frequency: HabitFrequency.DAILY, customDays: null };
    expect(isHabitPeriodDone(daily, ['2026-09-21'], '2026-09-22')).toBe(false);
    expect(isHabitPeriodDone(daily, ['2026-09-22'], '2026-09-22')).toBe(true);
  });

  it('thói quen 3 lần/tuần cần đủ 3 ngày khác nhau trong tuần hiện tại', () => {
    const weekly = { frequency: HabitFrequency.WEEKLY, customDays: null, timesPerWeek: 3 };
    // 20/9 là Chủ nhật tuần trước — không tính
    expect(isHabitPeriodDone(weekly, ['2026-09-20', '2026-09-21', '2026-09-22'], '2026-09-23')).toBe(false);
    expect(isHabitPeriodDone(weekly, ['2026-09-21', '2026-09-22', '2026-09-23'], '2026-09-23')).toBe(true);
  });

  it('thói quen hằng tuần không đặt số lần thì một lần là đủ', () => {
    const weekly = { frequency: HabitFrequency.WEEKLY, customDays: null };
    expect(isHabitPeriodDone(weekly, ['2026-09-21'], '2026-09-25')).toBe(true);
  });
});

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
