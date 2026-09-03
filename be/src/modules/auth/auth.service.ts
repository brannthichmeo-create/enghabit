import bcrypt from 'bcryptjs';
import {
  DEFAULT_TIMEZONE,
  LoginFailReason,
  UserStatus,
  parseImageDataUrl,
  type AuthResponse,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from '@enghabit/shared';
import type { User, UserAvatar } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/app-error.js';
import { issueRefreshToken, revokeRefreshToken, rotateRefreshToken, signAccessToken } from './token.service.js';

const BCRYPT_ROUNDS = 10;

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email này đã được đăng ký');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      timezone: input.timezone ?? DEFAULT_TIMEZONE,
      // Khởi tạo sẵn streak và cài đặt nhắc nhở để các module sau không phải kiểm tra null.
      streak: { create: {} },
      notificationSetting: { create: {} },
      // Một mốc nhắc mặc định 20:00 cả tuần: người mới chưa biết vào đâu để đặt, mà
      // không có mốc nào thì tính năng nhắc nhở coi như không tồn tại với họ.
      reminders: { create: { timeOfDay: '20:00', daysOfWeek: [1, 2, 3, 4, 5, 6, 7] } },
    },
  });

  return buildAuthResponse(user);
}

/**
 * Đăng nhập.
 *
 * Mọi lượt thử — kể cả thất bại — đều ghi vào LoginEvent để trang quản trị thống kê
 * được lượt truy cập và nhìn ra dấu hiệu dò mật khẩu. `client` là thông tin kỹ thuật
 * của request, do controller lấy từ req rồi truyền xuống (service không đụng tới req).
 */
export async function login(input: LoginInput, client: LoginClientInfo = {}): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { avatar: true },
  });

  // Cùng một thông báo cho cả hai trường hợp để không lộ email nào đã tồn tại.
  const invalid = new UnauthorizedError('Email hoặc mật khẩu không đúng');

  if (!user) {
    await recordLoginEvent(input.email, null, LoginFailReason.NO_ACCOUNT, client);
    throw invalid;
  }
  if (!(await bcrypt.compare(input.password, user.passwordHash))) {
    await recordLoginEvent(input.email, user.id, LoginFailReason.WRONG_PASSWORD, client);
    throw invalid;
  }
  if (user.status === UserStatus.LOCKED) {
    // Nói rõ lý do ở trường hợp này: mật khẩu đã đúng nên không lộ thêm thông tin gì,
    // mà người dùng cần biết phải liên hệ quản trị viên thay vì thử lại mật khẩu.
    await recordLoginEvent(input.email, user.id, LoginFailReason.LOCKED, client);
    throw new ForbiddenError('Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.');
  }

  await Promise.all([
    recordLoginEvent(input.email, user.id, null, client),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  return buildAuthResponse(user);
}

export interface LoginClientInfo {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

async function recordLoginEvent(
  email: string,
  userId: number | null,
  reason: LoginFailReason | null,
  client: LoginClientInfo,
): Promise<void> {
  await prisma.loginEvent.create({
    data: {
      userId,
      email,
      success: reason === null,
      reason,
      ipAddress: client.ipAddress?.slice(0, 45) ?? null,
      userAgent: client.userAgent?.slice(0, 255) ?? null,
    },
  });
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated) throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: rotated.userId },
    include: { avatar: true },
  });

  // Khoá tài khoản phải cắt được cả phiên đang mở, nếu không người bị khoá vẫn dùng
  // tiếp tới khi refresh token hết hạn (30 ngày).
  if (user.status === UserStatus.LOCKED) {
    throw new ForbiddenError('Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.');
  }

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role, timezone: user.timezone }),
    refreshToken: rotated.token,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
}

export async function getProfile(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { avatar: true } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');
  return toPublicUser(user);
}

export async function updateProfile(userId: number, input: UpdateProfileInput): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    include: { avatar: true },
  });
  return toPublicUser(user);
}

export async function changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new UnauthorizedError('Mật khẩu hiện tại không đúng');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) },
  });

  // Đổi mật khẩu thì thu hồi hết phiên cũ trên các thiết bị khác.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function buildAuthResponse(user: User): Promise<AuthResponse> {
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role, timezone: user.timezone }),
    refreshToken: await issueRefreshToken(user.id),
  };
}

/**
 * Chuyển bản ghi DB sang dạng trả về cho client — luôn loại bỏ passwordHash.
 *
 * Ảnh đại diện là quan hệ riêng nên phải `include: { avatar: true }` ở chỗ truy vấn;
 * không include thì `avatarDataUrl` ra null và người dùng tưởng ảnh vừa tải lên bị mất.
 */
export function toPublicUser(user: User & { avatar?: UserAvatar | null }): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    timezone: user.timezone,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    avatarDataUrl: user.avatar ? toDataUrl(user.avatar) : null,
  };
}

function toDataUrl(avatar: UserAvatar): string {
  return `data:${avatar.mimeType};base64,${Buffer.from(avatar.data).toString('base64')}`;
}

// --- Ảnh đại diện ---
//
// Mọi vai trò đều đổi được ảnh của chính mình: đây là thông tin cá nhân, không phải
// tính năng học tập, nên không chặn theo vai trò như các module học.

export async function setAvatar(userId: number, dataUrl: string): Promise<PublicUser> {
  // Kiểm lại ở server dù FE đã kiểm: FE có thể bị bỏ qua hoàn toàn bằng cách gọi
  // thẳng API. Luật nằm ở shared nên hai phía không thể lệch ngưỡng.
  const parsed = parseImageDataUrl(dataUrl);
  if (!parsed.ok) throw new BadRequestError(parsed.reason);

  const data = Buffer.from(parsed.base64, 'base64');

  await prisma.userAvatar.upsert({
    where: { userId },
    create: { userId, data, mimeType: parsed.mimeType },
    update: { data, mimeType: parsed.mimeType },
  });

  return getProfile(userId);
}

export async function removeAvatar(userId: number): Promise<PublicUser> {
  // deleteMany thay vì delete: xoá ảnh khi chưa từng đặt là không có gì để làm, không
  // phải lỗi — delete sẽ ném P2025 và biến thao tác vô hại thành lỗi 500.
  await prisma.userAvatar.deleteMany({ where: { userId } });
  return getProfile(userId);
}
