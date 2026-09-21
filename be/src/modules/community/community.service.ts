import {
  AdminAction,
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
import { isMember } from '../groups/group.service.js';
import { notifyMentions } from './mention.service.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { getEquippedFrameUrls } from '../shop/shop.frame.js';
import { getLevelsFor } from '../statistics/statistics.service.js';
import { recordAdminAction } from '../admin/admin-audit.service.js';

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

/** Xoá nội dung của người khác với tư cách quản trị viên — thứ phải vào nhật ký thao tác. */
function isModeration(authorId: number, viewer: { id: number; role: UserRole }): boolean {
  return viewer.role === UserRole.ADMIN && authorId !== viewer.id;
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
 * Người này có quyền đọc/ghi trong nhóm không.
 *
 * Dùng NotFoundError chứ không phải ForbiddenError: báo "bạn không có quyền" cũng là
 * xác nhận nhóm đó tồn tại, đủ để người ngoài dò ra id của các nhóm riêng tư.
 */
async function assertGroupAccess(groupId: number, userId: number): Promise<void> {
  if (!(await isMember(groupId, userId))) throw new NotFoundError('Không tìm thấy nội dung');
}

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
  // Bài của nhóm KHÔNG được lẫn vào diễn đàn chung. `groupId: null` là thứ duy nhất
  // chặn việc đó — bỏ dòng này là toàn bộ nội dung nhóm riêng tư hiện cho cả hệ thống.
  if (query.groupId !== undefined) await assertGroupAccess(query.groupId, viewer.id);

  /*
    Các bộ lọc CỘNG DỒN: chọn hai cái là phải thoả cả hai, không phải thoả một trong hai.
    Prisma gộp các khoá cùng cấp bằng AND nên viết phẳng như dưới là đúng ý; riêng tìm
    kiếm dùng OR nên phải nằm gọn trong khoá `OR` của chính nó, nếu bung ra cùng cấp thì
    nó sẽ nuốt luôn các điều kiện khác.
  */
  const where: Prisma.PostWhereInput = {
    groupId: query.groupId ?? null,
    ...(query.mine ? { authorId: viewer.id } : {}),
    ...(query.liked ? { likes: { some: { userId: viewer.id } } } : {}),
    ...(query.hasFiles ? { attachments: { some: {} } } : {}),
    ...(query.unanswered ? { comments: { none: {} } } : {}),
    ...(query.search
      ? {
          OR: [{ title: { contains: query.search } }, { body: { contains: query.search } }],
        }
      : {}),
  };

  /*
    Sắp xếp chỉ có MỘT tiêu chí chính — một danh sách không thể vừa xếp theo tim vừa xếp
    theo ngày. "Nhiều tim nhất" đã ngầm lấy bài mới hơn khi bằng tim, nhờ khoá phụ bên dưới.

    Khoá phụ `id` là bắt buộc cho phân trang: hai bài cùng số tim (rất hay gặp, vd cùng 0
    tim) mà không có khoá phụ thì MySQL trả về thứ tự tuỳ ý, nên cùng một bài có thể xuất
    hiện ở cả trang 1 lẫn trang 2 — hoặc biến mất khỏi cả hai.
  */
  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    query.sort === 'popular'
      ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }];

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

  const extras = await loadAuthorExtras(posts.map((post) => post.author));

  return {
    items: posts.map((post) => ({
      id: post.id,
      groupId: post.groupId,
      title: post.title,
      excerpt: toExcerpt(post.body),
      author: toAuthor(post.author, extras),
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
  // Chặn cả đường vào thẳng bằng id: danh sách đã lọc nhưng ai biết id bài vẫn gọi được endpoint này.
  if (post.groupId !== null) await assertGroupAccess(post.groupId, viewer.id);

  // Một truy vấn cho cả tác giả bài lẫn tất cả người bình luận.
  const extras = await loadAuthorExtras([post.author, ...post.comments.map((c) => c.author)]);

  return {
    id: post.id,
    // Giao diện cần biết bài thuộc nhóm nào để ô bình luận bật được gợi ý `@`.
    groupId: post.groupId,
    title: post.title,
    body: post.body,
    author: toAuthor(post.author, extras),
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
        author: toAuthor(comment.author, extras),
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
  if (input.groupId !== undefined) await assertGroupAccess(input.groupId, author.id);

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
      data: {
        authorId: author.id,
        title: input.title,
        body: input.body,
        groupId: input.groupId ?? null,
      },
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

  const detail = await getPost(post.id, author);

  // Sau khi bài đã ghi xong: người được nhắc chỉ nên nhận thông báo về một bài có thật.
  // Hàm này tự nuốt lỗi nên đề cập hỏng không làm hỏng việc đăng bài.
  await notifyMentions({
    groupId: detail.groupId ?? null,
    authorId: author.id,
    authorName: detail.author.name,
    // Cả tiêu đề lẫn nội dung: người ta hay nhắc tên ngay ở tiêu đề ("@all họp nhóm").
    text: `${input.title}\n${input.body}`,
    postId: detail.id,
    postTitle: detail.title,
  });

  return detail;
}

export async function deletePost(
  postId: number,
  viewer: { id: number; role: UserRole },
): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true, author: { select: { name: true, username: true } } },
  });
  if (!post) throw new NotFoundError('Không tìm thấy bài viết');
  if (!canDelete(post.authorId, viewer)) {
    throw new ForbiddenError('Bạn chỉ xoá được bài của chính mình');
  }

  await prisma.$transaction(async (tx) => {
    // Quản trị viên xoá bài của NGƯỜI KHÁC là thao tác kiểm duyệt — ghi nhật ký. Tự xoá
    // bài của chính mình thì là việc của một người viết, không có gì để kiểm duyệt.
    if (isModeration(post.authorId, viewer)) {
      await recordAdminAction(
        {
          actorId: viewer.id,
          action: AdminAction.POST_DELETED,
          targetId: postId,
          targetLabel: post.title,
          note: `${post.author.name} (@${post.author.username})`,
        },
        tx,
      );
    }
    // Bình luận, lượt tim và tệp đính kèm đi theo nhờ onDelete: Cascade ở schema.
    await tx.post.delete({ where: { id: postId } });
  });
}

