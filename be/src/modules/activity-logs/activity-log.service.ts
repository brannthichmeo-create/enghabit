import {
  GoalPeriod,
  NotificationType,
  applyActivity,
  computeStreak,
  startOfWeek,
  toLocalDate,
  type ActivityType,
  type GoalType,
  type LocalDate,
  type StreakState,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { getProgress } from '../goals/goal.service.js';
import { createNotification } from '../notifications/notification.service.js';

/**
 * Nơi DUY NHẤT ghi ActivityLog và cập nhật UserStreak.
 *
 * Mọi module khác (habits, flashcards, quizzes, vocabulary) phải gọi `recordActivity()`
 * thay vì tự ghi vào DB — nếu không sẽ có nhiều cách ghi log khác nhau và streak sẽ sai
 * (xem CLAUDE.md > Quy tắc tái sử dụng code).
 */

export interface RecordActivityInput {
  userId: number;
  type: ActivityType;
  /** Id bản ghi liên quan: vocabularyId, quizId, habitId... */
  refId?: number;
  /** Giá trị định lượng: số từ, số phút, điểm quiz. Mặc định 1. */
  value?: number;
  /** Timezone của user — bắt buộc để tính đúng localDate. */
  timezone: string;
  /**
   * Ngày (theo lịch của user) mà hoạt động được TÍNH cho. Mặc định là hôm nay.
   *
   * Chỉ truyền khi ghi bù cho ngày đã qua, vd check-in bù một thói quen của hôm qua.
   * Thiếu tham số này thì mọi bản ghi bù đều rơi vào hôm nay và đánh dấu sai ngày học —
   * user chưa học hôm nay vẫn được tính là có.
   */
  localDate?: LocalDate;
  /** Cho phép truyền client transaction khi cần ghi log cùng thao tác khác trong một transaction. */
  tx?: Prisma.TransactionClient;
}

/**
 * Ghi một hoạt động học và cập nhật streak trong cùng một transaction.
 * Dùng transaction để không bao giờ xảy ra cảnh có ActivityLog nhưng streak chưa cập nhật.
 */
export async function recordActivity(input: RecordActivityInput): Promise<{ localDate: LocalDate; streak: StreakState }> {
  const occurredAt = new Date();
  const today = toLocalDate(occurredAt, input.timezone);
  const localDate = input.localDate ?? today;

  // LocalDate là chuỗi 'YYYY-MM-DD' nên so sánh chuỗi cũng chính là so sánh ngày.
  const isBackdated = localDate < today;

  const run = async (tx: Prisma.TransactionClient) => {
    await tx.activityLog.create({
      data: {
        userId: input.userId,
        type: input.type,
        refId: input.refId ?? null,
        value: input.value ?? 1,
        // `occurredAt` là lúc bản ghi được TẠO, `localDate` mới là ngày được tính.
        // Với bản ghi bù, hai mốc này lệch nhau — đó là chủ ý: vẫn biết được ai bù
        // lúc nào, còn streak và thống kê chỉ đọc `localDate`.
        occurredAt,
        localDate: toDbDate(localDate),
      },
    });

    /*
      Ghi bù cho ngày đã qua thì KHÔNG cộng dồn được: `applyActivity` chỉ biết trạng
      thái hiện tại nên gặp ngày quá khứ là bỏ qua, trong khi ngày vừa bù có thể vá
      liền một quãng đứt ở giữa và làm chuỗi dài ra. Chỉ tính lại từ đầu mới ra đúng.
    */
    const streak = isBackdated
      ? await recomputeStreak(tx, input.userId)
      : await updateStreak(tx, input.userId, localDate);
    return { localDate, streak };
  };

  const result = input.tx ? await run(input.tx) : await prisma.$transaction(run);

  // Chúc mừng đạt mục tiêu — nuốt lỗi: một thông báo hỏng không được phép làm hỏng
  // việc ghi nhận hoạt động học.
  //
  // Chỉ chạy khi transaction do chính hàm này mở và đã commit xong. Nếu caller truyền
  // `tx` vào thì hoạt động vừa ghi CHƯA commit, đọc tiến độ mục tiêu ở ngoài sẽ ra số
  // cũ và thông báo hiện sai (vd "4/5" trong khi vừa đủ 5). Trường hợp đó để lần ghi
  // hoạt động kế tiếp phát hiện, thà chậm một nhịp còn hơn báo sai số.
  if (!input.tx) {
    await notifyAchievedGoals(input.userId, input.timezone, localDate).catch((error: unknown) => {
      logger.warn({ err: error, userId: input.userId }, 'Không tạo được thông báo đạt mục tiêu');
    });
  }

  return result;
}

/**
 * Tạo thông báo cho các mục tiêu vừa hoàn thành trong kỳ này.
 *
 * dedupeKey gắn goalId + ngày (mục tiêu tuần thì gắn ngày đầu tuần) nên mỗi kỳ chỉ
 * chúc mừng một lần, dù sau đó user còn học thêm bao nhiêu lượt nữa.
 */
async function notifyAchievedGoals(
  userId: number,
  timezone: string,
  localDate: LocalDate,
): Promise<void> {
  const progress = await getProgress(userId, timezone);
  const achieved = progress.filter((goal) => goal.isCompleted);
  if (achieved.length === 0) return;

  const goals = await prisma.goal.findMany({
    where: { id: { in: achieved.map((g) => g.goalId) } },
    select: { id: true, period: true },
  });
  const periodById = new Map(goals.map((g) => [g.id, g.period]));

  for (const goal of achieved) {
    const isWeekly = periodById.get(goal.goalId) === GoalPeriod.WEEKLY;
    const periodKey = isWeekly ? startOfWeek(localDate) : localDate;

    await createNotification({
      userId,
      type: NotificationType.GOAL_ACHIEVED,
      title: 'Đã đạt mục tiêu!',
      body: `${GOAL_TYPE_LABELS[goal.type]}: ${goal.currentValue}/${goal.targetValue} — hoàn thành ${
        isWeekly ? 'tuần này' : 'hôm nay'
      }.`,
      link: '/goals',
      dedupeKey: `${NotificationType.GOAL_ACHIEVED}:${goal.goalId}:${periodKey}`,
    });
  }
}

/** Nhãn tiếng Việt cho nội dung thông báo. Trùng ý với nhãn ở FE nhưng phải có bản
 * riêng ở BE, vì nội dung thông báo được sinh và lưu ở phía máy chủ. */
const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  VOCAB_PER_DAY: 'Số từ vựng mỗi ngày',
  MINUTES_PER_DAY: 'Số lượt ôn tập mỗi ngày',
  LESSONS_PER_WEEK: 'Số bài quiz mỗi tuần',
  STREAK_TARGET: 'Chuỗi ngày học liên tiếp',
};

