import { ActivityType, type QuizResult, type SubmitQuizInput } from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';

/** Câu hỏi trả về cho người làm bài — KHÔNG chứa correctIndex. */
export interface PublicQuizQuestion {
  id: number;
  questionText: string;
  options: string[];
}

export async function listQuizzes(topicId?: number) {
  return prisma.quiz.findMany({
    where: topicId ? { topicId } : {},
    include: {
      topic: { select: { id: true, name: true } },
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Lấy đề bài. Đáp án đúng bị loại bỏ ở tầng service — không bao giờ rời khỏi backend
 * trước khi user nộp bài.
 */
export async function getQuizForAttempt(
  quizId: number,
): Promise<{ id: number; title: string; questions: PublicQuizQuestion[] }> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { id: 'asc' } } },
  });
  if (!quiz) throw new NotFoundError('Không tìm thấy bài quiz');

  return {
    id: quiz.id,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options as string[],
    })),
  };
}

/** Chấm bài và ghi ActivityLog trong cùng transaction. */
export async function submitQuiz(
  userId: number,
  quizId: number,
  timezone: string,
  input: SubmitQuizInput,
): Promise<QuizResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { select: { id: true, correctIndex: true } } },
  });
  if (!quiz) throw new NotFoundError('Không tìm thấy bài quiz');

  const correctByQuestion = new Map(quiz.questions.map((q) => [q.id, q.correctIndex]));

  const details = input.answers
    .filter((answer) => correctByQuestion.has(answer.questionId))
    .map((answer) => {
      const correctIndex = correctByQuestion.get(answer.questionId) as number;
      return {
        questionId: answer.questionId,
        selectedIndex: answer.selectedIndex,
        correctIndex,
        isCorrect: answer.selectedIndex === correctIndex,
      };
    });

  const score = details.filter((d) => d.isCorrect).length;
  const total = quiz.questions.length;

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.quizAttempt.create({
      data: { userId, quizId, score, total, answers: details },
    });

    await recordActivity({
      userId,
      type: ActivityType.QUIZ_COMPLETED,
      refId: quizId,
      value: score,
      timezone,
      tx,
    });

    return created;
  });

  return {
    attemptId: attempt.id,
    score,
    total,
    percentage: total === 0 ? 0 : Math.round((score / total) * 100),
    details,
  };
}

export async function listAttempts(userId: number, quizId?: number) {
  return prisma.quizAttempt.findMany({
    where: { userId, ...(quizId ? { quizId } : {}) },
    include: { quiz: { select: { id: true, title: true } } },
    orderBy: { completedAt: 'desc' },
    take: 50,
  });
}
