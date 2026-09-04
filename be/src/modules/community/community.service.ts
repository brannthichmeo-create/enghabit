import {
  MAX_ATTACHMENTS_PER_POST,
  UserRole,
  isImageMime,
  parseAttachmentDataUrl,
  sanitizeFileName,
  type CreateCommentInput,
  type CreatePostInput,
  type LikeResult,
  type Paginated,
  type PostAttachmentInfo,
  type PostAuthor,
  type PostCommentRow,
  type PostDetail,
  type PostQueryInput,
  type PostSummary,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { getLevelsFor } from '../statistics/statistics.service.js';

/**
 * Diễn đàn Cộng đồng.
 *
 * Ba quy tắc phải giữ khi sửa module này:
 *
 * 1. **Không ghi `ActivityLog`.** Đăng bài và bình luận không phải hoạt động học —
 *    ghi vào đó thì viết vài dòng là đủ giữ chuỗi, và mọi thống kê học tập sẽ nói dối
 *    (cùng lý do với module rewards, xem CLAUDE.md).
 * 2. **Không bao giờ `select`/`include` cột `data` của `PostAttachment`** ngoài đúng
 *    hàm `getAttachmentContent`. Cột đó là BLOB; kéo nó theo một trang danh sách là
 *    kéo về hàng chục MB không ai dùng tới.
 * 3. **Nội dung là văn bản thuần**, không phải HTML. Backend không diễn giải, không
 *    làm sạch thẻ — nó lưu và trả lại đúng chuỗi người dùng gõ, còn giao diện hiển
 *    thị bằng text node nên thẻ có nằm trong đó cũng không chạy.
 */

/** Số ký tự trích ra cho danh sách — đủ để biết bài nói gì mà không tải cả nội dung. */
const EXCERPT_LENGTH = 180;

/**
 * Người xem có được xoá nội dung này không.
 *
 * Tác giả xoá được bài của mình; quản trị viên xoá được của bất kỳ ai vì họ chịu trách
 * nhiệm kiểm duyệt diễn đàn. Không ai khác được đụng vào.
 */
function canDelete(authorId: number, viewer: { id: number; role: UserRole }): boolean {
  return authorId === viewer.id || viewer.role === UserRole.ADMIN;
}

/** Các cột của tác giả cần lấy kèm. Cố ý KHÔNG lấy ảnh đại diện — xem ghi chú ở listPosts. */
const AUTHOR_SELECT = { id: true, name: true, role: true } as const;

/** Mô tả tệp đính kèm, không kèm nội dung. */
const ATTACHMENT_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
} as const;

/**
 * Danh sách bài đăng.
 *
 * KHÔNG trả ảnh đại diện của tác giả: một trang 10 bài sẽ kéo theo 10 ảnh, mỗi ảnh vài
 * chục KB, chỉ để hiện một vòng tròn nhỏ. Giao diện dùng chữ cái đầu của tên thay thế
 * (component `Avatar` đã có sẵn cách hiển thị này).
 */
export async function listPosts(
  viewer: { id: number; role: UserRole },
  query: PostQueryInput,
): Promise<Paginated<PostSummary>> {
  const where: Prisma.PostWhereInput = {
    ...(query.mine ? { authorId: viewer.id } : {}),
    ...(query.search
      ? {
          OR: [{ title: { contains: query.search } }, { body: { contains: query.search } }],
        }
      : {}),
  };

  // "Nhiều tim nhất" sắp theo số dòng trong bảng likes — Prisma dịch được sang
  // ORDER BY COUNT, không cần cột đếm sẵn.
  const orderBy: Prisma.PostOrderByWithRelationInput =
    query.sort === 'popular' ? { likes: { _count: 'desc' } } : { createdAt: 'desc' };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        author: { select: AUTHOR_SELECT },
        attachments: { select: ATTACHMENT_SELECT },
        _count: { select: { likes: true, comments: true } },
        // Chỉ lấy lượt tim của CHÍNH người đang xem thay vì tải hết rồi lọc — bài có
        // trăm lượt tim cũng chỉ trả về nhiều nhất một dòng.
        likes: { where: { userId: viewer.id }, select: { id: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const levels = await loadLevels(posts.map((post) => post.author));

  return {
    items: posts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: toExcerpt(post.body),
      author: toAuthor(post.author, levels),
      createdAt: post.createdAt.toISOString(),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      likedByMe: post.likes.length > 0,
      attachments: post.attachments.map(toAttachmentInfo),
      canDelete: canDelete(post.authorId, viewer),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Một bài kèm toàn bộ bình luận. */
export async function getPost(
  postId: number,
  viewer: { id: number; role: UserRole },
): Promise<PostDetail> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: AUTHOR_SELECT },
      attachments: { select: ATTACHMENT_SELECT },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewer.id }, select: { id: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: AUTHOR_SELECT } },
      },
    },
  });
  if (!post) throw new NotFoundError('Không tìm thấy bài viết');

  // Một truy vấn cho cả tác giả bài lẫn tất cả người bình luận.
  const levels = await loadLevels([post.author, ...post.comments.map((c) => c.author)]);

  return {
    id: post.id,
    title: post.title,
    body: post.body,
    author: toAuthor(post.author, levels),
    createdAt: post.createdAt.toISOString(),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    attachments: post.attachments.map(toAttachmentInfo),
    canDelete: canDelete(post.authorId, viewer),
    comments: post.comments.map(
      (comment): PostCommentRow => ({
        id: comment.id,
        body: comment.body,
        author: toAuthor(comment.author, levels),
        createdAt: comment.createdAt.toISOString(),
        canDelete: canDelete(comment.authorId, viewer),
      }),
    ),
  };
}

