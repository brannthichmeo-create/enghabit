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
