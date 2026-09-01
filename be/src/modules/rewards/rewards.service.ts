import { randomUUID } from 'node:crypto';
import {
  ActivityType,
  CoinReason,
  DAILY_CHECKIN_REWARD,
  DAILY_MISSIONS,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_PRICE,
  applyFrozenDay,
  checkInDedupeKey,
  evaluateMissions,
  findMission,
  freezableDate,
  missionDedupeKey,
  todayLocalDate,
  type CoinChangeResult,
  type LocalDate,
  type MissionId,
  type RewardsSummary,
  type StreakFreezeState,
  type StreakState,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { BadRequestError, ConflictError } from '../../common/errors/app-error.js';

/**
 * Phần thưởng động viên: điểm danh, nhiệm vụ ngày, vật phẩm giữ chuỗi.
 *
 * Ba quy tắc phải giữ khi sửa module này:
 *
 * 1. **Không ghi ActivityLog.** Điểm danh và nhận thưởng không phải hoạt động học;
 *    ghi vào đó thì bấm nút là đủ giữ streak và mọi thống kê học tập sẽ nói dối.
 * 2. **Không cộng XP.** XP suy ra từ ActivityLog nên không thể tặng. Phần thưởng ở
 *    đây là xu, có sổ cái riêng (coin_transactions).
 * 3. **Chống trùng bằng ràng buộc unique của DB**, không bằng câu lệnh đọc-rồi-ghi:
 *    hai request bấm cùng lúc đều đọc thấy "chưa nhận" và sẽ cùng ghi.
 *
 * Tiến độ nhiệm vụ KHÔNG lưu ở đâu cả — suy ra từ ActivityLog của ngày local đó,
 * cùng nguyên tắc với thống kê (xem CLAUDE.md).
 */

export async function getRewardsSummary(userId: number, timezone: string): Promise<RewardsSummary> {
  const today = todayLocalDate(timezone);

  const [coins, claimedKeys, counts, freeze] = await Promise.all([
    getCoinBalance(userId),
    listDedupeKeysOfDay(userId, today),
    countActivitiesOfDay(userId, today),
    getFreezeState(userId),
  ]);

  const claimed = DAILY_MISSIONS.filter((mission) =>
    claimedKeys.has(missionDedupeKey(mission.id, today)),
  ).map((mission) => mission.id);

  return {
    coins,
    checkIn: {
      localDate: today,
      claimedToday: claimedKeys.has(checkInDedupeKey(today)),
      reward: DAILY_CHECKIN_REWARD,
    },
    missions: evaluateMissions(counts, claimed),
    freeze,
  };
}

/** Điểm danh ngày hôm nay. Mỗi ngày local đúng một lần. */
export async function checkIn(userId: number, timezone: string): Promise<CoinChangeResult> {
  const today = todayLocalDate(timezone);

  await addCoins({
    userId,
    amount: DAILY_CHECKIN_REWARD,
    reason: CoinReason.DAILY_CHECKIN,
    dedupeKey: checkInDedupeKey(today),
    localDate: today,
    duplicateMessage: 'Hôm nay bạn đã điểm danh rồi',
  });

  return withSummary(userId, timezone, DAILY_CHECKIN_REWARD);
}

/**
 * Nhận thưởng một nhiệm vụ ngày.
 *
 * Tiến độ được chấm LẠI ở đây từ ActivityLog, không tin số FE gửi lên — nếu không,
 * sửa vài dòng trong devtools là nhận được thưởng mà chưa học gì.
 */
export async function claimMission(
  userId: number,
  timezone: string,
  missionId: MissionId,
): Promise<CoinChangeResult> {
  const mission = findMission(missionId);
  if (!mission) throw new BadRequestError('Nhiệm vụ không tồn tại');

  const today = todayLocalDate(timezone);
  const counts = await countActivitiesOfDay(userId, today);
  const state = evaluateMissions(counts).find((item) => item.id === missionId);

  if (!state?.isCompleted) {
    throw new BadRequestError('Nhiệm vụ chưa hoàn thành');
  }

  await addCoins({
    userId,
    amount: mission.reward,
    reason: CoinReason.MISSION_CLAIM,
    dedupeKey: missionDedupeKey(missionId, today),
    localDate: today,
    duplicateMessage: 'Bạn đã nhận thưởng nhiệm vụ này hôm nay',
  });

  return withSummary(userId, timezone, mission.reward);
}

/**
 * Mua một vật phẩm giữ chuỗi.
 *
 * Toàn bộ nằm trong một transaction có khoá dòng user: kiểm tra số dư rồi mới trừ.
 * Không khoá thì hai lần bấm cùng lúc đều thấy đủ tiền và user tiêu âm số dư.
 */
export async function buyStreakFreeze(userId: number, timezone: string): Promise<CoinChangeResult> {
  const today = todayLocalDate(timezone);

  await prisma.$transaction(async (tx) => {
    // Prisma không có API khoá dòng, nên phải dùng raw. Đây là ngoại lệ có chủ ý của
    // quy tắc "mọi truy vấn qua Prisma Client" — vẫn đi qua kết nối của Prisma.
    await tx.$executeRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

    const available = await tx.streakFreeze.count({ where: { userId, usedOnDate: null } });
    if (available >= MAX_STREAK_FREEZES) {
      throw new BadRequestError(`Kho chỉ giữ được tối đa ${MAX_STREAK_FREEZES} vật phẩm`);
    }

    const coins = await getCoinBalance(userId, tx);
    if (coins < STREAK_FREEZE_PRICE) {
      throw new BadRequestError(`Cần ${STREAK_FREEZE_PRICE} xu, bạn mới có ${coins}`);
    }

    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -STREAK_FREEZE_PRICE,
        reason: CoinReason.STREAK_FREEZE_PURCHASE,
        // Mua là hành động cố ý lặp lại được, khác điểm danh/nhiệm vụ — nên khoá chống
        // trùng ở đây chỉ cần là một giá trị không đụng nhau, không mang ý nghĩa chặn.
        dedupeKey: `${CoinReason.STREAK_FREEZE_PURCHASE}:${randomUUID()}`,
        localDate: toDbDate(today),
      },
    });

    await tx.streakFreeze.create({ data: { userId } });
  });

  return withSummary(userId, timezone, -STREAK_FREEZE_PRICE);
}

