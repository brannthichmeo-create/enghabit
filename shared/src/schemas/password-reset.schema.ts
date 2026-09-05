import { z } from 'zod';
import { PasswordResetStatus } from '../constants/enums.js';
import { passwordSchema } from './auth.schema.js';

/**
 * Luồng quên mật khẩu có quản trị viên duyệt tay.
 *
 * Tài liệu đầy đủ về luồng này: `docs/luong-quen-mat-khau.md`. Đọc file đó trước
 * khi thay đổi, vì nó ghi rõ ranh giới nào là do nghiệp vụ và ranh giới nào là do
 * đánh đổi an toàn — hai loại này sửa theo cách khác nhau.
 *
 * Tóm tắt: người dùng nhập email hoặc tên tài khoản -> hệ thống tạo yêu cầu và báo
 * cho MỌI quản trị viên -> quản trị viên duyệt hoặc từ chối (kèm lý do) -> lần sau
 * người dùng nhập lại đúng tài khoản đó thì thấy kết quả tương ứng.
 *
 * Toàn bộ luồng dùng CHUNG MỘT endpoint tra cứu (`/auth/password-reset/request`).
 * Không tách thành nhiều endpoint theo trạng thái, vì người dùng luôn làm đúng một
 * hành động — "nhập tài khoản của tôi" — còn việc đang ở bước nào là do hệ thống
 * biết, không phải do người dùng phải tự chọn.
 */

// ---------------------------------------------------------------------------
// Phía người dùng
// ---------------------------------------------------------------------------

/**
 * Ô nhập chấp nhận cả email lẫn tên tài khoản.
 *
 * Không kiểm tra định dạng email ở đây: người dùng gõ "long.tran" là hợp lệ. Việc
 * phân biệt để lần đúng người là của backend.
 */
export const passwordResetIdentifierSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Vui lòng nhập email hoặc tên tài khoản')
  .max(190);

export const passwordResetRequestSchema = z.object({
  identifier: passwordResetIdentifierSchema,
  /**
   * Chỉ đặt `true` khi người dùng bấm "Gửi lại yêu cầu" ở màn hình báo bị từ chối.
   *
   * Cần cờ này vì nếu không, người bị từ chối sẽ mắc kẹt: mỗi lần nhập tài khoản
   * lại chỉ nhận về đúng thông báo từ chối cũ, không có đường nào tạo yêu cầu mới.
   * Ngược lại, tự động tạo yêu cầu mới mỗi lần tra cứu thì người dùng không kịp
   * ĐỌC lý do bị từ chối trước khi nó bị thay bằng một yêu cầu đang chờ.
   */
  retry: z.boolean().optional(),
});
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z
  .object({
    identifier: passwordResetIdentifierSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    // Gắn lỗi vào đúng ô nhập lại, không phải vào cả form — người dùng cần biết
    // sửa ô nào chứ không phải nhìn một dòng đỏ chung chung ở đầu form.
    path: ['confirmPassword'],
  });
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Kết quả tra cứu, quyết định màn hình tiếp theo người dùng thấy.
 *
 * `CREATED` và `PENDING` khác nhau ở chỗ đây là lần gửi đầu hay lần tra lại — cùng
 * một trạng thái dữ liệu nhưng câu thông báo phải khác, nếu không người vừa bấm gửi
 * sẽ đọc được "đang đợi duyệt" và tưởng yêu cầu của mình đã có từ trước.
 */
export const PasswordResetOutcome = {
  /** Vừa tạo yêu cầu mới trong lần gọi này */
  CREATED: 'CREATED',
  /** Đã có yêu cầu từ trước, quản trị viên chưa thao tác */
  PENDING: 'PENDING',
  /** Đã được duyệt và chưa dùng — hiện form đặt mật khẩu mới */
  APPROVED: 'APPROVED',
  /** Bị từ chối, kèm lý do; người dùng có thể gửi lại */
  REJECTED: 'REJECTED',
} as const;
export type PasswordResetOutcome = (typeof PasswordResetOutcome)[keyof typeof PasswordResetOutcome];

export interface PasswordResetState {
  outcome: PasswordResetOutcome;
  /** Chỉ khác null khi `outcome === 'REJECTED'`. */
  rejectReason: string | null;
  /** ISO datetime quản trị viên xử lý; null khi còn chờ. */
  reviewedAt: string | null;
}

// ---------------------------------------------------------------------------
// Phía quản trị viên
// ---------------------------------------------------------------------------

/**
 * Hai tab của màn "Quản lý yêu cầu" đọc cùng một bảng, chỉ khác bộ lọc:
 *  - `pending` — các yêu cầu còn chờ, sắp theo cũ nhất trước (ai đợi lâu xử lý trước)
 *  - `log`     — các yêu cầu đã xử lý, sắp theo mới nhất trước (nhật ký)
 */
export const resetRequestQuerySchema = z.object({
  tab: z.enum(['pending', 'log']).default('pending'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ResetRequestQueryInput = z.infer<typeof resetRequestQuerySchema>;

export const rejectResetRequestSchema = z.object({
  /**
   * Lý do BẮT BUỘC khi từ chối. Người dùng sẽ đọc đúng chuỗi này, nên từ chối mà
   * không nói lý do thì họ không biết phải làm gì tiếp — chỉ biết là bị chặn.
   */
  reason: z
    .string()
    .trim()
    .min(5, 'Lý do từ chối phải có ít nhất 5 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
});
export type RejectResetRequestInput = z.infer<typeof rejectResetRequestSchema>;

/** Một dòng trong danh sách yêu cầu / nhật ký của trang quản trị. */
export interface ResetRequestRow {
  id: number;
  status: PasswordResetStatus;

  /** Người gửi yêu cầu. */
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
  };

  /**
   * Quản trị viên đã xử lý; null khi còn chờ, HOẶC khi tài khoản quản trị viên đó
   * đã bị xoá (khoá ngoại để SET NULL để không mất luôn dòng nhật ký).
   */
  reviewedBy: { id: number; name: string; username: string } | null;

  reviewedAt: string | null;
  rejectReason: string | null;
  /** Người dùng đã dùng lượt duyệt này để đổi mật khẩu chưa. */
  usedAt: string | null;
  createdAt: string;
}
