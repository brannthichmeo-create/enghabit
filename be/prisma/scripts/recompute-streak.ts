import { prisma } from '../../src/lib/prisma.js';
import { recomputeStreak } from '../../src/modules/activity-logs/activity-log.service.js';

/**
 * Tính lại UserStreak từ ActivityLog — nguồn sự thật duy nhất.
 *
 * Dùng khi số liệu streak sai. KHÔNG sửa tay bảng user_streaks (xem CLAUDE.md).
 *
 *   pnpm --filter @enghabit/be db:recompute-streak          # tất cả user
 *   pnpm --filter @enghabit/be db:recompute-streak -- 42    # chỉ user id 42
 *
 * Phép tính nằm ở `activity-logs/activity-log.service.ts` để dùng chung với đường ghi
 * bù hoạt động cho ngày đã qua — script này chỉ lo phần chạy dòng lệnh và in kết quả.
 */

async function recomputeForUser(userId: number): Promise<void> {
  const state = await recomputeStreak(prisma, userId);

  console.log(
    `  user ${userId}: current=${state.currentStreak}, longest=${state.longestStreak}, last=${state.lastActiveDate ?? '-'}`,
  );
}

async function main(): Promise<void> {
  // Bỏ dấu `--`: pnpm chuyển nguyên nó vào argv, nên `-- 42` trước đây bị đọc thành
  // id người dùng và script chết vì `Number('--')` là NaN — đúng cách gọi ghi trong
  // CLAUDE.md lại là cách duy nhất không chạy được.
  const arg = process.argv.slice(2).find((value) => value !== '--');

  const userIds = arg
    ? [Number(arg)]
    : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

  if (userIds.some((id) => !Number.isInteger(id))) {
    throw new Error(`Id người dùng không hợp lệ: ${arg}`);
  }

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
