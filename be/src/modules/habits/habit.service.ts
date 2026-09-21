import {
  ActivityType,
  GoalStatus,
  HabitFrequency,
  addDays,
  diffInDays,
  eachDayBetween,
  habitAmountsError,
  habitDayLevel,
  habitPeriodStart,
  isHabitPeriodDone,
  isScheduledDay,
  todayLocalDate,
  weeklyQuota,
  type CheckInHabitInput,
  type CreateHabitInput,
  type HabitDayLevel,
  type HabitSchedule,
  type LocalDate,
  type UpdateHabitInput,
} from '@enghabit/shared';
import { Prisma, type Goal, type Habit } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { isUniqueViolation } from '../../common/utils/prisma-error.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';

/** Một ngày trong lịch sử của thói quen. */
export interface HabitDay {
  date: LocalDate;
  /**
   * Lượng đã làm. Thói quen tự tích: số người dùng khai, null nếu tích không kèm lượng.
   * Thói quen tự động: số hoạt động loại đó trong ngày.
   */
  amount: number | null;
  note: string | null;
  /** Null = có làm nhưng chưa tới mức tối thiểu — chỉ gặp ở thói quen tự động. */
  level: HabitDayLevel | null;
}

/** Mục tiêu mà thói quen phục vụ — đủ để giao diện gọi tên nó. */
type LinkedGoal = Pick<Goal, 'id' | 'type' | 'period' | 'targetValue' | 'status'>;

export interface HabitWithStatus extends Habit {
  /** Hôm nay đã đạt ít nhất mức tối thiểu chưa (theo timezone của user). */
  checkedInToday: boolean;
  /** Lượng đã làm hôm nay, null nếu chưa làm gì. */
  todayAmount: number | null;
  /**
   * Các ngày có làm trong 7 ngày gần nhất — để client vẽ mức độ đều đặn. Trả kèm ghi chú:
   * người dùng viết ghi chú lúc check-in thì phải đọc lại được ở đúng ô ngày đó.
   */
  recentDays: HabitDay[];
  goal: LinkedGoal | null;
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
    include: { goal: { select: { id: true, type: true, period: true, targetValue: true, status: true } } },
  });
  const daysByHabit = await loadHabitDays(userId, habits, from, today);

  return habits.map((habit) => {
    const recentDays = daysByHabit.get(habit.id) ?? [];
    const todayEntry = recentDays.find((day) => day.date === today);
    return {
      ...habit,
      checkedInToday: Boolean(todayEntry?.level),
      todayAmount: todayEntry?.amount ?? null,
      recentDays,
    };
  });
}

export async function createHabit(userId: number, input: CreateHabitInput): Promise<Habit> {
  const config = normalizeConfig({
    frequency: input.frequency,
    autoActivity: input.autoActivity,
    targetAmount: input.targetAmount,
    minAmount: input.minAmount,
    unit: input.unit,
    timesPerWeek: input.timesPerWeek,
  });
  if (input.goalId !== null) await assertGoalLinkable(userId, input.goalId);

  return prisma.habit.create({
    data: {
      userId,
      name: input.name,
      customDays: input.frequency === HabitFrequency.CUSTOM ? (input.customDays ?? []) : undefined,
      reminderTime: input.reminderTime ?? null,
      isActive: input.isActive,
      goalId: input.goalId,
      ...config,
    },
  });
}

