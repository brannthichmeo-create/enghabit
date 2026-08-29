import {
  ActivityType,
  MAX_FLASHCARDS_PER_SESSION,
  initialSrsState,
  reviewCard,
  todayLocalDate,
  type ReviewFlashcardInput,
  type SrsState,
} from '@enghabit/shared';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';

/**
 * Ôn tập flashcard theo SM-2.
 * Thuật toán nằm ở @enghabit/shared/srs — module này chỉ lo đọc/ghi DB và ghi ActivityLog.
 */

export interface DueCard {
  vocabularyId: number;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  audioUrl: string | null;
  topicName: string;
}

/** Danh sách từ tới hạn ôn hôm nay. */
export async function getDueCards(userId: number, timezone: string, limit = MAX_FLASHCARDS_PER_SESSION): Promise<DueCard[]> {
  const today = todayLocalDate(timezone);

  const rows = await prisma.userVocabProgress.findMany({
    where: { userId, nextReviewDate: { lte: toDbDate(today) } },
    include: { vocabulary: { include: { topic: { select: { name: true } } } } },
    orderBy: { nextReviewDate: 'asc' },
    take: limit,
  });

  return rows.map((row) => ({
    vocabularyId: row.vocabularyId,
    word: row.vocabulary.word,
    meaning: row.vocabulary.meaning,
    phonetic: row.vocabulary.phonetic,
    example: row.vocabulary.example,
    audioUrl: row.vocabulary.audioUrl,
    topicName: row.vocabulary.topic.name,
  }));
}

/**
 * Ghi nhận kết quả một lần ôn: cập nhật trạng thái SRS + ghi ActivityLog trong cùng transaction.
 */
export async function submitReview(
  userId: number,
  timezone: string,
  input: ReviewFlashcardInput,
): Promise<SrsState> {
  const today = todayLocalDate(timezone);

  const progress = await prisma.userVocabProgress.findUnique({
    where: { userId_vocabularyId: { userId, vocabularyId: input.vocabularyId } },
  });
  if (!progress) throw new NotFoundError('Từ này chưa nằm trong danh sách học của bạn');

  const next = reviewCard(
    {
      repetitions: progress.repetitions,
      intervalDays: progress.intervalDays,
      easeFactor: progress.easeFactor,
      nextReviewDate: fromDbDate(progress.nextReviewDate),
    },
    input.quality,
    today,
  );

  await prisma.$transaction(async (tx) => {
    await tx.userVocabProgress.update({
      where: { id: progress.id },
      data: {
        repetitions: next.repetitions,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        nextReviewDate: toDbDate(next.nextReviewDate),
        lastReviewedAt: new Date(),
      },
    });

    await recordActivity({
      userId,
      type: ActivityType.FLASHCARD_REVIEWED,
      refId: input.vocabularyId,
      timezone,
      tx,
    });
  });

  return next;
}

/** Đưa một từ vào danh sách học — tạo bản ghi tiến độ SRS ban đầu. */
export async function learnVocabulary(userId: number, timezone: string, vocabularyId: number): Promise<SrsState> {
  const vocabulary = await prisma.vocabulary.findUnique({ where: { id: vocabularyId } });
  if (!vocabulary) throw new NotFoundError('Không tìm thấy từ vựng');

  const today = todayLocalDate(timezone);
  const initial = initialSrsState(today);

  await prisma.$transaction(async (tx) => {
    await tx.userVocabProgress.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      create: {
        userId,
        vocabularyId,
        repetitions: initial.repetitions,
        intervalDays: initial.intervalDays,
        easeFactor: initial.easeFactor,
        nextReviewDate: toDbDate(initial.nextReviewDate),
      },
      // Đã học rồi thì giữ nguyên tiến độ, không reset về đầu.
      update: {},
    });

    await recordActivity({
      userId,
      type: ActivityType.VOCAB_LEARNED,
      refId: vocabularyId,
      timezone,
      tx,
    });
  });

  return initial;
}

/** Đếm số từ tới hạn ôn — dùng cho badge trên UI. */
export async function countDueCards(userId: number, timezone: string): Promise<number> {
  return prisma.userVocabProgress.count({
    where: { userId, nextReviewDate: { lte: toDbDate(todayLocalDate(timezone)) } },
  });
}
