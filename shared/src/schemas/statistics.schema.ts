import { z } from 'zod';
import { ActivityType } from '../constants/enums.js';
import { type LocalDate } from '../date/local-date.js';

export const statsRangeSchema = z.object({
  range: z.enum(['day', 'week', 'month']).default('week'),
});
export type StatsRangeInput = z.infer<typeof statsRangeSchema>;

/** Số liệu tổng hợp của một ngày — luôn group theo localDate của ActivityLog. */
export interface DailyStat {
  date: LocalDate;
  vocabLearned: number;
  flashcardsReviewed: number;
  quizzesCompleted: number;
  habitCheckIns: number;
  /** Tổng số hoạt động trong ngày, dùng để vẽ biểu đồ nhanh. */
  totalActivities: number;
}

/** Số tháng lịch sử tối đa cho biểu đồ lịch — 12 tháng như GitHub. */
export const calendarRangeSchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(12),
});
export type CalendarRangeInput = z.infer<typeof calendarRangeSchema>;

/** Một ô trong biểu đồ lịch: một ngày và tổng số hoạt động của ngày đó. */
export interface CalendarDay {
  date: LocalDate;
  count: number;
}

export interface ActivityCalendar {
  from: LocalDate;
  to: LocalDate;
  days: CalendarDay[];
  /** Tổng số hoạt động trong toàn khoảng. */
  totalActivities: number;
  /** Số ngày có ít nhất một hoạt động. */
  activeDays: number;
  /**
   * Ngưỡng chia mức đậm nhạt, tính theo phân vị của các ngày có hoạt động.
   * Backend tính sẵn để mọi client tô màu giống nhau.
   */
  thresholds: [number, number, number];
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: LocalDate | null;
  /** Còn giữ được streak không (đã học hôm nay hoặc hôm qua). */
  isAlive: boolean;
  /** Ngày cuối cùng phải học để không mất streak. */
  deadline: LocalDate | null;
}

export interface StatsSummary {
  range: StatsRangeInput['range'];
  from: LocalDate;
  to: LocalDate;
  daily: DailyStat[];
  totals: Record<ActivityType, number>;
  /** Số ngày có hoạt động / tổng số ngày trong khoảng, tính theo %. */
  activeDayRate: number;
  streak: StreakSummary;
}