/**
 * Đăng bài mới kèm tệp.
 *
 * Tệp được kiểm lại ở đây dù FE đã kiểm: FE có thể bị bỏ qua hoàn toàn bằng cách gọi
 * thẳng API. Luật nằm ở `shared/attachment` nên hai phía không thể lệch ngưỡng.
 *
 * Bài và tệp ghi trong CÙNG một transaction: có bài mà thiếu tệp thì người đăng tưởng
 * mất dữ liệu, mà có tệp không thuộc bài nào thì chiếm chỗ trong DB mãi mãi.
 */
export async function createPost(
  author: { id: number; role: UserRole },
  input: CreatePostInput,
): Promise<PostDetail> {
  if (input.attachments.length > MAX_ATTACHMENTS_PER_POST) {
    throw new BadRequestError(`Mỗi bài chỉ đính kèm tối đa ${MAX_ATTACHMENTS_PER_POST} tệp`);
  }

  const files = input.attachments.map((attachment) => {
    const parsed = parseAttachmentDataUrl(attachment.dataUrl);
    if (!parsed.ok) throw new BadRequestError(`${attachment.fileName}: ${parsed.reason}`);

    return {
      data: Buffer.from(parsed.base64, 'base64'),
      mimeType: parsed.mimeType,
      fileName: sanitizeFileName(attachment.fileName),
      sizeBytes: parsed.byteLength,
    };
  });

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: { authorId: author.id, title: input.title, body: input.body },
      select: { id: true },
    });

    /*
      Chèn TỪNG tệp một, cố ý không dùng `attachments: { create: files }`.

      Prisma gộp nested create thành một câu INSERT nhiều dòng, nên ba tệp sát trần sẽ
      nằm chung một gói tin ~2,7MB và vượt `max_allowed_packet` (1MB) — MySQL đóng kết
      nối, Prisma báo "Server has closed the connection" mà không nói gì về dung lượng.

      Vòng lặp tuần tự ở đây là bắt buộc chứ không phải sơ suất: mỗi lượt phải là một
      gói tin riêng. Số lượt tối đa là MAX_ATTACHMENTS_PER_POST nên không đáng lo.
    */
    for (const file of files) {
      await tx.postAttachment.create({ data: { postId: created.id, ...file } });
    }

    return created;
  });

  return getPost(post.id, author);
}

export async function deletePost(
  postId: number,
  viewer: { id: number; role: UserRole },
): Promise<void> {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new NotFoundError('Không tìm thấy bài viết');
  if (!canDelete(post.authorId, viewer)) {
    throw new ForbiddenError('Bạn chỉ xoá được bài của chính mình');
  }

  // Bình luận, lượt tim và tệp đính kèm đi theo nhờ onDelete: Cascade ở schema.
  await prisma.post.delete({ where: { id: postId } });
}

// --- Bình luận ---

export async function createComment(
  postId: number,
  authorId: number,
  input: CreateCommentInput,
): Promise<PostCommentRow> {
  const exists = await prisma.post.count({ where: { id: postId } });
  if (exists === 0) throw new NotFoundError('Không tìm thấy bài viết');

  const comment = await prisma.postComment.create({
    data: { postId, authorId, body: input.body },
    include: { author: { select: AUTHOR_SELECT } },
  });

  return {
    id: comment.id,
    body: comment.body,
    author: toAuthor(comment.author, await loadLevels([comment.author])),
    createdAt: comment.createdAt.toISOString(),
    canDelete: true,
  };
}

