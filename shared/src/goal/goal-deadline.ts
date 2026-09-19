/**
 * Hạn của mục tiêu học tập.
 *
 * Đây là DOMAIN LOGIC dùng chung: `be` dùng để quyết định mục tiêu nào còn được đo tiến
 * độ (và còn được chúc mừng khi đạt), `fe` dùng để hiện "còn N ngày" / "đã hết hạn".
 * Hai phía phải nói cùng một câu — nếu không, trang Mục tiêu hiện "còn hạn" trong khi
 * máy chủ đã thôi đo, và người dùng thấy thanh tiến độ đứng im mà không hiểu vì sao.
 *
 * Mục tiêu hiệu lực TRỌN ngày bắt đầu và TRỌN ngày hạn (cả hai đầu đều tính). Hạn là
 * ngày cuối cùng còn được học để đạt, không phải thời điểm hết hạn lúc 0 giờ.
 */

import { diffInDays, type LocalDate } from '../date/local-date.js';

export const GoalTimelineState = {
  /** Chưa tới ngày bắt đầu. */
  UPCOMING: 'UPCOMING',
  /** Đang trong thời gian hiệu lực (kể cả mục tiêu không có hạn). */
  ACTIVE: 'ACTIVE',
  /** Đã qua ngày hạn. */
  EXPIRED: 'EXPIRED',
} as const;
export type GoalTimelineState = (typeof GoalTimelineState)[keyof typeof GoalTimelineState];

export interface GoalTimeline {
  state: GoalTimelineState;
  /**
   * Số ngày còn lại tới hạn, tính từ hôm nay. 0 nghĩa là hôm nay là ngày cuối.
   * Null khi mục tiêu không có hạn hoặc đã hết hạn.
   */
  daysLeft: number | null;
}

export function goalTimeline(
  startDate: LocalDate,
  endDate: LocalDate | null,
  today: LocalDate,
): GoalTimeline {
  if (today < startDate) return { state: GoalTimelineState.UPCOMING, daysLeft: null };
  if (endDate === null) return { state: GoalTimelineState.ACTIVE, daysLeft: null };
  if (today > endDate) return { state: GoalTimelineState.EXPIRED, daysLeft: null };
  return { state: GoalTimelineState.ACTIVE, daysLeft: diffInDays(today, endDate) };
}

/** Mục tiêu có còn được đo tiến độ vào ngày `today` không. */
export function isGoalInEffect(startDate: LocalDate, endDate: LocalDate | null, today: LocalDate): boolean {
  return goalTimeline(startDate, endDate, today).state === GoalTimelineState.ACTIVE;
}
