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
 * Cập nhật streak cho một ngày được BÙ bằng vật phẩm giữ chuỗi (streak freeze).
 *
 * Ngày được bù nối lại mạch nhưng KHÔNG cộng thêm ngày: người dùng không học hôm đó,
 * nên chuỗi được giữ nguyên chứ không dài ra. `lastActiveDate` vẫn phải nhảy sang ngày
 * được bù, nếu không thì hôm sau tính khoảng cách sẽ ra 2 ngày và chuỗi vẫn đứt.
 *
 * Vật phẩm chỉ bù được đúng ngày liền sau ngày hoạt động cuối. Nghỉ hai ngày liền thì
 * chuỗi đã đứt trước khi vật phẩm kịp có tác dụng.
 */
export function applyFrozenDay(state: StreakState, frozenDate: LocalDate): StreakState {
  if (state.lastActiveDate === null) return state;
  if (diffInDays(state.lastActiveDate, frozenDate) !== 1) return state;

  return { ...state, lastActiveDate: frozenDate };
}

/**
 * Tính lại streak từ đầu dựa trên danh sách ngày có hoạt động.
 * Đây là hàm dùng bởi script recompute-streak.
 *
 * Nguồn dữ liệu là ActivityLog, cộng thêm các ngày đã được bù bằng vật phẩm giữ chuỗi
 * (bảng streak_freezes). Hai nguồn này là TẤT CẢ những gì cần để dựng lại UserStreak —
 * quy tắc "UserStreak luôn tái tạo được, không sửa tay" vẫn giữ nguyên.
 *
 * Ngày vừa có hoạt động vừa được bù thì tính là ngày học: vật phẩm coi như chưa dùng
 * tới, và chuỗi được +1 như bình thường.
 */
export function computeStreak(
  activityDates: readonly LocalDate[],
  frozenDates: readonly LocalDate[] = [],
): StreakState {
  const active = new Set(activityDates);
  const frozen = new Set([...frozenDates].filter((date) => !active.has(date)));
  const allDates = [...new Set([...active, ...frozen])].sort();

  return allDates.reduce(
    (state, date) => (active.has(date) ? applyActivity(state, date) : applyFrozenDay(state, date)),
    EMPTY_STREAK,
  );
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

/**
 * Ngày mà một vật phẩm giữ chuỗi có thể cứu, xét tại thời điểm `today`. Null nghĩa là
 * không có gì để cứu: chưa từng học, hôm qua đã học, hoặc đã nghỉ quá lâu.
 *
 * Dùng bởi job tự động tiêu vật phẩm. Điều kiện đúng là khoảng cách 2 ngày — tức là
 * bỏ lỡ đúng một ngày (hôm qua) và hôm nay chuỗi sẽ đứt nếu không bù.
 */
export function freezableDate(state: StreakState, today: LocalDate): LocalDate | null {
  if (state.lastActiveDate === null || state.currentStreak === 0) return null;
  return diffInDays(state.lastActiveDate, today) === 2 ? addDays(state.lastActiveDate, 1) : null;
}
