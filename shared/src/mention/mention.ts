/**
 * Đề cập (@mention) trong bài đăng và bình luận của nhóm lớp.
 *
 * Nội dung bài vẫn là VĂN BẢN THUẦN — không có cú pháp đánh dấu riêng, không lưu danh
 * sách người được nhắc kèm bài. Người được nhắc được suy ra từ chính chuỗi người dùng
 * gõ, ở backend, bằng cách đối chiếu với danh sách thành viên nhóm. Nhờ vậy:
 *
 * - Sửa/xoá thành viên không để lại một bảng liên kết cũ phải dọn.
 * - Gõ `@ai-do` mà không có ai tên vậy thì chỉ là chữ thường, không sinh thông báo.
 * - Frontend và backend tách cùng một chuỗi bằng CÙNG hàm ở đây nên ô gợi ý và người
 *   thực sự nhận thông báo không bao giờ lệch nhau.
 *
 * KHÔNG tin danh sách người được nhắc do frontend gửi lên: gửi thẳng API là nhắc được
 * cả người ngoài nhóm.
 */

/**
 * Tên đặc biệt để gọi cả nhóm: `@all`.
 *
 * Dùng chữ tiếng Anh chứ không phải `@tatca` vì nó nằm chung không gian tên với tên tài
 * khoản, mà tên tài khoản chỉ nhận chữ không dấu — một từ tiếng Anh ngắn đỡ gây nhầm.
 * Tên tài khoản thật không thể là `all` vì độ dài tối thiểu là 3... nên phải loại trừ
 * tường minh khi so khớp (xem `matchMentions`).
 */
export const MENTION_ALL = 'all';

/**
 * Bắt `@tên_tài_khoản` trong văn bản.
 *
 * Bộ ký tự khớp đúng `usernameSchema` (chữ thường, số, `.`, `_`, `-`). Ký tự đứng ngay
 * trước `@` phải là đầu chuỗi hoặc khoảng trắng: nếu không thì phần đuôi của một địa
 * chỉ email (`ai@vidu.com`) cũng bị coi là một lượt nhắc.
 */
const MENTION_PATTERN = /(^|\s)@([a-z0-9][a-z0-9._-]{0,29})/gi;

/**
 * Các tên tài khoản được nhắc trong một đoạn văn bản, đã bỏ trùng và hạ chữ thường.
 *
 * Trả về cả `@all`; người gọi tự quyết định có cho phép hay không.
 */
export function parseMentions(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    // Bỏ dấu chấm cuối câu: "cảm ơn @long." là nhắc `long`, không phải `long.`
    found.add((match[2] ?? '').toLowerCase().replace(/[._-]+$/, ''));
  }
  return [...found].filter((name) => name.length >= 3);
}

/** Một người có thể được nhắc — đủ dùng cho cả ô gợi ý lẫn việc gửi thông báo. */
export interface MentionTarget {
  userId: number;
  name: string;
  username: string;
}

/**
 * Đối chiếu chuỗi người dùng gõ với danh sách được phép nhắc.
 *
 * `@all` trả về TOÀN BỘ danh sách. Người viết bị loại khỏi kết quả ở đây chứ không ở
 * chỗ gửi thông báo: tự nhắc mình rồi tự nhận thông báo là vô nghĩa, và loại một lần
 * ở đây thì mọi nơi gọi hàm đều có cùng hành vi.
 */
export function matchMentions(
  text: string,
  candidates: MentionTarget[],
  authorId: number,
): MentionTarget[] {
  const names = parseMentions(text);
  if (names.length === 0) return [];

  const others = candidates.filter((candidate) => candidate.userId !== authorId);
  if (names.includes(MENTION_ALL)) return others;

  const wanted = new Set(names);
  return others.filter((candidate) => wanted.has(candidate.username.toLowerCase()));
}
