import cron from 'node-cron';
import { NotificationType, UserRole, toLocalDate } from '@enghabit/shared';
import { prisma } from '../lib/prisma.js';
import { jobLogger } from '../lib/logger.js';
import { toDbDate } from '../common/utils/db-date.js';
import * as notificationService from '../modules/notifications/notification.service.js';
import * as flashcardService from '../modules/flashcards/flashcard.service.js';
import * as lessonService from '../modules/lessons/lesson.service.js';
import { sendPush } from './onesignal.client.js';

/**
 * Cron nhắc nhở học tập.
 *
 * Đây là nơi DUY NHẤT quyết định lịch gửi — không dùng tính năng lên lịch của OneSignal
 * (xem CLAUDE.md), nếu không sẽ có hai nguồn cùng gửi và user nhận thông báo trùng.
 *
 * Mỗi lượt quét xử lý hai mốc trong ngày của từng user, tính theo timezone của họ:
 *   1. Giờ nhắc user tự đặt  → nhắc học, kèm việc đang tồn (thẻ tới hạn, từ sai)
 *   2. 21:30 tối            → cảnh báo chuỗi sắp đứt, chỉ khi hôm đó chưa học
 *
 * Cả hai đều BỎ QUA nếu hôm nay user đã học rồi — nhắc người đang học đều là cách
 * nhanh nhất khiến họ tắt thông báo.
 *
 * Thông báo luôn được lưu vào bảng notifications (nguồn chính), push chỉ là kênh báo
 * thêm: push có thể bị chặn hoặc bỏ lỡ, mở app lên vẫn phải thấy.
 */

const CRON_EXPRESSION = '*/15 * * * *';
/** Cửa sổ khớp đúng chu kỳ cron — không bỏ sót mà cũng không gửi sớm. */
const WINDOW_MINUTES = 15;
/** Giờ cảnh báo chuỗi sắp đứt, theo giờ địa phương của user. */
const STREAK_WARNING_TIME = '21:30';

export function startReminderJob(): void {
  jobLogger.info({ schedule: CRON_EXPRESSION }, 'Khởi động job nhắc nhở học tập');
  cron.schedule(CRON_EXPRESSION, () => {
    void runReminderTick().catch((error: unknown) => {
      jobLogger.error({ err: error }, 'Job nhắc nhở lỗi');
    });
  });
}

export interface ReminderTickResult {
  /** Số thông báo nhắc học đã tạo. */
  reminders: number;
  /** Số cảnh báo chuỗi sắp đứt đã tạo. */
  streakWarnings: number;
  skipped: number;
}

/**
 * Tách riêng khỏi cron để test được và chạy tay khi cần debug.
 *
 * Hai lượt quét riêng vì hai loại thông báo có nguồn dữ liệu khác nhau: lời nhắc học
 * đi theo TỪNG MỐC người dùng đặt (mỗi người có thể nhiều mốc), còn cảnh báo chuỗi
 * sắp đứt là một mốc cố định 21:30 của cả hệ thống, đọc từ cấu hình chung.
 *
 * Người dùng lọc theo vai trò USER ở cả hai lượt: quản trị viên vận hành hệ thống chứ
 * không đi học (xem CLAUDE.md). Lọc ở job chứ không ở chỗ tạo cấu hình, vì một tài
 * khoản có thể được nâng lên quản trị sau khi đã có sẵn nhắc nhở.
 */
export async function runReminderTick(now: Date = new Date()): Promise<ReminderTickResult> {
  const result: ReminderTickResult = { reminders: 0, streakWarnings: 0, skipped: 0 };

  await sendDueReminders(now, result);
  await sendDueStreakWarnings(now, result);

  jobLogger.debug(result, 'Kết thúc lượt quét nhắc nhở');
  return result;
}

/** Lượt 1: từng mốc nhắc tới giờ. Công tắc tổng tắt thì mọi mốc của người đó im lặng. */
async function sendDueReminders(now: Date, result: ReminderTickResult): Promise<void> {
  const reminders = await prisma.reminder.findMany({
    where: {
      isEnabled: true,
      user: {
        role: UserRole.USER,
        notificationSetting: { isEnabled: true },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          timezone: true,
          devices: { select: { playerId: true } },
          streak: { select: { currentStreak: true } },
          notificationSetting: { select: { remindReviewDue: true } },
        },
      },
    },
  });

  for (const reminder of reminders) {
    const { user } = reminder;
    const minutesNow = localMinutes(user.timezone, now);

    if (!isAllowedWeekday(reminder, user.timezone, now) || !inWindow(minutesNow, reminder.timeOfDay)) {
      result.skipped += 1;
      continue;
    }

    const localDate = toLocalDate(now, user.timezone);
    if (await hasStudiedToday(user.id, localDate)) {
      result.skipped += 1;
      continue;
    }

    const created = await sendDailyReminder(
      { ...user, remindReviewDue: user.notificationSetting?.remindReviewDue ?? true },
      localDate,
      reminder.id,
    );
    if (created) result.reminders += 1;
    else result.skipped += 1;
  }
}

