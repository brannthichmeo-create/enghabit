import type { CreateTopicInput, UpdateTopicInput } from '@enghabit/shared';
import type { Topic, Vocabulary } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';

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

export async function createTopic(input: CreateTopicInput, createdById: number): Promise<Topic> {
  // ownerId để null: bộ quản trị viên tạo là bộ "Hệ thống", không thuộc tài khoản nào.
  return prisma.topic.create({ data: { ...input, createdById } });
}

export async function updateTopic(topicId: number, input: UpdateTopicInput): Promise<Topic> {
  await getTopic(topicId);
  return prisma.topic.update({ where: { id: topicId }, data: input });
}

export async function deleteTopic(topicId: number): Promise<void> {
  await getTopic(topicId);
  await prisma.topic.delete({ where: { id: topicId } });
}
