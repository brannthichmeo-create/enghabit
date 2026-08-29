/**
 * Tính chuỗi ngày học liên tiếp (streak).
 *
 * Đây là DOMAIN LOGIC, không phải utility — định nghĩa đúng một lần tại đây:
 * - be: tính chính thức khi ghi ActivityLog và khi chạy recompute-streak
 * - fe/mobile: hiển thị, preview
 *
 * Mọi phép tính dựa trên LocalDate (ngày theo timezone user), không dựa trên UTC.
 */

import { addDays, diffInDays, type LocalDate } from '../date/local-date.js';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: LocalDate | null;
}

export const EMPTY_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
};

/**
 * Cập nhật streak khi user có hoạt động vào `activityDate`.
 *
 * Quy tắc:
 * - Hoạt động trùng ngày đã ghi nhận  → không đổi (học nhiều lần/ngày vẫn tính 1)
 * - Hoạt động vào ngày kế tiếp        → +1
 * - Cách quãng > 1 ngày               → reset về 1
 * - Hoạt động trong quá khứ           → không đổi (dùng recompute nếu cần sửa lịch sử)
 */
export function applyActivity(state: StreakState, activityDate: LocalDate): StreakState {
  if (state.lastActiveDate === null) {
    return { currentStreak: 1, longestStreak: Math.max(1, state.longestStreak), lastActiveDate: activityDate };
  }

  const gap = diffInDays(state.lastActiveDate, activityDate);

  // Ngày trong quá khứ hoặc cùng ngày: streak không đổi.
  if (gap <= 0) return state;

  const currentStreak = gap === 1 ? state.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActiveDate: activityDate,
  };
}

/**
 * Tính lại streak từ đầu dựa trên danh sách ngày có hoạt động.
 * Đây là hàm dùng bởi script recompute-streak — nguồn dữ liệu là ActivityLog.
 */
export function computeStreak(activityDates: readonly LocalDate[]): StreakState {
  const uniqueSorted = [...new Set(activityDates)].sort();
  return uniqueSorted.reduce(applyActivity, EMPTY_STREAK);
}

/**
 * Streak "hiển thị" cho user tại thời điểm `today`.
 *
 * Khác với `currentStreak` lưu trong DB: nếu user chưa học hôm nay và cũng không học hôm qua
 * thì chuỗi đã đứt, phải hiện 0 — dù DB vẫn đang giữ giá trị cũ (giá trị đó chỉ được cập nhật
 * khi có hoạt động mới).
 */
export function displayStreak(state: StreakState, today: LocalDate): number {
  if (state.lastActiveDate === null) return 0;
  const gap = diffInDays(state.lastActiveDate, today);
  return gap <= 1 ? state.currentStreak : 0;
}

/** Streak có còn "sống" không — true nếu học hôm nay hoặc hôm qua. */
export function isStreakAlive(state: StreakState, today: LocalDate): boolean {
  return displayStreak(state, today) > 0;
}

/** Ngày cuối cùng user phải học để không mất streak. */
export function streakDeadline(state: StreakState): LocalDate | null {
  return state.lastActiveDate === null ? null : addDays(state.lastActiveDate, 1);
}
