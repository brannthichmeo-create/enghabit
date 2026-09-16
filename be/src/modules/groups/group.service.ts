import {
  GROUP_CODE_LENGTH,
  GroupJoinStatus,
  GroupMemberRole,
  GroupViewerState,
  GroupVisibility,
  NotificationType,
  isImageMime,
  type AddMemberInput,
  type CreateGroupInput,
  type GroupBlockInfo,
  type GroupDetail,
  type GroupDocumentQueryInput,
  type GroupDocumentRow,
  type GroupJoinRequestRow,
  type GroupMemberRow,
  type GroupSearchInput,
  type GroupStudySetRow,
  type GroupSummary,
  type JoinGroupResult,
  type MentionTarget,
  type Paginated,
  type ShareStudySetInput,
  type UpdateGroupInput,
} from '@enghabit/shared';
import type { Group, Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/app-error.js';
import { isUniqueViolation } from '../../common/utils/prisma-error.js';
import { createNotification } from '../notifications/notification.service.js';

/**
 * Nhóm lớp — không gian trao đổi nội bộ do người học tự lập.
 *
 * Hai quy tắc xuyên suốt module này:
 *
 * 1. **Nhóm luôn còn ít nhất một trưởng nhóm.** Mọi thao tác có thể làm mất trưởng
 *    nhóm cuối cùng (hạ quyền, rời nhóm, bị xoá khỏi nhóm) đều bị chặn. Mất hết
 *    trưởng nhóm thì không ai duyệt được yêu cầu vào nhóm nữa và nhóm thành xác chết.
 *
 * 2. **Nội dung nhóm chỉ dành cho thành viên.** Kiểm tra tư cách thành viên nằm ở
 *    `assertMember`, và bài đăng của nhóm bị loại khỏi diễn đàn chung bằng bộ lọc
 *    `groupId: null` bên community.service.
 */

// ---------------------------------------------------------------------------
// Mã nhóm
// ---------------------------------------------------------------------------

/**
 * Số lần thử sinh mã trước khi bỏ cuộc.
 *
 * Mã có 90 triệu tổ hợp nên đụng nhau gần như không xảy ra ở quy mô này; 5 lần thử
 * là để phòng trường hợp cực hiếm chứ không phải vòng lặp chờ. Hết 5 lần mà vẫn đụng
 * thì có gì đó sai hẳn (vd nguồn ngẫu nhiên hỏng) và ném lỗi là đúng.
 */
const CODE_ATTEMPTS = 5;

/**
 * Sinh mã 8 chữ số ngẫu nhiên, đảm bảo chưa ai dùng.
 *
 * Dùng `randomInt` của node:crypto chứ không phải `Math.random`: mã là thứ duy nhất
 * bảo vệ nhóm riêng tư, mà `Math.random` đoán trước được khi biết vài giá trị trước đó.
 */
async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = String(randomInt(0, 10 ** GROUP_CODE_LENGTH)).padStart(GROUP_CODE_LENGTH, '0');
    const taken = await prisma.group.count({ where: { code } });
    if (taken === 0) return code;
    logger.warn({ code }, 'Mã nhóm sinh ra bị trùng, thử lại');
  }
  throw new Error('Không sinh được mã nhóm sau nhiều lần thử');
}

// ---------------------------------------------------------------------------
// Quyền
// ---------------------------------------------------------------------------

/** Nhóm đang bị chặn thì mọi thao tác thay đổi đều dừng lại, kèm đúng lý do đã ghi. */
async function assertNotBlocked(groupId: number): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { blockedAt: true, blockedReason: true },
  });
  if (group?.blockedAt) {
    throw new ForbiddenError(`Nhóm đang bị chặn: ${group.blockedReason ?? 'không rõ lý do'}`);
  }
}

async function getMembership(groupId: number, userId: number) {
  return prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
}

