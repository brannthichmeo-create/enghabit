import {
  AdminAction,
  GroupMemberRole,
  NotificationType,
  type AdminGroupDetail,
  type AdminGroupQueryInput,
  type AdminGroupRow,
  type Paginated,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { createNotification } from '../notifications/notification.service.js';
import { toBlockInfo } from '../groups/group.service.js';
import { getEquippedFrameUrls } from '../shop/shop.frame.js';
import { recordAdminAction } from './admin-audit.service.js';

/**
 * Quản trị nhóm lớp — góc nhìn vận hành, KHÁC hẳn góc nhìn thành viên.
 *
 * Quản trị viên không tham gia nhóm nào cả: họ không đọc bài, không đăng bài, không
 * duyệt yêu cầu vào nhóm. Việc của họ là giám sát và xử lý vi phạm, nên chỉ có ba
 * thao tác: xem thông tin, gửi cảnh báo, chặn/mở chặn.
 *
 * Chặn nhóm là biện pháp ĐẢO NGƯỢC ĐƯỢC: dữ liệu giữ nguyên, chỉ đóng băng lại. Vì
 * vậy không có "xoá nhóm" ở đây — xoá là việc của trưởng nhóm, và mất dữ liệu thì
 * không cứu lại được.
 */

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

const GROUP_INCLUDE = {
  _count: { select: { members: true, posts: true } },
  blockedBy: { select: { name: true } },
} satisfies Prisma.GroupInclude;

export async function listGroups(query: AdminGroupQueryInput): Promise<Paginated<AdminGroupRow>> {
  const where: Prisma.GroupWhereInput = {
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.status === 'blocked' ? { blockedAt: { not: null } } : {}),
    ...(query.status === 'active' ? { blockedAt: null } : {}),
    ...(query.search
      ? {
          // Tìm cả theo mã: quản trị viên thường nhận báo cáo kèm mã nhóm chứ không
          // phải tên, mà tên nhóm thì đổi được còn mã thì không.
          OR: [{ name: { contains: query.search } }, { code: { contains: query.search } }],
        }
      : {}),
  };

  const orderBy: Prisma.GroupOrderByWithRelationInput =
    query.sort === 'members'
      ? { members: { _count: 'desc' } }
      : query.sort === 'posts'
        ? { posts: { _count: 'desc' } }
        : { createdAt: 'desc' };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: GROUP_INCLUDE,
    }),
    prisma.group.count({ where }),
  ]);

  const ids = groups.map((g) => g.id);
  const [leaders, pendingCounts, lastPosts] = await Promise.all([
    leadersByGroup(ids),
    countBy('pending', ids),
    lastPostByGroup(ids),
  ]);

  return {
    items: groups.map((group) => ({
      ...toRow(group),
      leaders: leaders.get(group.id) ?? [],
      pendingCount: pendingCounts.get(group.id) ?? 0,
      lastPostAt: lastPosts.get(group.id) ?? null,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getGroupDetail(groupId: number): Promise<AdminGroupDetail> {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: GROUP_INCLUDE });
  if (!group) throw new NotFoundError('Không tìm thấy nhóm');

  const [members, recentPosts, leaders, pendingCounts, lastPosts] = await Promise.all([
    prisma.groupMember.findMany({
      where: { groupId },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            streak: { select: { currentStreak: true } },
            _count: { select: { activityLogs: true } },
          },
        },
      },
    }),
    // CHỈ tiêu đề, không lấy `body` và tuyệt đối không `include: attachments` —
    // xem cảnh báo ở model PostAttachment.
    prisma.post.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true, createdAt: true, author: { select: { name: true } } },
    }),
    leadersByGroup([groupId]),
    countBy('pending', [groupId]),
    lastPostByGroup([groupId]),
  ]);

  // Quản trị viên cũng là "người khác": họ thấy khung viền thành viên đã mua, như mọi
  // màn hình khác hiện người dùng. Một truy vấn cho cả danh sách.
  const frames = await getEquippedFrameUrls(members.map((m) => m.user.id));

  return {
    ...toRow(group),
    leaders: leaders.get(groupId) ?? [],
    pendingCount: pendingCounts.get(groupId) ?? 0,
    lastPostAt: lastPosts.get(groupId) ?? null,
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      activityCount: m.user._count.activityLogs,
      currentStreak: m.user.streak?.currentStreak ?? 0,
      avatarFrameUrl: frames.get(m.user.id) ?? null,
    })),
    recentPosts: recentPosts.map((post) => ({
      id: post.id,
      title: post.title,
      authorName: post.author.name,
      createdAt: post.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Cảnh báo và chặn
// ---------------------------------------------------------------------------

/** Gửi cảnh báo vi phạm tới TOÀN BỘ thành viên nhóm, kể cả người mới vào hôm nay. */
export async function warnGroup(
  groupId: number,
  message: string,
  adminId: number,
): Promise<{ recipients: number }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, members: { select: { userId: true } } },
  });
  if (!group) throw new NotFoundError('Không tìm thấy nhóm');

  await notifyMembers(group.members, {
    type: NotificationType.GROUP_WARNING,
    title: `Cảnh báo về nhóm "${group.name}"`,
    body: message,
    link: `/groups/${groupId}`,
    // Mốc thời gian trong khoá: mỗi lần gửi là một cảnh báo riêng, gộp lại thì lần
    // nhắc thứ hai im lặng đúng lúc cần nhắc mạnh nhất.
    dedupeKey: `${NotificationType.GROUP_WARNING}:${groupId}:${Date.now()}`,
  });

  // Cảnh báo không đổi gì ở bảng nhóm, nên không có transaction chung để gắn vào: ghi
  // sau khi đã gửi xong, đúng thứ tự việc đã xảy ra.
  await recordAdminAction({
    actorId: adminId,
    action: AdminAction.GROUP_WARNED,
    targetId: groupId,
    targetLabel: group.name,
    changes: { recipients: { from: null, to: group.members.length } },
    note: message,
  });

  return { recipients: group.members.length };
}

