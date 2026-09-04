/**
 * Tính toán trên chuỗi base64.
 *
 * Tách riêng vì hai domain khác nhau cùng cần: ảnh đại diện (shared/avatar) và tệp
 * đính kèm của diễn đàn (shared/attachment). Để mỗi bên tự viết một bản thì sớm muộn
 * hai bên sẽ tính ra hai con số khác nhau cho cùng một chuỗi.
 */

/**
 * Số byte thật sau khi giải mã base64, tính mà không cần decode cả chuỗi.
 *
 * Cần thiết vì cả hai phía đều phải kiểm dung lượng TRƯỚC khi dựng buffer: decode một
 * chuỗi 10MB chỉ để biết nó quá lớn là đúng thứ ta muốn tránh.
 */
export function base64ByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}
