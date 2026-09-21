/**
 * Lịch đến hạn của thói quen.
 *
 * Đây là DOMAIN LOGIC dùng chung: `be` dùng để đếm số lần đến hạn (tỷ lệ hoàn thành) và
 * để quyết định hôm nay có nhắc không, `fe` dùng để vẽ dải 7 ngày. Hai phía phải cùng
 * một cách hiểu — nếu không, dải 7 ngày báo "đủ" trong khi máy chủ vẫn gửi lời nhắc.
 */

import { HabitFrequency } from '../constants/enums.js';
import { startOfWeek, type LocalDate } from '../date/local-date.js';

export interface HabitSchedule {
  frequency: HabitFrequency;
  /** Thứ ISO 1-7, chỉ có nghĩa khi `frequency = CUSTOM`. */
  customDays: readonly number[] | null;
}

/** Thứ ISO của một ngày: 1 = Thứ Hai ... 7 = Chủ nhật. */
export function isoWeekday(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  // getUTCDay(): 0 = Chủ nhật → đổi sang ISO
  return ((new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7) + 1;
}

/**
 * Ngày `date` có phải ngày làm thói quen không.
 *
 * Thói quen hằng tuần không gắn với thứ nào: làm hôm nào trong tuần cũng được, nên ngày
 * nào cũng là ngày làm được — đã làm trong tuần hay chưa thì xem `habitPeriodStart`.
 */
export function isScheduledDay(schedule: HabitSchedule, date: LocalDate): boolean {
  if (schedule.frequency !== HabitFrequency.CUSTOM) return true;
  return (schedule.customDays ?? []).includes(isoWeekday(date));
}

/**
 * Ngày đầu của kỳ chứa `date`: thói quen hằng tuần tính theo tuần (bắt đầu thứ Hai),
 * các loại còn lại tính theo ngày.
 *
 * "Đã làm trong kỳ này chưa" là có check-in nào trong `[habitPeriodStart(date), date]`.
 * Thiếu khái niệm kỳ thì thói quen hằng tuần đã làm hôm thứ Hai vẫn bị nhắc tới Chủ nhật.
 */
export function habitPeriodStart(frequency: HabitFrequency, date: LocalDate): LocalDate {
  return frequency === HabitFrequency.WEEKLY ? startOfWeek(date) : date;
}