/**
 * Tiêu một vật phẩm để bù cho ngày user nghỉ, nếu đúng lúc cần.
 *
 * Gọi bởi job (be/src/jobs/streak-freeze.job.ts), không phải bởi route: người dùng
 * không cần và không nên phải tự bấm "cứu chuỗi" — quên bấm thì vật phẩm vô nghĩa.
 *
 * Trả về ngày đã được bù, hoặc null nếu không có gì để làm.
 */
export async function consumeFreezeIfNeeded(
  userId: number,
  timezone: string,
): Promise<LocalDate | null> {
  const record = await prisma.userStreak.findUnique({ where: { userId } });
  if (!record) return null;

  const state: StreakState = {
    currentStreak: record.currentStreak,
    longestStreak: record.longestStreak,
    lastActiveDate: record.lastActiveDate ? fromDbDate(record.lastActiveDate) : null,
  };

  const missed = freezableDate(state, todayLocalDate(timezone));
  if (!missed) return null;

  // Ngày đó thực ra có học (cache streak lạc hậu) thì không việc gì phải tiêu vật phẩm.
  const studied = await prisma.activityLog.count({ where: { userId, localDate: toDbDate(missed) } });
  if (studied > 0) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      const freeze = await tx.streakFreeze.findFirst({
        where: { userId, usedOnDate: null },
        orderBy: { id: 'asc' },
      });
      if (!freeze) return null;

      await tx.streakFreeze.update({ where: { id: freeze.id }, data: { usedOnDate: toDbDate(missed) } });

      // Dùng đúng hàm domain thay vì tự sửa số: ngày được bù giữ nguyên độ dài chuỗi,
      // chỉ đẩy lastActiveDate lên (xem shared/streak).
      const next = applyFrozenDay(state, missed);
      await tx.userStreak.update({
        where: { userId },
        data: {
          currentStreak: next.currentStreak,
          longestStreak: next.longestStreak,
          lastActiveDate: next.lastActiveDate ? toDbDate(next.lastActiveDate) : null,
        },
      });

      return missed;
    });
  } catch (error: unknown) {
    // Unique (user, used_on_date) đã chặn: một lượt quét khác vừa bù đúng ngày này.
    if (isUniqueViolation(error)) {
      logger.debug({ userId, missed }, 'Ngày này đã được bù bởi một lượt quét khác');
      return null;
    }
    throw error;
  }
}

/** Số dư = tổng sổ cái. Không có bảng lưu số dư (xem ghi chú ở schema.prisma). */
export async function getCoinBalance(
  userId: number,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  const result = await client.coinTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

async function getFreezeState(userId: number): Promise<StreakFreezeState> {
  const [available, lastUsed] = await Promise.all([
    prisma.streakFreeze.count({ where: { userId, usedOnDate: null } }),
    prisma.streakFreeze.findFirst({
      where: { userId, usedOnDate: { not: null } },
      orderBy: { usedOnDate: 'desc' },
      select: { usedOnDate: true },
    }),
  ]);

  return {
    available,
    price: STREAK_FREEZE_PRICE,
    max: MAX_STREAK_FREEZES,
    lastUsedDate: lastUsed?.usedOnDate ? fromDbDate(lastUsed.usedOnDate) : null,
  };
}

/** Số lượt của từng loại hoạt động trong một ngày local — đếm số bản ghi, như thống kê. */
async function countActivitiesOfDay(
  userId: number,
  localDate: LocalDate,
): Promise<Partial<Record<ActivityType, number>>> {
  const rows = await prisma.activityLog.groupBy({
    by: ['type'],
    where: { userId, localDate: toDbDate(localDate) },
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.type, row._count._all])) as Partial<
    Record<ActivityType, number>
  >;
}

async function listDedupeKeysOfDay(userId: number, localDate: LocalDate): Promise<Set<string>> {
  const rows = await prisma.coinTransaction.findMany({
    where: { userId, localDate: toDbDate(localDate) },
    select: { dedupeKey: true },
  });

  return new Set(rows.map((row) => row.dedupeKey));
}

/**
 * Ghi một khoản nhận xu. Trùng khoá nghĩa là đã nhận rồi — báo lỗi rõ ràng thay vì
 * lặng lẽ bỏ qua, để FE nói được với người dùng vì sao không có gì xảy ra.
 */
async function addCoins(input: {
  userId: number;
  amount: number;
  reason: CoinReason;
  dedupeKey: string;
  localDate: LocalDate;
  duplicateMessage: string;
}): Promise<void> {
  try {
    await prisma.coinTransaction.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        reason: input.reason,
        dedupeKey: input.dedupeKey,
        localDate: toDbDate(input.localDate),
      },
    });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) throw new ConflictError(input.duplicateMessage);
    throw error;
  }
}

async function withSummary(
  userId: number,
  timezone: string,
  delta: number,
): Promise<CoinChangeResult> {
  const summary = await getRewardsSummary(userId, timezone);
  return { coins: summary.coins, delta, summary };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
