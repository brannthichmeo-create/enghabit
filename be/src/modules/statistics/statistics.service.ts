import {
  ActivityType,
  addDays,
  displayStreak,
  eachDayBetween,
  isStreakAlive,
  levelFromXp,
  xpFromActivityCounts,
  startOfMonth,
  startOfWeek,
  streakDeadline,
  todayLocalDate,
  type ActivityCalendar,
  type DailyStat,
  type LevelSummary,
  type LocalDate,
  type StatsRangeInput,
  type StatsSummary,
  type StreakSummary,
  type StreakState,
} from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';

/**
 * Thống kê tính TRỰC TIẾP từ ActivityLog (query on-the-fly), không có bảng tổng hợp riêng.
 * Ở quy mô vài trăm user, bảng tổng hợp chỉ làm tăng nguy cơ lệch số liệu (xem CLAUDE.md).
 */

export async function getSummary(
  userId: number,
  timezone: string,
  range: StatsRangeInput['range'],
): Promise<StatsSummary> {
  const today = todayLocalDate(timezone);
  const from = rangeStart(range, today);

  const [daily, streak, level] = await Promise.all([
    getDailyStats(userId, from, today),
    getStreak(userId, timezone),
    getLevel(userId),
  ]);

  const totals = daily.reduce(
    (acc, day) => ({
      [ActivityType.VOCAB_LEARNED]: acc[ActivityType.VOCAB_LEARNED] + day.vocabLearned,
      [ActivityType.FLASHCARD_REVIEWED]: acc[ActivityType.FLASHCARD_REVIEWED] + day.flashcardsReviewed,
      [ActivityType.QUIZ_COMPLETED]: acc[ActivityType.QUIZ_COMPLETED] + day.quizzesCompleted,
      [ActivityType.HABIT_CHECKIN]: acc[ActivityType.HABIT_CHECKIN] + day.habitCheckIns,
    }),
    {
      [ActivityType.VOCAB_LEARNED]: 0,
      [ActivityType.FLASHCARD_REVIEWED]: 0,
      [ActivityType.QUIZ_COMPLETED]: 0,
      [ActivityType.HABIT_CHECKIN]: 0,
    } as Record<ActivityType, number>,
  );

  const activeDays = daily.filter((d) => d.totalActivities > 0).length;

  return {
    range,
    from,
    to: today,
    daily,
    totals,
    activeDayRate: daily.length === 0 ? 0 : Math.round((activeDays / daily.length) * 100),
    streak,
    level,
  };
}

/**
 * XP và cấp độ, tính từ TOÀN BỘ ActivityLog chứ không phải khoảng đang xem.
 *
 * XP là dữ liệu dẫn xuất, không lưu thành cột riêng — cùng nguyên tắc với streak,
 * nên không bao giờ lệch với lịch sử hoạt động. Cách tính nằm ở @enghabit/shared
 * để fe/mobile hiển thị được mà không cần gọi lại API.
 */
