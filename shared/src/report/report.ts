/**
 * Báo cáo học tập theo khoảng thời gian tự chọn.
 *
 * Đây là DOMAIN LOGIC dùng chung: `be` chấm chính thức, `fe` dùng để hiển thị và
 * xem trước (đổi khoảng ngày trên giao diện là thấy ngay chỉ tiêu quy đổi đổi theo,
 * không phải chờ gọi API).
 *
 * Ba việc đặt ở đây vì hai phía bắt buộc phải nói giống nhau:
 *  - loại hoạt động nào đo cho loại mục tiêu nào
 *  - quy đổi chỉ tiêu của một mục tiêu sang khoảng đang xem
 *  - chấm và xếp loại hiệu quả học tập
 */

import { ActivityType, GoalPeriod, GoalType } from '../constants/enums.js';

/**
 * Độ dài tối đa của một khoảng báo cáo.
 *
 * Có trần vì báo cáo vẽ biểu đồ một cột mỗi ngày: dài quá thì cột mảnh tới mức
 * không đọc được, mà truy vấn cũng phải gom nhóm nhiều bản ghi hơn hẳn.
 */
export const MAX_REPORT_DAYS = 366;

/**
 * Loại hoạt động dùng để đo từng loại mục tiêu.
 *
 * `STREAK_TARGET` không có mặt ở đây vì nó không đo bằng cách đếm hoạt động —
 * xem `isCumulativeGoal`.
 */
export const GOAL_ACTIVITY_TYPE: Record<Exclude<GoalType, 'STREAK_TARGET'>, ActivityType> = {
  [GoalType.VOCAB_PER_DAY]: ActivityType.VOCAB_LEARNED,
  [GoalType.MINUTES_PER_DAY]: ActivityType.FLASHCARD_REVIEWED,
  [GoalType.LESSONS_PER_WEEK]: ActivityType.QUIZ_COMPLETED,
};

/**
 * Mục tiêu này có cộng dồn theo thời gian không.
 *
 * Mục tiêu chuỗi ngày thì KHÔNG: đặt "chuỗi 30 ngày" rồi xem báo cáo một tuần, nhân
 * chỉ tiêu lên thành 210 là con số vô nghĩa. Với loại đó ta đối chiếu chuỗi dài nhất
 * đạt được trong khoảng với đúng con số người dùng đặt.
 */
export function isCumulativeGoal(type: GoalType): type is Exclude<GoalType, 'STREAK_TARGET'> {
  return type !== GoalType.STREAK_TARGET;
}

/**
 * Quy đổi chỉ tiêu của một mục tiêu sang khoảng `days` ngày.
 *
 * Mục tiêu tuần lấy số tuần làm tròn LÊN, giống cách `countExpectedDays` của module
 * habits đếm số lần một thói quen tuần đến hạn — hai chỗ cùng một cách hiểu "tuần đã
 * bắt đầu thì tính là một tuần".
 */
export function expectedForRange(
  type: GoalType,
  period: GoalPeriod,
  targetValue: number,
  days: number,
): number {
  if (days <= 0) return 0;
  if (!isCumulativeGoal(type)) return targetValue;
  return period === GoalPeriod.WEEKLY ? targetValue * Math.ceil(days / 7) : targetValue * days;
}

/** Xếp loại hiệu quả học tập của một khoảng. */
export const EffectivenessLevel = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  LOW: 'LOW',
} as const;
export type EffectivenessLevel = (typeof EffectivenessLevel)[keyof typeof EffectivenessLevel];

/**
 * Điểm hiệu quả 0-100.
 *
 * Tỷ lệ ngày có học chiếm phần lớn hơn tỷ lệ đạt mục tiêu, vì đây là ứng dụng xây
 * thói quen: học đều bảy ngày mỗi ngày một ít tốt hơn dồn hết vào một hôm rồi nghỉ
 * cả tuần, dù tổng số hoạt động có thể bằng nhau.
 *
 * Chưa đặt mục tiêu nào thì chấm hoàn toàn theo mức độ đều đặn — không có vạch do
 * người dùng tự đặt thì cũng không có gì để đối chiếu.
 *
 * Cố ý KHÔNG dựng thang điểm riêng cho từng loại hoạt động: XP đã làm việc đó rồi
 * (xem `shared/level`), thêm một cách quy đổi thứ hai là thêm một chỗ để lệch.
 */
export function effectivenessScore(activeDayRate: number, goalCompletionRate: number | null): number {
  const consistency = clampPercent(activeDayRate);
  if (goalCompletionRate === null) return Math.round(consistency);
  return Math.round(consistency * 0.6 + clampPercent(goalCompletionRate) * 0.4);
}

/** Xếp loại từ điểm hiệu quả. */
export function evaluateEffectiveness(score: number): EffectivenessLevel {
  if (score >= 80) return EffectivenessLevel.EXCELLENT;
  if (score >= 60) return EffectivenessLevel.GOOD;
  if (score >= 40) return EffectivenessLevel.FAIR;
  return EffectivenessLevel.LOW;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
