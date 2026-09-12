import {
  ADMIN_USER_TREND_DAYS,
  ActivityType,
  UserRole,
  UserStatus,
  addDays,
  toLocalDate,
  type AccessLogQueryInput,
  type AccessOverview,
  type AccessPoint,
  type AdminUserDetail,
  type AdminUserQueryInput,
  type AdminUserEvent,
  type AdminUserRow,
  type CreateVocabularyInput,
  type LoginEventRow,
  type Paginated,
  type SystemOverview,
  type UpdateVocabularyInput,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { toPublicUser } from '../auth/auth.service.js';
import * as statisticsService from '../statistics/statistics.service.js';

/**
 * Nghiệp vụ quản trị — góc nhìn vận hành hệ thống, không phải góc nhìn người học.
 *
 * Phần nào đã có ở module khác thì tái dùng service của module đó (vd topic.service)
 * thay vì viết lại query — xem CLAUDE.md > Quy tắc tái sử dụng code.
 *
 * Mọi số liệu hoạt động ở đây đều đọc từ ActivityLog (nguồn sự thật duy nhất) và
 * group theo localDate, không tự tính lại từ bảng nghiệp vụ nào khác.
 */

/** Mốc thời gian N ngày trước, dùng cho các bộ lọc "trong 7/30 ngày qua". */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

// ---------------------------------------------------------------------------
// Quản lý tài khoản người dùng
// ---------------------------------------------------------------------------

export async function listUsers(query: AdminUserQueryInput): Promise<Paginated<AdminUserRow>> {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          // Có cả `username`: từ khi đăng nhập chấp nhận tên tài khoản, người dùng gọi
          // hỗ trợ sẽ đọc tên đó chứ không phải email — không tra được theo nó thì
          // quản trị viên phải dò tay cả danh sách.
          OR: [
            { name: { contains: query.search } },
            { username: { contains: query.search } },
            { email: { contains: query.search } },
          ],
        }
      : {}),
  };

  // "mostActive" sắp theo số hoạt động — không phải cột của bảng users nên phải
  // dùng orderBy trên quan hệ, Prisma dịch được sang ORDER BY COUNT.
  const orderBy: Prisma.UserOrderByWithRelationInput =
    query.sort === 'oldest'
      ? { createdAt: 'asc' }
      : query.sort === 'lastLogin'
        ? { lastLoginAt: 'desc' }
        : query.sort === 'mostActive'
          ? { activityLogs: { _count: 'desc' } }
          : { createdAt: 'desc' };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        streak: true,
        _count: {
          select: {
            activityLogs: true,
            refreshTokens: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map((user) => ({
      ...toPublicUser(user),
      activityCount: user._count.activityLogs,
      currentStreak: user.streak?.currentStreak ?? 0,
      activeSessions: user._count.refreshTokens,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getUserDetail(userId: number): Promise<AdminUserDetail> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // Bắt buộc: `toPublicUser` đọc quan hệ này để dựng `avatarDataUrl`. Không
      // include thì nó trả null một cách im lặng và giao diện hiện chữ cái đầu như
      // thể người dùng chưa từng tải ảnh lên.
      avatar: true,
      streak: true,
      _count: {
        select: {
          activityLogs: true,
          habits: true,
          goals: true,
          examAttempts: true,
          refreshTokens: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
        },
      },
    },
  });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');

  // Biểu đồ tần suất tính theo múi giờ CỦA NGƯỜI ĐƯỢC XEM, không phải của quản trị
  // viên đang xem: "ngày học" là ngày của họ. Dùng lại getDailyStats của module
  // statistics thay vì viết truy vấn riêng — hai chỗ group khác nhau là hai chỗ để
  // số liệu lệch (xem CLAUDE.md > Quy tắc tái sử dụng code).
  const today = toLocalDate(new Date(), user.timezone);
  const from = addDays(today, -(ADMIN_USER_TREND_DAYS - 1));

  const [byType, lastActivity, logins, activities, activityTrend] = await Promise.all([
    prisma.activityLog.groupBy({ by: ['type'], where: { userId }, _count: { _all: true } }),
    prisma.activityLog.findFirst({
      where: { userId },
      orderBy: { localDate: 'desc' },
      select: { localDate: true },
    }),
    prisma.loginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_EVENTS_PER_SOURCE,
      select: { id: true, createdAt: true, success: true, reason: true, ipAddress: true },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: RECENT_EVENTS_PER_SOURCE,
      select: { id: true, occurredAt: true, type: true, value: true },
    }),
    statisticsService.getDailyStats(userId, from, today),
  ]);

  // Đếm theo loại phải phủ ĐỦ mọi giá trị của enum, kể cả loại chưa từng xuất hiện:
  // groupBy chỉ trả về loại có ít nhất một bản ghi, để nguyên thì giao diện hiện
  // undefined thay vì số 0.
  const activityByType = Object.fromEntries(
    Object.values(ActivityType).map((type) => [
      type,
      byType.find((r) => r.type === type)?._count._all ?? 0,
    ]),
  ) as Record<ActivityType, number>;

  return {
    ...toPublicUser(user),
    activityCount: user._count.activityLogs,
    currentStreak: user.streak?.currentStreak ?? 0,
    activeSessions: user._count.refreshTokens,
    longestStreak: user.streak?.longestStreak ?? 0,
    habitCount: user._count.habits,
    goalCount: user._count.goals,
    vocabLearned: activityByType[ActivityType.VOCAB_LEARNED],
    examAttempts: user._count.examAttempts,
    lastActivityDate: lastActivity ? toLocalDate(lastActivity.localDate, 'UTC') : null,
    activityByType,
    activityTrend,
    recentEvents: mergeEvents(logins, activities),
  };
}