export async function updateHabit(userId: number, habitId: number, input: UpdateHabitInput): Promise<Habit> {
  const habit = await assertOwnership(userId, habitId);

  // Kiểm trên bản ĐÃ GỘP: PATCH chỉ gửi mức tối thiểu thì phải so với lượng mỗi lần đang lưu.
  const config = normalizeConfig({
    frequency: input.frequency ?? habit.frequency,
    autoActivity: input.autoActivity !== undefined ? input.autoActivity : habit.autoActivity,
    targetAmount: input.targetAmount !== undefined ? input.targetAmount : habit.targetAmount,
    minAmount: input.minAmount !== undefined ? input.minAmount : habit.minAmount,
    unit: input.unit !== undefined ? input.unit : habit.unit,
    timesPerWeek: input.timesPerWeek !== undefined ? input.timesPerWeek : habit.timesPerWeek,
  });
  // Chỉ kiểm khi ĐỔI mục tiêu: thói quen đang gắn một mục tiêu vừa kết thúc vẫn sửa tên được.
  if (input.goalId !== undefined && input.goalId !== null && input.goalId !== habit.goalId) {
    await assertGoalLinkable(userId, input.goalId);
  }

  return prisma.habit.update({
    where: { id: habitId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.customDays !== undefined && { customDays: input.customDays }),
      ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.goalId !== undefined && { goalId: input.goalId }),
      ...config,
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
 * Check-in hoàn thành thói quen tự tích trong ngày.
 *
 * Mỗi NGÀY chỉ ghi một dòng `HABIT_CHECKIN` vào ActivityLog, dù tích bao nhiêu thói quen.
 * Tích tay là việc ứng dụng không kiểm được: mỗi lượt một dòng thì tạo mười thói quen
 * "abc" rồi tích là được 120 XP mỗi ngày mà không học chữ nào. Một dòng mỗi ngày vẫn đủ
 * giữ chuỗi và làm nhiệm vụ "Check-in 1 thói quen" cho người thật sự học ngoài ứng dụng.
 *
 * Check-in và dòng ActivityLog (nếu có) ghi trong CÙNG một transaction để streak không lệch.
 */
export async function checkIn(
  userId: number,
  habitId: number,
  timezone: string,
  input: CheckInHabitInput,
): Promise<{ date: LocalDate }> {
  const habit = await assertOwnership(userId, habitId);

  // Tạm dừng nghĩa là thôi theo dõi: không nhắc, không đếm. Cho check-in vào một thói
  // quen đang dừng là lại ghi ActivityLog cho thứ người dùng đã nói là không làm nữa.
  if (!habit.isActive) {
    throw new BadRequestError('Thói quen đang tạm dừng. Tiếp tục theo dõi rồi mới check-in được');
  }
  // Thói quen tự động chấm từ hoạt động học thật; cho tích tay là mở lại đúng lỗ hổng mà
  // loại thói quen này sinh ra để bịt.
  if (habit.autoActivity) {
    throw new BadRequestError('Thói quen này tự đánh dấu khi bạn học trong ứng dụng, không cần check-in');
  }

  const today = todayLocalDate(timezone);
  const date = input.date ?? today;

  // Ngày mai chưa xảy ra: cho phép sẽ tạo ra ngày học nằm ở tương lai, và mọi phép
  // tính streak sau đó đọc phải một mốc không có thật.
  if (date > today) throw new BadRequestError('Không thể check-in cho ngày chưa tới');
  if (diffInDays(date, today) >= MAX_BACKFILL_DAYS) {
    throw new BadRequestError(`Chỉ check-in bù được trong vòng ${MAX_BACKFILL_DAYS} ngày gần nhất`);
  }

  // Bỏ trống lượng là làm đủ: nút Check-in một chạm không bắt người dùng gõ số mỗi ngày.
  const amount = habit.targetAmount === null ? null : (input.amount ?? habit.targetAmount);
  if (amount !== null && habitDayLevel(habit, amount) === null) {
    throw new BadRequestError(
      habit.minAmount === null
        ? `Chưa đạt ${habit.targetAmount}. Đặt mức tối thiểu cho thói quen nếu muốn ngày bận vẫn được tính`
        : `Chưa đạt mức tối thiểu (${habit.minAmount})`,
    );
  }

  const existing = await prisma.habitCheckIn.findUnique({
    where: { habitId_localDate: { habitId, localDate: toDbDate(date) } },
  });
  if (existing) throw new ConflictError('Thói quen này đã được check-in trong ngày');

  const write = (): Promise<void> =>
    prisma.$transaction(async (tx) => {
      await tx.habitCheckIn.create({
        data: { habitId, userId, localDate: toDbDate(date), amount, note: input.note ?? null },
      });

      // Tìm theo LOẠI + NGÀY chứ không chỉ theo khoá: dữ liệu từ trước khi có quy tắc
      // này vẫn có những ngày mang vài dòng HABIT_CHECKIN không khoá.
      const loggedToday = await tx.activityLog.findFirst({
        where: { userId, type: ActivityType.HABIT_CHECKIN, localDate: toDbDate(date) },
        select: { id: true },
      });
      if (loggedToday) return;

      await recordActivity({
        userId,
        type: ActivityType.HABIT_CHECKIN,
        refId: habitId,
        timezone,
        // Check-in bù phải tính cho ĐÚNG ngày được bù. Thiếu dòng này thì bù cho hôm qua
        // lại đánh dấu hôm nay có học, và chuỗi ngày hiện sai ở cả hai ngày.
        localDate: date,
        // Khoá theo ngày để hai thói quen tích cùng lúc không cùng ghi được hai dòng.
        dedupeKey: `${ActivityType.HABIT_CHECKIN}:${date}`,
        tx,
      });
    });

  try {
    await write();
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // Trùng khoá của ActivityLog: một thói quen khác vừa tích cùng ngày, xen vào giữa lúc
    // đọc và lúc ghi. Transaction đã huỷ cả check-in này, chạy lại là thấy dòng của bên
    // kia và bỏ qua. Trùng ở bảng check-in thì là bấm hai lần — trả 409 như lối kiểm ở trên.
    const target = String((error as Prisma.PrismaClientKnownRequestError).meta?.['target'] ?? '');
    if (!target.includes('dedupe')) throw new ConflictError('Thói quen này đã được check-in trong ngày');
    await write();
  }

  return { date };
}

/** Lịch sử check-in của một thói quen tự tích, dùng để vẽ lịch/đánh giá tỷ lệ duy trì. */
export async function listCheckIns(
  userId: number,
  habitId: number,
  from?: LocalDate,
  to?: LocalDate,
): Promise<{ date: LocalDate; amount: number | null; note: string | null }[]> {
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

  return rows.map((r) => ({ date: fromDbDate(r.localDate), amount: r.amount, note: r.note }));
}

/**
 * Tỷ lệ hoàn thành thói quen trong khoảng thời gian.
 * Mẫu số là số lần thói quen đó "đến hạn" theo tần suất, không phải tổng số ngày.
 */
export async function getCompletionRate(
  userId: number,
  habitId: number,
  from: LocalDate,
  to: LocalDate,
): Promise<{ expected: number; completed: number; rate: number }> {
  const habit = await assertOwnership(userId, habitId);

  const days = (await loadHabitDays(userId, [habit], from, to)).get(habit.id) ?? [];
  const completed = days.filter((day) => day.level !== null).length;
  const expected = countExpectedDays(habit, from, to);
  const rate = expected === 0 ? 0 : Math.min(100, Math.round((completed / expected) * 100));

  return { expected, completed, rate };
}

/**
 * Kỳ hiện tại (hôm nay, hoặc tuần này với thói quen hằng tuần) đã làm đủ chưa. Job nhắc
 * nhở dùng để im lặng với thói quen đã xong.
 */
export async function isHabitDoneThisPeriod(habit: Habit, today: LocalDate): Promise<boolean> {
  const from = habitPeriodStart(habit.frequency, today);
  const days = (await loadHabitDays(habit.userId, [habit], from, today)).get(habit.id) ?? [];
  return isHabitPeriodDone(
    toSchedule(habit),
    days.filter((day) => day.level !== null).map((day) => day.date),
    today,
  );
}

export function toSchedule(habit: Habit): HabitSchedule {
  return {
    frequency: habit.frequency,
    customDays: habit.customDays as number[] | null,
    timesPerWeek: habit.timesPerWeek,
  };
}

/**
 * Lịch sử từng ngày của nhiều thói quen trong khoảng `[from, to]`.
 *
 * Hai nguồn, gom trong hai truy vấn cho cả danh sách:
 * - thói quen tự tích: bảng `habit_check_ins`;
 * - thói quen tự động: ĐẾM `activity_logs` theo loại và ngày. Không lưu bản sao nào —
 *   hoạt động học đã có sẵn ở đó, chép sang bảng check-in là nguồn số liệu thứ hai.
 */
async function loadHabitDays(
  userId: number,
  habits: Habit[],
  from: LocalDate,
  to: LocalDate,
): Promise<Map<number, HabitDay[]>> {
  const result = new Map<number, HabitDay[]>(habits.map((habit) => [habit.id, []]));
  const range = { gte: toDbDate(from), lte: toDbDate(to) };

  const manual = habits.filter((habit) => habit.autoActivity === null);
  const auto = habits.filter((habit) => habit.autoActivity !== null);
  const autoTypes = [...new Set(auto.map((habit) => habit.autoActivity as ActivityType))];

  const [checkIns, counts] = await Promise.all([
    manual.length === 0
      ? []
      : prisma.habitCheckIn.findMany({
          where: { habitId: { in: manual.map((habit) => habit.id) }, localDate: range },
          select: { habitId: true, localDate: true, amount: true, note: true },
        }),
    autoTypes.length === 0
      ? []
      : prisma.activityLog.groupBy({
          by: ['type', 'localDate'],
          where: { userId, type: { in: autoTypes }, localDate: range },
          _count: { _all: true },
        }),
  ]);

  const byId = new Map(habits.map((habit) => [habit.id, habit]));
  for (const row of checkIns) {
    const habit = byId.get(row.habitId);
    if (!habit) continue;
    result.get(habit.id)?.push({
      date: fromDbDate(row.localDate),
      amount: row.amount,
      note: row.note,
      level: habitDayLevel(habit, row.amount),
    });
  }

  for (const habit of auto) {
    for (const row of counts) {
      if (row.type !== habit.autoActivity) continue;
      const amount = row._count._all;
      result.get(habit.id)?.push({
        date: fromDbDate(row.localDate),
        amount,
        note: null,
        level: habitDayLevel(habit, amount),
      });
    }
  }

  for (const days of result.values()) days.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

type HabitConfig = Pick<
  Habit,
  'frequency' | 'autoActivity' | 'targetAmount' | 'minAmount' | 'unit' | 'timesPerWeek'
>;

/**
 * Chuẩn hoá bộ cấu hình trước khi ghi: bỏ những giá trị không còn nghĩa với kiểu thói
 * quen đang chọn, để dữ liệu không mang một "3 lần/tuần" của thói quen hằng ngày.
 */
function normalizeConfig(config: HabitConfig): HabitConfig {
  const isAuto = config.autoActivity !== null;
  // Thói quen tự động luôn có lượng: "có hoạt động" nghĩa là ít nhất một lần.
  const targetAmount = isAuto ? (config.targetAmount ?? 1) : config.targetAmount;
  const minAmount = targetAmount === null ? null : config.minAmount;

  const error = habitAmountsError({ targetAmount, minAmount });
  if (error) throw new BadRequestError(error);

  return {
    frequency: config.frequency,
    autoActivity: config.autoActivity,
    targetAmount,
    minAmount,
    // Đơn vị chỉ để người dùng tự đặt cho việc ngoài ứng dụng; thói quen tự động có đơn
    // vị cố định theo loại hoạt động.
    unit: isAuto || targetAmount === null ? null : config.unit || null,
    timesPerWeek: config.frequency === HabitFrequency.WEEKLY ? config.timesPerWeek : null,
  };
}

/** Chỉ gắn được vào mục tiêu của chính mình và còn đang theo dõi. */
async function assertGoalLinkable(userId: number, goalId: number): Promise<void> {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId }, select: { status: true } });
  if (!goal) throw new NotFoundError('Không tìm thấy mục tiêu');
  if (goal.status !== GoalStatus.ACTIVE) throw new BadRequestError('Mục tiêu này đã kết thúc');
}

/** Số lần thói quen đến hạn trong khoảng, theo tần suất đã cấu hình. */
function countExpectedDays(habit: Habit, from: LocalDate, to: LocalDate): number {
  const days = eachDayBetween(from, to);
  if (habit.frequency === HabitFrequency.WEEKLY) {
    return Math.ceil(days.length / 7) * weeklyQuota(habit.timesPerWeek);
  }

  // Cùng một hàm với dải 7 ngày ở FE và job nhắc nhở, để ba chỗ đếm "đến hạn" như nhau.
  return days.filter((day) => isScheduledDay(toSchedule(habit), day)).length;
}

async function assertOwnership(userId: number, habitId: number): Promise<Habit> {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) throw new NotFoundError('Không tìm thấy thói quen');
  return habit;
}
