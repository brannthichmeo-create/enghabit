import { z } from 'zod';
import { ActivityType, UserRole, UserStatus } from '../constants/enums.js';
import type { PublicUser } from './auth.schema.js';

/**
 * Schema & type cho khu vực quản trị.
 *
 * Tách riêng khỏi auth.schema vì đây là góc nhìn của người quản lý hệ thống
 * (lọc, đổi vai trò, khoá tài khoản, đọc nhật ký truy cập), không phải góc nhìn
 * của người học về chính mình.
 */

// --- Quản lý tài khoản người dùng ---

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /** Tìm theo tên hoặc email, không phân biệt hoa thường. */
  search: z.string().trim().max(190).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  sort: z.enum(['newest', 'oldest', 'lastLogin', 'mostActive']).default('newest'),
});
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const resetUserPasswordSchema = z.object({
  /**
   * Mật khẩu tạm do quản trị viên đặt. Dùng chung passwordSchema là hợp lý về mặt
   * quy tắc, nhưng khai báo lại ở đây để tránh import vòng giữa hai file schema.
   */
  newPassword: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự')
    .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số'),
});
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;

/** Một dòng trong danh sách người dùng của trang quản trị. */
export interface AdminUserRow extends PublicUser {
  activityCount: number;
  currentStreak: number;
  /** Số phiên đăng nhập còn hiệu lực — 0 nghĩa là hiện không ở trong hệ thống. */
  activeSessions: number;
}

/** Hồ sơ chi tiết một người dùng, mở từ danh sách. */
export interface AdminUserDetail extends AdminUserRow {
  longestStreak: number;
  habitCount: number;
  goalCount: number;
  vocabLearned: number;
  quizAttempts: number;
  lastActivityDate: string | null;
  recentLogins: LoginEventRow[];
}

// --- Lượt truy cập ---

export const accessLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /** 'all' để xem cả lần thất bại — mặc định chỉ quan tâm lần vào được. */
  result: z.enum(['all', 'success', 'failed']).default('all'),
  days: z.coerce.number().int().min(1).max(90).default(30),
});
export type AccessLogQueryInput = z.infer<typeof accessLogQuerySchema>;

export interface LoginEventRow {
  id: number;
  userId: number | null;
  userName: string | null;
  email: string;
  success: boolean;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AccessPoint {
  /** Ngày `YYYY-MM-DD` theo giờ máy chủ. */
  date: string;
  logins: number;
  failed: number;
  uniqueUsers: number;
}

export interface AccessOverview {
  points: AccessPoint[];
  totalLogins: number;
  totalFailed: number;
  uniqueUsers: number;
  activeSessions: number;
}

// --- Tổng quan hệ thống ---

export interface SystemOverview {
  users: {
    total: number;
    admins: number;
    locked: number;
    newLast7Days: number;
    newLast30Days: number;
    /** Số người có hoạt động học trong 1 / 7 / 30 ngày gần nhất. */
    activeToday: number;
    activeLast7Days: number;
    activeLast30Days: number;
    /** Tỷ lệ người dùng quay lại: activeLast7Days / total, làm tròn phần trăm. */
    retention7Days: number;
  };
  content: {
    topics: number;
    vocabulary: number;
    quizzes: number;
    quizQuestions: number;
  };
  activity: {
    total: number;
    last7Days: number;
    byType: { type: ActivityType; count: number }[];
    /** Chuỗi 30 ngày gần nhất, để vẽ biểu đồ xu hướng. */
    daily: { date: string; count: number; activeUsers: number }[];
  };
  access: {
    loginsLast7Days: number;
    failedLast7Days: number;
    activeSessions: number;
  };
  system: {
    /** Số giây tiến trình API đã chạy. */
    uptimeSeconds: number;
    nodeVersion: string;
    environment: string;
    databaseOk: boolean;
    /** Thời điểm sinh ra số liệu này, để biết dữ liệu cũ hay mới. */
    generatedAt: string;
  };
  /** Người dùng học nhiều nhất, dùng cho bảng xếp hạng ngắn ở trang tổng quan. */
  topLearners: { id: number; name: string; activityCount: number; currentStreak: number }[];
}
