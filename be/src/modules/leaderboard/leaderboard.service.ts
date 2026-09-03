import {
  ActivityType,
  UserRole,
  UserStatus,
  startOfMonth,
  startOfWeek,
  todayLocalDate,
  xpFromActivityCounts,
  type LeaderboardEntry,
  type LeaderboardQueryInput,
  type LeaderboardResult,
  type LocalDate,
} from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { toDbDate } from '../../common/utils/db-date.js';

/**
 * Bảng xếp hạng người học.
 *
 * Tính TRỰC TIẾP từ `ActivityLog` mỗi lần đọc, không có bảng tổng hợp — cùng nguyên
 * tắc với thống kê (xem CLAUDE.md). Ở quy mô vài trăm user, một lần `groupBy` là đủ
 * nhanh, còn bảng tổng hợp thì phải cập nhật ở mọi chỗ ghi hoạt động và chỉ chờ ngày lệch.
 *
 * Điểm xếp hạng là XP, dùng đúng `xpFromActivityCounts` của `shared/level` để thứ hạng
 * không bao giờ mâu thuẫn với cấp độ hiện trên trang cá nhân.
 *
 * Chỉ xếp hạng tài khoản `USER` đang hoạt động: quản trị viên không đi học, còn tài
 * khoản bị khoá thì không nên tiếp tục chiếm chỗ trong bảng.
 */

export async function getLeaderboard(
  userId: number,
  timezone: string,
  query: LeaderboardQueryInput,
): Promise<LeaderboardResult> {
  const from = rangeStart(query.range, todayLocalDate(timezone));

  const rows = await prisma.activityLog.groupBy({
    by: ['userId', 'type'],
    where: {
      ...(from && { localDate: { gte: toDbDate(from) } }),
      user: { role: UserRole.USER, status: UserStatus.ACTIVE },
    },
    _count: { _all: true },
  });

  // Gom số lượt theo từng user rồi quy ra XP.
  const byUser = new Map<number, Partial<Record<ActivityType, number>>>();
  for (const row of rows) {
    const counts = byUser.get(row.userId) ?? {};
    counts[row.type] = row._count._all;
    byUser.set(row.userId, counts);
  }

  const scored = [...byUser.entries()].map(([id, counts]) => ({
    userId: id,
    xp: xpFromActivityCounts(counts),
    activities: Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0),
  }));

  // Sắp xếp: XP giảm dần, hoà thì ai ít hoạt động hơn đứng trên (cùng điểm mà làm ít
  // lượt hơn nghĩa là chọn việc nặng hơn). Cuối cùng chốt bằng userId để thứ tự ổn
  // định giữa các lần gọi — không có mốc này, hai người hoà nhau sẽ nhảy chỗ mỗi lần tải.
  scored.sort((a, b) => b.xp - a.xp || a.activities - b.activities || a.userId - b.userId);

  const profiles = await loadProfiles(scored.map((item) => item.userId));

  const all: LeaderboardEntry[] = scored.map((item, index) => ({
    rank: index + 1,
    userId: item.userId,
    name: profiles.get(item.userId)?.name ?? '—',
    xp: item.xp,
    activities: item.activities,
    currentStreak: profiles.get(item.userId)?.currentStreak ?? 0,
    isMe: item.userId === userId,
  }));

  const entries = all.slice(0, query.limit);
  const mine = all.find((entry) => entry.isMe) ?? null;

  return {
    range: query.range,
    entries,
    // Đã nằm trong bảng thì không lặp lại ở dưới.
    me: mine && mine.rank > query.limit ? mine : null,
    totalRanked: all.length,
  };
}

/** Tên và chuỗi ngày của những người có mặt trong bảng. */
async function loadProfiles(
  userIds: number[],
): Promise<Map<number, { name: string; currentStreak: number }>> {
  if (userIds.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, streak: { select: { currentStreak: true } } },
  });

  return new Map(
    users.map((user) => [user.id, { name: user.name, currentStreak: user.streak?.currentStreak ?? 0 }]),
  );
}

/** Mốc bắt đầu của khoảng; `null` nghĩa là tính từ trước tới nay. */
function rangeStart(range: LeaderboardQueryInput['range'], today: LocalDate): LocalDate | null {
  if (range === 'week') return startOfWeek(today);
  if (range === 'month') return startOfMonth(today);
  return null;
}
