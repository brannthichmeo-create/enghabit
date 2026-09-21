/**
 * Dự báo ngày đạt của mục tiêu cộng dồn tới hạn (`GoalPeriod.TOTAL`).
 *
 * Đặt ở `shared` vì đây là con số người dùng dựa vào để quyết định có cố thêm hay không:
 * `be` tính kèm tiến độ, `fe` hiển thị — không phía nào tự suy lại theo cách riêng.
 *
 * Tốc độ lấy trung bình từ NGÀY BẮT ĐẦU tới hôm nay, tính cả hôm nay. Không lấy "7 ngày
 * gần nhất": mục tiêu mới tạo hai hôm thì 7 ngày gần nhất phần lớn là thời gian mục tiêu
 * chưa tồn tại, và dự báo sẽ bi quan một cách vô lý.
 */

import { addDays, diffInDays, type LocalDate } from '../date/local-date.js';

export interface GoalForecast {
  /** Trung bình mỗi ngày từ ngày bắt đầu tới hôm nay, làm tròn một chữ số thập phân. */
  dailyPace: number;
  /** Ngày dự kiến đạt theo tốc độ hiện tại. Null khi chưa có tiến độ nào để suy ra. */
  projectedDate: LocalDate | null;
  /** Mỗi ngày cần bao nhiêu, từ hôm nay tới hạn, để kịp. Null khi mục tiêu không có hạn. */
  requiredPerDay: number | null;
  /**
   * Theo tốc độ hiện tại có kịp hạn không. Null khi không có hạn — không có mốc để so.
   * Chưa có tiến độ nào mà có hạn thì là `false`: đứng yên thì không bao giờ tới.
   */
  onTrack: boolean | null;
}

export interface ForecastInput {
  targetValue: number;
  currentValue: number;
  startDate: LocalDate;
  endDate: LocalDate | null;
  today: LocalDate;
}

export function forecastGoal({ targetValue, currentValue, startDate, endDate, today }: ForecastInput): GoalForecast {
  const elapsedDays = Math.max(1, diffInDays(startDate, today) + 1);
  const pace = currentValue / elapsedDays;
  const remaining = Math.max(0, targetValue - currentValue);

  if (remaining === 0) {
    return {
      dailyPace: round1(pace),
      projectedDate: today,
      requiredPerDay: endDate ? 0 : null,
      onTrack: endDate ? true : null,
    };
  }

  const projectedDate = pace > 0 ? addDays(today, Math.ceil(remaining / pace)) : null;

  if (!endDate) {
    return { dailyPace: round1(pace), projectedDate, requiredPerDay: null, onTrack: null };
  }

  // Tính cả hôm nay: hôm nay vẫn còn học được. Hạn đã qua thì coi như còn đúng một ngày
  // để con số "cần mỗi ngày" không chia cho 0 hay ra số âm.
  const daysLeft = Math.max(1, diffInDays(today, endDate) + 1);

  return {
    dailyPace: round1(pace),
    projectedDate,
    requiredPerDay: Math.ceil(remaining / daysLeft),
    onTrack: projectedDate !== null && projectedDate <= endDate,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
