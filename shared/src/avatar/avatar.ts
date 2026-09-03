/**
 * Ảnh đại diện: giới hạn và cách kiểm tra chuỗi data URL.
 *
 * Dùng chung vì cả hai phía đều cần cùng một luật: FE báo lỗi ngay khi người dùng chọn
 * file để không phải chờ upload, BE kiểm lại lần nữa vì FE có thể bị bỏ qua hoàn toàn
 * (gọi thẳng API). Chỉ định nghĩa một lần ở đây để hai bên không bao giờ lệch ngưỡng.
 *
 * Ảnh được thu nhỏ ở phía client trước khi gửi (canvas), nên ngưỡng dưới đây là cho
 * ảnh ĐÃ thu nhỏ, không phải file gốc người dùng chọn.
 */

/** Cạnh của ảnh sau khi thu nhỏ. Avatar hiển thị lớn nhất là 64px nên 256 là dư cho màn hình retina. */
export const AVATAR_DIMENSION = 256;

/**
 * Giới hạn dữ liệu ảnh sau khi giải mã base64.
 *
 * 200KB là rất rộng cho một ảnh 256×256 (thường chỉ 20-40KB) nhưng vẫn đủ nhỏ để nhét
 * thẳng vào phản hồi `/auth/me` mà không làm chậm lần tải đầu.
 */
export const AVATAR_MAX_BYTES = 200_000;

/**
 * Định dạng chấp nhận. Không nhận SVG: SVG là tài liệu chạy được script, cho phép tải
 * lên rồi hiển thị lại cho người khác là mở đường cho XSS.
 */
export const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AvatarMimeType = (typeof ALLOWED_AVATAR_MIME)[number];

export type ParsedAvatar =
  | { ok: true; mimeType: AvatarMimeType; base64: string; byteLength: number }
  | { ok: false; reason: string };

const DATA_URL_PATTERN = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Số byte thật sau khi giải mã base64, tính mà không cần decode cả chuỗi. */
export function base64ByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Tách và kiểm tra một data URL ảnh.
 *
 * Trả về lý do bằng tiếng Việt để hiển thị thẳng cho người dùng, thay vì ném lỗi —
 * đây là dữ liệu người dùng nhập, sai là chuyện bình thường chứ không phải sự cố.
 */
export function parseImageDataUrl(dataUrl: string): ParsedAvatar {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());
  if (!match) return { ok: false, reason: 'Ảnh không đúng định dạng' };

  const [, mimeType, base64] = match as unknown as [string, string, string];

  if (!ALLOWED_AVATAR_MIME.includes(mimeType as AvatarMimeType)) {
    return { ok: false, reason: 'Chỉ nhận ảnh JPG, PNG hoặc WebP' };
  }

  const byteLength = base64ByteLength(base64);
  if (byteLength === 0) return { ok: false, reason: 'Ảnh rỗng' };
  if (byteLength > AVATAR_MAX_BYTES) {
    return { ok: false, reason: `Ảnh quá lớn (tối đa ${Math.round(AVATAR_MAX_BYTES / 1000)}KB)` };
  }

  return { ok: true, mimeType: mimeType as AvatarMimeType, base64, byteLength };
}
