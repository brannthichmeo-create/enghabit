import type { CreateTopicInput, UpdateTopicInput } from '@enghabit/shared';
import type { Topic, Vocabulary } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';

/** Chủ đề học — user chỉ đọc, admin quản lý (CRUD qua module admin). */

export async function listTopics(): Promise<(Topic & { vocabularyCount: number })[]> {
  const topics = await prisma.topic.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { vocabularies: true } } },
  });

  return topics.map(({ _count, ...topic }) => ({ ...topic, vocabularyCount: _count.vocabularies }));
}

export async function getTopic(topicId: number): Promise<Topic> {
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) throw new NotFoundError('Không tìm thấy chủ đề');
  return topic;
}

/**
 * Từ vựng của một chủ đề, kèm cờ cho biết user đã đưa từ đó vào danh sách học chưa
 * để UI hiển thị đúng nút "Học từ này" / "Đã học".
 */
export async function listVocabularyByTopic(
  topicId: number,
  userId: number,
): Promise<(Vocabulary & { isLearning: boolean })[]> {
  await getTopic(topicId);

  const vocabularies = await prisma.vocabulary.findMany({
    where: { topicId },
    orderBy: { word: 'asc' },
    include: { progress: { where: { userId }, select: { id: true } } },
  });

  return vocabularies.map(({ progress, ...vocab }) => ({ ...vocab, isLearning: progress.length > 0 }));
}

export async function createTopic(input: CreateTopicInput, createdById: number): Promise<Topic> {
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