/** Ném lỗi nếu người dùng không phải thành viên nhóm. */
async function assertMember(groupId: number, userId: number) {
  const membership = await getMembership(groupId, userId);
  if (!membership) throw new ForbiddenError('Bạn không phải thành viên của nhóm này');
  return membership;
}

/** Ném lỗi nếu người dùng không phải trưởng nhóm. */
async function assertLeader(groupId: number, userId: number) {
  const membership = await getMembership(groupId, userId);
  if (membership?.role !== GroupMemberRole.LEADER) {
    throw new ForbiddenError('Chỉ trưởng nhóm mới làm được việc này');
  }
  return membership;
}

/** Chặn thao tác làm nhóm mất trưởng nhóm cuối cùng. */
async function assertNotLastLeader(groupId: number, userId: number): Promise<void> {
  const otherLeaders = await prisma.groupMember.count({
    where: { groupId, role: GroupMemberRole.LEADER, userId: { not: userId } },
  });
  if (otherLeaders === 0) {
    throw new BadRequestError(
      'Đây là trưởng nhóm duy nhất — hãy phong cho người khác làm trưởng nhóm trước',
    );
  }
}

/**
 * Dùng cho community.service: người này có đọc/ghi được nội dung nhóm không.
 *
 * Nhóm bị chặn trả về false với TẤT CẢ mọi người, kể cả trưởng nhóm — chặn mà nội
 * dung vẫn đọc và đăng được thì không phải là chặn.
 */
export async function isMember(groupId: number, userId: number): Promise<boolean> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { blockedAt: true },
  });
  if (!group || group.blockedAt !== null) return false;

  return (await getMembership(groupId, userId)) !== null;
}

// ---------------------------------------------------------------------------
// Tạo, sửa, xoá nhóm
// ---------------------------------------------------------------------------

export async function createGroup(userId: number, input: CreateGroupInput): Promise<GroupSummary> {
  const code = await generateUniqueCode();

  // Tạo nhóm và gắn người tạo làm trưởng nhóm trong CÙNG một transaction: nhóm không
  // có trưởng nhóm là nhóm không ai điều hành được.
  const group = await prisma.group.create({
    data: {
      code,
      name: input.name,
      description: input.description ?? null,
      visibility: input.visibility,
      requireApproval: input.requireApproval,
      createdById: userId,
      members: { create: { userId, role: GroupMemberRole.LEADER } },
    },
  });

  return toSummary(group, { memberCount: 1, postCount: 0, viewerState: GroupViewerState.LEADER });
}

export async function updateGroup(
  groupId: number,
  userId: number,
  input: UpdateGroupInput,
): Promise<GroupSummary> {
  await assertLeader(groupId, userId);
  await assertNotBlocked(groupId);
  await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.requireApproval !== undefined ? { requireApproval: input.requireApproval } : {}),
    },
  });
  return getGroupSummary(groupId, userId);
}

export async function deleteGroup(groupId: number, userId: number): Promise<void> {
  await assertLeader(groupId, userId);
  // Xoá nhóm kéo theo thành viên, yêu cầu và bài đăng của nhóm (onDelete: Cascade).
  await prisma.group.delete({ where: { id: groupId } });
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

/** Nhóm của tôi — cả nhóm mình làm trưởng lẫn nhóm mình là thành viên. */
export async function listMyGroups(userId: number): Promise<GroupSummary[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    include: {
      group: {
        include: {
          _count: { select: { members: true, posts: true } },
        },
      },
    },
  });

  const leaderGroupIds = memberships
    .filter((m) => m.role === GroupMemberRole.LEADER)
    .map((m) => m.groupId);
  const pendingByGroup = await countPendingByGroup(leaderGroupIds);

  return memberships.map((m) =>
    toSummary(m.group, {
      memberCount: m.group._count.members,
      postCount: m.group._count.posts,
      viewerState:
        m.role === GroupMemberRole.LEADER ? GroupViewerState.LEADER : GroupViewerState.MEMBER,
      pendingCount: pendingByGroup.get(m.groupId) ?? 0,
    }),
  );
}

