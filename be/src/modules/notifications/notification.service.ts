import {
  MAX_REMINDERS_PER_USER,
  NotificationType,
  UserRole,
  type CreateAnnouncementInput,
  type CreateReminderInput,
  type NotificationQueryInput,
  type NotificationRow,
  type NotificationSetting as NotificationSettingDto,
  type Paginated,
  type RegisterDeviceInput,
  type Reminder as ReminderDto,
  type UpdateNotificationSettingInput,
  type UpdateReminderInput,
} from '@enghabit/shared';
import type { Notification, NotificationSetting, Reminder } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';

/**
 * Thông báo trong ứng dụng + cấu hình nhắc nhở.
 *
 * Module này quyết định NỘI DUNG và lưu trữ thông báo. Nó KHÔNG quyết định lịch gửi —
 * việc đó nằm ở `be/src/jobs/reminder.job.ts` (xem CLAUDE.md). Job gọi `createNotification`
 * của module này thay vì tự ghi bảng, để chỉ có một chỗ sinh thông báo.
 */

// --- Cấu hình nhắc nhở ---

export async function getSetting(userId: number): Promise<NotificationSettingDto> {
  const setting = await prisma.notificationSetting.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return toSettingDto(setting);
}

export async function updateSetting(
  userId: number,
  input: UpdateNotificationSettingInput,
): Promise<NotificationSettingDto> {
  const setting = await prisma.notificationSetting.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
  return toSettingDto(setting);
}

function toSettingDto(setting: NotificationSetting): NotificationSettingDto {
  return {
    isEnabled: setting.isEnabled,
    remindStreakAtRisk: setting.remindStreakAtRisk,
    remindReviewDue: setting.remindReviewDue,
  };
}

// --- Các mốc nhắc nhở ---
//
// Mỗi người đặt được nhiều mốc trong ngày. Công tắc tổng ở NotificationSetting tắt thì
// im lặng hết, không cần xoá từng mốc; `isEnabled` của từng mốc dùng để nghỉ tạm một mốc.

export async function listReminders(userId: number): Promise<ReminderDto[]> {
  const rows = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { timeOfDay: 'asc' },
  });
  return rows.map(toReminderDto);
}

export async function createReminder(userId: number, input: CreateReminderInput): Promise<ReminderDto> {
  const count = await prisma.reminder.count({ where: { userId } });
  if (count >= MAX_REMINDERS_PER_USER) {
    throw new BadRequestError(`Mỗi người chỉ đặt được tối đa ${MAX_REMINDERS_PER_USER} mốc nhắc`);
  }

  try {
    const created = await prisma.reminder.create({
      data: {
        userId,
        label: input.label?.trim() || null,
        timeOfDay: input.timeOfDay,
        daysOfWeek: input.daysOfWeek,
      },
    });
    return toReminderDto(created);
  } catch (error: unknown) {
    // Ràng buộc unique (user, time_of_day): hai mốc cùng giờ sẽ bắn hai thông báo
    // giống hệt nhau trong cùng một phút.
    if (isUniqueViolation(error)) throw new ConflictError('Bạn đã có một mốc nhắc vào giờ này');
    throw error;
  }
}

export async function updateReminder(
  userId: number,
  reminderId: number,
  input: UpdateReminderInput,
): Promise<ReminderDto> {
  // Lọc theo cả userId để người này không sửa được mốc của người khác.
  const existing = await prisma.reminder.findFirst({ where: { id: reminderId, userId } });
  if (!existing) throw new NotFoundError('Không tìm thấy mốc nhắc');

  try {
    const updated = await prisma.reminder.update({
      where: { id: existing.id },
      data: {
        ...(input.label !== undefined && { label: input.label.trim() || null }),
        ...(input.timeOfDay !== undefined && { timeOfDay: input.timeOfDay }),
        ...(input.daysOfWeek !== undefined && { daysOfWeek: input.daysOfWeek }),
        ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
      },
    });
    return toReminderDto(updated);
  } catch (error: unknown) {
    if (isUniqueViolation(error)) throw new ConflictError('Bạn đã có một mốc nhắc vào giờ này');
    throw error;
  }
}

export async function deleteReminder(userId: number, reminderId: number): Promise<void> {
  const result = await prisma.reminder.deleteMany({ where: { id: reminderId, userId } });
  if (result.count === 0) throw new NotFoundError('Không tìm thấy mốc nhắc');
}

function toReminderDto(reminder: Reminder): ReminderDto {
  return {
    id: reminder.id,
    label: reminder.label,
    timeOfDay: reminder.timeOfDay,
    daysOfWeek: (reminder.daysOfWeek as number[] | null) ?? [1, 2, 3, 4, 5, 6, 7],
    isEnabled: reminder.isEnabled,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

// --- Thiết bị nhận push ---

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

// --- Thông báo ---

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  /**
   * Khoá chống trùng trong phạm vi một người dùng, vd `DAILY_REMINDER:2026-08-31`.
   * Gọi lại với cùng khoá sẽ không tạo thêm bản ghi — nhờ vậy cron chạy lại nhiều lần
   * trong ngày vẫn an toàn mà job không phải tự nhớ đã gửi cho ai.
   */
  dedupeKey: string;
}

/** Trả về bản ghi vừa tạo, hoặc `null` nếu thông báo này đã tồn tại. */
export async function createNotification(input: CreateNotificationInput): Promise<Notification | null> {
  const existing = await prisma.notification.findUnique({
    where: { userId_dedupeKey: { userId: input.userId, dedupeKey: input.dedupeKey } },
  });
  if (existing) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      dedupeKey: input.dedupeKey,
    },
  });
}

export async function listNotifications(
  userId: number,
  query: NotificationQueryInput,
): Promise<Paginated<NotificationRow>> {
  const where = { userId, ...(query.unreadOnly ? { readAt: null } : {}) };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items: items.map(toRow), total, page: query.page, pageSize: query.pageSize };
}

export async function countUnread(userId: number): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(userId: number, notificationId: number): Promise<NotificationRow> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new NotFoundError('Không tìm thấy thông báo');

  // Đã đọc rồi thì giữ nguyên mốc thời gian đọc lần đầu.
  if (notification.readAt) return toRow(notification);

  return toRow(
    await prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } }),
  );
}

export async function markAllRead(userId: number): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}

export async function deleteNotification(userId: number, notificationId: number): Promise<void> {
  const result = await prisma.notification.deleteMany({ where: { id: notificationId, userId } });
  if (result.count === 0) throw new NotFoundError('Không tìm thấy thông báo');
}

/**
 * Quản trị viên gửi thông báo tới nhiều người cùng lúc.
 *
 * dedupeKey gắn mốc thời gian gửi nên hai lần gửi khác nhau vẫn ra hai thông báo —
 * khác với nhắc nhở tự động, ở đây gửi trùng là chủ ý của người gửi.
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<{ recipients: number }> {
  const where = input.audience === 'role' && input.role ? { role: input.role } : {};
  const users = await prisma.user.findMany({ where, select: { id: true } });

  const dedupeKey = `ANNOUNCEMENT:${Date.now()}`;
  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: NotificationType.ANNOUNCEMENT,
      title: input.title,
      body: input.body,
      link: input.link || null,
      dedupeKey,
    })),
  });

  return { recipients: users.length };
}

/** Số người sẽ nhận được thông báo với lựa chọn hiện tại — hiện trước khi bấm gửi. */
export async function countAudience(role?: UserRole): Promise<number> {
  return prisma.user.count({ where: role ? { role } : {} });
}

function toRow(notification: Notification): NotificationRow {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