export async function blockGroup(
  groupId: number,
  adminId: number,
  reason: string,
): Promise<AdminGroupDetail> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, blockedAt: true, members: { select: { userId: true } } },
  });
  if (!group) throw new NotFoundError('Không tìm thấy nhóm');
  if (group.blockedAt) throw new BadRequestError('Nhóm này đã bị chặn từ trước');

  await prisma.$transaction(async (tx) => {
    await tx.group.update({
      where: { id: groupId },
      data: { blockedAt: new Date(), blockedReason: reason, blockedById: adminId },
    });
    await recordAdminAction(
      { actorId: adminId, action: AdminAction.GROUP_BLOCKED, targetId: groupId, targetLabel: group.name, note: reason },
      tx,
    );
  });

  // Báo cho thành viên ngay thay vì để họ tự phát hiện lúc mở nhóm: người đang soạn
  // dở bài cần biết vì sao nhóm im lặng.
  await notifyMembers(group.members, {
    type: NotificationType.GROUP_BLOCKED,
    title: `Nhóm "${group.name}" đã bị chặn`,
    body: `Lý do: ${reason}`,
    link: `/groups/${groupId}`,
    dedupeKey: `${NotificationType.GROUP_BLOCKED}:${groupId}:${Date.now()}`,
  });

  return getGroupDetail(groupId);
}