/**
 * Tìm nhóm CÔNG KHAI theo tên.
 *
 * Nhóm riêng tư không bao giờ xuất hiện ở đây, kể cả khi gõ đúng tên — muốn vào thì
 * phải có mã 8 số. Đó chính là ý nghĩa của "riêng tư".
 */
export async function searchPublicGroups(
  userId: number,
  query: GroupSearchInput,
): Promise<Paginated<GroupSummary>> {
  const where: Prisma.GroupWhereInput = {
    visibility: GroupVisibility.PUBLIC,
    // Nhóm đang bị chặn biến mất khỏi tìm kiếm: không ai nên xin vào một nhóm đã bị
    // đóng băng, và để nó trong danh sách chỉ tạo thêm yêu cầu không ai duyệt được.
    blockedAt: null,
    ...(query.search
      ? {
          OR: [{ name: { contains: query.search } }, { description: { contains: query.search } }],
        }
      : {}),
  };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      orderBy: { members: { _count: 'desc' } },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { members: true, posts: true } } },
    }),
    prisma.group.count({ where }),
  ]);

  const states = await loadViewerStates(
    userId,
    groups.map((g) => g.id),
  );

  return {
    items: groups.map((g) =>
      toSummary(g, {
        memberCount: g._count.members,
        postCount: g._count.posts,
        viewerState: states.get(g.id) ?? GroupViewerState.NONE,
      }),
    ),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Tra nhóm bằng mã 8 số — cách duy nhất tìm ra nhóm riêng tư. */
export async function findByCode(userId: number, code: string): Promise<GroupSummary> {
  const group = await prisma.group.findUnique({
    where: { code },
    include: { _count: { select: { members: true, posts: true } } },
  });
  if (!group) throw new NotFoundError('Không tìm thấy nhóm nào có mã này');

  const states = await loadViewerStates(userId, [group.id]);
  return toSummary(group, {
    memberCount: group._count.members,
    postCount: group._count.posts,
    viewerState: states.get(group.id) ?? GroupViewerState.NONE,
  });
}

/**
 * Chi tiết nhóm. Chỉ thành viên xem được — người ngoài chỉ thấy phần tóm tắt qua
 * tìm kiếm hoặc tra mã, không thấy danh sách thành viên hay bài đăng.
 */
export async function getGroupDetail(groupId: number, userId: number): Promise<GroupDetail> {
  const membership = await assertMember(groupId, userId);
  const isLeader = membership.role === GroupMemberRole.LEADER;

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: { _count: { select: { members: true, posts: true } }, blockedBy: { select: { name: true } } },
  });

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    // Trưởng nhóm lên đầu, rồi tới người vào sớm nhất
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
  });

  const pendingRequests = isLeader ? await listPendingRequests(groupId) : [];

  return {
    ...toSummary(group, {
      memberCount: group._count.members,
      postCount: group._count.posts,
      viewerState: isLeader ? GroupViewerState.LEADER : GroupViewerState.MEMBER,
      pendingCount: pendingRequests.length,
    }),
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      activityCount: m.user._count.activityLogs,
      currentStreak: m.user.streak?.currentStreak ?? 0,
    })),
    pendingRequests,
  };
}

async function getGroupSummary(groupId: number, userId: number): Promise<GroupSummary> {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: { _count: { select: { members: true, posts: true } } },
  });
  const states = await loadViewerStates(userId, [groupId]);
  const pending = await countPendingByGroup([groupId]);

  return toSummary(group, {
    memberCount: group._count.members,
    postCount: group._count.posts,
    viewerState: states.get(groupId) ?? GroupViewerState.NONE,
    pendingCount: pending.get(groupId) ?? 0,
  });
}

// ---------------------------------------------------------------------------
// Tham gia nhóm
// ---------------------------------------------------------------------------