/**
 * Lấy ĐỦ SỐ CUỐI CÙNG từ mỗi nguồn rồi mới cắt sau khi trộn.
 *
 * Hai hằng này phải BẰNG NHAU, không được lấy ít hơn ở mỗi nguồn cho tiết kiệm. Lý do:
 * cả 30 sự kiện gần nhất hoàn toàn có thể đến từ một nguồn duy nhất — người đăng nhập
 * hỏng mật khẩu 30 lần liên tiếp, hoặc học một mạch 30 lượt trong buổi tối. Lấy 25 mỗi
 * bên thì đúng trường hợp đó sẽ mất 5 sự kiện mới nhất và thay bằng 5 sự kiện cũ hơn
 * của nguồn kia — sai một cách rất khó nhận ra, vì danh sách vẫn đủ 30 dòng.
 */
const RECENT_EVENTS_TOTAL = 30;
const RECENT_EVENTS_PER_SOURCE = RECENT_EVENTS_TOTAL;

function mergeEvents(
  logins: { id: number; createdAt: Date; success: boolean; reason: string | null; ipAddress: string | null }[],
  activities: { id: number; occurredAt: Date; type: ActivityType; value: number }[],
): AdminUserEvent[] {
  const events: AdminUserEvent[] = [
    ...logins.map((l) => ({
      // Tiền tố nguồn vì hai bảng đánh id riêng — id 5 tồn tại ở cả hai.
      key: `login:${l.id}`,
      at: l.createdAt.toISOString(),
      kind: 'LOGIN' as const,
      success: l.success,
      reason: l.reason,
      ipAddress: l.ipAddress,
    })),
    ...activities.map((a) => ({
      key: `activity:${a.id}`,
      at: a.occurredAt.toISOString(),
      kind: 'ACTIVITY' as const,
      type: a.type,
      value: a.value,
    })),
  ];

  events.sort((a, b) => b.at.localeCompare(a.at));
  return events.slice(0, RECENT_EVENTS_TOTAL);
}

/**
 * Đổi vai trò. Chặn việc hạ cấp người quản trị cuối cùng — mất hết admin thì không
 * còn ai vào được khu quản trị để sửa, phải can thiệp thẳng vào database.
 */
export async function updateUserRole(userId: number, role: UserRole, actorId: number): Promise<AdminUserRow> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');

  if (user.id === actorId && role !== UserRole.ADMIN) {
    throw new BadRequestError('Không thể tự bỏ quyền quản trị của chính mình');
  }
  if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    await assertNotLastAdmin(userId);
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  return findRow(userId);
}

/**
 * Khoá / mở khoá tài khoản. Khi khoá thì thu hồi luôn refresh token đang có, để
 * phiên đang mở bị cắt ngay thay vì còn dùng được tới lúc token hết hạn.
 */
export async function updateUserStatus(
  userId: number,
  status: UserStatus,
  actorId: number,
): Promise<AdminUserRow> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');

  if (user.id === actorId && status === UserStatus.LOCKED) {
    throw new BadRequestError('Không thể tự khoá tài khoản của chính mình');
  }
  if (user.role === UserRole.ADMIN && status === UserStatus.LOCKED) {
    await assertNotLastAdmin(userId);
  }

  await prisma.user.update({ where: { id: userId }, data: { status } });

  if (status === UserStatus.LOCKED) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return findRow(userId);
}

