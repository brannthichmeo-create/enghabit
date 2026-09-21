import {
  AdminAction,
  NotificationType,
  StudySetReportStatus,
  type AdminStudySetDetail,
  type AdminStudySetReportQueryInput,
  type AdminStudySetReportRow,
  type Paginated,
  type StudySetBlockInfo,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { createNotification } from '../notifications/notification.service.js';
import { recordAdminAction } from './admin-audit.service.js';

/**
 * Kiểm duyệt bộ thẻ công khai — cùng tinh thần với quản lý nhóm lớp.
 *
 * Quản trị viên chỉ xem, bỏ qua báo cáo, và chặn/mở chặn. KHÔNG xoá bộ thẻ: chặn đảo
 * ngược được, xoá thì mất dữ liệu học của mọi người đang học bộ đó (BR-MOD-04).
 * Bộ "Hệ thống" không nằm ở đây — quản trị viên sửa thẳng ở /admin/content.
 */

const REPORT_INCLUDE = {
  reporter: { select: { id: true, name: true, username: true } },
  resolvedBy: { select: { name: true } },
  topic: {
    select: {
      id: true,
      name: true,
      visibility: true,
      blockedAt: true,
      blockedReason: true,
      owner: { select: { id: true, name: true, username: true } },
      _count: { select: { vocabularies: true } },
    },
  },
} satisfies Prisma.StudySetReportInclude;

type ReportWithRelations = Prisma.StudySetReportGetPayload<{ include: typeof REPORT_INCLUDE }>;

function toBlockInfo(set: { blockedAt: Date | null; blockedReason: string | null }): StudySetBlockInfo | null {
  return set.blockedAt && set.blockedReason
    ? { reason: set.blockedReason, blockedAt: set.blockedAt.toISOString() }
    : null;
}

function toRow(report: ReportWithRelations): AdminStudySetReportRow {
  return {
    id: report.id,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
    reporter: report.reporter,
    resolvedBy: report.resolvedBy?.name ?? null,
    studySet: {
      id: report.topic.id,
      name: report.topic.name,
      visibility: report.topic.visibility,
      cardCount: report.topic._count.vocabularies,
      owner: report.topic.owner,
      block: toBlockInfo(report.topic),
    },
  };
}

export async function listReports(query: AdminStudySetReportQueryInput): Promise<Paginated<AdminStudySetReportRow>> {
  const where: Prisma.StudySetReportWhereInput = query.status ? { status: query.status } : {};

  const [reports, total] = await Promise.all([
    prisma.studySetReport.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.studySetReport.count({ where }),
  ]);

  return { items: reports.map(toRow), total, page: query.page, pageSize: query.pageSize };
}

/** Nội dung bộ thẻ để quản trị viên đọc trước khi quyết định. Chỉ đọc, không kèm tiến độ ai. */
export async function getStudySet(setId: number): Promise<AdminStudySetDetail> {
  const set = await prisma.topic.findUnique({
    where: { id: setId },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      vocabularies: { orderBy: { id: 'asc' } },
    },
  });
  if (!set) throw new NotFoundError('Không tìm thấy bộ thẻ');

  return {
    id: set.id,
    name: set.name,
    description: set.description,
    level: set.level,
    visibility: set.visibility,
    cardCount: set.vocabularies.length,
    owner: set.owner,
    block: toBlockInfo(set),
    createdAt: set.createdAt.toISOString(),
    cards: set.vocabularies.map((card) => ({
      id: card.id,
      word: card.word,
      meaning: card.meaning,
      phonetic: card.phonetic,
      example: card.example,
    })),
  };
}

