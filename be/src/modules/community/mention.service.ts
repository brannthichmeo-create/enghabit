import { NotificationType, matchMentions } from '@enghabit/shared';
import { logger } from '../../lib/logger.js';
import { createNotification } from '../notifications/notification.service.js';
import { listMentionTargets } from '../groups/group.service.js';

/**
 * Gửi thông báo cho những người được đề cập bằng `@` trong nhóm lớp.
 *
 * Ba điều phải giữ khi sửa:
 *
 * 1. **Danh sách người được nhắc do BACKEND tách ra từ chính nội dung bài**, không nhận
 *    từ frontend. Nhận từ frontend là gọi thẳng API nhắc được cả người ngoài nhóm.
 * 2. **Chỉ nhắc được thành viên của ĐÚNG nhóm đó.** `listMentionTargets` trả về danh
 *    sách thành viên và đã tự kiểm tra tư cách của người viết.
 * 3. **Đề cập KHÔNG chặn việc đăng bài.** Lỗi khi gửi thông báo chỉ được ghi log — bài
 *    đã ghi vào DB rồi, ném lỗi ra ngoài thì người dùng thấy "đăng thất bại" trong khi
 *    bài của họ vẫn nằm đó và họ sẽ đăng lại lần nữa.
 */

/** Cắt nội dung xuống một dòng xem trước trong thông báo. */
const PREVIEW_LENGTH = 120;

function toPreview(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= PREVIEW_LENGTH ? flat : `${flat.slice(0, PREVIEW_LENGTH)}…`;
}

export async function notifyMentions(params: {
  /** Null nghĩa là bài ở diễn đàn chung — ở đó không có danh sách thành viên nên không có @. */
  groupId: number | null;
  authorId: number;
  authorName: string;
  /** Nội dung người dùng vừa gõ, để tách ra các `@tên`. */
  text: string;
  postId: number;
  postTitle: string;
  /**
   * Có giá trị khi đề cập nằm trong một bình luận.
   *
   * Dùng làm khoá chống trùng: sửa nội dung không có ở hệ thống này, nhưng hai bình
   * luận khác nhau cùng nhắc một người là hai thông báo khác nhau.
   */
  commentId?: number;
}): Promise<void> {
  if (params.groupId === null) return;
  if (!params.text.includes('@')) return;

  try {
    const candidates = await listMentionTargets(params.groupId, params.authorId);
    const mentioned = matchMentions(params.text, candidates, params.authorId);

    for (const target of mentioned) {
      await createNotification({
        userId: target.userId,
        type: NotificationType.MENTIONED,
        title: params.commentId
          ? 'Bạn được nhắc trong một bình luận'
          : 'Bạn được nhắc trong một bài đăng',
        body: `${params.authorName} nhắc bạn ở "${params.postTitle}": ${toPreview(params.text)}`,
        // Dẫn tới nhóm chứ không tới bài: bài đăng không có URL riêng, nó mở bên trong
        // trang nhóm (xem GroupDetailPage).
        link: `/groups/${params.groupId}`,
        dedupeKey: params.commentId
          ? `${NotificationType.MENTIONED}:COMMENT:${params.commentId}:${target.userId}`
          : `${NotificationType.MENTIONED}:POST:${params.postId}:${target.userId}`,
      });
    }
  } catch (error: unknown) {
    logger.error({ error, postId: params.postId }, 'Không gửi được thông báo đề cập');
  }
}
