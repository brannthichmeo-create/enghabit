import {
  ActivityType,
  addDays,
  displayStreak,
  eachDayBetween,
  isStreakAlive,
  startOfMonth,
  startOfWeek,
  streakDeadline,
  todayLocalDate,
  type DailyStat,
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

  const [daily, streak] = await Promise.all([
    getDailyStats(userId, from, today),
    getStreak(userId, timezone),
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
  };
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
