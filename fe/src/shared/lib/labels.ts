import {
  ActivityType,
  EffectivenessLevel,
  GoalPeriod,
  GoalType,
  HabitFrequency,
  UserStatus,
  VocabLevel,
} from '@enghabit/shared';

/**
 * Nhãn tiếng Việt cho các enum nghiệp vụ.
 *
 * Gom về một chỗ vì được dùng ở nhiều feature (dashboard, goals, habits, vocabulary, admin) —
 * để mỗi trang không tự đặt tên khác nhau cho cùng một giá trị.
 */

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  [GoalType.VOCAB_PER_DAY]: 'Số từ vựng học mỗi ngày',
  [GoalType.MINUTES_PER_DAY]: 'Số lượt ôn tập mỗi ngày',
  [GoalType.LESSONS_PER_WEEK]: 'Số bài kiểm tra mỗi tuần',
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

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.VOCAB_LEARNED]: 'Học từ vựng',
  [ActivityType.FLASHCARD_REVIEWED]: 'Ôn flashcard',
  [ActivityType.QUIZ_COMPLETED]: 'Làm kiểm tra',
  [ActivityType.HABIT_CHECKIN]: 'Check-in thói quen',
};

/** Xếp loại hiệu quả học tập của một khoảng báo cáo. */
export const EFFECTIVENESS_LABELS: Record<EffectivenessLevel, string> = {
  [EffectivenessLevel.EXCELLENT]: 'Xuất sắc',
  [EffectivenessLevel.GOOD]: 'Tốt',
  [EffectivenessLevel.FAIR]: 'Khá',
  [EffectivenessLevel.LOW]: 'Cần cải thiện',
};

/** Một câu nhận xét đi kèm xếp loại — nói rõ nên làm gì tiếp, không chỉ chấm điểm. */
export const EFFECTIVENESS_NOTES: Record<EffectivenessLevel, string> = {
  [EffectivenessLevel.EXCELLENT]: 'Bạn học rất đều và bám sát mục tiêu. Cứ giữ nhịp này.',
  [EffectivenessLevel.GOOD]: 'Nhịp học ổn định. Thêm vài ngày nữa trong tuần là đạt mức xuất sắc.',
  [EffectivenessLevel.FAIR]: 'Bạn có học nhưng còn ngắt quãng. Học ít mỗi ngày tốt hơn dồn một hôm.',
  [EffectivenessLevel.LOW]: 'Khoảng này bạn nghỉ khá nhiều. Thử hạ mục tiêu xuống mức dễ giữ hơn.',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Đang hoạt động',
  [UserStatus.LOCKED]: 'Đã khoá',
};

/** Lý do một lượt đăng nhập thất bại (LoginEvent.reason). */
export const LOGIN_FAIL_LABELS: Record<string, string> = {
  NO_ACCOUNT: 'Email không tồn tại',
  WRONG_PASSWORD: 'Sai mật khẩu',
  LOCKED: 'Tài khoản bị khoá',
};

/** Nhãn thứ trong tuần theo ISO: index 0 = Thứ Hai. */
export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

/** Đổi mảng thứ ISO (1-7) sang chuỗi hiển thị, vd [2,4,6] → "T3, T5, T7". */
export function formatWeekdays(days: number[]): string {
  return days.map((d) => WEEKDAY_LABELS[d - 1] ?? '?').join(', ');
}
