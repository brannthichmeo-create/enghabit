import { z } from 'zod';
import { MAX_ATTACHMENTS_PER_POST } from '../attachment/attachment.js';
import { UserRole } from '../constants/enums.js';

/**
 * Diễn đàn Cộng đồng — hỏi đáp dùng chung cho cả người học và quản trị viên.
 *
 * Nội dung bài và bình luận là VĂN BẢN THUẦN. Không nhận HTML hay Markdown có thẻ:
 * thứ một người viết ra sẽ hiện trên màn hình của tất cả người khác, nên cứ để trình
 * duyệt hiển thị như chuỗi thường là cách chắc chắn nhất để không có XSS.
 */

/** Một tệp gửi kèm lúc đăng bài. Luật thật nằm ở `parseAttachmentDataUrl` (shared/attachment). */
export const postAttachmentInputSchema = z.object({
  fileName: z.string().trim().min(1, 'Tệp phải có tên').max(255),
  /** Nội dung tệp dạng data URL base64, do client đọc từ máy người dùng. */
  dataUrl: z.string().min(1, 'Tệp rỗng'),
});
export type PostAttachmentInput = z.infer<typeof postAttachmentInputSchema>;

export const createPostSchema = z.object({
  /**
   * Bài thuộc nhóm nào. Bỏ trống là đăng ở diễn đàn chung.
   *
   * Bài của nhóm KHÔNG bao giờ lọt ra diễn đàn chung — xem bộ lọc `groupId: null`
   * trong community.service.listPosts. Thiếu bộ lọc đó là nội dung nhóm riêng tư
   * hiện cho cả hệ thống.
   */
  groupId: z.number().int().positive().optional(),
  title: z.string().trim().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(200),
  body: z.string().trim().min(10, 'Nội dung phải có ít nhất 10 ký tự').max(10_000),
  attachments: z
    .array(postAttachmentInputSchema)
    .max(MAX_ATTACHMENTS_PER_POST, `Mỗi bài chỉ đính kèm tối đa ${MAX_ATTACHMENTS_PER_POST} tệp`)
    .default([]),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Bình luận không được để trống').max(2000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** Cờ bật/tắt đọc từ query string. Tách ra vì có bốn bộ lọc dùng chung một luật. */
const booleanFlag = z
  .preprocess((value) => value === true || value === 'true' || value === '1', z.boolean())
  .default(false);

export const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  /** Tìm trong tiêu đề và nội dung. */
  search: z.string().trim().max(200).optional(),
  /**
   * `latest` là bài mới nhất, `popular` là nhiều tim nhất.
   *
   * Không có xếp hạng "trending" theo thời gian: công thức đó cần chỉnh liên tục theo
   * lượng bài thực tế, mà ở quy mô này hai lựa chọn trên là đủ dùng.
   */
  sort: z.enum(['latest', 'popular']).default('latest'),
  /** Lọc theo nhóm. Bỏ trống là diễn đàn chung (chỉ bài không thuộc nhóm nào). */
  groupId: z.coerce.number().int().positive().optional(),
  /**
   * Bộ lọc — CỘNG DỒN với nhau, chọn bao nhiêu cái cũng được.
   *
   * Khác với `sort`: hai kiểu sắp xếp không thể cùng áp dụng (một danh sách chỉ có một
   * thứ tự), còn các bộ lọc thì chồng lên nhau được — "bài của tôi" + "chưa ai trả lời"
   * là câu hỏi có nghĩa.
   *
   * Không dùng `z.coerce.boolean()`: query string luôn là chuỗi mà `Boolean('false')`
   * bằng `true`, nên mọi bộ lọc sẽ luôn bật (xem CLAUDE.md).
   */
  mine: booleanFlag,
  /** Bài mình đã thả tim. */
  liked: booleanFlag,
  /** Bài có tệp đính kèm. */
  hasFiles: booleanFlag,
  /** Bài chưa ai bình luận — dành cho người muốn tìm câu hỏi còn bỏ ngỏ để trả lời. */
  unanswered: booleanFlag,
});
export type PostQueryInput = z.infer<typeof postQuerySchema>;

/** Người viết bài hoặc bình luận. Không kèm ảnh đại diện — xem ghi chú ở community.service. */
export interface PostAuthor {
  id: number;
  name: string;
  /** Để giao diện gắn nhãn cho câu trả lời của quản trị viên. */
  role: UserRole;
  /**
   * Cấp độ suy từ `ActivityLog`, dùng đúng công thức của `shared/level`.
   *
   * `null` với quản trị viên: họ vận hành hệ thống chứ không đi học nên không có cấp
   * độ (xem CLAUDE.md > Chức năng cho quản trị viên). Giao diện gắn nhãn vai trò cho
   * họ thay chỗ đó — mỗi người luôn có đúng một nhãn, không bao giờ có cả hai.
   */
  level: number | null;
}

/** Thông tin mô tả một tệp đính kèm. KHÔNG bao giờ chứa nội dung tệp. */
export interface PostAttachmentInfo {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Ảnh thì hiện thẳng trong bài, còn lại chỉ hiện dòng tải về. */
  isImage: boolean;
}

/** Một bài trong danh sách. Không kèm bình luận để trang danh sách nhẹ. */
export interface PostSummary {
  /** Null nghĩa là bài ở diễn đàn chung. */
  groupId?: number | null;
  id: number;
  title: string;
  /** Vài dòng đầu của nội dung, đã cắt ở backend. */
  excerpt: string;
  author: PostAuthor;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  /** Người đang xem đã thả tim bài này chưa. */
  likedByMe: boolean;
  attachments: PostAttachmentInfo[];
  /** Người đang xem có được xoá bài này không (tác giả, hoặc quản trị viên). */
  canDelete: boolean;
}

export interface PostCommentRow {
  id: number;
  body: string;
  author: PostAuthor;
  createdAt: string;
  canDelete: boolean;
}

export interface PostDetail extends Omit<PostSummary, 'excerpt'> {
  body: string;
  comments: PostCommentRow[];
}

/** Kết quả sau khi thả hoặc bỏ tim — trả số mới để giao diện không phải tự đoán. */
export interface LikeResult {
  likeCount: number;
  likedByMe: boolean;
}
