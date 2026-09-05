import {
  NotificationType,
  PasswordResetOutcome,
  PasswordResetStatus,
  UserRole,
  UserStatus,
  type Paginated,
  type PasswordResetConfirmInput,
  type PasswordResetRequestInput,
  type PasswordResetState,
  type RejectResetRequestInput,
  type ResetRequestQueryInput,
  type ResetRequestRow,
} from '@enghabit/shared';
import { Prisma, type PasswordResetRequest, type User } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app-error.js';
import { createNotification } from '../notifications/notification.service.js';
import { findByIdentifier, hashPassword } from './auth.service.js';

/**
 * Quên mật khẩu có quản trị viên duyệt tay.
 *
 * TÀI LIỆU LUỒNG: `docs/luong-quen-mat-khau.md` — đọc trước khi sửa. File đó tách rõ
 * đâu là quy tắc nghiệp vụ (thay được) và đâu là đánh đổi an toàn (đổi thì phải biết
 * mình đang đánh đổi cái gì).
 *
 * Service này giữ TOÀN BỘ logic của luồng, cả phần người dùng lẫn phần quản trị viên.
 * Router của `auth` và của `admin` đều gọi vào đây thay vì mỗi bên tự viết một nửa —
 * chia đôi thì hai nửa sẽ hiểu khác nhau về việc "yêu cầu nào còn hiệu lực".
 *
 * ĐIỂM YẾU CỐ HỮU CỦA THIẾT KẾ NÀY, ghi lại để người sau không tưởng là đã an toàn:
 * lượt duyệt gắn với TÀI KHOẢN chứ không gắn với người đã chứng minh được danh tính.
 * Sau khi quản trị viên duyệt, bất kỳ ai biết tên tài khoản đó đều đặt được mật khẩu
 * mới. Không có liên kết gửi qua email, không có mã xác thực. Vì vậy quản trị viên
 * phải xác minh danh tính NGOÀI hệ thống trước khi bấm duyệt — nút duyệt là toàn bộ
 * cánh cửa. `APPROVAL_TTL_DAYS` chỉ thu hẹp khoảng thời gian cánh cửa mở, không thay
 * được việc nó không có khoá.
 */

/**
 * Lượt duyệt hết hiệu lực sau ngần này ngày.
 *
 * Không nằm trong yêu cầu ban đầu — thêm vào để cửa sổ đặt lại mật khẩu không mở
 * vô hạn sau khi quản trị viên duyệt. Đặt rộng (7 ngày) nên người dùng thật gần như
 * không bao giờ chạm phải. Bỏ hẳn ràng buộc này chỉ cần xoá `isUsable`.
 */
const APPROVAL_TTL_DAYS = 7;

// ---------------------------------------------------------------------------
// Phía người dùng
// ---------------------------------------------------------------------------

/**
 * Tra cứu tài khoản và trả về bước tiếp theo người dùng cần thấy; tạo yêu cầu mới
 * nếu chưa có yêu cầu nào còn hiệu lực.
 */
export async function requestReset(input: PasswordResetRequestInput): Promise<PasswordResetState> {
  const user = await requireUser(input.identifier);
  const latest = await latestRequest(user.id);

  if (latest) {
    if (latest.status === PasswordResetStatus.PENDING) return stateOf(PasswordResetOutcome.PENDING, latest);

    if (latest.status === PasswordResetStatus.APPROVED && isUsable(latest)) {
      return stateOf(PasswordResetOutcome.APPROVED, latest);
    }

    // Bị từ chối thì DỪNG LẠI ở màn báo lý do, không tự tạo yêu cầu mới. Người dùng
    // phải đọc được vì sao bị từ chối rồi mới chủ động bấm gửi lại (`retry`).
    if (latest.status === PasswordResetStatus.REJECTED && !input.retry) {
      return stateOf(PasswordResetOutcome.REJECTED, latest);
    }
  }

  return createRequest(user);
}

async function createRequest(user: User): Promise<PasswordResetState> {
  let created: PasswordResetRequest;
  try {
    created = await prisma.passwordResetRequest.create({
      // `pendingUserId` = userId trong lúc chờ. Cột này UNIQUE nên chính DB chặn
      // việc một người có hai yêu cầu chờ, không cần đọc-rồi-ghi.
      data: { userId: user.id, pendingUserId: user.id },
    });
  } catch (err) {
    // P2002 nghĩa là vừa có một yêu cầu chờ được tạo xen vào giữa (người dùng bấm
    // hai lần, hoặc hai tab). Đây không phải lỗi — kết quả đúng là "đang chờ duyệt".
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await latestRequest(user.id);
      if (existing) return stateOf(PasswordResetOutcome.PENDING, existing);
    }
    throw err;
  }

  await notifyAdmins(user, created.id);
  return stateOf(PasswordResetOutcome.CREATED, created);
}

/**
 * Báo cho MỌI quản trị viên đang hoạt động.
 *
 * Đi qua `createNotification` của module notifications chứ không tự ghi bảng — đó là
 * nơi duy nhất được sinh thông báo trong hệ thống (xem CLAUDE.md). Khoá chống trùng
 * gắn theo id yêu cầu nên cùng một yêu cầu không bao giờ báo hai lần cho một người.
 */
async function notifyAdmins(user: User, requestId: number): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: NotificationType.PASSWORD_RESET_REQUEST,
        title: 'Có yêu cầu cấp lại mật khẩu',
        body: `${user.name} (${user.username}) vừa gửi yêu cầu cấp lại mật khẩu.`,
        link: '/admin/requests',
        dedupeKey: `PASSWORD_RESET_REQUEST:${requestId}`,
      }),
    ),
  );
}

