import { z } from 'zod';

/**
 * Bảng xếp hạng người học.
 *
 * Hai cách xếp hạng, chọn qua `metric`:
 *  - `xp`         điểm học tập — cùng công thức với cấp độ (`shared/level`). Không dựng
 *                 thang điểm riêng cho bảng xếp hạng: hai cách tính điểm song song là
 *                 hai chỗ để lệch nhau, và người dùng sẽ thấy "cấp của tôi nói một đằng,
 *                 thứ hạng nói một nẻo".
 *  - `activities` tổng số lượt hoạt động — cho người chăm chỉ làm nhiều việc nhỏ (ôn
 *                 flashcard, check-in) một chỗ để so tài, vì XP thiên vị hoạt động nặng
 *                 điểm (một bài quiz = 20 XP = năm lượt ôn thẻ).
 *
 * Cả hai cách đều xem được theo tuần, tháng hoặc toàn thời gian — `metric` và `range`
 * là hai trục độc lập, không phải bốn bảng cố định.
 */

export const leaderboardQuerySchema = z.object({
  /**
   * Khoảng thời gian tính điểm:
   * - `week` / `month`: theo `local_date` của tuần / tháng này
   * - `all`: tổng từ trước tới nay, khớp với "Tổng điểm" ở trang cá nhân
   */
  range: z.enum(['week', 'month', 'all']).default('week'),
  /** Xếp theo điểm học tập (XP) hay theo tổng số lượt hoạt động. */
  metric: z.enum(['xp', 'activities']).default('xp'),
  /** Số người hiển thị trong bảng. */
  limit: z.coerce.number().int().min(3).max(50).default(20),
});
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
export type LeaderboardMetric = LeaderboardQueryInput['metric'];

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  /** XP kiếm được TRONG khoảng đang xem. */
  xp: number;
  /**
   * Cấp độ của người đó, tính từ TOÀN BỘ lịch sử học.
   *
   * Cố ý không suy ra từ `xp` ở trên: với bảng tuần hay tháng, `xp` chỉ là điểm kiếm
   * được trong khoảng đó, quy ra cấp độ sẽ cho một con số không ai nhận ra là của mình.
   */
  level: number;
  /** Số hoạt động TRONG khoảng đang xem. */
  activities: number;
  /** Chuỗi ngày hiện tại, hiển thị kèm cho có ngữ cảnh. */
  currentStreak: number;
  /** Dòng này có phải chính người đang xem không — FE dùng để tô sáng. */
  isMe: boolean;
}

export interface LeaderboardResult {
  range: LeaderboardQueryInput['range'];
  metric: LeaderboardMetric;
  /** Top N theo thứ hạng. */
  entries: LeaderboardEntry[];
  /**
   * Dòng của người đang xem khi họ nằm ngoài top — null nếu đã có trong `entries`.
   * Không có phần này thì người mới vào chỉ thấy một bảng toàn người lạ.
   */
  me: LeaderboardEntry | null;
  /** Tổng số người có điểm trong khoảng, để hiện "hạng X / Y". */
  totalRanked: number;
}
