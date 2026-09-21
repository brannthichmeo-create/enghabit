import { AdminAction, StudySetVisibility, type CreateTopicInput, type UpdateTopicInput } from '@enghabit/shared';
import type { Topic, Vocabulary } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { createdFields, diffFields, recordAdminAction } from '../admin/admin-audit.service.js';

/**
 * Bộ thẻ "Hệ thống" — do quản trị viên soạn ở /admin/content.
 *
 * Module này CHỈ đụng tới bộ có `ownerId` null. Bộ người học tự tạo nằm ở module
 * `library`; quản trị viên không sửa được chúng, chỉ chặn được qua kiểm duyệt.
 */

export async function listTopics(): Promise<(Topic & { vocabularyCount: number })[]> {
  const topics = await prisma.topic.findMany({
    where: { ownerId: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { vocabularies: true } } },
  });

  return topics.map(({ _count, ...topic }) => ({ ...topic, vocabularyCount: _count.vocabularies }));
}

/** Tìm bộ "Hệ thống". Bộ của người học trả 404 như thể không tồn tại với khu quản trị. */
export async function getTopic(topicId: number): Promise<Topic> {
  const topic = await prisma.topic.findFirst({ where: { id: topicId, ownerId: null } });
  if (!topic) throw new NotFoundError('Không tìm thấy chủ đề');
  return topic;
}

export async function listVocabularyByTopic(topicId: number): Promise<Vocabulary[]> {
  await getTopic(topicId);
  return prisma.vocabulary.findMany({ where: { topicId }, orderBy: { word: 'asc' } });
}

/** Các trường của chủ đề được so trong nhật ký thao tác khi sửa. */
const TOPIC_FIELDS = ['name', 'description', 'level'] as const;

/** Mô tả để trống nghĩa là "không có mô tả" — lưu null, như bộ thẻ của người học. */
function normalizeTopicInput<T extends { description?: string }>(input: T): T & { description?: string | null } {
  return input.description === undefined ? input : { ...input, description: input.description || null };
}

export async function createTopic(rawInput: CreateTopicInput, createdById: number): Promise<Topic> {
  const input = normalizeTopicInput(rawInput);
  return prisma.$transaction(async (tx) => {
    // ownerId để null: bộ quản trị viên tạo là bộ "Hệ thống", không thuộc tài khoản nào.
    // Bộ "Hệ thống" LUÔN công khai — ghi tường minh thay vì dựa vào giá trị mặc định của
    // cột: đổi mặc định về sau thì bộ mới của quản trị viên sẽ lặng lẽ biến khỏi Thư viện.
    const topic = await tx.topic.create({
      data: { ...input, visibility: StudySetVisibility.PUBLIC, createdById },
    });
    await recordAdminAction(
      {
        actorId: createdById,
        action: AdminAction.TOPIC_CREATED,
        targetId: topic.id,
        targetLabel: topic.name,
        changes: createdFields(input, TOPIC_FIELDS),
      },
      tx,
    );
    return topic;
  });
}

export async function updateTopic(topicId: number, rawInput: UpdateTopicInput, actorId: number): Promise<Topic> {
  const input = normalizeTopicInput(rawInput);
  const before = await getTopic(topicId);
  const changes = diffFields(before, input, TOPIC_FIELDS);

  return prisma.$transaction(async (tx) => {
    const topic = await tx.topic.update({ where: { id: topicId }, data: input });
    if (changes) {
      await recordAdminAction(
        { actorId, action: AdminAction.TOPIC_UPDATED, targetId: topicId, targetLabel: topic.name, changes },
        tx,
      );
    }
    return topic;
  });
}

export async function deleteTopic(topicId: number, actorId: number): Promise<void> {
  const topic = await getTopic(topicId);
  const cardCount = await prisma.vocabulary.count({ where: { topicId } });

  await prisma.$transaction(async (tx) => {
    await recordAdminAction(
      {
        actorId,
        action: AdminAction.TOPIC_DELETED,
        targetId: topicId,
        targetLabel: topic.name,
        // Xoá chủ đề là xoá luôn toàn bộ từ vựng trong đó — ghi lại số lượng để biết
        // lần xoá này đã mất bao nhiêu thẻ.
        changes: { vocabularyCount: { from: cardCount, to: null } },
      },
      tx,
    );
    await tx.topic.delete({ where: { id: topicId } });
  });
}
