import {
  GOAL_ACTIVITY_TYPE,
  GoalPeriod,
  GoalStatus,
  GoalType,
  addDays,
  diffInDays,
  forecastGoal,
  isCumulativeGoal,
  isGoalInEffect,
  startOfWeek,
  todayLocalDate,
  type CreateGoalInput,
  type FinishGoalInput,
  type GoalProgress,
  type LocalDate,
  type UpdateGoalInput,
} from '@enghabit/shared';
import type { Goal } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { getStreak } from '../statistics/statistics.service.js';

export async function listGoals(userId: number): Promise<Goal[]> {
  return prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createGoal(
  userId: number,
  timezone: string,
  input: CreateGoalInput,
): Promise<Goal> {
  if (input.endDate) assertDeadlineNotPast(input.endDate, timezone);

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

export async function updateGoal(
  userId: number,
  timezone: string,
  goalId: number,
  input: UpdateGoalInput,
): Promise<Goal> {
  const goal = await assertOwnership(userId, goalId);
  assertStillActive(goal);

  if (input.endDate) {
    assertDeadlineNotPast(input.endDate, timezone);
    if (input.endDate < fromDbDate(goal.startDate)) {
      throw new BadRequestError('Hạn phải từ ngày bắt đầu mục tiêu trở đi');
    }
  }

  return prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(input.targetValue !== undefined && { targetValue: input.targetValue }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? toDbDate(input.endDate) : null }),
    },
  });
}

/**
 * Kết thúc một mục tiêu: đã đạt (`COMPLETED`) hoặc thôi theo dõi (`ARCHIVED`).
 *
 * Chốt luôn hạn về hôm nay nếu hạn còn ở phía trước hoặc chưa có hạn: nhờ vậy mục tiêu
 * đã kết thúc vẫn mang đúng khoảng thời gian nó từng được theo dõi, và giao diện nói
 * được "kết thúc ngày nào". Hạn đã qua thì giữ nguyên — mục tiêu thật sự dừng từ hôm đó.
 *
 * Không có chiều ngược lại. Mở lại một mục tiêu đã chốt hạn thì khoảng từ lúc kết thúc
 * tới lúc mở lại thành ngày "đang theo dõi" mà không ai theo dõi; muốn làm tiếp thì tạo
 * mục tiêu mới.
 */
export async function finishGoal(
  userId: number,
  timezone: string,
  goalId: number,
  outcome: FinishGoalInput['outcome'],
): Promise<Goal> {
  const goal = await assertOwnership(userId, goalId);
  assertStillActive(goal);

  const today = todayLocalDate(timezone);
  if (fromDbDate(goal.startDate) > today) {
    throw new BadRequestError('Mục tiêu chưa bắt đầu nên không kết thúc được. Hãy xoá nó');
  }

  const endDate = goal.endDate && fromDbDate(goal.endDate) < today ? goal.endDate : toDbDate(today);

  return prisma.goal.update({
    where: { id: goalId },
    data: { status: outcome, endDate, pausedAt: null },
  });
}

/**
 * Tạm dừng mục tiêu (ốm, thi học kỳ, đi xa): thôi đo tiến độ, thôi chúc mừng, và khi
 * tiếp tục thì hạn lùi đúng số ngày đã dừng — người dùng không bị mất quãng đó.
 *
 * Chỉ dừng được mục tiêu đang trong hạn. Dừng một mục tiêu đã quá hạn rồi tiếp tục là
 * một cách gia hạn vòng vèo; muốn gia hạn thì dùng nút Gia hạn.
 */
export async function pauseGoal(userId: number, timezone: string, goalId: number): Promise<Goal> {
  const goal = await assertOwnership(userId, goalId);
  assertStillActive(goal);
  if (goal.pausedAt) throw new BadRequestError('Mục tiêu đang tạm dừng rồi');

  const today = todayLocalDate(timezone);
  if (!isGoalInEffect(fromDbDate(goal.startDate), goal.endDate ? fromDbDate(goal.endDate) : null, today)) {
    throw new BadRequestError('Chỉ tạm dừng được mục tiêu đang trong hạn');
  }

  return prisma.goal.update({ where: { id: goalId }, data: { pausedAt: toDbDate(today) } });
}

