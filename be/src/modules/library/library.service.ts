import {
  MIN_CARDS_FOR_MULTIPLE_CHOICE,
  NotificationType,
  UserRole,
  UserStatus,
  cardImportKey,
  todayLocalDate,
  type CreateStudySetInput,
  type ImportStudySetCardsInput,
  type ImportStudySetCardsResult,
  type Paginated,
  type ReportStudySetInput,
  type StudySetCard,
  type StudySetCardInput,
  type StudySetDetail,
  type StudySetSearchInput,
  type StudySetSummary,
  type UpdateStudySetCardInput,
  type UpdateStudySetInput,
} from '@enghabit/shared';
import { Prisma, type Vocabulary } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { isUniqueViolation } from '../../common/utils/prisma-error.js';
import { createNotification } from '../notifications/notification.service.js';
import { summarizeProgress } from '../study/study.service.js';
import {
  SET_NOT_FOUND,
  findOwnedSet,
  findReadableSet,
  pendingReportKey,
  publicSetWhere,
} from './library.access.js';

/**
 * Thư viện bộ thẻ: khám phá, bộ của tôi, soạn thẻ, báo cáo vi phạm.
 *
 * Quyền truy cập nằm hết ở `library.access.ts`. Học và chấm thẻ nằm ở module `study`.
 */

const SUMMARY_INCLUDE = {
  owner: { select: { id: true, name: true } },
  _count: { select: { vocabularies: true } },
} satisfies Prisma.TopicInclude;

type SetWithSummary = Prisma.TopicGetPayload<{ include: typeof SUMMARY_INCLUDE }>;

function toSummary(set: SetWithSummary, viewerId: number): StudySetSummary {
  const isOwner = set.ownerId === viewerId;

  return {
    id: set.id,
    name: set.name,
    description: set.description,
    level: set.level,
    visibility: set.visibility,
    cardCount: set._count.vocabularies,
    author:
      set.ownerId === null
        ? { id: null, name: null, isSystem: true }
        : { id: set.ownerId, name: set.owner?.name ?? null, isSystem: false },
    isOwner,
    createdAt: set.createdAt.toISOString(),
    updatedAt: set.updatedAt.toISOString(),
    // Người khác không bao giờ nhận được bộ đang bị chặn (xem library.access), nên chỉ
    // chủ bộ thẻ mới cần thấy lý do.
    block:
      isOwner && set.blockedAt && set.blockedReason
        ? { reason: set.blockedReason, blockedAt: set.blockedAt.toISOString() }
        : null,
  };
}

function toCard(card: Vocabulary): StudySetCard {
  return {
    id: card.id,
    word: card.word,
    meaning: card.meaning,
    phonetic: card.phonetic,
    example: card.example,
  };
}

/** Chuỗi rỗng từ ô nhập tuỳ chọn nghĩa là xoá giá trị, không phải lưu chuỗi rỗng. */
function optionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === '' ? null : value;
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

/**
 * Tab Khám phá. Chỉ bộ công khai hợp lệ, và bỏ bộ chưa có thẻ nào — mở một bộ rỗng
 * từ kết quả tìm kiếm chỉ làm người học mất công.
 */
