import { z } from 'zod';

/**
 * Bảng xếp hạng người học.
 *
 * Điểm xếp hạng chính là XP — cùng công thức với cấp độ (`shared/level`), tính từ
 * `ActivityLog`. Không dựng thang điểm riêng cho bảng xếp hạng: hai cách tính điểm
 * song song là hai chỗ để lệch nhau, và người dùng sẽ thấy "cấp của tôi nói một đằng,
 * thứ hạng nói một nẻo".
 */

export const leaderboardQuerySchema = z.object({
  /**
   * Khoảng thời gian tính điểm:
   * - `week` / `month`: XP kiếm được trong tuần / tháng này (theo `local_date`)
   * - `all`: tổng XP từ trước tới nay, khớp với "Tổng điểm" ở trang cá nhân
   */
  range: z.enum(['week', 'month', 'all']).default('week'),
  /** Số người hiển thị trong bảng. */
  limit: z.coerce.number().int().min(3).max(50).default(20),
});
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  /** XP kiếm được TRONG khoảng đang xem — đây mới là điểm dùng để xếp hạng. */
  xp: number;
  /**
   * Cấp độ của người đó, tính từ TOÀN BỘ lịch sử học.
   *
   * Cố ý không suy ra từ `xp` ở trên: với bảng tuần hay tháng, `xp` chỉ là điểm kiếm
   * được trong khoảng đó, quy ra cấp độ sẽ cho một con số không ai nhận ra là của mình.
   */
  level: number;
  /** Số hoạt động trong khoảng — để phân biệt "học nhiều lượt nhỏ" với "ít lượt nặng". */
  activities: number;
  /** Chuỗi ngày hiện tại, hiển thị kèm cho có ngữ cảnh. */
  currentStreak: number;
  /** Dòng này có phải chính người đang xem không — FE dùng để tô sáng. */
  isMe: boolean;
}

export interface LeaderboardResult {
  range: LeaderboardQueryInput['range'];
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