/** Tiếp tục mục tiêu đang tạm dừng. Hạn (nếu có) lùi đúng số ngày đã dừng. */
export async function resumeGoal(userId: number, timezone: string, goalId: number): Promise<Goal> {
  const goal = await assertOwnership(userId, goalId);
  assertStillActive(goal);
  if (!goal.pausedAt) throw new BadRequestError('Mục tiêu không ở trạng thái tạm dừng');

  // Dừng rồi tiếp tục ngay trong ngày là 0 ngày — hôm đó vẫn học được, không bù thêm.
  const pausedDays = Math.max(0, diffInDays(fromDbDate(goal.pausedAt), todayLocalDate(timezone)));

  return prisma.goal.update({
    where: { id: goalId },
    data: {
      pausedAt: null,
      ...(goal.endDate && { endDate: toDbDate(addDays(fromDbDate(goal.endDate), pausedDays)) }),
    },
  });
}

export async function deleteGoal(userId: number, goalId: number): Promise<void> {
  await assertOwnership(userId, goalId);
  await prisma.goal.delete({ where: { id: goalId } });
}

/**
 * Tiến độ các mục tiêu đang hoạt động, tính từ ActivityLog trong kỳ hiện tại
 * (hôm nay với mục tiêu DAILY, tuần này với WEEKLY, từ ngày bắt đầu với TOTAL).
 *
 * Chỉ đo mục tiêu còn trong hạn và không tạm dừng. Mục tiêu đã quá hạn (hoặc chưa tới
 * ngày bắt đầu) bị loại ở đây chứ không chỉ ẩn trên giao diện: hàm này còn là nguồn của
 * thông báo "Đã đạt mục tiêu!", và không lọc thì một mục tiêu đã chết vẫn được chúc mừng
 * mỗi ngày. Trang Báo cáo cũng lọc theo đúng khoảng ngày này (`findGoalsOverlapping`).
 */
export async function getProgress(userId: number, timezone: string): Promise<GoalProgress[]> {
  const today = todayLocalDate(timezone);
  const goals = (
    await prisma.goal.findMany({ where: { userId, status: GoalStatus.ACTIVE, pausedAt: null } })
  ).filter((goal) =>
    isGoalInEffect(fromDbDate(goal.startDate), goal.endDate ? fromDbDate(goal.endDate) : null, today),
  );

  return Promise.all(
    goals.map(async (goal) => {
      const startDate = fromDbDate(goal.startDate);
      const from = periodStart(goal.period, startDate, today);
      const currentValue = await measureProgress(userId, timezone, goal.type, from, today);

      return {
        goalId: goal.id,
        type: goal.type,
        period: goal.period,
        targetValue: goal.targetValue,
        currentValue,
        completionRate: Math.min(100, Math.round((currentValue / goal.targetValue) * 100)),
        isCompleted: currentValue >= goal.targetValue,
        forecast:
          goal.period === GoalPeriod.TOTAL
            ? forecastGoal({
                targetValue: goal.targetValue,
                currentValue,
                startDate,
                endDate: goal.endDate ? fromDbDate(goal.endDate) : null,
                today,
              })
            : null,
      };
    }),
  );
}

/** Ngày đầu của kỳ đang đo. Mục tiêu cộng dồn đo từ ngày bắt đầu mục tiêu. */
function periodStart(period: GoalPeriod, startDate: LocalDate, today: LocalDate): LocalDate {
  if (period === GoalPeriod.TOTAL) return startDate;
  return period === GoalPeriod.WEEKLY ? startOfWeek(today) : today;
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
  if (!isCumulativeGoal(type)) {
    return (await getStreak(userId, timezone)).currentStreak;
  }

  const result = await prisma.activityLog.aggregate({
    where: {
      userId,
      type: GOAL_ACTIVITY_TYPE[type],
      localDate: { gte: toDbDate(from), lte: toDbDate(to) },
    },
    _count: { _all: true },
  });

  return result._count._all;
}

/**
 * Hạn không được nằm trong quá khứ. Đặt hạn đã qua là tạo ra một mục tiêu hết hạn
 * ngay lúc sinh ra — không bao giờ đo được tiến độ, chỉ nằm đó chiếm chỗ.
 */
function assertDeadlineNotPast(endDate: LocalDate, timezone: string): void {
  if (endDate < todayLocalDate(timezone)) {
    throw new BadRequestError('Hạn phải từ hôm nay trở đi');
  }
}

/** Mục tiêu đã kết thúc là một dòng lịch sử: không sửa, không kết thúc lần hai. */
function assertStillActive(goal: Goal): void {
  if (goal.status !== GoalStatus.ACTIVE) {
    throw new BadRequestError('Mục tiêu này đã kết thúc nên không sửa được nữa');
  }
}

async function assertOwnership(userId: number, goalId: number): Promise<Goal> {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new NotFoundError('Không tìm thấy mục tiêu');
  return goal;
}
