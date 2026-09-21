import {
  AUDIT_ACTION_TARGET,
  type AdminAction,
  type AuditActorOption,
  type AuditChanges,
  type AuditLogQueryInput,
  type AuditLogRow,
  type AuditValue,
  type Paginated,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

/**
 * Nhật ký thao tác của quản trị viên.
 *
 * Nơi DUY NHẤT ghi bảng `admin_audit_logs`. Mọi service có thao tác của quản trị viên
 * gọi `recordAdminAction` ngay sau lệnh ghi chính, TRONG CÙNG transaction khi có thể: thao
 * tác đã xảy ra mà không có dòng nhật ký là nhật ký nói dối, còn dòng nhật ký cho một
 * thao tác đã rollback thì là bịa.
 *
 * Không có hàm sửa hay xoá — nhật ký mà người bị ghi tự xoá được thì không còn là nhật ký.
 */

/** Client Prisma hoặc transaction đang mở — ghi cùng transaction với thao tác chính. */
type Db = Prisma.TransactionClient | typeof prisma;

export interface AuditEntry {
  actorId: number;
  action: AdminAction;
  targetId?: string | number | null;
  /** Tên đối tượng lúc thao tác. Bắt buộc với thao tác xoá: sau đó không còn gì để tra. */
  targetLabel?: string | null;
  changes?: AuditChanges | null;
  note?: string | null;
}

const MAX_LABEL = 200;
const MAX_NOTE = 500;
const MAX_VALUE = 300;

export async function recordAdminAction(entry: AuditEntry, db: Db = prisma): Promise<void> {
  // Chụp tên người thực hiện ngay lúc ghi: tài khoản đó có thể bị xoá sau này, khi đó
  // `actorId` về null nhưng nhật ký vẫn phải nói được "ai".
  const actor = await db.user.findUnique({
    where: { id: entry.actorId },
    select: { name: true, username: true },
  });

  await db.adminAuditLog.create({
    data: {
      actorId: entry.actorId,
      actorName: actor ? `${actor.name} (@${actor.username})`.slice(0, 100) : `#${entry.actorId}`,
      action: entry.action,
      targetType: AUDIT_ACTION_TARGET[entry.action],
      targetId: entry.targetId === undefined || entry.targetId === null ? null : String(entry.targetId),
      targetLabel: entry.targetLabel ? entry.targetLabel.slice(0, MAX_LABEL) : null,
      changes: entry.changes && Object.keys(entry.changes).length > 0 ? entry.changes : undefined,
      note: entry.note ? entry.note.slice(0, MAX_NOTE) : null,
    },
  });
}

/**
 * Các trường thật sự đổi giữa `before` và `after`.
 *
 * Chỉ xét những khoá có mặt trong `after` — với PATCH, trường không gửi lên là "không
 * đổi", không phải "đổi thành undefined". Trả null khi không có gì đổi, để chỗ gọi biết
 * mà không ghi một dòng "đã sửa" rỗng.
 */
export function diffFields<T extends object>(
  before: T,
  after: Partial<T>,
  fields: readonly (keyof T & string)[],
): AuditChanges | null {
  const changes: AuditChanges = {};

  for (const field of fields) {
    if (!(field in after) || after[field] === undefined) continue;
    const from = toAuditValue(before[field]);
    const to = toAuditValue(after[field]);
    if (from !== to) changes[field] = { from, to };
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/** Giá trị ban đầu của một đối tượng vừa tạo, ghi dưới dạng "trống → giá trị". */
export function createdFields<T extends object>(
  values: T,
  fields: readonly (keyof T & string)[],
): AuditChanges | null {
  return diffFields({} as T, values, fields);
}

/** Ép về kiểu nguyên thuỷ để hiển thị được; chuỗi dài thì cắt bớt để một dòng không phình to. */
export function toAuditValue(value: unknown): AuditValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > MAX_VALUE ? `${text.slice(0, MAX_VALUE)}…` : text;
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

export async function listAuditLogs(query: AuditLogQueryInput): Promise<Paginated<AuditLogRow>> {
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      // `id` phụ cho chắc thứ tự: hai thao tác trong cùng một mili giây vẫn đứng đúng trước sau.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      actor: { id: row.actorId, name: row.actorName },
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel: row.targetLabel,
      changes: (row.changes as AuditChanges | null) ?? null,
      note: row.note,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Những người đã từng có thao tác — ô lọc chỉ liệt kê người có dòng để lọc. */
export async function listAuditActors(): Promise<AuditActorOption[]> {
  const rows = await prisma.adminAuditLog.groupBy({
    by: ['actorId', 'actorName'],
    where: { actorId: { not: null } },
    orderBy: { actorName: 'asc' },
  });

  // Một người đổi tên thì có hai dòng cùng id — giữ tên xuất hiện sau cùng trong danh sách.
  const byId = new Map<number, string>();
  for (const row of rows) if (row.actorId !== null) byId.set(row.actorId, row.actorName);
  return [...byId].map(([id, name]) => ({ id, name }));
}
