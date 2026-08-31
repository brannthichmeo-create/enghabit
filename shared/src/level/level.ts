import { ActivityType } from '../constants/enums.js';

/**
 * Điểm kinh nghiệm (XP) và cấp độ.
 *
 * XP là dữ liệu DẪN XUẤT từ ActivityLog, không lưu thành cột riêng — cùng nguyên
 * tắc với streak. Nhờ vậy không bao giờ có chuyện XP lệch với lịch sử hoạt động,
 * và đổi cách tính điểm chỉ cần sửa ở đây.
 */

/**
 * XP cho mỗi loại hoạt động.
 *
 * Chênh lệch phản ánh công sức bỏ ra: làm xong một bài quiz tốn nhiều thời gian
 * và trí lực hơn nhiều so với lật một thẻ flashcard.
 */
export const XP_PER_ACTIVITY: Record<ActivityType, number> = {
  [ActivityType.FLASHCARD_REVIEWED]: 4,
  [ActivityType.VOCAB_LEARNED]: 8,
  [ActivityType.HABIT_CHECKIN]: 12,
  [ActivityType.QUIZ_COMPLETED]: 20,
};

/**
 * XP cần để LÊN cấp n (tính riêng cho từng cấp, không cộng dồn).
 *
 * Tăng dần theo cấp để cấp đầu đạt nhanh — người mới cần thấy tiến triển ngay,
 * còn người học lâu thì mỗi cấp là một cột mốc đáng kể.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 100 + (level - 2) * 60;
}

/** Tổng XP tích luỹ cần có để đạt tới cấp n. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l += 1) total += xpForLevel(l);
  return total;
}

export interface LevelState {
  /** Tổng XP tích luỹ từ trước tới nay. */
  xp: number;
  level: number;
  /** XP đã kiếm được trong cấp hiện tại. */
  xpInLevel: number;
  /** XP cần để lên cấp kế tiếp. */
  xpToNextLevel: number;
  /** Tiến độ tới cấp kế tiếp, 0-100. */
  progressPercent: number;
}

/** Trần cấp độ, tránh vòng lặp chạy vô hạn nếu XP bị sai bất thường. */
const MAX_LEVEL = 200;

/** Suy ra cấp độ và tiến độ từ tổng XP. */
export function levelFromXp(xp: number): LevelState {
  const safeXp = Math.max(0, Math.floor(xp));

  let level = 1;
  let consumed = 0;

  while (level < MAX_LEVEL && safeXp - consumed >= xpForLevel(level + 1)) {
    consumed += xpForLevel(level + 1);
    level += 1;
  }

  const xpInLevel = safeXp - consumed;
  const needed = level >= MAX_LEVEL ? 0 : xpForLevel(level + 1);

  return {
    xp: safeXp,
    level,
    xpInLevel,
    xpToNextLevel: Math.max(0, needed - xpInLevel),
    progressPercent: needed === 0 ? 100 : Math.round((xpInLevel / needed) * 100),
  };
}

/** Tổng XP từ số lượt của từng loại hoạt động. */
export function xpFromActivityCounts(counts: Partial<Record<ActivityType, number>>): number {
  return (Object.keys(XP_PER_ACTIVITY) as ActivityType[]).reduce(
    (sum, type) => sum + (counts[type] ?? 0) * XP_PER_ACTIVITY[type],
    0,
  );
}