export async function getLevel(userId: number): Promise<LevelSummary> {
  const rows = await prisma.activityLog.groupBy({
    by: ['type'],
    where: { userId },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(rows.map((r) => [r.type, r._count._all]));
  return levelFromXp(xpFromActivityCounts(counts));
}

/**
 * Số liệu từng ngày trong khoảng. Group theo localDate — không convert timezone trong SQL.
 * Những ngày không có hoạt động vẫn được trả về với giá trị 0 để FE vẽ biểu đồ liền mạch.
 */
export async function getDailyStats(userId: number, from: LocalDate, to: LocalDate): Promise<DailyStat[]> {
  const rows = await prisma.activityLog.groupBy({
    by: ['localDate', 'type'],
    where: { userId, localDate: { gte: toDbDate(from), lte: toDbDate(to) } },
    _count: { _all: true },
  });

  const byDate = new Map<LocalDate, Map<ActivityType, number>>();
  for (const row of rows) {
    const date = fromDbDate(row.localDate);
    const counts = byDate.get(date) ?? new Map<ActivityType, number>();
    counts.set(row.type, row._count._all);
    byDate.set(date, counts);
  }

  return eachDayBetween(from, to).map((date) => {
    const counts = byDate.get(date);
    const vocabLearned = counts?.get(ActivityType.VOCAB_LEARNED) ?? 0;
    const flashcardsReviewed = counts?.get(ActivityType.FLASHCARD_REVIEWED) ?? 0;
    const quizzesCompleted = counts?.get(ActivityType.QUIZ_COMPLETED) ?? 0;
    const habitCheckIns = counts?.get(ActivityType.HABIT_CHECKIN) ?? 0;

    return {
      date,
      vocabLearned,
      flashcardsReviewed,
      quizzesCompleted,
      habitCheckIns,
      totalActivities: vocabLearned + flashcardsReviewed + quizzesCompleted + habitCheckIns,
    };
  });
}

/**
 * Streak để hiển thị. Đọc từ cache UserStreak nhưng luôn đối chiếu với hôm nay:
 * nếu user không học hôm nay lẫn hôm qua thì chuỗi đã đứt và phải hiện 0,
 * dù giá trị trong DB vẫn là số cũ.
 */
export async function getStreak(userId: number, timezone: string): Promise<StreakSummary> {
  const record = await prisma.userStreak.findUnique({ where: { userId } });
  const today = todayLocalDate(timezone);

  const state: StreakState = {
    currentStreak: record?.currentStreak ?? 0,
    longestStreak: record?.longestStreak ?? 0,
    lastActiveDate: record?.lastActiveDate ? fromDbDate(record.lastActiveDate) : null,
  };

  return {
    currentStreak: displayStreak(state, today),
    longestStreak: state.longestStreak,
    lastActiveDate: state.lastActiveDate,
    isAlive: isStreakAlive(state, today),
    deadline: streakDeadline(state),
  };
}

/**
 * Dữ liệu cho biểu đồ lịch kiểu GitHub: mỗi ngày một ô, đậm nhạt theo số hoạt động.
 *
 * Chỉ lấy tổng số mỗi ngày (không tách theo loại) vì biểu đồ này trả lời câu hỏi
 * "có học hay không, nhiều hay ít" — chi tiết theo loại đã có ở biểu đồ cột.
 */
export async function getActivityCalendar(
  userId: number,
  timezone: string,
  months: number,
): Promise<ActivityCalendar> {
  const today = todayLocalDate(timezone);
  const from = addMonths(today, -months);

  const rows = await prisma.activityLog.groupBy({
    by: ['localDate'],
    where: { userId, localDate: { gte: toDbDate(from), lte: toDbDate(today) } },
    _count: { _all: true },
  });

  const countByDate = new Map(rows.map((r) => [fromDbDate(r.localDate), r._count._all]));

  const days = eachDayBetween(from, today).map((date) => ({
    date,
    count: countByDate.get(date) ?? 0,
  }));

  const activeCounts = days.filter((d) => d.count > 0).map((d) => d.count);

  return {
    from,
    to: today,
    days,
    totalActivities: activeCounts.reduce((sum, n) => sum + n, 0),
    activeDays: activeCounts.length,
    thresholds: computeThresholds(activeCounts),
  };
}

/**
 * Ngưỡng chia 4 mức đậm nhạt, lấy theo phân vị của những ngày CÓ hoạt động.
 *
 * Dùng phân vị thay vì chia đều theo giá trị lớn nhất: một ngày học đột biến
 * sẽ không làm toàn bộ các ngày còn lại tụt xuống mức nhạt nhất.
 */
function computeThresholds(activeCounts: number[]): [number, number, number] {
  if (activeCounts.length === 0) return [1, 2, 3];

  const sorted = [...activeCounts].sort((a, b) => a - b);
  const at = (p: number): number => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 1;

  // Đảm bảo các ngưỡng tăng dần kể cả khi dữ liệu ít và trùng nhau nhiều.
  const t1 = Math.max(1, at(0.25));
  const t2 = Math.max(t1 + 1, at(0.5));
  const t3 = Math.max(t2 + 1, at(0.75));
  return [t1, t2, t3];
}

/** Cộng/trừ số tháng vào một LocalDate, giữ nguyên ngày trong tháng khi có thể. */
function addMonths(date: LocalDate, delta: number): LocalDate {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const d = new Date(Date.UTC(year, month - 1 + delta, day));
  return d.toISOString().slice(0, 10);
}

function rangeStart(range: StatsRangeInput['range'], today: LocalDate): LocalDate {
  switch (range) {
    case 'day':
      // Vẫn lấy 7 ngày gần nhất để biểu đồ "ngày" có bối cảnh so sánh.
      return addDays(today, -6);
    case 'week':
      return startOfWeek(today);
    case 'month':
      return startOfMonth(today);
  }
}
