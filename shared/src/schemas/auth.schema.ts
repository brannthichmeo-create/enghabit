import { z } from 'zod';
import { AVATAR_MAX_BYTES } from '../avatar/avatar.js';
import { UserRole, UserStatus } from '../constants/enums.js';

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự') // giới hạn của bcrypt
  .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: passwordSchema,
  timezone: z.string().min(1).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  timezone: z.string().min(1).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Thông tin user trả về cho client — không bao giờ chứa passwordHash. */
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  createdAt: string;
  /** ISO datetime lần đăng nhập gần nhất, null nếu chưa từng đăng nhập. */
  lastLoginAt: string | null;
  /**
   * Ảnh đại diện dạng data URL, null nếu chưa đặt (FE hiện chữ cái đầu của tên).
   *
   * Nhúng thẳng vào phản hồi thay vì trả một đường dẫn ảnh riêng: ảnh đã thu nhỏ chỉ
   * vài chục KB, mà thẻ <img> thì không gửi kèm được Bearer token nên một endpoint
   * ảnh riêng sẽ phải mở công khai hoặc phải tải qua JS rồi tạo blob URL.
   */
  avatarDataUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

/**
 * Đổi ảnh đại diện. Ảnh gửi lên dạng data URL đã thu nhỏ ở client.
 *
 * Zod chỉ chặn được độ dài thô; luật thật (định dạng, dung lượng sau giải mã) nằm ở
 * `parseImageDataUrl` trong `shared/avatar` và được gọi lại ở service.
 */
export const updateAvatarSchema = z.object({
  dataUrl: z
    .string()
    .min(1, 'Chưa chọn ảnh')
    // 4/3 vì base64 phình 33%, cộng dư một ít cho phần "data:image/...;base64,"
    .max(Math.ceil((AVATAR_MAX_BYTES * 4) / 3) + 100, 'Ảnh quá lớn'),
});
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