/** Đặt mật khẩu mới sau khi yêu cầu đã được duyệt. */
export async function confirmReset(input: PasswordResetConfirmInput): Promise<void> {
  const user = await requireUser(input.identifier);
  const latest = await latestRequest(user.id);

  if (!latest || latest.status !== PasswordResetStatus.APPROVED || !isUsable(latest)) {
    throw new ForbiddenError('Yêu cầu chưa được duyệt hoặc đã hết hiệu lực');
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),

    // Đánh dấu đã dùng — một lượt duyệt chỉ đổi được mật khẩu một lần. `usedAt: null`
    // trong điều kiện để hai request gửi cùng lúc không cùng tiêu một lượt duyệt.
    prisma.passwordResetRequest.updateMany({
      where: { id: latest.id, usedAt: null },
      data: { usedAt: new Date() },
    }),

    // Đổi mật khẩu thì cắt hết phiên cũ, đúng như `changePassword` đang làm. Quan
    // trọng hơn ở đây: nếu tài khoản bị chiếm, đây là lúc đá kẻ chiếm ra.
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Phía quản trị viên
// ---------------------------------------------------------------------------

export async function listRequests(
  query: ResetRequestQueryInput,
): Promise<Paginated<ResetRequestRow>> {
  // Tab "Yêu cầu": ai đợi lâu nhất lên đầu. Tab "Nhật ký": việc vừa xử lý lên đầu.
  const pending = query.tab === 'pending';
  const where = pending
    ? { status: PasswordResetStatus.PENDING }
    : { status: { in: [PasswordResetStatus.APPROVED, PasswordResetStatus.REJECTED] } };
  const orderBy = pending
    ? ({ createdAt: 'asc' } as const)
    : ({ reviewedAt: 'desc' } as const);

  const [items, total] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        reviewedBy: { select: { id: true, name: true, username: true } },
      },
    }),
    prisma.passwordResetRequest.count({ where }),
  ]);

  return {
    items: items.map(toRow),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function approveRequest(id: number, adminId: number): Promise<void> {
  await resolveRequest(id, adminId, PasswordResetStatus.APPROVED, null);
}

export async function rejectRequest(
  id: number,
  adminId: number,
  input: RejectResetRequestInput,
): Promise<void> {
  await resolveRequest(id, adminId, PasswordResetStatus.REJECTED, input.reason);
}

/**
 * Chuyển một yêu cầu từ PENDING sang trạng thái cuối.
 *
 * Dùng `updateMany` kèm điều kiện `status: PENDING` thay vì đọc rồi ghi: hai quản
 * trị viên bấm cùng lúc thì chỉ một lệnh đổi được dòng, lệnh còn lại thấy `count = 0`
 * và nhận lỗi rõ ràng — thay vì cả hai cùng ghi đè và nhật ký ghi nhầm người.
 */
async function resolveRequest(
  id: number,
  adminId: number,
  status: PasswordResetStatus,
  rejectReason: string | null,
): Promise<void> {
  const { count } = await prisma.passwordResetRequest.updateMany({
    where: { id, status: PasswordResetStatus.PENDING },
    data: {
      status,
      rejectReason,
      reviewedById: adminId,
      reviewedAt: new Date(),
      // Trả cột về NULL để nhả ràng buộc UNIQUE, nhờ đó người dùng gửi được yêu
      // cầu mới sau này mà vẫn giữ nguyên dòng cũ trong nhật ký.
      pendingUserId: null,
    },
  });

  if (count === 0) {
    const exists = await prisma.passwordResetRequest.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Không tìm thấy yêu cầu');
    throw new ConflictError('Yêu cầu này đã được xử lý');
  }
}

// ---------------------------------------------------------------------------

async function requireUser(identifier: string): Promise<User> {
  const user = await findByIdentifier(identifier);

  // Cố ý nói thẳng là không tìm thấy, dù điều đó để lộ tài khoản nào tồn tại.
  // Lý do: luồng này vốn đã lộ (bước sau còn hiện cả "đã bị từ chối" kèm lý do), nên
  // giấu ở riêng bước đầu không mua được gì; đổi lại, người gõ nhầm một chữ sẽ ngồi
  // đợi một quản trị viên không bao giờ thấy yêu cầu nào. Xem mục "Đánh đổi" trong
  // docs/luong-quen-mat-khau.md.
  if (!user) throw new NotFoundError('Không tìm thấy tài khoản với email hoặc tên tài khoản này');
  return user;
}

function latestRequest(userId: number): Promise<PasswordResetRequest | null> {
  return prisma.passwordResetRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/** Lượt duyệt còn dùng được: chưa dùng lần nào và chưa quá hạn. */
function isUsable(request: PasswordResetRequest): boolean {
  if (request.usedAt) return false;
  if (!request.reviewedAt) return false;
  const hetHan = request.reviewedAt.getTime() + APPROVAL_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < hetHan;
}

function stateOf(outcome: PasswordResetOutcome, request: PasswordResetRequest): PasswordResetState {
  return {
    outcome,
    // Chỉ trả lý do khi thật sự đang báo từ chối; các trạng thái khác không được
    // mang theo lý do của một yêu cầu cũ.
    rejectReason: outcome === PasswordResetOutcome.REJECTED ? request.rejectReason : null,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
  };
}

type RequestWithRelations = PasswordResetRequest & {
  user: { id: number; name: string; username: string; email: string };
  reviewedBy: { id: number; name: string; username: string } | null;
};

function toRow(r: RequestWithRelations): ResetRequestRow {
  return {
    id: r.id,
    status: r.status as PasswordResetStatus,
    user: r.user,
    reviewedBy: r.reviewedBy,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    rejectReason: r.rejectReason,
    usedAt: r.usedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}