/**
 * Xin vào nhóm.
 *
 * Nhóm tắt phê duyệt thì vào thẳng; bật thì tạo yêu cầu và báo cho mọi trưởng nhóm.
 * Người đã bị từ chối trước đó vẫn xin lại được — dòng cũ được cập nhật về PENDING
 * chứ không tạo thêm dòng mới.
 */
export async function requestJoin(
  groupId: number,
  userId: number,
  message?: string,
): Promise<JoinGroupResult> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Không tìm thấy nhóm');
  if (group.blockedAt) throw new ForbiddenError('Nhóm này đang bị chặn, tạm thời không nhận thành viên mới');

  const existing = await getMembership(groupId, userId);
  if (existing) {
    return {
      state:
        existing.role === GroupMemberRole.LEADER ? GroupViewerState.LEADER : GroupViewerState.MEMBER,
      joined: true,
    };
  }

  if (!group.requireApproval) {
    await addMemberRecord(groupId, userId);
    return { state: GroupViewerState.MEMBER, joined: true };
  }

  await prisma.groupJoinRequest.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId, message: message ?? null },
    update: {
      status: GroupJoinStatus.PENDING,
      message: message ?? null,
      decidedById: null,
      decidedAt: null,
    },
  });

  await notifyLeaders(group, userId);
  return { state: GroupViewerState.PENDING, joined: false };
}

/** Báo cho mọi trưởng nhóm rằng có người đang chờ duyệt. */
async function notifyLeaders(group: Group, applicantId: number): Promise<void> {
  const [leaders, applicant] = await Promise.all([
    prisma.groupMember.findMany({
      where: { groupId: group.id, role: GroupMemberRole.LEADER },
      select: { userId: true },
    }),
    prisma.user.findUnique({ where: { id: applicantId }, select: { name: true } }),
  ]);

  for (const leader of leaders) {
    await createNotification({
      userId: leader.userId,
      type: NotificationType.GROUP_JOIN_REQUEST,
      title: 'Có người xin vào nhóm',
      body: `${applicant?.name ?? 'Một người dùng'} muốn tham gia nhóm "${group.name}".`,
      link: `/groups/${group.id}`,
      // Gắn cả id người xin: hai người khác nhau xin vào cùng một nhóm là hai thông
      // báo khác nhau, gộp lại thì trưởng nhóm chỉ thấy người đầu tiên.
      dedupeKey: `${NotificationType.GROUP_JOIN_REQUEST}:${group.id}:${applicantId}:${Date.now()}`,
    });
  }
}

export async function decideRequest(
  groupId: number,
  targetUserId: number,
  leaderId: number,
  approve: boolean,
): Promise<void> {
  await assertLeader(groupId, leaderId);

  const request = await prisma.groupJoinRequest.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    include: { group: { select: { name: true } } },
  });
  if (!request || request.status !== GroupJoinStatus.PENDING) {
    throw new NotFoundError('Yêu cầu không tồn tại hoặc đã được xử lý');
  }

  await prisma.groupJoinRequest.update({
    where: { id: request.id },
    data: {
      status: approve ? GroupJoinStatus.APPROVED : GroupJoinStatus.REJECTED,
      decidedById: leaderId,
      decidedAt: new Date(),
    },
  });

  if (approve) await addMemberRecord(groupId, targetUserId);

  await createNotification({
    userId: targetUserId,
    type: approve ? NotificationType.GROUP_JOIN_APPROVED : NotificationType.GROUP_JOIN_REJECTED,
    title: approve ? 'Yêu cầu vào nhóm được duyệt' : 'Yêu cầu vào nhóm bị từ chối',
    body: approve
      ? `Bạn đã là thành viên nhóm "${request.group.name}".`
      : `Yêu cầu tham gia nhóm "${request.group.name}" chưa được chấp nhận.`,
    // Chỉ dẫn tới nhóm khi đã vào được; bị từ chối mà bấm vào lại gặp trang báo lỗi
    // không phải thành viên.
    link: approve ? `/groups/${groupId}` : '/groups',
    dedupeKey: `GROUP_DECISION:${groupId}:${targetUserId}:${Date.now()}`,
  });
}