// --- Bình luận ---

export async function createComment(
  postId: number,
  authorId: number,
  input: CreateCommentInput,
): Promise<PostCommentRow> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { groupId: true, title: true },
  });
  if (!post) throw new NotFoundError('Không tìm thấy bài viết');
  if (post.groupId !== null) await assertGroupAccess(post.groupId, authorId);

  const comment = await prisma.postComment.create({
    data: { postId, authorId, body: input.body },
    include: { author: { select: AUTHOR_SELECT } },
  });

  await notifyMentions({
    groupId: post.groupId,
    authorId,
    authorName: comment.author.name,
    text: input.body,
    postId,
    postTitle: post.title,
    commentId: comment.id,
  });

  return {
    id: comment.id,
    body: comment.body,
    author: toAuthor(comment.author, await loadAuthorExtras([comment.author])),
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
    select: {
      authorId: true,
      body: true,
      postId: true,
      author: { select: { name: true, username: true } },
      post: { select: { title: true } },
    },
  });
  if (!comment) throw new NotFoundError('Không tìm thấy bình luận');
  if (!canDelete(comment.authorId, viewer)) {
    throw new ForbiddenError('Bạn chỉ xoá được bình luận của chính mình');
  }

  await prisma.$transaction(async (tx) => {
    if (isModeration(comment.authorId, viewer)) {
      await recordAdminAction(
        {
          actorId: viewer.id,
          action: AdminAction.COMMENT_DELETED,
          targetId: commentId,
          targetLabel: comment.post.title,
          // Nội dung bình luận mất theo lệnh xoá — nhật ký giữ lại để còn biết đã xoá gì.
          changes: { body: { from: comment.body, to: null } },
          note: `${comment.author.name} (@${comment.author.username})`,
        },
        tx,
      );
    }
    await tx.postComment.delete({ where: { id: commentId } });
  });
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
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { groupId: true } });
  if (!post) throw new NotFoundError('Không tìm thấy bài viết');
  if (post.groupId !== null) await assertGroupAccess(post.groupId, userId);

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
export async function getAttachmentContent(
  attachmentId: number,
  viewerId: number,
): Promise<{
  data: Buffer;
  mimeType: string;
  fileName: string;
  isImage: boolean;
}> {
  const attachment = await prisma.postAttachment.findUnique({
    where: { id: attachmentId },
    // `post.groupId` chứ không phải cả bài: cột `data` đã nặng sẵn, kéo thêm thân bài
    // vào cùng truy vấn là tốn thêm băng thông cho mỗi lượt tải tệp.
    select: { data: true, mimeType: true, fileName: true, post: { select: { groupId: true } } },
  });
  if (!attachment) throw new NotFoundError('Không tìm thấy tệp đính kèm');
  // Tệp của nhóm riêng tư phải chặn ở đây nữa: biết id tệp là tải được, không cần
  // qua trang bài viết.
  if (attachment.post.groupId !== null) await assertGroupAccess(attachment.post.groupId, viewerId);

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
async function loadAuthorExtras(authors: AuthorRow[]): Promise<AuthorExtras> {
  const [levels, frames] = await Promise.all([
    getLevelsFor(authors.filter((a) => a.role !== UserRole.ADMIN).map((a) => a.id)),
    // Khung viền lấy cho mọi tác giả, kể cả quản trị viên: họ không mua được vật phẩm
    // (shop chặn requireRole USER) nên luôn ra khung mặc định — không cần lọc tay ở đây.
    getEquippedFrameUrls(authors.map((a) => a.id)),
  ]);
  return { levels, frames };
}

/** Cấp độ và khung viền của cả trang, tải cùng lúc để mỗi trang chỉ tốn một lượt. */
interface AuthorExtras {
  levels: Map<number, number>;
  frames: Map<number, string>;
}

function toAuthor(author: AuthorRow, extras: AuthorExtras): PostAuthor {
  return {
    id: author.id,
    name: author.name,
    role: author.role,
    level: author.role === UserRole.ADMIN ? null : (extras.levels.get(author.id) ?? 1),
    avatarFrameUrl: extras.frames.get(author.id) ?? null,
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
