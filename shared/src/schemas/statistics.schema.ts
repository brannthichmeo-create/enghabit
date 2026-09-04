import { z } from 'zod';
import { ActivityType, GoalPeriod, GoalType } from '../constants/enums.js';
import { diffInDays, type LocalDate } from '../date/local-date.js';
import { MAX_REPORT_DAYS, type EffectivenessLevel } from '../report/report.js';
import { localDateSchema } from './common.schema.js';

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

/** XP và cấp độ, suy ra từ toàn bộ ActivityLog của user. */
export interface LevelSummary {
  xp: number;
  level: number;
  xpInLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
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
  level: LevelSummary;
}

// --- Báo cáo học tập theo khoảng tự chọn ------------------------------------
//
// Khác `statsRangeSchema` ở trên (ngày/tuần/tháng cố định): ở đây người học tự chọn
// hai đầu mốc, và báo cáo đối chiếu hoạt động với chỉ tiêu của chính họ.

export const reportRangeSchema = z
  .object({
    from: localDateSchema,
    to: localDateSchema,
  })
  // So sánh chuỗi là đủ vì LocalDate luôn ở dạng YYYY-MM-DD — thứ tự từ điển
  // trùng với thứ tự thời gian.
  .refine((range) => range.from <= range.to, {
    message: 'Ngày bắt đầu phải trước hoặc trùng ngày kết thúc',
    path: ['from'],
  })
  .refine((range) => diffInDays(range.from, range.to) + 1 <= MAX_REPORT_DAYS, {
    message: `Khoảng báo cáo tối đa ${MAX_REPORT_DAYS} ngày`,
    path: ['to'],
  });
export type ReportRangeInput = z.infer<typeof reportRangeSchema>;

/** Tiến độ một mục tiêu, tính trên đúng khoảng báo cáo đang xem. */
export interface ReportGoalProgress {
  goalId: number;
  type: GoalType;
  period: GoalPeriod;
  /** Chỉ tiêu gốc người dùng đặt cho MỘT kỳ (một ngày hoặc một tuần). */
  targetValue: number;
  /** Chỉ tiêu đã quy đổi sang toàn khoảng — xem `expectedForRange` ở shared/report. */
  expectedValue: number;
  currentValue: number;
  /** 0-100, đã làm tròn và cắt trần. */
  completionRate: number;
  isCompleted: boolean;
}

/** Số liệu gọn của một khoảng — dùng để đối chiếu kỳ này với kỳ liền trước. */
export interface ReportTotals {
  from: LocalDate;
  to: LocalDate;
  totalActivities: number;
  activeDays: number;
  activeDayRate: number;
  /** XP kiếm được trong khoảng, dùng đúng công thức của shared/level. */
  xp: number;
}

export interface LearningReport {
  from: LocalDate;
  to: LocalDate;
  /** Số ngày trong khoảng, tính cả hai đầu mốc. */
  days: number;
  daily: DailyStat[];
  totals: Record<ActivityType, number>;
  current: ReportTotals;
  /** Khoảng cùng độ dài nằm ngay trước khoảng đang xem, để thấy xu hướng. */
  previous: ReportTotals;
  /** Ngày học nhiều nhất trong khoảng; null khi cả khoảng không có hoạt động nào. */
  bestDay: CalendarDay | null;
  /** Chuỗi ngày liên tiếp dài nhất đạt được TRONG khoảng này. */
  longestStreakInRange: number;
  goals: ReportGoalProgress[];
  /** Trung bình tỷ lệ đạt của các mục tiêu; null khi chưa đặt mục tiêu nào. */
  goalCompletionRate: number | null;
  effectivenessScore: number;
  effectiveness: EffectivenessLevel;
}