export async function searchPublicSets(
  userId: number,
  query: StudySetSearchInput,
): Promise<Paginated<StudySetSummary>> {
  const where: Prisma.TopicWhereInput = {
    AND: [
      publicSetWhere(),
      { vocabularies: { some: {} } },
      ...(query.search
        ? [{ OR: [{ name: { contains: query.search } }, { description: { contains: query.search } }] }]
        : []),
    ],
  };

  const [sets, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      include: SUMMARY_INCLUDE,
      orderBy: [{ vocabularies: { _count: 'desc' } }, { updatedAt: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.topic.count({ where }),
  ]);

  return {
    items: sets.map((set) => toSummary(set, userId)),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Tab Của tôi — mọi bộ tự tạo, kể cả riêng tư và đang bị chặn. */
export async function listMySets(userId: number): Promise<StudySetSummary[]> {
  const sets = await prisma.topic.findMany({
    where: { ownerId: userId },
    include: SUMMARY_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
  return sets.map((set) => toSummary(set, userId));
}

export async function getSetDetail(userId: number, timezone: string, setId: number): Promise<StudySetDetail> {
  await findReadableSet(userId, setId);

  const [set, progress] = await Promise.all([
    prisma.topic.findUniqueOrThrow({
      where: { id: setId },
      include: { ...SUMMARY_INCLUDE, vocabularies: { orderBy: { id: 'asc' } } },
    }),
    prisma.userVocabProgress.findMany({
      where: { userId, vocabulary: { topicId: setId } },
      select: {
        nextReviewDate: true,
        repetitions: true,
        intervalDays: true,
        lapses: true,
        correctCount: true,
        wrongCount: true,
      },
    }),
  ]);

  const pendingReport =
    set.ownerId === userId
      ? null
      : await prisma.studySetReport.findUnique({
          where: { pendingKey: pendingReportKey(setId, userId) },
          select: { id: true },
        });

  return {
    ...toSummary(set, userId),
    cards: set.vocabularies.map(toCard),
    progress: summarizeProgress(set.vocabularies.length, progress, todayLocalDate(timezone)),
    canMultipleChoice: set.vocabularies.length >= MIN_CARDS_FOR_MULTIPLE_CHOICE,
    hasPendingReport: Boolean(pendingReport),
  };
}

// ---------------------------------------------------------------------------
// Soạn bộ thẻ — chỉ chủ bộ thẻ
// ---------------------------------------------------------------------------

export async function createSet(userId: number, input: CreateStudySetInput): Promise<StudySetSummary> {
  const set = await prisma.topic.create({
    data: {
      name: input.name,
      description: optionalText(input.description) ?? null,
      level: input.level,
      visibility: input.visibility,
      ownerId: userId,
      createdById: userId,
    },
    include: SUMMARY_INCLUDE,
  });
  return toSummary(set, userId);
}

/**
 * Sửa bộ thẻ, kể cả đổi PUBLIC ↔ PRIVATE.
 *
 * Chuyển sang PRIVATE không cần dọn gì: mọi truy vấn của người khác đã lọc qua
 * `readableSetWhere`, nên thẻ của bộ này rời khỏi nhóm ôn của họ ngay lần đọc kế tiếp,
 * còn tiến độ của họ giữ nguyên để mở công khai lại là học tiếp được.
 */
export async function updateSet(userId: number, setId: number, input: UpdateStudySetInput): Promise<StudySetSummary> {
  await findOwnedSet(userId, setId);

  const set = await prisma.topic.update({
    where: { id: setId },
    data: {
      name: input.name,
      description: optionalText(input.description),
      level: input.level,
      visibility: input.visibility,
    },
    include: SUMMARY_INCLUDE,
  });
  return toSummary(set, userId);
}

/** Xoá bộ thẻ kéo theo thẻ, tiến độ và lịch sử ôn (cascade). ActivityLog giữ nguyên. */
export async function deleteSet(userId: number, setId: number): Promise<void> {
  await findOwnedSet(userId, setId);
  await prisma.topic.delete({ where: { id: setId } });
}

export async function addCard(userId: number, setId: number, input: StudySetCardInput): Promise<StudySetCard> {
  await findOwnedSet(userId, setId);

  const card = await prisma.vocabulary.create({
    data: {
      topicId: setId,
      word: input.word,
      meaning: input.meaning,
      phonetic: optionalText(input.phonetic) ?? null,
      example: optionalText(input.example) ?? null,
    },
  });
  return toCard(card);
}

/**
 * Nhập nhiều thẻ từ file. FE đã đọc file và tách thẻ; ở đây chỉ chống trùng rồi ghi.
 *
 * Chống trùng lại ở BE chứ không tin màn xem trước: giữa lúc xem trước và lúc bấm nhập,
 * chủ bộ có thể đã thêm tay đúng thẻ đó ở tab khác. Dùng chung `cardImportKey` với FE nên
 * con số "bỏ qua" hai bên khớp nhau.
 */
export async function importCards(
  userId: number,
  setId: number,
  input: ImportStudySetCardsInput,
): Promise<ImportStudySetCardsResult> {
  await findOwnedSet(userId, setId);

  const existing = await prisma.vocabulary.findMany({ where: { topicId: setId }, select: { word: true, meaning: true } });
  const seen = new Set(existing.map((card) => cardImportKey(card.word, card.meaning)));
  const fresh = input.cards.filter((card) => {
    const key = cardImportKey(card.word, card.meaning);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (fresh.length > 0) {
    await prisma.vocabulary.createMany({
      data: fresh.map((card) => ({
        topicId: setId,
        word: card.word,
        meaning: card.meaning,
        phonetic: optionalText(card.phonetic) ?? null,
        example: optionalText(card.example) ?? null,
      })),
    });
  }

  return { created: fresh.length, skipped: input.cards.length - fresh.length };
}

async function findOwnedCard(userId: number, cardId: number): Promise<Vocabulary> {
  const card = await prisma.vocabulary.findFirst({ where: { id: cardId, topic: { ownerId: userId } } });
  if (!card) throw new NotFoundError('Không tìm thấy thẻ');
  return card;
}

export async function updateCard(userId: number, cardId: number, input: UpdateStudySetCardInput): Promise<StudySetCard> {
  await findOwnedCard(userId, cardId);

  const card = await prisma.vocabulary.update({
    where: { id: cardId },
    data: {
      word: input.word,
      meaning: input.meaning,
      phonetic: optionalText(input.phonetic),
      example: optionalText(input.example),
    },
  });
  return toCard(card);
}

export async function deleteCard(userId: number, cardId: number): Promise<void> {
  await findOwnedCard(userId, cardId);
  await prisma.vocabulary.delete({ where: { id: cardId } });
}

// ---------------------------------------------------------------------------
// Báo cáo vi phạm
// ---------------------------------------------------------------------------

export async function reportSet(userId: number, setId: number, input: ReportStudySetInput): Promise<void> {
  const set = await prisma.topic.findFirst({
    where: { AND: [{ id: setId }, publicSetWhere()] },
    select: { id: true, name: true, ownerId: true },
  });
  if (!set) throw new NotFoundError(SET_NOT_FOUND);
  if (set.ownerId === userId) throw new BadRequestError('Không thể báo cáo bộ thẻ của chính bạn');
  // Bộ "Hệ thống" do quản trị viên soạn và sửa trực tiếp — không có ai để chặn.
  if (set.ownerId === null) throw new BadRequestError('Bộ thẻ của hệ thống không nhận báo cáo');

  let reportId: number;
  try {
    const report = await prisma.studySetReport.create({
      data: {
        topicId: setId,
        reporterId: userId,
        reason: input.reason,
        pendingKey: pendingReportKey(setId, userId),
      },
      select: { id: true },
    });
    reportId = report.id;
  } catch (error) {
    // Ràng buộc unique của `pendingKey` là thứ chặn được hai lần bấm cùng lúc —
    // kiểm tra đọc-rồi-ghi thì cả hai request đều thấy "chưa báo cáo".
    if (isUniqueViolation(error)) {
      throw new ConflictError('Bạn đã báo cáo bộ thẻ này, quản trị viên đang xem xét');
    }
    throw error;
  }

  const [reporter, admins] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, username: true } }),
    prisma.user.findMany({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE }, select: { id: true } }),
  ]);

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: NotificationType.STUDY_SET_REPORTED,
        title: 'Có báo cáo vi phạm bộ thẻ',
        body: `${reporter.name} (${reporter.username}) báo cáo bộ thẻ "${set.name}": ${input.reason}`,
        link: '/admin/study-sets',
        dedupeKey: `${NotificationType.STUDY_SET_REPORTED}:${reportId}`,
      }),
    ),
  );
}
