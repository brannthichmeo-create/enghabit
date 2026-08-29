import {
  applyActivity,
  toLocalDate,
  type ActivityType,
  type LocalDate,
  type StreakState,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';

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
  /** Cho phép truyền client transaction khi cần ghi log cùng thao tác khác trong một transaction. */
  tx?: Prisma.TransactionClient;
}

/**
 * Ghi một hoạt động học và cập nhật streak trong cùng một transaction.
 * Dùng transaction để không bao giờ xảy ra cảnh có ActivityLog nhưng streak chưa cập nhật.
 */
export async function recordActivity(input: RecordActivityInput): Promise<{ localDate: LocalDate; streak: StreakState }> {
  const occurredAt = new Date();
  const localDate = toLocalDate(occurredAt, input.timezone);

  const run = async (tx: Prisma.TransactionClient) => {
    await tx.activityLog.create({
      data: {
        userId: input.userId,
        type: input.type,
        refId: input.refId ?? null,
        value: input.value ?? 1,
        occurredAt,
        localDate: toDbDate(localDate),
      },
    });

    const streak = await updateStreak(tx, input.userId, localDate);
    return { localDate, streak };
  };

  return input.tx ? run(input.tx) : prisma.$transaction(run);
}

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
