import {
  ActivityType,
  EffectivenessLevel,
  GoalPeriod,
  GoalType,
  HabitFrequency,
  UserStatus,
  VocabLevel,
  type HabitAutoActivity,
} from '@enghabit/shared';

/**
 * Nhãn tiếng Việt cho các enum nghiệp vụ.
 *
 * Gom về một chỗ vì được dùng ở nhiều feature (dashboard, goals, habits, vocabulary, admin) —
 * để mỗi trang không tự đặt tên khác nhau cho cùng một giá trị.
 */

/**
 * Tên LOẠI mục tiêu, không kèm chu kỳ — dùng cho ô chọn loại ở biểu mẫu, nơi chu kỳ là
 * một ô riêng ngay bên cạnh. Tên enum (`VOCAB_PER_DAY`...) là lịch sử, không phải nghĩa:
 * mục tiêu từ vựng đặt được theo ngày, theo tuần hay cộng dồn tới hạn.
 */
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  [GoalType.VOCAB_PER_DAY]: 'Số từ vựng học',
  [GoalType.MINUTES_PER_DAY]: 'Số lượt ôn tập',
  [GoalType.LESSONS_PER_WEEK]: 'Số phiên học',
  [GoalType.STREAK_TARGET]: 'Chuỗi ngày học liên tiếp',
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  [GoalPeriod.DAILY]: 'Mỗi ngày',
  [GoalPeriod.WEEKLY]: 'Mỗi tuần',
  [GoalPeriod.TOTAL]: 'Cộng dồn tới hạn',
};

/**
 * Tên đầy đủ của một mục tiêu, gồm cả chu kỳ — dùng ở mọi chỗ hiện mục tiêu cho người
 * đọc (thẻ mục tiêu, trang Tổng quan, Báo cáo).
 *
 * Viết thành bảng đủ từng cặp thay vì ghép "{loại} {chu kỳ}": trật tự từ tiếng Việt và
 * tiếng Anh khác nhau, câu ghép thì không dịch được (xem quy tắc i18n trong CLAUDE.md).
 */
const GOAL_NAMES: Record<Exclude<GoalType, 'STREAK_TARGET'>, Record<GoalPeriod, string>> = {
  [GoalType.VOCAB_PER_DAY]: {
    [GoalPeriod.DAILY]: 'Số từ vựng học mỗi ngày',
    [GoalPeriod.WEEKLY]: 'Số từ vựng học mỗi tuần',
    [GoalPeriod.TOTAL]: 'Tổng số từ vựng học',
  },
  [GoalType.MINUTES_PER_DAY]: {
    [GoalPeriod.DAILY]: 'Số lượt ôn tập mỗi ngày',
    [GoalPeriod.WEEKLY]: 'Số lượt ôn tập mỗi tuần',
    [GoalPeriod.TOTAL]: 'Tổng số lượt ôn tập',
  },
  [GoalType.LESSONS_PER_WEEK]: {
    [GoalPeriod.DAILY]: 'Số phiên học mỗi ngày',
    [GoalPeriod.WEEKLY]: 'Số phiên học mỗi tuần',
    [GoalPeriod.TOTAL]: 'Tổng số phiên học',
  },
};

/** Khoá dịch của tên đầy đủ — chỗ gọi tự đưa qua `t()`. */
export function goalName(type: GoalType, period: GoalPeriod): string {
  // Chuỗi ngày không có chu kỳ: "chuỗi 30 ngày" là một con số duy nhất.
  if (type === GoalType.STREAK_TARGET) return GOAL_TYPE_LABELS[type];
  return GOAL_NAMES[type][period];
}

/** Đơn vị của thói quen tự động, theo loại hoạt động nó bám theo. */
export const HABIT_AUTO_UNITS: Record<HabitAutoActivity, string> = {
  [ActivityType.VOCAB_LEARNED]: 'từ',
  [ActivityType.FLASHCARD_REVIEWED]: 'thẻ',
  [ActivityType.QUIZ_COMPLETED]: 'phiên',
};

/** Cách đánh dấu của thói quen tự động, hiện ở ô chọn và trên thẻ thói quen. */
export const HABIT_AUTO_LABELS: Record<HabitAutoActivity, string> = {
  [ActivityType.VOCAB_LEARNED]: 'Tự động khi học từ mới',
  [ActivityType.FLASHCARD_REVIEWED]: 'Tự động khi ôn thẻ',
  [ActivityType.QUIZ_COMPLETED]: 'Tự động khi xong một phiên học',
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
