import { z } from 'zod';
import { NotificationType, UserRole } from '../constants/enums.js';
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
  /** Cảnh báo cuối ngày khi chuỗi đang có nguy cơ đứt. */
  remindStreakAtRisk: z.boolean().default(true),
  /** Nhắc khi có thẻ flashcard tới hạn ôn. */
  remindReviewDue: z.boolean().default(true),
});
export type UpdateNotificationSettingInput = z.infer<typeof updateNotificationSettingSchema>;

export interface NotificationSetting {
  isEnabled: boolean;
  timeOfDay: string;
  daysOfWeek: number[];
  remindStreakAtRisk: boolean;
  remindReviewDue: boolean;
}

/** Đăng ký thiết bị nhận push (player id do OneSignal SDK cấp ở client). */
export const registerDeviceSchema = z.object({
  playerId: z.string().min(1).max(200),
  platform: z.enum(['web', 'ios', 'android']),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

// --- Thông báo trong ứng dụng ---

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  /**
   * Chỉ lấy thông báo chưa đọc.
   *
   * KHÔNG dùng `z.coerce.boolean()`: query string luôn là chuỗi, mà `Boolean('false')`
   * bằng `true` — mọi request đều thành "chỉ chưa đọc" và tab "Tất cả" mất bản ghi
   * đã đọc. Phải so khớp giá trị chuỗi một cách tường minh.
   */
  unreadOnly: z
    .preprocess((value) => value === true || value === 'true' || value === '1', z.boolean())
    .default(false),
});
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;

export interface NotificationRow {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  /** Đường dẫn trong app để bấm vào là tới thẳng việc cần làm. */
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Thông báo do quản trị viên gửi tới người dùng. */
export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(150),
  body: z.string().trim().min(3, 'Nội dung phải có ít nhất 3 ký tự').max(500),
  /** Gửi cho ai: tất cả, hay chỉ một nhóm vai trò. */
  audience: z.enum(['all', 'role']).default('all'),
  role: z.nativeEnum(UserRole).optional(),
  /** Đường dẫn kèm theo, vd "/learn". Bỏ trống thì thông báo không bấm được. */
  link: z.string().trim().max(120).optional(),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