export async function dismissReport(reportId: number, adminId: number): Promise<void> {
  const report = await prisma.studySetReport.findUnique({
    where: { id: reportId },
    select: { status: true, reason: true, reporterId: true, topic: { select: { name: true } } },
  });
  if (!report) throw new NotFoundError('Không tìm thấy báo cáo');
  if (report.status !== StudySetReportStatus.PENDING) throw new BadRequestError('Báo cáo này đã được xử lý');

  await prisma.$transaction(async (tx) => {
    await tx.studySetReport.update({
      where: { id: reportId },
      data: {
        status: StudySetReportStatus.DISMISSED,
        pendingKey: null,
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
    });
    await recordAdminAction(
      {
        actorId: adminId,
        action: AdminAction.STUDY_SET_REPORT_DISMISSED,
        targetId: reportId,
        targetLabel: report.topic.name,
        // Lý do NGƯỜI BÁO CÁO đưa ra — để sau này biết mình đã bỏ qua lời tố cáo nào.
        note: report.reason,
      },
      tx,
    );
  });

  await createNotification({
    userId: report.reporterId,
    type: NotificationType.STUDY_SET_REPORT_RESOLVED,
    title: 'Báo cáo của bạn đã được xem xét',
    body: `Quản trị viên đã xem bộ thẻ "${report.topic.name}" và chưa thấy vi phạm.`,
    link: null,
    dedupeKey: `${NotificationType.STUDY_SET_REPORT_RESOLVED}:${reportId}`,
  });
}

/**
 * Chặn bộ thẻ. Mọi báo cáo đang chờ về bộ này khép lại luôn, trong CÙNG transaction —
 * để lại báo cáo chờ cho một bộ đã chặn là bắt quản trị viên xử lý lại việc đã xong.
 */
export async function blockSet(setId: number, adminId: number, reason: string): Promise<AdminStudySetDetail> {
  const set = await prisma.topic.findUnique({
    where: { id: setId },
    select: { name: true, ownerId: true, blockedAt: true },
  });
  if (!set) throw new NotFoundError('Không tìm thấy bộ thẻ');
  if (set.ownerId === null) throw new BadRequestError('Bộ thẻ của hệ thống sửa trực tiếp ở Nội dung học tập');
  if (set.blockedAt) throw new BadRequestError('Bộ thẻ này đã bị chặn từ trước');

  const pending = await prisma.studySetReport.findMany({
    where: { topicId: setId, status: StudySetReportStatus.PENDING },
    select: { id: true, reporterId: true },
  });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.topic.update({
      where: { id: setId },
      data: { blockedAt: now, blockedReason: reason, blockedById: adminId },
    });
    await tx.studySetReport.updateMany({
      where: { topicId: setId, status: StudySetReportStatus.PENDING },
      data: { status: StudySetReportStatus.RESOLVED, pendingKey: null, resolvedById: adminId, resolvedAt: now },
    });
    await recordAdminAction(
      {
        actorId: adminId,
        action: AdminAction.STUDY_SET_BLOCKED,
        targetId: setId,
        targetLabel: set.name,
        changes: pending.length > 0 ? { resolvedReports: { from: null, to: pending.length } } : null,
        note: reason,
      },
      tx,
    );
  });

  await createNotification({
    userId: set.ownerId,
    type: NotificationType.STUDY_SET_BLOCKED,
    title: `Bộ thẻ "${set.name}" đã bị chặn`,
    body: `Lý do: ${reason}`,
    link: `/library/${setId}`,
    // Mốc thời gian trong khoá: chặn → mở → chặn lại là hai lần báo khác nhau.
    dedupeKey: `${NotificationType.STUDY_SET_BLOCKED}:${setId}:${now.getTime()}`,
  });

  await Promise.all(
    pending.map((report) =>
      createNotification({
        userId: report.reporterId,
        type: NotificationType.STUDY_SET_REPORT_RESOLVED,
        title: 'Báo cáo của bạn đã được xử lý',
        body: `Bộ thẻ "${set.name}" bạn báo cáo đã bị chặn. Cảm ơn bạn đã giúp giữ thư viện sạch.`,
        link: null,
        dedupeKey: `${NotificationType.STUDY_SET_REPORT_RESOLVED}:${report.id}`,
      }),
    ),
  );

  return getStudySet(setId);
}

export async function unblockSet(setId: number, adminId: number): Promise<AdminStudySetDetail> {
  const set = await prisma.topic.findUnique({
    where: { id: setId },
    select: { name: true, ownerId: true, blockedAt: true, blockedReason: true },
  });
  if (!set) throw new NotFoundError('Không tìm thấy bộ thẻ');
  if (!set.blockedAt) throw new BadRequestError('Bộ thẻ này không bị chặn');

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.topic.update({
      where: { id: setId },
      data: { blockedAt: null, blockedReason: null, blockedById: null },
    });
    await recordAdminAction(
      {
        actorId: adminId,
        action: AdminAction.STUDY_SET_UNBLOCKED,
        targetId: setId,
        targetLabel: set.name,
        changes: { blockedReason: { from: set.blockedReason, to: null } },
      },
      tx,
    );
  });

  if (set.ownerId !== null) {
    await createNotification({
      userId: set.ownerId,
      type: NotificationType.STUDY_SET_UNBLOCKED,
      title: `Bộ thẻ "${set.name}" đã được mở chặn`,
      body: 'Bộ thẻ hoạt động trở lại như trước.',
      link: `/library/${setId}`,
      dedupeKey: `${NotificationType.STUDY_SET_UNBLOCKED}:${setId}:${now.getTime()}`,
    });
  }

  return getStudySet(setId);
}