export async function deleteUser(userId: number, actorId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');
  if (user.id === actorId) throw new BadRequestError('Không thể tự xoá tài khoản của chính mình');
  if (user.role === UserRole.ADMIN) await assertNotLastAdmin(userId);

  await prisma.user.delete({ where: { id: userId } });
}

async function assertNotLastAdmin(userId: number): Promise<void> {
  const otherAdmins = await prisma.user.count({
    where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, id: { not: userId } },
  });
  if (otherAdmins === 0) {
    throw new BadRequestError('Đây là quản trị viên hoạt động duy nhất — hãy chỉ định người khác trước');
  }
}

/** Trả về dòng đã cập nhật để client thay tại chỗ, không phải tải lại cả danh sách. */
async function findRow(userId: number): Promise<AdminUserRow> {
  return getUserDetail(userId);
}

// ---------------------------------------------------------------------------
// Lượt truy cập
// ---------------------------------------------------------------------------

export async function listLoginEvents(query: AccessLogQueryInput): Promise<Paginated<LoginEventRow>> {
  const where: Prisma.LoginEventWhereInput = {
    createdAt: { gte: daysAgo(query.days) },
    ...(query.result === 'success' ? { success: true } : {}),
    ...(query.result === 'failed' ? { success: false } : {}),
  };

  const [events, total] = await Promise.all([
    prisma.loginEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { name: true } } },
    }),
    prisma.loginEvent.count({ where }),
  ]);

  return { items: events.map(toLoginEventRow), total, page: query.page, pageSize: query.pageSize };
}

/** Chuỗi lượt truy cập theo ngày + vài con số tổng, để vẽ biểu đồ ở trang quản trị. */
export async function getAccessOverview(days: number): Promise<AccessOverview> {
  const since = daysAgo(days);

  const [events, activeSessions] = await Promise.all([
    prisma.loginEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, success: true, userId: true },
    }),
    prisma.refreshToken.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);

  // Khởi tạo đủ mọi ngày trong khoảng, kể cả ngày không có lượt nào — thiếu ngày thì
  // biểu đồ sẽ nối liền hai mốc cách xa nhau và nhìn như không có khoảng trống.
  const buckets = new Map<string, { logins: number; failed: number; users: Set<number> }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(isoDate(new Date(Date.now() - i * 86_400_000)), {
      logins: 0,
      failed: 0,
      users: new Set(),
    });
  }

  const uniqueUsers = new Set<number>();
  let totalLogins = 0;
  let totalFailed = 0;

  for (const event of events) {
    const bucket = buckets.get(isoDate(event.createdAt));
    if (!bucket) continue;

    if (event.success) {
      bucket.logins += 1;
      totalLogins += 1;
      if (event.userId !== null) {
        bucket.users.add(event.userId);
        uniqueUsers.add(event.userId);
      }
    } else {
      bucket.failed += 1;
      totalFailed += 1;
    }
  }

  const points: AccessPoint[] = [...buckets.entries()].map(([date, b]) => ({
    date,
    logins: b.logins,
    failed: b.failed,
    uniqueUsers: b.users.size,
  }));

  return { points, totalLogins, totalFailed, uniqueUsers: uniqueUsers.size, activeSessions };
}

function toLoginEventRow(event: {
  id: number;
  userId: number | null;
  email: string;
  success: boolean;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: { name: string } | null;
}): LoginEventRow {
  return {
    id: event.id,
    userId: event.userId,
    userName: event.user?.name ?? null,
    email: event.email,
    success: event.success,
    reason: event.reason,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    createdAt: event.createdAt.toISOString(),
  };
}

/** Ngày `YYYY-MM-DD` theo giờ máy chủ — nhật ký truy cập là sự kiện kỹ thuật,
 * không gắn với timezone của riêng người dùng nào như ActivityLog. */
function isoDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Tổng quan hệ thống
// ---------------------------------------------------------------------------