export async function deleteComment(
  commentId: number,
  viewer: { id: number; role: UserRole },
): Promise<void> {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });
  if (!comment) throw new NotFoundError('Không tìm thấy bình luận');
  if (!canDelete(comment.authorId, viewer)) {
    throw new ForbiddenError('Bạn chỉ xoá được bình luận của chính mình');
  }

  await prisma.postComment.delete({ where: { id: commentId } });
}

// --- Thả tim ---

/**
 * Thả hoặc bỏ tim, tuỳ trạng thái hiện tại.
 *
 * Một endpoint đảo trạng thái thay vì hai endpoint like/unlike: bấm nhanh hai lần thì
 * hai request có thể về không đúng thứ tự, mà endpoint đảo trạng thái luôn hội tụ về
 * đúng những gì người dùng thấy sau lần bấm cuối.
 */
export async function toggleLike(postId: number, userId: number): Promise<LikeResult> {
  const exists = await prisma.post.count({ where: { id: postId } });
  if (exists === 0) throw new NotFoundError('Không tìm thấy bài viết');

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    try {
      await prisma.postLike.create({ data: { postId, userId } });
    } catch (error: unknown) {
      // Ràng buộc unique đã chặn: một request khác vừa thả tim xong. Đó là trạng thái
      // người dùng muốn, nên coi như thành công thay vì báo lỗi.
      if (!isUniqueViolation(error)) throw error;
    }
  }

  const likeCount = await prisma.postLike.count({ where: { postId } });
  return { likeCount, likedByMe: !existing };
}

// --- Tệp đính kèm ---

/**
 * Nội dung một tệp, để tải về hoặc hiển thị.
 *
 * Đây là chỗ DUY NHẤT được đọc cột `data`. `mimeType` trả về là giá trị đã lưu — đã
 * qua danh sách trắng lúc đăng bài — chứ không phải thứ client gửi lên, nên không thể
 * ép trình duyệt diễn giải tệp thành HTML.
 */
export async function getAttachmentContent(attachmentId: number): Promise<{
  data: Buffer;
  mimeType: string;
  fileName: string;
  isImage: boolean;
}> {
  const attachment = await prisma.postAttachment.findUnique({
    where: { id: attachmentId },
    select: { data: true, mimeType: true, fileName: true },
  });
  if (!attachment) throw new NotFoundError('Không tìm thấy tệp đính kèm');

  return {
    data: Buffer.from(attachment.data),
    mimeType: attachment.mimeType,
    fileName: attachment.fileName,
    isImage: isImageMime(attachment.mimeType),
  };
}

// --- Chuyển đổi ---

/** Người viết bài hoặc bình luận, dạng thô lấy từ Prisma. */
type AuthorRow = { id: number; name: string; role: UserRole };

/**
 * Cấp độ của những người viết trong trang, tính bằng đúng một truy vấn.
 *
 * Dùng chung `statistics.getLevelsFor` với bảng xếp hạng thay vì tự gom nhóm ở đây —
 * cùng một công thức XP thì cấp độ hiện ở diễn đàn, ở bảng xếp hạng và ở trang cá nhân
 * không bao giờ nói khác nhau.
 *
 * Lọc bỏ quản trị viên trước khi hỏi: họ không có cấp độ nên đếm hoạt động của họ cũng
 * vô nghĩa (xem CLAUDE.md > Chức năng cho quản trị viên).
 */
async function loadLevels(authors: AuthorRow[]): Promise<Map<number, number>> {
  return getLevelsFor(authors.filter((a) => a.role !== UserRole.ADMIN).map((a) => a.id));
}

function toAuthor(author: AuthorRow, levels: Map<number, number>): PostAuthor {
  return {
    id: author.id,
    name: author.name,
    role: author.role,
    level: author.role === UserRole.ADMIN ? null : (levels.get(author.id) ?? 1),
  };
}

function toAttachmentInfo(attachment: {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): PostAttachmentInfo {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    isImage: isImageMime(attachment.mimeType),
  };
}

/** Cắt ở ranh giới từ để không đứt giữa chừng một chữ. */
function toExcerpt(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return flat;

  const cut = flat.slice(0, EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > EXCERPT_LENGTH / 2 ? cut.slice(0, lastSpace) : cut}…`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
