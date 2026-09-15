import { StudySetVisibility, UserStatus } from '@enghabit/shared';
import type { Prisma, Topic } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';

/**
 * Quyền truy cập bộ thẻ — MỘT chỗ duy nhất định nghĩa "ai thấy bộ nào".
 *
 * Mọi truy vấn bộ thẻ và thẻ của người học (Thư viện, Học, Ôn tập, lịch sử, thống kê)
 * phải lọc qua các điều kiện ở đây, ngay trong câu truy vấn. Không truy vấn hết rồi lọc
 * ở frontend: bộ riêng tư đã rời khỏi server là đã lộ.
 *
 * Người không có quyền nhận 404 chứ không 403 — với họ, bộ riêng tư là không tồn tại.
 */

export const SET_NOT_FOUND = 'Không tìm thấy bộ thẻ';

/**
 * Bộ thẻ người khác được thấy: công khai, không bị chặn, và chủ không bị khoá.
 * Bộ "Hệ thống" (`ownerId` null) không có chủ để khoá nên luôn thoả điều kiện cuối.
 */
export function publicSetWhere(): Prisma.TopicWhereInput {
  return {
    visibility: StudySetVisibility.PUBLIC,
    blockedAt: null,
    OR: [{ ownerId: null }, { owner: { status: UserStatus.ACTIVE } }],
  };
}

/**
 * Bộ thẻ `userId` được xem, học và ôn: của chính mình (kể cả riêng tư hoặc đang bị
 * chặn — chủ vẫn phải thấy để biết lý do và sửa), hoặc bộ công khai hợp lệ.
 */
export function readableSetWhere(userId: number): Prisma.TopicWhereInput {
  return { OR: [{ ownerId: userId }, publicSetWhere()] };
}

/** Bộ thẻ mà người học đã bắt đầu học — có ít nhất một thẻ đã có lịch ôn. */
export function startedSetWhere(userId: number): Prisma.TopicWhereInput {
  return { AND: [readableSetWhere(userId), { vocabularies: { some: { progress: { some: { userId } } } } }] };
}

export async function findReadableSet(userId: number, setId: number): Promise<Topic> {
  const set = await prisma.topic.findFirst({ where: { AND: [{ id: setId }, readableSetWhere(userId)] } });
  if (!set) throw new NotFoundError(SET_NOT_FOUND);
  return set;
}

/** Chỉ chủ bộ thẻ được sửa, xoá, đổi chế độ. Người khác nhận 404 như thể bộ không tồn tại. */
export async function findOwnedSet(userId: number, setId: number): Promise<Topic> {
  const set = await prisma.topic.findFirst({ where: { id: setId, ownerId: userId } });
  if (!set) throw new NotFoundError(SET_NOT_FOUND);
  return set;
}

/** Khoá của báo cáo đang chờ — xem chú thích cột `pendingKey` trong schema.prisma. */
export function pendingReportKey(setId: number, reporterId: number): string {
  return `${setId}:${reporterId}`;
}
