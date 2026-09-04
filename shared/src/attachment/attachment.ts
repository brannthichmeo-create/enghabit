/**
 * Tệp đính kèm của bài đăng: giới hạn và cách kiểm tra chuỗi data URL.
 *
 * Dùng chung vì cả hai phía cần cùng một luật: FE báo lỗi ngay khi người dùng chọn
 * tệp để không phải chờ tải lên, BE kiểm lại lần nữa vì FE có thể bị bỏ qua hoàn toàn
 * (gọi thẳng API). Định nghĩa một lần ở đây để hai bên không bao giờ lệch ngưỡng —
 * cùng cách làm với ảnh đại diện (xem shared/avatar).
 *
 * Khác ảnh đại diện ở một điểm quan trọng: tệp ở đây được hiển thị lại cho NGƯỜI KHÁC
 * xem, nên danh sách định dạng cho phép phải chặt hơn chứ không lỏng hơn.
 */

import { base64ByteLength } from '../encoding/base64.js';

/** Số tệp tối đa cho một bài đăng. */
export const MAX_ATTACHMENTS_PER_POST = 3;

/**
 * Giới hạn mỗi tệp sau khi giải mã base64.
 *
 * Con số này KHÔNG phải chọn tuỳ ý — nó bị chặn trên bởi `max_allowed_packet` của
 * MySQL, mặc định 1MB (1.048.576 byte). Tệp lưu thẳng vào cột BLOB nên cả nội dung
 * phải nằm gọn trong một gói tin; vượt qua thì MySQL đóng kết nối và Prisma báo
 * "Server has closed the connection" — một thông báo không hề nhắc gì tới dung lượng,
 * rất khó truy nguyên nếu không biết trước.
 *
 * 900KB chừa lại ~148KB cho phần còn lại của câu lệnh INSERT (tiêu đề, nội dung tối đa
 * 10.000 ký tự, tên tệp) và phần bao của giao thức.
 *
 * Muốn cho phép tệp lớn hơn thì phải nâng `max_allowed_packet` ở phía máy chủ DB
 * TRƯỚC, rồi mới sửa con số này. Sửa mỗi ở đây là hỏng ngay khi có người tải tệp lớn.
 */
export const ATTACHMENT_MAX_BYTES = 900_000;

/**
 * Ảnh — hiển thị thẳng trong bài.
 *
 * KHÔNG nhận SVG. SVG là tài liệu chạy được script; ở diễn đàn thì tệp một người tải
 * lên sẽ hiện trên màn hình của tất cả những người khác, nên đây là con đường XSS
 * trực tiếp chứ không phải rủi ro lý thuyết.
 */
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/**
 * Tệp không phải ảnh — chỉ tải về, không bao giờ render nội dung trong trang.
 *
 * Danh sách cố ý ngắn. Thêm định dạng mới chỉ cần thêm một dòng ở đây, nhưng phải cân
 * nhắc: mỗi định dạng là một thứ trình duyệt có thể diễn giải theo cách ngoài dự tính.
 * Không bao giờ thêm text/html hay image/svg+xml vào đây.
 */
export const ALLOWED_FILE_MIME = ['application/pdf', 'text/plain'] as const;

export const ALLOWED_ATTACHMENT_MIME = [...ALLOWED_IMAGE_MIME, ...ALLOWED_FILE_MIME] as const;
export type AttachmentMimeType = (typeof ALLOWED_ATTACHMENT_MIME)[number];

/** Tệp này có phải ảnh không — quyết định hiện thumbnail hay hiện dòng tải về. */
export function isImageMime(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mimeType);
}

export type ParsedAttachment =
  | { ok: true; mimeType: AttachmentMimeType; base64: string; byteLength: number }
  | { ok: false; reason: string };

const DATA_URL_PATTERN = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Tách và kiểm tra một data URL đính kèm.
 *
 * Trả lý do bằng tiếng Việt để hiện thẳng cho người dùng thay vì ném lỗi — người dùng
 * chọn nhầm tệp là chuyện bình thường, không phải sự cố hệ thống.
 */
export function parseAttachmentDataUrl(dataUrl: string): ParsedAttachment {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());
  if (!match) return { ok: false, reason: 'Tệp không đúng định dạng' };

  const [, mimeType, base64] = match as unknown as [string, string, string];

  if (!(ALLOWED_ATTACHMENT_MIME as readonly string[]).includes(mimeType)) {
    return { ok: false, reason: 'Chỉ nhận ảnh JPG, PNG, WebP, GIF hoặc tệp PDF, TXT' };
  }

  const byteLength = base64ByteLength(base64);
  if (byteLength === 0) return { ok: false, reason: 'Tệp rỗng' };
  if (byteLength > ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      reason: `Tệp quá lớn (tối đa ${Math.round(ATTACHMENT_MAX_BYTES / 1000)}KB)`,
    };
  }

  return { ok: true, mimeType: mimeType as AttachmentMimeType, base64, byteLength };
}

/**
 * Làm sạch tên tệp trước khi lưu và trước khi đặt vào header `Content-Disposition`.
 *
 * Bỏ đường dẫn, dấu nháy và ký tự xuống dòng: tên tệp là chuỗi do người dùng đặt, mà
 * nó đi thẳng vào một HTTP header — không lọc thì chèn được header giả vào phản hồi.
 */
export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/["'\r\n\t]/g, '').trim();
  return cleaned.slice(0, 255) || 'tep-dinh-kem';
}
