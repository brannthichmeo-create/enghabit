import { z } from 'zod';
import { timeOfDaySchema, weekdaySchema } from './habit.schema.js';

/**
 * Cài đặt nhắc nhở học hàng ngày.
 * Lịch gửi do be/src/jobs quyết định; OneSignal chỉ là kênh gửi (xem CLAUDE.md).
 */
export const updateNotificationSettingSchema = z.object({
  isEnabled: z.boolean(),
  /** Giờ nhắc theo timezone của user. */
  timeOfDay: timeOfDaySchema,
  /** Các thứ trong tuần muốn nhận nhắc nhở; mặc định cả tuần. */
  daysOfWeek: z.array(weekdaySchema).min(1).max(7).default([1, 2, 3, 4, 5, 6, 7]),
});
export type UpdateNotificationSettingInput = z.infer<typeof updateNotificationSettingSchema>;

/** Đăng ký thiết bị nhận push (player id do OneSignal SDK cấp ở client). */
export const registerDeviceSchema = z.object({
  playerId: z.string().min(1).max(200),
  platform: z.enum(['web', 'ios', 'android']),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
