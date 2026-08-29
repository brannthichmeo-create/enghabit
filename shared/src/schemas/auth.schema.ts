import { z } from 'zod';
import { UserRole } from '../constants/enums.js';

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
  timezone: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}
