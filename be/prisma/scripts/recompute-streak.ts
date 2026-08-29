import { computeStreak } from '@enghabit/shared';
import { prisma } from '../../src/lib/prisma.js';
import { fromDbDate, toDbDate } from '../../src/common/utils/db-date.js';

/**
 * Tính lại UserStreak từ ActivityLog — nguồn sự thật duy nhất.
 *
 * Dùng khi số liệu streak sai. KHÔNG sửa tay bảng user_streaks (xem CLAUDE.md).
 *
 *   pnpm --filter @enghabit/be db:recompute-streak          # tất cả user
 *   pnpm --filter @enghabit/be db:recompute-streak -- 42    # chỉ user id 42
 */

async function recomputeForUser(userId: number): Promise<void> {
  const rows = await prisma.activityLog.findMany({
    where: { userId },
    select: { localDate: true },
    distinct: ['localDate'],
    orderBy: { localDate: 'asc' },
  });

  const state = computeStreak(rows.map((r) => fromDbDate(r.localDate)));

  await prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate ? toDbDate(state.lastActiveDate) : null,
    },
    update: {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate ? toDbDate(state.lastActiveDate) : null,
    },
  });

  console.log(
    `  user ${userId}: current=${state.currentStreak}, longest=${state.longestStreak}, last=${state.lastActiveDate ?? '-'}`,
  );
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const userIds = arg
    ? [Number(arg)]
    : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

  console.log(`Tính lại streak cho ${userIds.length} người dùng...`);
  for (const userId of userIds) {
    await recomputeForUser(userId);
  }
  console.log('Hoàn tất.');
}

main()
  .catch((error: unknown) => {
    console.error('Lỗi khi tính lại streak:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
