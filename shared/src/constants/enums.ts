/**
 * Enum nghiệp vụ dùng chung cho be / fe / mobile.
 * Giá trị phải khớp với enum trong be/prisma/schema.prisma.
 */

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Trạng thái tài khoản. Khoá là biện pháp đảo ngược được: tài khoản LOCKED không
 * đăng nhập được nhưng toàn bộ dữ liệu học vẫn còn nguyên.
 */
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Lý do một lượt đăng nhập thất bại — ghi vào LoginEvent.reason. */
export const LoginFailReason = {
  NO_ACCOUNT: 'NO_ACCOUNT',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  LOCKED: 'LOCKED',
} as const;
export type LoginFailReason = (typeof LoginFailReason)[keyof typeof LoginFailReason];

/** Loại mục tiêu học người dùng có thể đặt ra. */
export const GoalType = {
  /** Học N từ vựng mỗi ngày */
  VOCAB_PER_DAY: 'VOCAB_PER_DAY',
  /** Học N phút mỗi ngày */
  MINUTES_PER_DAY: 'MINUTES_PER_DAY',
  /** Hoàn thành N bài học mỗi tuần */
  LESSONS_PER_WEEK: 'LESSONS_PER_WEEK',
  /** Duy trì chuỗi N ngày liên tiếp */
  STREAK_TARGET: 'STREAK_TARGET',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GoalPeriod = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
} as const;
export type GoalPeriod = (typeof GoalPeriod)[keyof typeof GoalPeriod];

export const GoalStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const HabitFrequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  /** Chọn cụ thể các thứ trong tuần, xem Habit.customDays */
  CUSTOM: 'CUSTOM',
} as const;
export type HabitFrequency = (typeof HabitFrequency)[keyof typeof HabitFrequency];

/**
 * Loại hoạt động ghi vào ActivityLog — nguồn sự thật duy nhất cho streak & thống kê.
 * Thêm loại mới ở đây thì phải thêm cả trong schema.prisma.
 */
export const ActivityType = {
  VOCAB_LEARNED: 'VOCAB_LEARNED',
  FLASHCARD_REVIEWED: 'FLASHCARD_REVIEWED',
  QUIZ_COMPLETED: 'QUIZ_COMPLETED',
  HABIT_CHECKIN: 'HABIT_CHECKIN',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

/**
 * Loại thông báo trong ứng dụng. Phải khớp enum NotificationType trong schema.prisma.
 * Nội dung thông báo do backend sinh; FE chỉ dùng loại để chọn biểu tượng và nhóm lọc.
 */
export const NotificationType = {
  DAILY_REMINDER: 'DAILY_REMINDER',
  STREAK_AT_RISK: 'STREAK_AT_RISK',
  REVIEW_DUE: 'REVIEW_DUE',
  MISTAKES_PENDING: 'MISTAKES_PENDING',
  GOAL_ACHIEVED: 'GOAL_ACHIEVED',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const VocabLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type VocabLevel = (typeof VocabLevel)[keyof typeof VocabLevel];

/**
 * Lý do một dòng trong sổ cái xu. Phải khớp enum CoinReason trong schema.prisma.
 *
 * Xu là phần thưởng động viên, KHÔNG phải XP: XP suy ra từ ActivityLog nên không
 * thể cộng thêm bằng việc bấm nút. Xu có sổ cái riêng nên tặng bao nhiêu cũng
 * không làm sai lệch cấp độ hay thống kê học tập.
 */
export const CoinReason = {
  /** Điểm danh hằng ngày */
  DAILY_CHECKIN: 'DAILY_CHECKIN',
  /** Nhận thưởng một nhiệm vụ ngày */
  MISSION_CLAIM: 'MISSION_CLAIM',
  /** Mua một vật phẩm giữ chuỗi (số âm) */
  STREAK_FREEZE_PURCHASE: 'STREAK_FREEZE_PURCHASE',
} as const;
export type CoinReason = (typeof CoinReason)[keyof typeof CoinReason];

/**
 * Nhiệm vụ ngày. Cố ý là hằng số trong code chứ không phải bảng trong DB:
 * tiến độ nhiệm vụ suy ra từ ActivityLog của hôm đó, nên không cần lưu gì thêm —
 * thêm bảng tiến độ chỉ tạo thêm một nguồn số liệu có thể lệch.
 */
export const MissionId = {
  LEARN_VOCAB: 'LEARN_VOCAB',
  REVIEW_FLASHCARDS: 'REVIEW_FLASHCARDS',
  DO_HABIT: 'DO_HABIT',
} as const;
export type MissionId = (typeof MissionId)[keyof typeof MissionId];

/** Chất lượng nhớ khi ôn flashcard, đầu vào của thuật toán SM-2 (0-5). */
export const ReviewQuality = {
  /** Quên hoàn toàn */
  BLACKOUT: 0,
  INCORRECT: 1,
  INCORRECT_EASY_RECALL: 2,
  CORRECT_HARD: 3,
  CORRECT: 4,
  /** Nhớ ngay lập tức */
  PERFECT: 5,
} as const;
export type ReviewQuality = (typeof ReviewQuality)[keyof typeof ReviewQuality];