/** Trưởng nhóm thêm thẳng một người, bỏ qua bước xin vào. */
export async function addMember(
  groupId: number,
  leaderId: number,
  input: AddMemberInput,
): Promise<GroupMemberRow> {
  await assertLeader(groupId, leaderId);

  const identifier = input.identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
    select: {
      id: true,
      name: true,
      username: true,
      streak: { select: { currentStreak: true } },
      _count: { select: { activityLogs: true } },
    },
  });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng với tên tài khoản hoặc email này');

  const existing = await getMembership(groupId, user.id);
  if (existing) throw new BadRequestError('Người này đã ở trong nhóm');

  const member = await addMemberRecord(groupId, user.id);
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: { name: true },
  });

  await createNotification({
    userId: user.id,
    type: NotificationType.GROUP_JOIN_APPROVED,
    title: 'Bạn được thêm vào một nhóm',
    body: `Bạn vừa được thêm vào nhóm "${group.name}".`,
    link: `/groups/${groupId}`,
    dedupeKey: `GROUP_ADDED:${groupId}:${user.id}:${Date.now()}`,
  });

  return {
    userId: user.id,
    name: user.name,
    username: user.username,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    activityCount: user._count.activityLogs,
    currentStreak: user.streak?.currentStreak ?? 0,
  };
}

/**
 * Ghi bản ghi thành viên và dọn yêu cầu đang chờ của chính người đó.
 *
 * `skipDuplicates` chứ không kiểm tra trước: hai trưởng nhóm bấm duyệt cùng lúc thì
 * kiểm tra đọc-rồi-ghi vẫn lọt, còn ràng buộc unique thì không.
 */
async function addMemberRecord(groupId: number, userId: number) {
  await prisma.groupMember.createMany({
    data: [{ groupId, userId, role: GroupMemberRole.MEMBER }],
    skipDuplicates: true,
  });
  await prisma.groupJoinRequest.updateMany({
    where: { groupId, userId, status: GroupJoinStatus.PENDING },
    data: { status: GroupJoinStatus.APPROVED, decidedAt: new Date() },
  });
  return prisma.groupMember.findUniqueOrThrow({ where: { groupId_userId: { groupId, userId } } });
}

// ---------------------------------------------------------------------------
// Thành viên
// ---------------------------------------------------------------------------

export async function updateMemberRole(
  groupId: number,
  targetUserId: number,
  leaderId: number,
  role: GroupMemberRole,
): Promise<void> {
  await assertLeader(groupId, leaderId);
  const target = await getMembership(groupId, targetUserId);
  if (!target) throw new NotFoundError('Người này không ở trong nhóm');

  // Hạ quyền chính mình hoặc hạ quyền trưởng nhóm cuối cùng đều làm nhóm mất người điều hành.
  if (target.role === GroupMemberRole.LEADER && role === GroupMemberRole.MEMBER) {
    await assertNotLastLeader(groupId, targetUserId);
  }

  await prisma.groupMember.update({ where: { id: target.id }, data: { role } });
}

export async function removeMember(
  groupId: number,
  targetUserId: number,
  leaderId: number,
): Promise<void> {
  await assertLeader(groupId, leaderId);
  const target = await getMembership(groupId, targetUserId);
  if (!target) throw new NotFoundError('Người này không ở trong nhóm');
  if (target.role === GroupMemberRole.LEADER) await assertNotLastLeader(groupId, targetUserId);

  await prisma.groupMember.delete({ where: { id: target.id } });
  // Xoá luôn yêu cầu cũ để người đó xin vào lại được từ đầu.
  await prisma.groupJoinRequest.deleteMany({ where: { groupId, userId: targetUserId } });
}

