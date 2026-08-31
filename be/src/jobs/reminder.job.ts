import cron from 'node-cron';
import { NotificationType, toLocalDate } from '@enghabit/shared';
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

/** Tách riêng khỏi cron để test được và chạy tay khi cần debug. */
export async function runReminderTick(now: Date = new Date()): Promise<ReminderTickResult> {
  const settings = await prisma.notificationSetting.findMany({
    where: { isEnabled: true },
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

  const result: ReminderTickResult = { reminders: 0, streakWarnings: 0, skipped: 0 };

  for (const setting of settings) {
    const { user } = setting;
    const localDate = toLocalDate(now, user.timezone);
    const minutesNow = localMinutes(user.timezone, now);

    const atReminderTime =
      isAllowedWeekday(setting, user.timezone, now) && inWindow(minutesNow, setting.timeOfDay);
    const atStreakWarning = setting.remindStreakAtRisk && inWindow(minutesNow, STREAK_WARNING_TIME);

    if (!atReminderTime && !atStreakWarning) {
      result.skipped += 1;
      continue;
    }

    // Đã học hôm nay thì không nhắc nữa — cả hai loại.
    const studiedToday = await hasStudiedToday(user.id, localDate);
    if (studiedToday) {
      result.skipped += 1;
      continue;
    }

    if (atReminderTime) {
      const created = await sendDailyReminder(
        { ...user, remindReviewDue: setting.remindReviewDue },
        localDate,
      );
      if (created) result.reminders += 1;
      else result.skipped += 1;
    }

    if (atStreakWarning && (user.streak?.currentStreak ?? 0) > 0) {
      const created = await sendStreakWarning(user, localDate);
      if (created) result.streakWarnings += 1;
      else result.skipped += 1;
    }
  }

  // lastSentDate không còn dùng để chặn trùng (đã có dedupeKey của Notification),
  // nhưng vẫn cập nhật để nhìn nhanh trong DB là user được nhắc lần cuối ngày nào.
  jobLogger.debug({ ...result, total: settings.length }, 'Kết thúc lượt quét nhắc nhở');
  return result;
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
    dedupeKey: `${NotificationType.DAILY_REMINDER}:${localDate}`,
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
