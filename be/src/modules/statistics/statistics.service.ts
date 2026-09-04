import {
  ActivityType,
  GOAL_ACTIVITY_TYPE,
  GoalStatus,
  addDays,
  computeStreak,
  diffInDays,
  displayStreak,
  eachDayBetween,
  effectivenessScore,
  evaluateEffectiveness,
  expectedForRange,
  isCumulativeGoal,
  isStreakAlive,
  levelFromXp,
  xpFromActivityCounts,
  startOfMonth,
  startOfWeek,
  streakDeadline,
  todayLocalDate,
  type ActivityCalendar,
  type CalendarDay,
  type DailyStat,
  type LearningReport,
  type LevelSummary,
  type LocalDate,
  type ReportGoalProgress,
  type ReportRangeInput,
  type ReportTotals,
  type StatsRangeInput,
  type StatsSummary,
  type StreakSummary,
  type StreakState,
} from '@enghabit/shared';
import type { Goal } from '@prisma/client';
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

  const activeDays = daily.filter((d) => d.totalActivities > 0).length;

  return {
    range,
    from,
    to: today,
    daily,
    totals: sumByType(daily),
    activeDayRate: daily.length === 0 ? 0 : Math.round((activeDays / daily.length) * 100),
    streak,
  };
}

/** Cộng dồn số lượt theo từng loại hoạt động cho cả khoảng. */
function sumByType(daily: DailyStat[]): Record<ActivityType, number> {
  return daily.reduce(
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
 * Cấp độ của NHIỀU người dùng, tính bằng đúng MỘT truy vấn.
 *
 * Gọi `getLevel` cho từng người sẽ thành N+1 truy vấn ở những chỗ liệt kê nhiều người
 * (bảng xếp hạng, danh sách bài viết ở diễn đàn) — mỗi lượt lại group toàn bộ
 * ActivityLog một lần.
 *
 * Luôn tính trên TOÀN BỘ lịch sử, không giới hạn khoảng thời gian: cấp độ là con số
 * tích luỹ của cả hành trình. Bảng xếp hạng theo tuần vẫn phải hiện cấp độ thật của
 * người đó, không phải cấp độ suy từ điểm kiếm được trong tuần.
 *
 * Người chưa có hoạt động nào vẫn ở cấp 1, nên mọi id truyền vào đều có mặt trong kết quả.
 */
export async function getLevelsFor(userIds: number[]): Promise<Map<number, number>> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Map();

  const rows = await prisma.activityLog.groupBy({
    by: ['userId', 'type'],
    where: { userId: { in: ids } },
    _count: { _all: true },
  });

  const countsByUser = new Map<number, Partial<Record<ActivityType, number>>>();
  for (const row of rows) {
    const counts = countsByUser.get(row.userId) ?? {};
    counts[row.type] = row._count._all;
    countsByUser.set(row.userId, counts);
  }

  return new Map(
    ids.map((id) => [id, levelFromXp(xpFromActivityCounts(countsByUser.get(id) ?? {})).level]),
  );
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

// ---------------------------------------------------------------------------
// Báo cáo học tập theo khoảng tự chọn
// ---------------------------------------------------------------------------

/**
 * Báo cáo cho một khoảng ngày do người học tự chọn.
 *
 * Trả lời ba câu hỏi trong đúng một lần gọi: trong khoảng đó đã làm được những gì,
 * đạt bao nhiêu phần trăm so với mục tiêu đã đặt, và tổng thể học có hiệu quả không.
 *
 * Mọi con số vẫn đi ra từ `ActivityLog` group theo `local_date` như phần thống kê
 * còn lại — không có bảng tổng hợp riêng cho báo cáo (xem CLAUDE.md).
 */
export async function getLearningReport(
  userId: number,
  timezone: string,
  range: ReportRangeInput,
): Promise<LearningReport> {
  // Cắt mốc cuối về hôm nay: ngày chưa tới thì đương nhiên chưa có hoạt động, để
  // chúng nằm trong mẫu số sẽ kéo tỷ lệ ngày học xuống một cách vô lý.
  const today = todayLocalDate(timezone);
  const from = range.from;
  const to = range.to > today ? today : range.to;
  const days = Math.max(0, diffInDays(from, to) + 1);

  // Kỳ liền trước, cùng độ dài — để nói được "hơn hay kém kỳ trước" thay vì đưa ra
  // một con số trơ trọi không có gì đối chiếu.
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(days - 1));

  const [daily, previousDaily, goals, frozenDates] = await Promise.all([
    getDailyStats(userId, from, to),
    getDailyStats(userId, previousFrom, previousTo),
    findGoalsOverlapping(userId, from, to),
    listFrozenDates(userId, from, to),
  ]);

  const totals = sumByType(daily);
  const activeDates = daily.filter((day) => day.totalActivities > 0).map((day) => day.date);

  // Chuỗi trong khoảng tính cả ngày được vật phẩm bù, đúng như cách streak chính thức
  // được dựng lại. Bỏ qua thì báo cáo sẽ báo chuỗi ngắn hơn con số người dùng đang
  // nhìn thấy ở trang tổng quan, và họ không có cách nào hiểu vì sao lệch.
  const streakInRange = computeStreak(activeDates, frozenDates);

  const goalProgress = goals.map((goal) =>
    measureGoalInRange(goal, days, totals, streakInRange.longestStreak),
  );

  const goalCompletionRate =
    goalProgress.length === 0
      ? null
      : Math.round(
          goalProgress.reduce((sum, goal) => sum + goal.completionRate, 0) / goalProgress.length,
        );

  const current = toReportTotals(from, to, daily);
  const score = effectivenessScore(current.activeDayRate, goalCompletionRate);

  return {
    from,
    to,
    days,
    daily,
    totals,
    current,
    previous: toReportTotals(previousFrom, previousTo, previousDaily),
    bestDay: findBestDay(daily),
    longestStreakInRange: streakInRange.longestStreak,
    goals: goalProgress,
    goalCompletionRate,
    effectivenessScore: score,
    effectiveness: evaluateEffectiveness(score),
  };
}

/**
 * Mục tiêu còn hiệu lực trong khoảng.
 *
 * Bỏ qua mục tiêu bắt đầu SAU khoảng hoặc đã kết thúc TRƯỚC khoảng — chấm một mục
 * tiêu trong quãng thời gian nó chưa tồn tại thì lúc nào cũng ra 0%.
 */
async function findGoalsOverlapping(userId: number, from: LocalDate, to: LocalDate): Promise<Goal[]> {
  return prisma.goal.findMany({
    where: {
      userId,
      status: GoalStatus.ACTIVE,
      startDate: { lte: toDbDate(to) },
      OR: [{ endDate: null }, { endDate: { gte: toDbDate(from) } }],
    },
    orderBy: { createdAt: 'asc' },
  });
}

/** Các ngày trong khoảng đã được vật phẩm giữ chuỗi bù. */
async function listFrozenDates(userId: number, from: LocalDate, to: LocalDate): Promise<LocalDate[]> {
  const rows = await prisma.streakFreeze.findMany({
    where: { userId, usedOnDate: { gte: toDbDate(from), lte: toDbDate(to) } },
    select: { usedOnDate: true },
  });

  return rows.flatMap((row) => (row.usedOnDate ? [fromDbDate(row.usedOnDate)] : []));
}

function toReportTotals(from: LocalDate, to: LocalDate, daily: DailyStat[]): ReportTotals {
  const activeDays = daily.filter((day) => day.totalActivities > 0).length;

  return {
    from,
    to,
    totalActivities: daily.reduce((sum, day) => sum + day.totalActivities, 0),
    activeDays,
    activeDayRate: daily.length === 0 ? 0 : Math.round((activeDays / daily.length) * 100),
    // Dùng lại đúng công thức XP của shared/level — không dựng thang điểm thứ hai.
    xp: xpFromActivityCounts(sumByType(daily)),
  };
}

/** Ngày học nhiều nhất; ngày đầu tiên thắng khi hoà, để kết quả ổn định giữa các lần gọi. */
function findBestDay(daily: DailyStat[]): CalendarDay | null {
  const best = daily.reduce<DailyStat | null>(
    (top, day) => (day.totalActivities > (top?.totalActivities ?? 0) ? day : top),
    null,
  );

  return best ? { date: best.date, count: best.totalActivities } : null;
}

/**
 * Tiến độ một mục tiêu trong khoảng báo cáo.
 *
 * Mục tiêu đếm hoạt động thì so tổng số lượt với chỉ tiêu đã quy đổi sang cả khoảng;
 * mục tiêu chuỗi ngày thì so chuỗi dài nhất đạt được với đúng con số người dùng đặt
 * (xem `isCumulativeGoal` và `expectedForRange` ở shared/report).
 */
function measureGoalInRange(
  goal: Goal,
  days: number,
  totals: Record<ActivityType, number>,
  longestStreakInRange: number,
): ReportGoalProgress {
  const expectedValue = expectedForRange(goal.type, goal.period, goal.targetValue, days);

  const currentValue = isCumulativeGoal(goal.type)
    ? totals[GOAL_ACTIVITY_TYPE[goal.type]]
    : longestStreakInRange;

  return {
    goalId: goal.id,
    type: goal.type,
    period: goal.period,
    targetValue: goal.targetValue,
    expectedValue,
    currentValue,
    completionRate:
      expectedValue === 0 ? 0 : Math.min(100, Math.round((currentValue / expectedValue) * 100)),
    isCompleted: expectedValue > 0 && currentValue >= expectedValue,
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