export async function leaveGroup(groupId: number, userId: number): Promise<void> {
  const membership = await assertMember(groupId, userId);
  if (membership.role === GroupMemberRole.LEADER) await assertNotLastLeader(groupId, userId);

  await prisma.groupMember.delete({ where: { id: membership.id } });
  await prisma.groupJoinRequest.deleteMany({ where: { groupId, userId } });
}

// ---------------------------------------------------------------------------
// Đề cập (@mention)
// ---------------------------------------------------------------------------

/**
 * Những người có thể được nhắc trong nhóm — chính là danh sách thành viên.
 *
 * Dùng cho CẢ ô gợi ý khi gõ `@` lẫn việc chấm lại lúc gửi thông báo (xem
 * `community/mention.service.ts`). Một nguồn duy nhất nên không thể có chuyện ô gợi ý
 * mời một người mà hệ thống lại không gửi thông báo cho họ.
 */
export async function listMentionTargets(
  groupId: number,
  userId: number,
): Promise<MentionTarget[]> {
  await assertActiveMember(groupId, userId);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    select: { user: { select: { id: true, name: true, username: true } } },
  });

  return members.map((m) => ({ userId: m.user.id, name: m.user.name, username: m.user.username }));
}

// ---------------------------------------------------------------------------
// Tài liệu nhóm
// ---------------------------------------------------------------------------

/**
 * Thành viên của một nhóm ĐANG HOẠT ĐỘNG.
 *
 * Khác `assertMember`: hàm này chặn cả khi nhóm bị chặn, và trả 404 thay vì 403 — cùng
 * cách với community.service, vì báo "bạn không có quyền" cũng là xác nhận nhóm tồn tại.
 * `getGroupDetail` cố ý KHÔNG dùng hàm này: thành viên phải vào được để đọc lý do chặn.
 */
async function assertActiveMember(groupId: number, userId: number): Promise<void> {
  if (!(await isMember(groupId, userId))) throw new NotFoundError('Không tìm thấy nhóm');
}

/**
 * Tài liệu chung của nhóm: mọi tệp đính kèm của bài đăng trong nhóm, bài mới nhất lên đầu.
 *
 * KHÔNG `select` cột `data` — đó là BLOB, kéo theo một trang danh sách là kéo về hàng
 * chục MB không ai dùng tới. Tải tệp vẫn đi qua `/community/attachments/:id`, nơi đã
 * kiểm tra tư cách thành viên sẵn.
 */
