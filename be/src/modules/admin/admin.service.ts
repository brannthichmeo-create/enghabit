import type {
  CreateQuizInput,
  CreateQuizQuestionInput,
  CreateVocabularyInput,
  PaginationInput,
  Paginated,
  PublicUser,
  UpdateVocabularyInput,
} from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { toPublicUser } from '../auth/auth.service.js';

/**
 * Nghiệp vụ quản trị. Phần nào đã có ở module khác thì tái dùng service của module đó
 * (vd topic.service) thay vì viết lại query — xem CLAUDE.md > Quy tắc tái sử dụng code.
 */

export async function listUsers(pagination: PaginationInput): Promise<Paginated<PublicUser>> {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.user.count(),
  ]);

  return {
    items: users.map(toPublicUser),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}

export async function deleteUser(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');
  await prisma.user.delete({ where: { id: userId } });
}

export async function createVocabulary(input: CreateVocabularyInput) {
  return prisma.vocabulary.create({ data: input });
}

export async function updateVocabulary(vocabularyId: number, input: UpdateVocabularyInput) {
  return prisma.vocabulary.update({ where: { id: vocabularyId }, data: input });
}

export async function deleteVocabulary(vocabularyId: number): Promise<void> {
  await prisma.vocabulary.delete({ where: { id: vocabularyId } });
}

export async function createQuiz(input: CreateQuizInput) {
  return prisma.quiz.create({ data: input });
}

export async function addQuizQuestion(quizId: number, input: CreateQuizQuestionInput) {
  return prisma.quizQuestion.create({
    data: {
      quizId,
      questionText: input.questionText,
      options: input.options,
      correctIndex: input.correctIndex,
    },
  });
}

export async function deleteQuizQuestion(questionId: number): Promise<void> {
  await prisma.quizQuestion.delete({ where: { id: questionId } });
}

/** Thống kê toàn hệ thống cho trang quản trị. */
export async function getSystemStats() {
  const [userCount, topicCount, vocabularyCount, quizCount, activityCount, activeToday] = await Promise.all([
    prisma.user.count(),
    prisma.topic.count(),
    prisma.vocabulary.count(),
    prisma.quiz.count(),
    prisma.activityLog.count(),
    // Số user có hoạt động trong 7 ngày gần nhất (tính theo localDate của chính họ).
    prisma.activityLog
      .findMany({
        where: { occurredAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
        select: { userId: true },
        distinct: ['userId'],
      })
      .then((rows) => rows.length),
  ]);

  return { userCount, topicCount, vocabularyCount, quizCount, activityCount, activeLast7Days: activeToday };
}
