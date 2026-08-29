/**
 * Enum nghiệp vụ dùng chung cho be / fe / mobile.
 * Giá trị phải khớp với enum trong be/prisma/schema.prisma.
 */

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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

export const VocabLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type VocabLevel = (typeof VocabLevel)[keyof typeof VocabLevel];

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