export async function getSystemOverview(): Promise<SystemOverview> {
  const now = new Date();
  const day1 = daysAgo(1);
  const day7 = daysAgo(7);
  const day30 = daysAgo(30);

  const [
    total,
    admins,
    locked,
    newLast7Days,
    newLast30Days,
    topics,
    vocabulary,
    activityTotal,
    activityLast7Days,
    loginsLast7Days,
    failedLast7Days,
    activeSessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { status: UserStatus.LOCKED } }),
    prisma.user.count({ where: { createdAt: { gte: day7 } } }),
    prisma.user.count({ where: { createdAt: { gte: day30 } } }),
    prisma.topic.count(),
    prisma.vocabulary.count(),
    prisma.activityLog.count(),
    prisma.activityLog.count({ where: { occurredAt: { gte: day7 } } }),
    prisma.loginEvent.count({ where: { success: true, createdAt: { gte: day7 } } }),
    prisma.loginEvent.count({ where: { success: false, createdAt: { gte: day7 } } }),
    prisma.refreshToken.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
  ]);

  const [activeToday, activeLast7Days, activeLast30Days] = await Promise.all([
    countActiveUsers(day1),
    countActiveUsers(day7),
    countActiveUsers(day30),
  ]);

  const [byType, daily, topLearners, databaseOk] = await Promise.all([
    activityByType(),
    dailyActivity(30),
    getTopLearners(5),
    pingDatabase(),
  ]);

  return {
    users: {
      total,
      admins,
      locked,
      newLast7Days,
      newLast30Days,
      activeToday,
      activeLast7Days,
      activeLast30Days,
      retention7Days: total === 0 ? 0 : Math.round((activeLast7Days / total) * 100),
    },
    content: { topics, vocabulary },
    activity: { total: activityTotal, last7Days: activityLast7Days, byType, daily },
    access: { loginsLast7Days, failedLast7Days, activeSessions },
    system: {
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
      databaseOk,
      generatedAt: now.toISOString(),
    },
    topLearners,
  };
}

/** Số người dùng khác nhau có ít nhất một hoạt động kể từ mốc `since`. */
async function countActiveUsers(since: Date): Promise<number> {
  const rows = await prisma.activityLog.findMany({
    where: { occurredAt: { gte: since } },
    select: { userId: true },
    distinct: ['userId'],
  });
  return rows.length;
}

async function activityByType(): Promise<{ type: ActivityType; count: number }[]> {
  const grouped = await prisma.activityLog.groupBy({ by: ['type'], _count: { _all: true } });
  const counts = new Map(grouped.map((row) => [row.type, row._count._all]));

  // Liệt kê đủ 4 loại kể cả loại chưa có dữ liệu, để biểu đồ không đổi số cột theo ngày.
  return Object.values(ActivityType).map((type) => ({ type, count: counts.get(type) ?? 0 }));
}

/**
 * Hoạt động theo ngày trong `days` ngày gần nhất.
 *
 * Group theo localDate đúng quy ước, nhưng lưu ý: localDate là ngày theo timezone
 * của từng người dùng, nên với hệ thống nhiều múi giờ, một "ngày" ở đây là tập hợp
 * ngày-local của nhiều người chứ không phải một khoảng UTC liền mạch. Đây là đánh
 * đổi có chủ ý — xem CLAUDE.md > Quy ước thời gian.
 */
async function dailyActivity(days: number): Promise<{ date: string; count: number; activeUsers: number }[]> {
  const logs = await prisma.activityLog.findMany({
    where: { occurredAt: { gte: daysAgo(days) } },
    select: { localDate: true, userId: true },
  });

  const buckets = new Map<string, { count: number; users: Set<number> }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(isoDate(new Date(Date.now() - i * 86_400_000)), { count: 0, users: new Set() });
  }

  for (const log of logs) {
    const key = toLocalDate(log.localDate, 'UTC');
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.users.add(log.userId);
  }

  return [...buckets.entries()].map(([date, b]) => ({
    date,
    count: b.count,
    activeUsers: b.users.size,
  }));
}

async function getTopLearners(
  limit: number,
): Promise<{ id: number; name: string; activityCount: number; currentStreak: number }[]> {
  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    orderBy: { activityLogs: { _count: 'desc' } },
    take: limit,
    include: { streak: true, _count: { select: { activityLogs: true } } },
  });

  return users
    .filter((user) => user._count.activityLogs > 0)
    .map((user) => ({
      id: user.id,
      name: user.name,
      activityCount: user._count.activityLogs,
      currentStreak: user.streak?.currentStreak ?? 0,
    }));
}

/** Kiểm tra kết nối database bằng một truy vấn rẻ nhất có thể. */
async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Nội dung học tập
// ---------------------------------------------------------------------------

export async function createVocabulary(input: CreateVocabularyInput) {
  return prisma.vocabulary.create({ data: input });
}

export async function updateVocabulary(vocabularyId: number, input: UpdateVocabularyInput) {
  return prisma.vocabulary.update({ where: { id: vocabularyId }, data: input });
}

export async function deleteVocabulary(vocabularyId: number): Promise<void> {
  await prisma.vocabulary.delete({ where: { id: vocabularyId } });
}