/** Lượt 2: cảnh báo chuỗi sắp đứt lúc 21:30, mỗi người tối đa một lần mỗi ngày. */
async function sendDueStreakWarnings(now: Date, result: ReminderTickResult): Promise<void> {
  const settings = await prisma.notificationSetting.findMany({
    where: { isEnabled: true, remindStreakAtRisk: true, user: { role: UserRole.USER } },
    include: {
      user: {
        select: {
          id: true,
          timezone: true,
          devices: { select: { playerId: true } },
          streak: { select: { currentStreak: true } },
        },
      },
    },
  });

  for (const setting of settings) {
    const { user } = setting;

    if (!inWindow(localMinutes(user.timezone, now), STREAK_WARNING_TIME)) {
      result.skipped += 1;
      continue;
    }
    if ((user.streak?.currentStreak ?? 0) === 0) {
      result.skipped += 1;
      continue;
    }

    const localDate = toLocalDate(now, user.timezone);
    if (await hasStudiedToday(user.id, localDate)) {
      result.skipped += 1;
      continue;
    }

    const created = await sendStreakWarning(user, localDate);
    if (created) result.streakWarnings += 1;
    else result.skipped += 1;
  }
}

interface JobUser {
  id: number;
  timezone: string;
  devices: { playerId: string }[];
  streak: { currentStreak: number } | null;
}

/** Nhắc học hằng ngày. Nội dung đổi theo việc đang tồn để lời nhắc còn có ích. */
async function sendDailyReminder(
  user: JobUser & { remindReviewDue: boolean },
  localDate: string,
  reminderId: number,
): Promise<boolean> {
  const [dueCards, mistakes] = await Promise.all([
    user.remindReviewDue ? flashcardService.countDueCards(user.id, user.timezone) : Promise.resolve(0),
    lessonService.countMistakes(user.id),
  ]);

  const streak = user.streak?.currentStreak ?? 0;
  let body: string;
  let link = '/learn';

  if (dueCards > 0) {
    body = `Bạn có ${dueCards} thẻ tới hạn ôn hôm nay. Ôn xong là giữ được chuỗi.`;
    link = '/flashcards';
  } else if (mistakes > 0) {
    body = `Còn ${mistakes} từ bạn từng làm sai đang chờ luyện lại.`;
    link = '/learn';
  } else if (streak > 0) {
    body = `Bạn đang có chuỗi ${streak} ngày. Học vài phút hôm nay để giữ chuỗi.`;
  } else {
    body = 'Dành vài phút học hôm nay để bắt đầu một chuỗi ngày mới.';
  }

  return deliver(user, {
    type: NotificationType.DAILY_REMINDER,
    title: 'Đến giờ học tiếng Anh rồi!',
    body,
    link,
    // Khoá chống trùng gắn thêm id của mốc: một người đặt 8:00 và 20:00 thì đó là hai
    // lời nhắc cố ý khác nhau trong cùng một ngày. Không có id, mốc thứ hai bị coi là
    // trùng và im lặng — người dùng đặt mốc mà không bao giờ nhận được.
    dedupeKey: `${NotificationType.DAILY_REMINDER}:${reminderId}:${localDate}`,
  });
}

/** Cảnh báo cuối ngày khi chuỗi đang có nguy cơ đứt. */
async function sendStreakWarning(user: JobUser, localDate: string): Promise<boolean> {
  const streak = user.streak?.currentStreak ?? 0;

  return deliver(user, {
    type: NotificationType.STREAK_AT_RISK,
    title: `Chuỗi ${streak} ngày sắp đứt`,
    body: 'Hôm nay bạn chưa học. Một hoạt động bất kỳ trước nửa đêm là đủ để giữ chuỗi.',
    link: '/learn',
    dedupeKey: `${NotificationType.STREAK_AT_RISK}:${localDate}`,
  });
}

/**
 * Lưu thông báo rồi mới bắn push.
 *
 * Thứ tự này quan trọng: nếu dedupeKey báo đã tạo trước đó, ta không push nữa —
 * ngược lại push thành công mà DB lỗi thì user nhận push nhưng mở app không thấy gì.
 */
async function deliver(
  user: JobUser,
  input: { type: NotificationType; title: string; body: string; link: string; dedupeKey: string },
): Promise<boolean> {
  const notification = await notificationService.createNotification({ userId: user.id, ...input });
  if (!notification) return false; // đã gửi trong ngày

  const playerIds = user.devices.map((d) => d.playerId);
  if (playerIds.length > 0) {
    await sendPush({ playerIds, title: input.title, message: input.body });
  }

  await prisma.notificationSetting.updateMany({
    where: { userId: user.id },
    data: { lastSentDate: toDbDate(toLocalDate(new Date(), user.timezone)) },
  });

  jobLogger.info({ userId: user.id, type: input.type, push: playerIds.length > 0 }, 'Đã gửi nhắc nhở');
  return true;
}

/** Có hoạt động nào trong ngày local này chưa. ActivityLog là nguồn sự thật duy nhất. */
async function hasStudiedToday(userId: number, localDate: string): Promise<boolean> {
  const count = await prisma.activityLog.count({
    where: { userId, localDate: toDbDate(localDate) },
  });
  return count > 0;
}

/** Số phút đã trôi qua trong ngày, theo timezone của user. */
function localMinutes(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

function inWindow(minutesNow: number, timeOfDay: string): boolean {
  const [hour, minute] = timeOfDay.split(':').map(Number) as [number, number];
  const target = hour * 60 + minute;
  return minutesNow >= target && minutesNow < target + WINDOW_MINUTES;
}

/** Hôm nay có nằm trong các thứ user chọn nhận nhắc nhở không. */
function isAllowedWeekday(
  setting: { daysOfWeek: unknown },
  timezone: string,
  now: Date,
): boolean {
  const weekdayLabel = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, weekday: 'short' })
    .formatToParts(now)
    .find((p) => p.type === 'weekday')?.value;

  const isoWeekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[weekdayLabel ?? ''];
  const allowedDays = (setting.daysOfWeek as number[] | null) ?? [];
  return isoWeekday !== undefined && allowedDays.includes(isoWeekday);
}
