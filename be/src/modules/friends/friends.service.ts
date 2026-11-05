import { randomInt } from 'node:crypto';
import { NotificationType, UserRole, UserStatus, startOfMonth, todayLocalDate, type FriendProfile, type FriendUser, type FriendsPageData, type FriendshipRelation } from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { toDbDate } from '../../common/utils/db-date.js';
import { avatarToDataUrl } from '../auth/avatar-data.js';
import { getEquippedFrameUrls } from '../shop/shop.frame.js';
import { getLevel } from '../statistics/statistics.service.js';
import { ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { createNotification } from '../notifications/notification.service.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export async function listFriends(viewerId: number, search = ''): Promise<FriendsPageData> {
  const [friendships, incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({ where: { status: 'ACCEPTED', OR: [{ requesterId: viewerId }, { addresseeId: viewerId }] }, include: { requester: true, addressee: true } }),
    prisma.friendship.findMany({ where: { addresseeId: viewerId, status: 'PENDING' }, include: { requester: true }, orderBy: { createdAt: 'desc' } }),
    prisma.friendship.findMany({ where: { requesterId: viewerId, status: 'PENDING' }, include: { addressee: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  const ids = friendships.map((row) => row.requesterId === viewerId ? row.addresseeId : row.requesterId);
  const users = await loadUsers(ids, search);
  const [incomingRequests, outgoingRequests] = await Promise.all([
    buildRequests(incoming, 'requester'),
    buildRequests(outgoing, 'addressee'),
  ]);
  return { friends: users, incoming: incomingRequests, outgoing: outgoingRequests };
}

export async function searchPublicId(viewerId: number, publicId: string): Promise<FriendUser> {
  const user = await prisma.user.findFirst({ where: { publicId: publicId.toUpperCase(), role: UserRole.USER, status: UserStatus.ACTIVE, id: { not: viewerId } }, include: { avatar: true, streak: true } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng với mã này');
  const users = await buildFriendUsers([user.id]);
  if (!users[0]) throw new NotFoundError('Không tìm thấy người dùng');
  return users[0];
}

export async function getProfile(viewerId: number, publicId: string): Promise<FriendProfile> {
  const user = await prisma.user.findFirst({ where: { publicId: publicId.toUpperCase(), role: UserRole.USER, status: UserStatus.ACTIVE }, include: { avatar: true, streak: true } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');
  const [base, level, monthlyActivities, relation] = await Promise.all([
    buildFriendUsers([user.id]),
    getLevel(user.id),
    prisma.activityLog.count({ where: { userId: user.id, localDate: { gte: toDbDate(startOfMonth(todayLocalDate(user.timezone))) } } }),
    getRelation(viewerId, user.id),
  ]);
  if (!base[0]) throw new NotFoundError('Không tìm thấy người dùng');
  return { ...base[0], createdAt: user.createdAt.toISOString(), longestStreak: user.streak?.longestStreak ?? 0, xp: level.xp, xpToNextLevel: level.xpToNextLevel, progressPercent: level.progressPercent, monthlyActivities, relation: relation.relation, friendshipId: relation.id };
}

export async function sendRequest(viewerId: number, publicId: string): Promise<{ id: number; relation: FriendshipRelation }> {
  const target = await prisma.user.findFirst({ where: { publicId: publicId.toUpperCase(), role: UserRole.USER, status: UserStatus.ACTIVE } });
  if (!target) throw new NotFoundError('Không tìm thấy người dùng');
  if (target.id === viewerId) throw new ConflictError('Không thể kết bạn với chính mình');
  const pairKey = friendshipPairKey(viewerId, target.id);
  const existing = await prisma.friendship.findUnique({ where: { pairKey } });
  if (existing) throw new ConflictError(existing.status === 'ACCEPTED' ? 'Hai người đã là bạn' : 'Lời mời kết bạn đã tồn tại');
  const row = await prisma.friendship.create({ data: { requesterId: viewerId, addresseeId: target.id, pairKey } });
  const requester = await prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { name: true } });
  await createNotification({
    userId: target.id,
    type: NotificationType.FRIEND_REQUEST,
    title: 'Bạn nhận được lời mời kết bạn',
    body: `${requester.name} đã gửi cho bạn một lời mời kết bạn.`,
    link: '/friends?tab=incoming',
    dedupeKey: `FRIEND_REQUEST:${row.id}`,
  });
  return { id: row.id, relation: 'OUTGOING_PENDING' };
}

export async function acceptRequest(viewerId: number, id: number): Promise<void> {
  const row = await prisma.friendship.findUnique({ where: { id } });
  if (!row || row.addresseeId !== viewerId || row.status !== 'PENDING') throw new NotFoundError('Không tìm thấy lời mời');
  await prisma.friendship.update({ where: { id }, data: { status: 'ACCEPTED', acceptedAt: new Date() } });
}

export async function removeRequest(viewerId: number, id: number): Promise<void> {
  const row = await prisma.friendship.findUnique({ where: { id } });
  if (!row || row.status !== 'PENDING' || (row.requesterId !== viewerId && row.addresseeId !== viewerId)) throw new NotFoundError('Không tìm thấy lời mời');
  await prisma.friendship.delete({ where: { id } });
}

export async function removeFriend(viewerId: number, userId: number): Promise<void> {
  const pairKey = friendshipPairKey(viewerId, userId);
  const row = await prisma.friendship.findUnique({ where: { pairKey } });
  if (!row || row.status !== 'ACCEPTED' || (row.requesterId !== viewerId && row.addresseeId !== viewerId)) throw new NotFoundError('Không tìm thấy quan hệ bạn bè');
  await prisma.friendship.delete({ where: { id: row.id } });
}

export async function ensurePublicIds(): Promise<void> {
  const users = await prisma.user.findMany({ where: { publicId: null, role: UserRole.USER, status: UserStatus.ACTIVE }, select: { id: true } });
  for (const user of users) await ensurePublicId(user.id);
}

async function ensurePublicId(userId: number): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { publicId: true } });
  if (existing?.publicId) return existing.publicId;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const value = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    try {
      await prisma.user.update({ where: { id: userId }, data: { publicId: value } });
      return value;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') continue;
      throw error;
    }
  }
  throw new ConflictError('Không thể tạo mã bạn bè duy nhất');
}

export function friendshipPairKey(a: number, b: number): string {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

async function loadUsers(ids: number[], search = ''): Promise<FriendUser[]> {
  if (ids.length === 0) return [];
  const users = await prisma.user.findMany({ where: { id: { in: ids }, role: UserRole.USER, status: UserStatus.ACTIVE, ...(search ? { name: { contains: search } } : {}) }, select: { id: true } });
  return buildFriendUsers(users.map((user) => user.id));
}

async function buildFriendUsers(ids: number[]): Promise<FriendUser[]> {
  if (ids.length === 0) return [];
  const [users, levels, frames] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids } }, include: { avatar: true, streak: true } }),
    Promise.all(ids.map(async (id) => [id, await getLevel(id)] as const)),
    getEquippedFrameUrls(ids),
  ]);
  const byLevel = new Map(levels.map(([id, level]) => [id, level.level]));
  return ids.map((id) => {
    const user = users.find((item) => item.id === id);
    if (!user) return null;
    return { userId: user.id, publicId: user.publicId ?? '', name: user.name, level: byLevel.get(user.id) ?? 1, currentStreak: user.streak?.currentStreak ?? 0, avatarDataUrl: avatarToDataUrl(user.avatar), avatarFrameUrl: frames.get(user.id) ?? null, lastActiveAt: user.lastLoginAt?.toISOString() ?? null };
  }).filter((user): user is FriendUser => user !== null);
}

async function buildRequests(rows: Array<{ id: number; createdAt: Date; requester?: { id: number }; addressee?: { id: number } }>, side: 'requester' | 'addressee') {
  const ids = rows.map((row) => (side === 'requester' ? row.requester?.id : row.addressee?.id)).filter((id): id is number => Boolean(id));
  const users = await buildFriendUsers(ids);
  const byId = new Map(users.map((user) => [user.userId, user]));
  return rows.map((row) => ({ id: row.id, createdAt: row.createdAt.toISOString(), user: byId.get(side === 'requester' ? row.requester?.id ?? 0 : row.addressee?.id ?? 0) })).filter((row): row is { id: number; createdAt: string; user: FriendUser } => Boolean(row.user));
}

async function getRelation(viewerId: number, userId: number): Promise<{ id: number | null; relation: FriendshipRelation }> {
  const row = await prisma.friendship.findUnique({ where: { pairKey: friendshipPairKey(viewerId, userId) } });
  if (!row) return { id: null, relation: 'NONE' };
  if (row.status === 'ACCEPTED') return { id: row.id, relation: 'FRIENDS' };
  return { id: row.id, relation: row.requesterId === viewerId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING' };
}
