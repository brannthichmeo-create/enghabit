import type { RegisterDeviceInput, UpdateNotificationSettingInput } from '@enghabit/shared';
import type { NotificationSetting } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

/**
 * Module này CHỈ quản lý cấu hình nhắc nhở và thiết bị nhận push.
 * Lịch gửi nằm ở be/src/jobs/reminder.job.ts — không đặt cron ở đây (xem CLAUDE.md).
 */

export async function getSetting(userId: number): Promise<NotificationSetting> {
  return prisma.notificationSetting.upsert({
    where: { userId },
    create: { userId, daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
    update: {},
  });
}

export async function updateSetting(
  userId: number,
  input: UpdateNotificationSettingInput,
): Promise<NotificationSetting> {
  return prisma.notificationSetting.upsert({
    where: { userId },
    create: {
      userId,
      isEnabled: input.isEnabled,
      timeOfDay: input.timeOfDay,
      daysOfWeek: input.daysOfWeek,
    },
    update: {
      isEnabled: input.isEnabled,
      timeOfDay: input.timeOfDay,
      daysOfWeek: input.daysOfWeek,
    },
  });
}

export async function registerDevice(userId: number, input: RegisterDeviceInput): Promise<void> {
  await prisma.userDevice.upsert({
    where: { playerId: input.playerId },
    create: { userId, playerId: input.playerId, platform: input.platform },
    // Thiết bị có thể được dùng bởi user khác sau khi đăng xuất/đăng nhập lại.
    update: { userId, platform: input.platform },
  });
}

export async function unregisterDevice(userId: number, playerId: string): Promise<void> {
  await prisma.userDevice.deleteMany({ where: { userId, playerId } });
}