export async function listDocuments(
  groupId: number,
  userId: number,
  query: GroupDocumentQueryInput,
): Promise<Paginated<GroupDocumentRow>> {
  await assertActiveMember(groupId, userId);

  const where: Prisma.PostAttachmentWhereInput = {
    post: { groupId },
    ...(query.search ? { fileName: { contains: query.search } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.postAttachment.findMany({
      where,
      // Khoá phụ `id` là bắt buộc cho phân trang: nhiều tệp của cùng một bài có chung
      // `created_at` tới từng mili giây, không có khoá phụ thì thứ tự giữa chúng là tuỳ
      // ý và một tệp có thể hiện ở cả hai trang — hoặc biến mất khỏi cả hai.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        post: { select: { id: true, title: true, author: { select: { name: true } } } },
      },
    }),
    prisma.postAttachment.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      isImage: isImageMime(row.mimeType),
      createdAt: row.createdAt.toISOString(),
      postId: row.post.id,
      postTitle: row.post.title,
      uploaderName: row.post.author.name,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

// ---------------------------------------------------------------------------
// Bộ thẻ chia sẻ trong nhóm
// ---------------------------------------------------------------------------

/**
 * Bộ thẻ đang được chia sẻ trong nhóm.
 *
 * Bộ bị quản trị viên chặn bị loại ngay trong câu truy vấn, đúng như `readableSetWhere`
 * bên library.access — nếu không, danh sách vẫn mời người học mở một bộ mà họ sẽ nhận 404.
 */
export async function listStudySets(groupId: number, userId: number): Promise<GroupStudySetRow[]> {
  await assertActiveMember(groupId, userId);

  const shares = await prisma.groupStudySet.findMany({
    where: { groupId, topic: { blockedAt: null } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      createdAt: true,
      sharedBy: { select: { name: true } },
      topic: {
        select: {
          id: true,
          name: true,
          description: true,
          level: true,
          visibility: true,
          ownerId: true,
          _count: { select: { vocabularies: true } },
        },
      },
    },
  });

  return shares.map((share) => ({
    setId: share.topic.id,
    name: share.topic.name,
    description: share.topic.description,
    level: share.topic.level,
    cardCount: share.topic._count.vocabularies,
    visibility: share.topic.visibility,
    sharedByName: share.sharedBy?.name ?? null,
    sharedAt: share.createdAt.toISOString(),
    isOwner: share.topic.ownerId === userId,
  }));
}

/**
 * Trưởng nhóm chia sẻ một bộ thẻ CỦA CHÍNH MÌNH vào nhóm.
 *
 * Chỉ bộ do người bấm sở hữu: chia sẻ bộ của người khác là tự ý mở bộ riêng tư của họ
 * cho cả nhóm. Bộ "Hệ thống" cũng không chia sẻ được — nó đã công khai với tất cả mọi
 * người rồi, thêm vào nhóm chỉ là một lối đi thừa.
 */
export async function shareStudySet(
  groupId: number,
  leaderId: number,
  input: ShareStudySetInput,
): Promise<GroupStudySetRow[]> {
  await assertLeader(groupId, leaderId);
  await assertNotBlocked(groupId);

  const set = await prisma.topic.findFirst({
    where: { id: input.setId, ownerId: leaderId },
    select: { id: true, name: true, blockedAt: true },
  });
  if (!set) throw new NotFoundError('Không tìm thấy bộ thẻ của bạn');
  if (set.blockedAt) throw new BadRequestError('Bộ thẻ đang bị chặn nên không chia sẻ được');

  try {
    await prisma.groupStudySet.create({
      data: { groupId, topicId: set.id, sharedById: leaderId },
    });
  } catch (error: unknown) {
    // Ràng buộc unique là thứ chặn được hai trưởng nhóm bấm cùng lúc — kiểm tra
    // đọc-rồi-ghi thì cả hai request đều thấy "chưa có".
    if (!isUniqueViolation(error)) throw error;
    throw new ConflictError('Bộ thẻ này đã có trong nhóm');
  }

  await notifyStudySetShared(groupId, leaderId, set.id, set.name);
  return listStudySets(groupId, leaderId);
}

/** Báo cho mọi thành viên (trừ người chia sẻ) rằng nhóm có bộ thẻ mới. */
async function notifyStudySetShared(
  groupId: number,
  sharedById: number,
  setId: number,
  setName: string,
): Promise<void> {
  const [group, members, sharer] = await Promise.all([
    prisma.group.findUniqueOrThrow({ where: { id: groupId }, select: { name: true } }),
    prisma.groupMember.findMany({
      where: { groupId, userId: { not: sharedById } },
      select: { userId: true },
    }),
    prisma.user.findUnique({ where: { id: sharedById }, select: { name: true } }),
  ]);

  for (const member of members) {
    await createNotification({
      userId: member.userId,
      type: NotificationType.GROUP_STUDY_SET_SHARED,
      title: 'Nhóm có bộ thẻ mới',
      body: `${sharer?.name ?? 'Trưởng nhóm'} vừa chia sẻ bộ thẻ "${setName}" vào nhóm "${group.name}".`,
      link: `/library/${setId}`,
      // Gắn id bộ thẻ: chia sẻ hai bộ khác nhau vào cùng một nhóm là hai thông báo
      // khác nhau. Không gắn thời gian vì gỡ rồi chia sẻ lại cùng một bộ thì người
      // nhận không cần biết thêm lần nữa.
      dedupeKey: `${NotificationType.GROUP_STUDY_SET_SHARED}:${groupId}:${setId}`,
    });
  }
}

/**
 * Gỡ một bộ thẻ khỏi nhóm.
 *
 * Mọi trưởng nhóm gỡ được, không riêng người đã chia sẻ: người chia sẻ có thể đã rời
 * nhóm, mà nhóm thì vẫn phải dọn được nội dung của mình. Tiến độ SRS của thành viên
 * giữ nguyên — chia sẻ lại là học tiếp được.
 */
export async function unshareStudySet(
  groupId: number,
  setId: number,
  leaderId: number,
): Promise<void> {
  await assertLeader(groupId, leaderId);
  await assertNotBlocked(groupId);

  const share = await prisma.groupStudySet.findUnique({
    where: { groupId_topicId: { groupId, topicId: setId } },
    select: { id: true },
  });
  if (!share) throw new NotFoundError('Bộ thẻ này không có trong nhóm');

  await prisma.groupStudySet.delete({ where: { id: share.id } });
}

// ---------------------------------------------------------------------------
// Trợ giúp
// ---------------------------------------------------------------------------

async function listPendingRequests(groupId: number): Promise<GroupJoinRequestRow[]> {
  const requests = await prisma.groupJoinRequest.findMany({
    where: { groupId, status: GroupJoinStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, username: true } } },
  });

  return requests.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    username: r.user.username,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

async function countPendingByGroup(groupIds: number[]): Promise<Map<number, number>> {
  if (groupIds.length === 0) return new Map();

  const rows = await prisma.groupJoinRequest.groupBy({
    by: ['groupId'],
    where: { groupId: { in: groupIds }, status: GroupJoinStatus.PENDING },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.groupId, r._count._all]));
}

/**
 * Quan hệ của người xem với từng nhóm, lấy một lần cho cả danh sách.
 *
 * Gộp một truy vấn cho cả trang thay vì hỏi từng nhóm: danh sách 12 nhóm sẽ thành
 * 24 truy vấn nếu hỏi lẻ.
 */
async function loadViewerStates(
  userId: number,
  groupIds: number[],
): Promise<Map<number, GroupViewerState>> {
  if (groupIds.length === 0) return new Map();

  const [memberships, requests] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId, groupId: { in: groupIds } },
      select: { groupId: true, role: true },
    }),
    prisma.groupJoinRequest.findMany({
      where: { userId, groupId: { in: groupIds }, status: GroupJoinStatus.PENDING },
      select: { groupId: true },
    }),
  ]);

  const states = new Map<number, GroupViewerState>();
  for (const r of requests) states.set(r.groupId, GroupViewerState.PENDING);
  // Thành viên đè lên trạng thái chờ: đã vào rồi thì yêu cầu cũ không còn ý nghĩa.
  for (const m of memberships) {
    states.set(
      m.groupId,
      m.role === GroupMemberRole.LEADER ? GroupViewerState.LEADER : GroupViewerState.MEMBER,
    );
  }
  return states;
}

/** Thông tin chặn kèm tên người chặn, nếu truy vấn có include `blockedBy`. */
export function toBlockInfo(
  group: Group & { blockedBy?: { name: string } | null },
): GroupBlockInfo | null {
  if (!group.blockedAt || !group.blockedReason) return null;
  return {
    reason: group.blockedReason,
    blockedAt: group.blockedAt.toISOString(),
    blockedBy: group.blockedBy?.name ?? null,
  };
}

function toSummary(
  group: Group & { blockedBy?: { name: string } | null },
  extra: {
    memberCount: number;
    postCount: number;
    viewerState: GroupViewerState;
    pendingCount?: number;
  },
): GroupSummary {
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    visibility: group.visibility,
    requireApproval: group.requireApproval,
    memberCount: extra.memberCount,
    postCount: extra.postCount,
    createdAt: group.createdAt.toISOString(),
    viewerState: extra.viewerState,
    pendingCount: extra.pendingCount ?? 0,
    block: toBlockInfo(group),
  };
}
