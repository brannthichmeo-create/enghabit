import {
  ActivityType,
  HabitFrequency,
  addDays,
  diffInDays,
  todayLocalDate,
  type CheckInHabitInput,
  type CreateHabitInput,
  type LocalDate,
  type UpdateHabitInput,
} from '@enghabit/shared';
import type { Habit } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';

export interface HabitWithStatus extends Habit {
  /** Đã check-in trong ngày hôm nay chưa (theo timezone của user). */
  checkedInToday: boolean;
  /** Các ngày đã check-in trong 7 ngày gần nhất — để client vẽ mức độ đều đặn. */
  recentCheckIns: LocalDate[];
}

/** Số ngày lịch sử trả kèm mỗi thói quen, đủ để nhìn ra thói quen tuần này. */
const RECENT_DAYS = 7;

/**
 * Danh sách thói quen kèm trạng thái hôm nay và lịch sử 7 ngày.
 *
 * Trả sẵn `checkedInToday` để client vô hiệu hoá nút Check-in ngay khi tải trang —
 * nếu không, user bấm lại sẽ nhận lỗi 409 dù không làm gì sai.
 */
export async function listHabits(userId: number, timezone: string): Promise<HabitWithStatus[]> {
  const today = todayLocalDate(timezone);
  const from = addDays(today, -(RECENT_DAYS - 1));

  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      checkIns: {
        where: { localDate: { gte: toDbDate(from), lte: toDbDate(today) } },
        select: { localDate: true },
      },
    },
  });

  return habits.map(({ checkIns, ...habit }) => {
    const dates = checkIns.map((c) => fromDbDate(c.localDate));
    return { ...habit, checkedInToday: dates.includes(today), recentCheckIns: dates };
  });
}

export async function createHabit(userId: number, input: CreateHabitInput): Promise<Habit> {
  return prisma.habit.create({
    data: {
      userId,
      name: input.name,
      frequency: input.frequency,
      customDays: input.frequency === HabitFrequency.CUSTOM ? (input.customDays ?? []) : undefined,
      reminderTime: input.reminderTime ?? null,
      isActive: input.isActive,
    },
  });
}

export async function updateHabit(userId: number, habitId: number, input: UpdateHabitInput): Promise<Habit> {
  await assertOwnership(userId, habitId);
  return prisma.habit.update({
    where: { id: habitId },
    data: {
      ...input,
      customDays: input.customDays ?? undefined,
    },
  });
}

export async function deleteHabit(userId: number, habitId: number): Promise<void> {
  await assertOwnership(userId, habitId);
  await prisma.habit.delete({ where: { id: habitId } });
}

/**
 * Số ngày được phép check-in BÙ về trước, tính cả hôm nay.
 *
 * Có giới hạn vì check-in là thứ ghi thẳng vào ActivityLog, mà streak lại tính từ đó:
 * không chặn thì chỉ cần gọi API với vài chục ngày quá khứ là dựng được một chuỗi dài
 * mà không học buổi nào. Bảy ngày vừa đủ để vá chỗ quên đánh dấu, và khớp với dải 7 ngày
 * mà giao diện đang hiển thị.
 */
const MAX_BACKFILL_DAYS = 7;

/**
 * Check-in hoàn thành thói quen trong ngày.
 * Ghi HabitCheckIn và ActivityLog trong CÙNG một transaction để streak không bao giờ lệch.
 */
export async function checkIn(
  userId: number,
  habitId: number,
  timezone: string,
  input: CheckInHabitInput,
): Promise<{ date: LocalDate }> {
  await assertOwnership(userId, habitId);

  const today = todayLocalDate(timezone);
  const date = input.date ?? today;

  // Ngày mai chưa xảy ra: cho phép sẽ tạo ra ngày học nằm ở tương lai, và mọi phép
  // tính streak sau đó đọc phải một mốc không có thật.
  if (date > today) throw new BadRequestError('Không thể check-in cho ngày chưa tới');
  if (diffInDays(date, today) >= MAX_BACKFILL_DAYS) {
    throw new BadRequestError(`Chỉ check-in bù được trong vòng ${MAX_BACKFILL_DAYS} ngày gần nhất`);
  }

  const existing = await prisma.habitCheckIn.findUnique({
    where: { habitId_localDate: { habitId, localDate: toDbDate(date) } },
  });
  if (existing) throw new ConflictError('Thói quen này đã được check-in trong ngày');

  await prisma.$transaction(async (tx) => {
    await tx.habitCheckIn.create({
      data: { habitId, userId, localDate: toDbDate(date), note: input.note ?? null },
    });

    await recordActivity({
      userId,
      type: ActivityType.HABIT_CHECKIN,
      refId: habitId,
      timezone,
      // Check-in bù phải tính cho ĐÚNG ngày được bù. Thiếu dòng này thì bù cho hôm qua
      // lại đánh dấu hôm nay có học, và chuỗi ngày hiện sai ở cả hai ngày.
      localDate: date,
      tx,
    });
  });

  return { date };
}

/** Lịch sử check-in của một thói quen, dùng để vẽ lịch/đánh giá tỷ lệ duy trì. */
export async function listCheckIns(
  userId: number,
  habitId: number,
  from?: LocalDate,
  to?: LocalDate,
): Promise<{ date: LocalDate; note: string | null }[]> {
  await assertOwnership(userId, habitId);

  const rows = await prisma.habitCheckIn.findMany({
    where: {
      habitId,
      ...(from || to
        ? { localDate: { ...(from && { gte: toDbDate(from) }), ...(to && { lte: toDbDate(to) }) } }
        : {}),
    },
    orderBy: { localDate: 'desc' },
  });

  return rows.map((r) => ({ date: fromDbDate(r.localDate), note: r.note }));
}

/**
 * Tỷ lệ hoàn thành thói quen trong khoảng thời gian.
 * Mẫu số là số ngày thói quen đó "đến hạn" theo tần suất, không phải tổng số ngày.
 */
export async function getCompletionRate(
  userId: number,
  habitId: number,
  from: LocalDate,
  to: LocalDate,
): Promise<{ expected: number; completed: number; rate: number }> {
  const habit = await assertOwnership(userId, habitId);

  const completed = await prisma.habitCheckIn.count({
    where: { habitId, localDate: { gte: toDbDate(from), lte: toDbDate(to) } },
  });

  const expected = countExpectedDays(habit, from, to);
  const rate = expected === 0 ? 0 : Math.round((completed / expected) * 100);

  return { expected, completed, rate };
}

/** Số ngày thói quen đến hạn trong khoảng, theo tần suất đã cấu hình. */
function countExpectedDays(habit: Habit, from: LocalDate, to: LocalDate): number {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (totalDays <= 0) return 0;

  if (habit.frequency === HabitFrequency.DAILY) return totalDays;
  if (habit.frequency === HabitFrequency.WEEKLY) return Math.ceil(totalDays / 7);

  // CUSTOM: đếm số ngày trong khoảng rơi vào các thứ đã chọn.
  const days = new Set((habit.customDays as number[] | null) ?? []);
  if (days.size === 0) return 0;

  let count = 0;
  for (let i = 0; i < totalDays; i += 1) {
    const day = new Date(start.getTime() + i * 86_400_000);
    // getUTCDay(): 0 = Chủ nhật → đổi sang ISO 1-7 (Thứ Hai = 1)
    const isoWeekday = ((day.getUTCDay() + 6) % 7) + 1;
    if (days.has(isoWeekday)) count += 1;
  }
  return count;
}

async function assertOwnership(userId: number, habitId: number): Promise<Habit> {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) throw new NotFoundError('Không tìm thấy thói quen');
  return habit;
}
