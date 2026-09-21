/**
 * Lịch đến hạn và cách chấm "đã làm" của thói quen.
 *
 * Đây là DOMAIN LOGIC dùng chung: `be` dùng để đếm số lần đến hạn (tỷ lệ hoàn thành) và
 * để quyết định có nhắc không, `fe` dùng để vẽ dải 7 ngày. Hai phía phải cùng một cách
 * hiểu — nếu không, dải 7 ngày báo "đủ" trong khi máy chủ vẫn gửi lời nhắc.
 */

import { ActivityType, HabitFrequency } from '../constants/enums.js';
import { startOfWeek, type LocalDate } from '../date/local-date.js';

export interface HabitSchedule {
  frequency: HabitFrequency;
  /** Thứ ISO 1-7, chỉ có nghĩa khi `frequency = CUSTOM`. */
  customDays: readonly number[] | null;
  /** Số lần mỗi tuần, chỉ có nghĩa khi `frequency = WEEKLY`. Null = 1. */
  timesPerWeek?: number | null;
}

/**
 * Loại hoạt động mà một thói quen tự động được phép bám theo.
 *
 * Không có `HABIT_CHECKIN`: thói quen tự hoàn thành vì chính nó được check-in là vòng lặp
 * vô nghĩa, và mở đường cho việc một lần tích tay kéo theo cả dãy thói quen khác.
 */
export const HABIT_AUTO_ACTIVITIES = [
  ActivityType.VOCAB_LEARNED,
  ActivityType.FLASHCARD_REVIEWED,
  ActivityType.QUIZ_COMPLETED,
] as const;
export type HabitAutoActivity = (typeof HABIT_AUTO_ACTIVITIES)[number];

/** Mức hoàn thành của một ngày: làm đủ, hay chỉ đạt mức tối thiểu của ngày bận. */
export const HabitDayLevel = {
  FULL: 'FULL',
  MINIMUM: 'MINIMUM',
} as const;
export type HabitDayLevel = (typeof HabitDayLevel)[keyof typeof HabitDayLevel];

export interface HabitAmounts {
  /** Lượng mỗi lần. Null = chỉ có làm / chưa làm. */
  targetAmount: number | null;
  /** Mức tối thiểu cho ngày bận. Null = không có mức riêng. */
  minAmount: number | null;
}

/**
 * Chấm một ngày từ lượng đã làm.
 *
 * `amount = null` là lần tích không kèm lượng (thói quen chỉ có làm / chưa làm, hoặc bản
 * ghi từ trước khi có cột lượng) — coi là làm đủ. Đạt mức tối thiểu vẫn tính là ĐÃ LÀM:
 * cả mục đích của mức này là để ngày bận không làm đứt mạch.
 */
export function habitDayLevel(amounts: HabitAmounts, amount: number | null): HabitDayLevel | null {
  if (amount === null) return HabitDayLevel.FULL;
  if (amount >= (amounts.targetAmount ?? 1)) return HabitDayLevel.FULL;
  if (amounts.minAmount !== null && amount >= amounts.minAmount) return HabitDayLevel.MINIMUM;
  return null;
}

/**
 * Lỗi của bộ số lượng, hoặc null nếu hợp lệ. Dùng ở cả schema lẫn service (service kiểm
 * lại trên bản ĐÃ GỘP với dữ liệu cũ, vì PATCH có thể chỉ gửi một trong hai số).
 */
export function habitAmountsError(amounts: HabitAmounts): string | null {
  if (amounts.minAmount === null) return null;
  if (amounts.targetAmount === null) return 'Đặt lượng mỗi lần trước rồi mới đặt được mức tối thiểu';
  if (amounts.minAmount >= amounts.targetAmount) return 'Mức tối thiểu phải nhỏ hơn lượng mỗi lần';
  return null;
}

/** Số lần cần làm trong tuần của thói quen hằng tuần. */
export function weeklyQuota(timesPerWeek: number | null | undefined): number {
  return timesPerWeek ?? 1;
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
 * nào cũng là ngày làm được — đã đủ số lần trong tuần hay chưa thì xem `isHabitPeriodDone`.
 */
export function isScheduledDay(schedule: HabitSchedule, date: LocalDate): boolean {
  if (schedule.frequency !== HabitFrequency.CUSTOM) return true;
  return (schedule.customDays ?? []).includes(isoWeekday(date));
}

/**
 * Ngày đầu của kỳ chứa `date`: thói quen hằng tuần tính theo tuần (bắt đầu thứ Hai),
 * các loại còn lại tính theo ngày.
 */
export function habitPeriodStart(frequency: HabitFrequency, date: LocalDate): LocalDate {
  return frequency === HabitFrequency.WEEKLY ? startOfWeek(date) : date;
}

/**
 * Kỳ chứa `date` đã làm xong chưa: thói quen hằng tuần cần đủ `timesPerWeek` ngày trong
 * tuần, các loại còn lại cần đúng ngày đó.
 *
 * Thiếu khái niệm kỳ thì thói quen hằng tuần đã làm hôm thứ Hai vẫn bị nhắc tới Chủ nhật.
 *
 * @param doneDates Các ngày ĐÃ LÀM (đạt ít nhất mức tối thiểu). Ngày ngoài kỳ bị bỏ qua.
 */
export function isHabitPeriodDone(
  schedule: HabitSchedule,
  doneDates: readonly LocalDate[],
  date: LocalDate,
): boolean {
  if (schedule.frequency !== HabitFrequency.WEEKLY) return doneDates.includes(date);

  const from = habitPeriodStart(schedule.frequency, date);
  const doneInWeek = new Set(doneDates.filter((day) => day >= from && day <= date)).size;
  return doneInWeek >= weeklyQuota(schedule.timesPerWeek);
}