/**
 * Cập nhật cache UserStreak theo ngày có hoạt động mới.
 * Logic tính nằm ở @enghabit/shared để fe/mobile dùng chung — ở đây chỉ đọc/ghi DB.
 */
async function updateStreak(
  tx: Prisma.TransactionClient,
  userId: number,
  localDate: LocalDate,
): Promise<StreakState> {
  const record = await tx.userStreak.findUnique({ where: { userId } });

  const previous: StreakState = {
    currentStreak: record?.currentStreak ?? 0,
    longestStreak: record?.longestStreak ?? 0,
    lastActiveDate: record?.lastActiveDate ? fromDbDate(record.lastActiveDate) : null,
  };

  const next = applyActivity(previous, localDate);

  // Không có gì thay đổi (học lại trong cùng ngày) thì bỏ qua ghi DB.
  if (
    record &&
    next.currentStreak === previous.currentStreak &&
    next.longestStreak === previous.longestStreak &&
    next.lastActiveDate === previous.lastActiveDate
  ) {
    return previous;
  }

  await tx.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastActiveDate: next.lastActiveDate ? toDbDate(next.lastActiveDate) : null,
    },
    update: {
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastActiveDate: next.lastActiveDate ? toDbDate(next.lastActiveDate) : null,
    },
  });

  return next;
}

/**
 * Dựng lại UserStreak từ đầu dựa trên ActivityLog — nguồn sự thật duy nhất.
 *
 * Đây là bản dùng chung cho hai chỗ: script `recompute-streak` (chạy tay khi số liệu
 * sai) và đường ghi bù ở `recordActivity`. Viết hai lần thì hai chỗ sẽ trôi khỏi nhau
 * và cùng một dữ liệu lại ra hai con số streak khác nhau.
 *
 * Phải đọc thêm `streak_freezes`: ngày đã bù bằng vật phẩm giữ chuỗi cũng nối mạch,
 * bỏ qua bảng này là xoá sạch công dụng của vật phẩm người dùng đã mua.
 */
export async function recomputeStreak(
  tx: Prisma.TransactionClient,
  userId: number,
): Promise<StreakState> {
  const [rows, freezes] = await Promise.all([
    tx.activityLog.findMany({
      where: { userId },
      select: { localDate: true },
      distinct: ['localDate'],
      orderBy: { localDate: 'asc' },
    }),
    tx.streakFreeze.findMany({
      where: { userId, usedOnDate: { not: null } },
      select: { usedOnDate: true },
    }),
  ]);

  const state = computeStreak(
    rows.map((r) => fromDbDate(r.localDate)),
    freezes.flatMap((f) => (f.usedOnDate ? [fromDbDate(f.usedOnDate)] : [])),
  );

  const data = {
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    lastActiveDate: state.lastActiveDate ? toDbDate(state.lastActiveDate) : null,
  };
  await tx.userStreak.upsert({ where: { userId }, create: { userId, ...data }, update: data });

  return state;
}

/** Danh sách ngày (local) user có hoạt động trong khoảng — dùng cho thống kê và recompute. */
export async function listActiveDates(userId: number, from?: LocalDate, to?: LocalDate): Promise<LocalDate[]> {
  const rows = await prisma.activityLog.findMany({
    where: {
      userId,
      ...(from || to
        ? { localDate: { ...(from && { gte: toDbDate(from) }), ...(to && { lte: toDbDate(to) }) } }
        : {}),
    },
    select: { localDate: true },
    distinct: ['localDate'],
    orderBy: { localDate: 'asc' },
  });

  return rows.map((r) => fromDbDate(r.localDate));
}
