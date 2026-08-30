import { GoalPeriod, GoalType, HabitFrequency, VocabLevel } from '@enghabit/shared';

/**
 * Nhãn tiếng Việt cho các enum nghiệp vụ.
 *
 * Gom về một chỗ vì được dùng ở nhiều feature (dashboard, goals, habits, vocabulary, admin) —
 * để mỗi trang không tự đặt tên khác nhau cho cùng một giá trị.
 */

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  [GoalType.VOCAB_PER_DAY]: 'Số từ vựng học mỗi ngày',
  [GoalType.MINUTES_PER_DAY]: 'Số lượt ôn tập mỗi ngày',
  [GoalType.LESSONS_PER_WEEK]: 'Số bài quiz mỗi tuần',
  [GoalType.STREAK_TARGET]: 'Chuỗi ngày học liên tiếp',
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  [GoalPeriod.DAILY]: 'Mỗi ngày',
  [GoalPeriod.WEEKLY]: 'Mỗi tuần',
};

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  [HabitFrequency.DAILY]: 'Hằng ngày',
  [HabitFrequency.WEEKLY]: 'Hằng tuần',
  [HabitFrequency.CUSTOM]: 'Tuỳ chọn',
};

export const VOCAB_LEVEL_LABELS: Record<VocabLevel, string> = {
  [VocabLevel.BEGINNER]: 'Cơ bản',
  [VocabLevel.INTERMEDIATE]: 'Trung cấp',
  [VocabLevel.ADVANCED]: 'Nâng cao',
};

/** Nhãn thứ trong tuần theo ISO: index 0 = Thứ Hai. */
export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

/** Đổi mảng thứ ISO (1-7) sang chuỗi hiển thị, vd [2,4,6] → "T3, T5, T7". */
export function formatWeekdays(days: number[]): string {
  return days.map((d) => WEEKDAY_LABELS[d - 1] ?? '?').join(', ');
}