export async function unblockGroup(groupId: number, adminId: number): Promise<AdminGroupDetail> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, blockedAt: true, blockedReason: true, members: { select: { userId: true } } },
  });
  if (!group) throw new NotFoundError('Không tìm thấy nhóm');
  if (!group.blockedAt) throw new BadRequestError('Nhóm này không bị chặn');

  // Xoá sạch cả lý do và người chặn: để lại thì lần chặn sau sẽ hiện lý do cũ nếu
  // có chỗ nào quên kiểm tra `blockedAt`.
  await prisma.$transaction(async (tx) => {
    await tx.group.update({
      where: { id: groupId },
      data: { blockedAt: null, blockedReason: null, blockedById: null },
    });
    await recordAdminAction(
      {
        actorId: adminId,
        action: AdminAction.GROUP_UNBLOCKED,
        targetId: groupId,
        targetLabel: group.name,
        // Lý do chặn cũ bị xoá khỏi bảng nhóm ngay dưới đây — nhật ký là nơi duy nhất còn giữ nó.
        changes: { blockedReason: { from: group.blockedReason, to: null } },
      },
      tx,
    );
  });

  await notifyMembers(group.members, {
    type: NotificationType.GROUP_UNBLOCKED,
    title: `Nhóm "${group.name}" đã hoạt động trở lại`,
    body: 'Quản trị viên đã gỡ chặn. Cả nhóm tiếp tục trao đổi bình thường.',
    link: `/groups/${groupId}`,
    dedupeKey: `${NotificationType.GROUP_UNBLOCKED}:${groupId}:${Date.now()}`,
  });

  return getGroupDetail(groupId);
}

async function notifyMembers(
  members: { userId: number }[],
  input: { type: NotificationType; title: string; body: string; link: string; dedupeKey: string },
): Promise<void> {
  for (const member of members) {
    await createNotification({ userId: member.userId, ...input });
  }
}

// ---------------------------------------------------------------------------
// Trợ giúp
// ---------------------------------------------------------------------------

function toRow(
  group: Prisma.GroupGetPayload<{ include: typeof GROUP_INCLUDE }>,
): Omit<AdminGroupRow, 'leaders' | 'pendingCount' | 'lastPostAt'> {
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    visibility: group.visibility,
    requireApproval: group.requireApproval,
    memberCount: group._count.members,
    postCount: group._count.posts,
    createdAt: group.createdAt.toISOString(),
    block: toBlockInfo(group),
  };
}

/**
 * Trưởng nhóm hiện tại của từng nhóm, lấy một lần cho cả trang.
 *
 * Hỏi gộp thay vì hỏi từng nhóm: bảng 20 dòng sẽ thành 20 truy vấn nếu hỏi lẻ.
 */
async function leadersByGroup(
  groupIds: number[],
): Promise<Map<number, { id: number; name: string; username: string }[]>> {
  if (groupIds.length === 0) return new Map();

  const rows = await prisma.groupMember.findMany({
    where: { groupId: { in: groupIds }, role: GroupMemberRole.LEADER },
    orderBy: { joinedAt: 'asc' },
    select: { groupId: true, user: { select: { id: true, name: true, username: true } } },
  });

  const result = new Map<number, { id: number; name: string; username: string }[]>();
  for (const row of rows) {
    const list = result.get(row.groupId) ?? [];
    list.push(row.user);
    result.set(row.groupId, list);
  }
  return result;
}

/** Đếm gộp cho cả trang thay vì hỏi từng nhóm. */
async function countBy(kind: 'pending', groupIds: number[]): Promise<Map<number, number>> {
  if (groupIds.length === 0) return new Map();

  const rows = await prisma.groupJoinRequest.groupBy({
    by: ['groupId'],
    where: { groupId: { in: groupIds }, status: 'PENDING' },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.groupId, r._count._all]));
}

/** Thời điểm bài mới nhất của từng nhóm — cho biết nhóm còn sống hay đã bỏ hoang. */
async function lastPostByGroup(groupIds: number[]): Promise<Map<number, string>> {
  if (groupIds.length === 0) return new Map();

  const rows = await prisma.post.groupBy({
    by: ['groupId'],
    where: { groupId: { in: groupIds } },
    _max: { createdAt: true },
  });

  const result = new Map<number, string>();
  for (const row of rows) {
    if (row.groupId !== null && row._max.createdAt) {
      result.set(row.groupId, row._max.createdAt.toISOString());
    }
  }
  return result;
}
