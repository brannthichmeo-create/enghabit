import cron from 'node-cron';
import { toLocalDate } from '@enghabit/shared';
import { prisma } from '../lib/prisma.js';
import { jobLogger } from '../lib/logger.js';
import { toDbDate } from '../common/utils/db-date.js';
import { sendPush } from './onesignal.client.js';

/**
 * Cron gửi nhắc nhở học hàng ngày.
 *
 * Đây là nơi DUY NHẤT quyết định lịch gửi — không dùng tính năng lên lịch của OneSignal
 * (xem CLAUDE.md), nếu không sẽ có hai nguồn cùng gửi và user nhận thông báo trùng.
 *
 * Chạy mỗi 15 phút, mỗi lần quét các user đang tới đúng "giờ nhắc" theo timezone của họ.
 * Cột lastSentDate chặn gửi lặp khi cron chạy lại trong cùng một ngày.
 */

const CRON_EXPRESSION = '*/15 * * * *';

export function startReminderJob(): void {
  jobLogger.info({ schedule: CRON_EXPRESSION }, 'Khởi động job nhắc nhở học tập');
  cron.schedule(CRON_EXPRESSION, () => {
    void runReminderTick().catch((error: unknown) => {
      jobLogger.error({ err: error }, 'Job nhắc nhở lỗi');
    });
  });
}

/** Tách riêng khỏi cron để test được và chạy tay khi cần debug. */
export async function runReminderTick(now: Date = new Date()): Promise<{ sent: number; skipped: number }> {
  const settings = await prisma.notificationSetting.findMany({
    where: { isEnabled: true },
    include: {
      user: { select: { id: true, timezone: true, devices: { select: { playerId: true } } } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const setting of settings) {
    const { user } = setting;
    const localDate = toLocalDate(now, user.timezone);

    if (!shouldSendNow(setting, user.timezone, now)) {
      skipped += 1;
      continue;
    }

    // Đã gửi trong ngày (theo giờ user) thì bỏ qua.
    if (setting.lastSentDate && toDbDate(localDate).getTime() === setting.lastSentDate.getTime()) {
      skipped += 1;
      continue;
    }

    const playerIds = user.devices.map((d) => d.playerId);
    if (playerIds.length === 0) {
      skipped += 1;
      continue;
    }

    await sendPush({
      playerIds,
      title: 'Đến giờ học tiếng Anh rồi!',
      message: 'Dành vài phút hôm nay để giữ chuỗi ngày học của bạn.',
    });

    await prisma.notificationSetting.update({
      where: { id: setting.id },
      data: { lastSentDate: toDbDate(localDate) },
    });

    jobLogger.info({ userId: user.id, localDate }, 'Đã gửi nhắc nhở');
    sent += 1;
  }

  jobLogger.debug({ sent, skipped, total: settings.length }, 'Kết thúc lượt quét nhắc nhở');
  return { sent, skipped };
}

/** Đúng thứ trong tuần và đã qua giờ hẹn (trong cửa sổ 15 phút của lượt chạy này) chưa. */
function shouldSendNow(
  setting: { timeOfDay: string; daysOfWeek: unknown },
  timezone: string,
  now: Date,
): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const weekdayLabel = parts.find((p) => p.type === 'weekday')?.value ?? '';

  const isoWeekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[weekdayLabel];
  const allowedDays = (setting.daysOfWeek as number[] | null) ?? [];
  if (!isoWeekday || !allowedDays.includes(isoWeekday)) return false;

  const [targetHour, targetMinute] = setting.timeOfDay.split(':').map(Number) as [number, number];
  const nowMinutes = hour * 60 + minute;
  const targetMinutes = targetHour * 60 + targetMinute;

  // Cửa sổ 15 phút khớp với chu kỳ cron — không bỏ sót mà cũng không gửi sớm.
  return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 15;
}
