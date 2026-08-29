import {
  ActivityType,
  GoalPeriod,
  GoalStatus,
  GoalType,
  startOfWeek,
  todayLocalDate,
  type CreateGoalInput,
  type GoalProgress,
  type LocalDate,
  type UpdateGoalInput,
} from '@enghabit/shared';
import type { Goal } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { toDbDate } from '../../common/utils/db-date.js';
import { getStreak } from '../statistics/statistics.service.js';

export async function listGoals(userId: number): Promise<Goal[]> {
  return prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createGoal(userId: number, input: CreateGoalInput): Promise<Goal> {
  return prisma.goal.create({
    data: {
      userId,
      type: input.type,
      targetValue: input.targetValue,
      period: input.period,
      startDate: toDbDate(input.startDate),
      endDate: input.endDate ? toDbDate(input.endDate) : null,
    },
  });
}

export async function updateGoal(userId: number, goalId: number, input: UpdateGoalInput): Promise<Goal> {
  await assertOwnership(userId, goalId);
  return prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(input.targetValue !== undefined && { targetValue: input.targetValue }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? toDbDate(input.endDate) : null }),
    },
  });
}

export async function deleteGoal(userId: number, goalId: number): Promise<void> {
  await assertOwnership(userId, goalId);
  await prisma.goal.delete({ where: { id: goalId } });
}

/**
 * Tiến độ các mục tiêu đang hoạt động, tính từ ActivityLog trong kỳ hiện tại
 * (hôm nay với mục tiêu DAILY, tuần này với WEEKLY).
 */
export async function getProgress(userId: number, timezone: string): Promise<GoalProgress[]> {
  const goals = await prisma.goal.findMany({ where: { userId, status: GoalStatus.ACTIVE } });
  const today = todayLocalDate(timezone);

  return Promise.all(
    goals.map(async (goal) => {
      const from = goal.period === GoalPeriod.WEEKLY ? startOfWeek(today) : today;
      const currentValue = await measureProgress(userId, timezone, goal.type, from, today);

      return {
        goalId: goal.id,
        type: goal.type,
        targetValue: goal.targetValue,
        currentValue,
        completionRate: Math.min(100, Math.round((currentValue / goal.targetValue) * 100)),
        isCompleted: currentValue >= goal.targetValue,
      };
    }),
  );
}

/** Mỗi loại mục tiêu đo bằng một nguồn số liệu khác nhau, nhưng đều bắt nguồn từ ActivityLog. */
async function measureProgress(
  userId: number,
  timezone: string,
  type: GoalType,
  from: LocalDate,
  to: LocalDate,
): Promise<number> {
  // STREAK_TARGET đo bằng chuỗi ngày hiện tại, không phải đếm hoạt động.
  if (type === GoalType.STREAK_TARGET) {
    return (await getStreak(userId, timezone)).currentStreak;
  }

  const activityType = {
    [GoalType.VOCAB_PER_DAY]: ActivityType.VOCAB_LEARNED,
    [GoalType.MINUTES_PER_DAY]: ActivityType.FLASHCARD_REVIEWED,
    [GoalType.LESSONS_PER_WEEK]: ActivityType.QUIZ_COMPLETED,
  }[type];

  const result = await prisma.activityLog.aggregate({
    where: {
      userId,
      type: activityType,
      localDate: { gte: toDbDate(from), lte: toDbDate(to) },
    },
    _count: { _all: true },
  });

  return result._count._all;
}

async function assertOwnership(userId: number, goalId: number): Promise<Goal> {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new NotFoundError('Không tìm thấy mục tiêu');
  return goal;
}
