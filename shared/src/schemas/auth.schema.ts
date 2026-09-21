import { z } from 'zod';
import { AVATAR_MAX_BYTES } from '../avatar/avatar.js';
import { UserRole, UserStatus } from '../constants/enums.js';

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự') // giới hạn của bcrypt
  .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số');

/**
 * Tên tài khoản đăng nhập — khác `name` là tên hiển thị (được phép trùng).
 *
 * Lúc ĐĂNG KÝ chuẩn hoá về chữ thường ngay tại schema: collation của DB là
 * `utf8mb4_unicode_ci`, tức KHÔNG phân biệt hoa thường — "Admin" và "admin" vốn đã đụng
 * nhau ở tầng DB, hạ chữ thường tại đây làm điều đó thành quy tắc tường minh thay vì một
 * hành vi ngầm của MySQL. Nhờ vậy tên lưu trong DB luôn là chữ thường.
 *
 * Lúc ĐĂNG NHẬP thì ngược lại: KHÔNG chuẩn hoá gì cả, phải gõ đúng từng ký tự — xem
 * `loginSchema`.
 *
 * Không cho dấu tiếng Việt và khoảng trắng: tên này còn dùng để tra cứu khi quên
 * mật khẩu, gõ sai dấu một ly là không tìm ra tài khoản.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Tên tài khoản phải có ít nhất 3 ký tự')
  .max(30, 'Tên tài khoản tối đa 30 ký tự')
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    'Tên tài khoản chỉ gồm chữ không dấu, số và các ký tự . _ - và phải bắt đầu bằng chữ hoặc số',
  );

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: passwordSchema,
  timezone: z.string().min(1).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Đăng nhập bằng email HOẶC tên tài khoản.
 *
 * Một ô nhập duy nhất chứ không phải hai ô hay một nút chuyển kiểu: người dùng chỉ
 * cần gõ thứ họ nhớ.
 *
 * KHÔNG `.trim()`, KHÔNG `.toLowerCase()`: tên tài khoản phải khớp CHÍNH XÁC. Tài khoản
 * `user` thì gõ `User` hay `  user  ` đều là sai tên đăng nhập — như mật khẩu, đây là
 * thông tin xác thực, không phải một ô tìm kiếm. Riêng email vẫn không phân biệt hoa
 * thường (xem `findByIdentifier`), vì đó là quy ước chung của địa chỉ email.
 *
 * Chuẩn hoá ở đây thôi CHƯA ĐỦ: collation `utf8mb4_unicode_ci` của MySQL cũng tự bỏ qua
 * hoa thường và khoảng trắng cuối chuỗi. Phần so khớp chính xác nằm ở backend.
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .max(190)
    .refine((value) => value.trim().length > 0, 'Vui lòng nhập email hoặc tên tài khoản'),
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
  /** Tên tài khoản đăng nhập, luôn chữ thường. Khác `name` là tên hiển thị. */
  username: string;
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
