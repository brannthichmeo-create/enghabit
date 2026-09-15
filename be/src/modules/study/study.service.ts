import {
  ActivityType,
  ChoiceDirection,
  FeatureKey,
  MIN_CARDS_FOR_MULTIPLE_CHOICE,
  RATING_QUALITY,
  StudyGroup,
  StudyMode,
  StudySource,
  WEAK_MIN_LAPSES,
  accuracyPercent,
  applyAnswerCounters,
  buildMultipleChoice,
  dueStatusOf,
  initialSrsState,
  isMastered,
  isPassingQuality,
  isWeakCard,
  pickDirection,
  qualityForMultipleChoice,
  reviewCard,
  shuffle,
  todayLocalDate,
  type AnswerResult,
  type CardReviewRow,
  type ChoiceCard,
  type FinishSessionResult,
  type LocalDate,
  type Paginated,
  type ReviewHistoryQueryInput,
  type ReviewQuality,
  type StudyOverview,
  type StudyQuestion,
  type StudyQuestionsInput,
  type StudyQuestionsResult,
  type StudySetProgress,
  type StudyStats,
  type SubmitAnswerInput,
} from '@enghabit/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';
import { isUniqueViolation } from '../../common/utils/prisma-error.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';
import * as featureService from '../feature-flags/feature.service.js';
import { findReadableSet, readableSetWhere, startedSetWhere } from '../library/library.access.js';
import { attemptKeyOf, decodeQuestionToken, encodeQuestionToken, type QuestionTokenPayload } from './question-token.js';

/**
 * Học, Ôn tập và Cram Mode.
 *
 * Ba luồng dùng chung một cách lấy thẻ và một cách chấm; khác nhau ở chỗ kết quả có được
 * ghi hay không (`StudySource`). Thuật toán giãn cách là SM-2 của `shared/srs` — ở đây
 * chỉ gọi `reviewCard()`, không tự viết công thức (BR-SRS-01).
 *
 * Một thẻ có MỘT trạng thái nhớ duy nhất (`UserVocabProgress`) dù được làm ở Học hay Ôn
 * tập. Đặc tả: docs/ke-hoach-hoc-on-flashcard.md.
 */

// ---------------------------------------------------------------------------
// Dùng chung
// ---------------------------------------------------------------------------

const CARD_SELECT = {
  id: true,
  word: true,
  meaning: true,
  phonetic: true,
  example: true,
  topicId: true,
  topic: { select: { name: true } },
} satisfies Prisma.VocabularySelect;

type CardRow = Prisma.VocabularyGetPayload<{ select: typeof CARD_SELECT }>;

const COUNTER_SELECT = {
  nextReviewDate: true,
  repetitions: true,
  intervalDays: true,
  lapses: true,
  correctCount: true,
  wrongCount: true,
} satisfies Prisma.UserVocabProgressSelect;

type ProgressCounters = Prisma.UserVocabProgressGetPayload<{ select: typeof COUNTER_SELECT }>;

/**
 * Nhóm Yếu cần tỷ lệ sai, thứ Prisma không biểu diễn được trong `where`. Lọc thô bằng
 * điều kiện cần (đã quên hoặc đã sai ít nhất một lần) rồi áp `isWeakCard` ở đây.
 * Trần số dòng để một người học rất nhiều thẻ không kéo cả bảng về.
 */
const WEAK_CANDIDATE_LIMIT = 1000;

/** Học tắt thì Học trả 404; Ôn tập tắt thì Ôn tập và Cram trả 404 — như `requireFeature`. */
async function assertSourceEnabled(source: StudySource): Promise<void> {
  const key = source === StudySource.LEARN ? FeatureKey.LEARN : FeatureKey.FLASHCARDS;
  if (!(await featureService.isEnabled(key))) throw new NotFoundError();
}

async function findWeak(
  userId: number,
  topic: Prisma.TopicWhereInput,
): Promise<(ProgressCounters & { vocabulary: CardRow })[]> {
  const rows = await prisma.userVocabProgress.findMany({
    where: {
      userId,
      vocabulary: { topic },
      OR: [{ lapses: { gte: WEAK_MIN_LAPSES } }, { wrongCount: { gte: 1 } }],
    },
    select: { ...COUNTER_SELECT, vocabulary: { select: CARD_SELECT } },
    orderBy: [{ lapses: 'desc' }, { wrongCount: 'desc' }],
    take: WEAK_CANDIDATE_LIMIT,
  });
  return rows.filter(isWeakCard);
}

/** Tiến độ của một người trên một tập thẻ. Dùng cho trang chi tiết bộ thẻ và thống kê. */
export function summarizeProgress(total: number, rows: ProgressCounters[], today: LocalDate): StudySetProgress {
  let due = 0;
  let overdue = 0;
  let weak = 0;
  let mastered = 0;

  for (const row of rows) {
    const status = dueStatusOf(fromDbDate(row.nextReviewDate), today);
    if (status === 'DUE') due += 1;
    if (status === 'OVERDUE') overdue += 1;
    if (isWeakCard(row)) weak += 1;
    if (isMastered(row)) mastered += 1;
  }

  return { total, new: Math.max(0, total - rows.length), due, overdue, weak, mastered };
}

// ---------------------------------------------------------------------------
// Phát đề
// ---------------------------------------------------------------------------

async function selectCards(userId: number, today: LocalDate, input: StudyQuestionsInput): Promise<CardRow[]> {
  const topic: Prisma.TopicWhereInput = input.setId !== undefined ? { id: input.setId } : readableSetWhere(userId);
  const todayDb = toDbDate(today);

  switch (input.group) {
    case StudyGroup.NEW: {
      // Ôn tập không chọn bộ: "Mới" chỉ lấy trong các bộ đã bắt đầu học. Lấy mọi thẻ chưa
      // học của mọi bộ công khai là đổ cả thư viện vào mặt người học.
      const newTopic = input.setId !== undefined ? topic : startedSetWhere(userId);
      return prisma.vocabulary.findMany({
        where: { topic: newTopic, progress: { none: { userId } } },
        select: CARD_SELECT,
        orderBy: { id: 'asc' },
        take: input.limit,
      });
    }

    case StudyGroup.DUE:
    case StudyGroup.OVERDUE: {
      const rows = await prisma.userVocabProgress.findMany({
        where: {
          userId,
          nextReviewDate: input.group === StudyGroup.DUE ? todayDb : { lt: todayDb },
          vocabulary: { topic },
        },
        select: { vocabulary: { select: CARD_SELECT } },
        orderBy: [{ nextReviewDate: 'asc' }, { id: 'asc' }],
        take: input.limit,
      });
      return rows.map((row) => row.vocabulary);
    }

    case StudyGroup.WEAK: {
      const rows = await findWeak(userId, topic);
      return rows.slice(0, input.limit).map((row) => row.vocabulary);
    }

    case StudyGroup.ALL: {
      const rows = await prisma.vocabulary.findMany({ where: { topic }, select: CARD_SELECT });
      return shuffle(rows).slice(0, input.limit);
    }
  }
}

export async function getQuestions(
  userId: number,
  timezone: string,
  input: StudyQuestionsInput,
): Promise<StudyQuestionsResult> {
  await assertSourceEnabled(input.source);
  if (input.setId !== undefined) await findReadableSet(userId, input.setId);

  if (input.mode === StudyMode.MULTIPLE_CHOICE && input.setId !== undefined) {
    const total = await prisma.vocabulary.count({ where: { topicId: input.setId } });
    if (total < MIN_CARDS_FOR_MULTIPLE_CHOICE) {
      throw new BadRequestError(`Bộ thẻ cần ít nhất ${MIN_CARDS_FOR_MULTIPLE_CHOICE} thẻ để làm trắc nghiệm`);
    }
  }

  const cards = await selectCards(userId, todayLocalDate(timezone), input);

  if (input.mode === StudyMode.FLASHCARD) {
    return {
      questions: cards.map((card) => ({
        kind: StudyMode.FLASHCARD,
        token: encodeQuestionToken({ userId, cardId: card.id, source: input.source, mode: StudyMode.FLASHCARD }),
        setId: card.topicId,
        setName: card.topic.name,
        word: card.word,
        meaning: card.meaning,
        phonetic: card.phonetic,
        example: card.example,
      })),
      skipped: 0,
    };
  }

  // Phương án nhiễu lấy từ CÙNG bộ của từng thẻ — Ôn tập trộn nhiều bộ thì mỗi thẻ dùng
  // bộ của chính nó, nhiễu khác chủ đề thì đoán ra ngay.
  const topicIds = [...new Set(cards.map((card) => card.topicId))];
  const poolRows =
    topicIds.length === 0
      ? []
      : await prisma.vocabulary.findMany({
          where: { topicId: { in: topicIds } },
          select: { id: true, word: true, meaning: true, topicId: true },
        });

  const pools = new Map<number, ChoiceCard[]>();
  for (const row of poolRows) {
    const pool = pools.get(row.topicId) ?? [];
    pool.push(row);
    pools.set(row.topicId, pool);
  }

  const questions: StudyQuestion[] = [];
  let skipped = 0;

  for (const card of cards) {
    const question = buildMultipleChoice(card, pools.get(card.topicId) ?? [], pickDirection());
    if (!question) {
      skipped += 1;
      continue;
    }

    questions.push({
      kind: StudyMode.MULTIPLE_CHOICE,
      token: encodeQuestionToken({
        userId,
        cardId: card.id,
        source: input.source,
        mode: StudyMode.MULTIPLE_CHOICE,
        direction: question.direction,
        correctIndex: question.correctIndex,
      }),
      setId: card.topicId,
      setName: card.topic.name,
      direction: question.direction,
      prompt: question.prompt,
      phonetic: question.direction === ChoiceDirection.WORD_TO_MEANING ? card.phonetic : null,
      options: question.options,
    });
  }

  return { questions, skipped };
}

// ---------------------------------------------------------------------------
// Chấm
// ---------------------------------------------------------------------------

interface Graded {
  quality: ReviewQuality;
  isCorrect: boolean;
  /** Giá trị trả về cho client — null ở chế độ Flashcard vì người học tự chấm. */
  shownCorrect: boolean | null;
  correctIndex: number | null;
  correctAnswer: string;
}

function grade(
  payload: QuestionTokenPayload,
  input: SubmitAnswerInput,
  card: { word: string; meaning: string },
): Graded {
  if (payload.mode === StudyMode.FLASHCARD) {
    if (input.rating === undefined) throw new BadRequestError('Thẻ này cần chọn mức nhớ');
    const quality = RATING_QUALITY[input.rating];
    return {
      quality,
      isCorrect: isPassingQuality(quality),
      shownCorrect: null,
      correctIndex: null,
      correctAnswer: card.meaning,
    };
  }

  if (input.choiceIndex === undefined || payload.correctIndex === undefined) {
    throw new BadRequestError('Câu trắc nghiệm cần chọn một phương án');
  }
  const isCorrect = input.choiceIndex === payload.correctIndex;
  return {
    quality: qualityForMultipleChoice(isCorrect),
    isCorrect,
    shownCorrect: isCorrect,
    correctIndex: payload.correctIndex,
    correctAnswer: payload.direction === ChoiceDirection.MEANING_TO_WORD ? card.word : card.meaning,
  };
}

async function duplicateResult(userId: number, cardId: number, attemptKey: string, graded: Graded): Promise<AnswerResult | null> {
  const [review, progress] = await Promise.all([
    prisma.cardReview.findUnique({ where: { userId_attemptKey: { userId, attemptKey } } }),
    prisma.userVocabProgress.findUnique({ where: { userId_vocabularyId: { userId, vocabularyId: cardId } } }),
  ]);
  if (!review) return null;

  return {
    // Lần gửi đầu mới là kết quả thật — trả lại đúng nó, không chấm theo lần gửi lặp.
    isCorrect: graded.shownCorrect === null ? null : review.isCorrect,
    correctIndex: graded.correctIndex,
    correctAnswer: graded.correctAnswer,
    nextReviewDate: progress ? fromDbDate(progress.nextReviewDate) : null,
    intervalDays: review.intervalAfter,
    duplicate: true,
  };
}

/**
 * Chấm một câu và ghi ngay (không có bước nộp cả phiên — D-14).
 *
 * Trong CÙNG transaction: ghi lịch sử, cập nhật SRS + bộ đếm, ghi ActivityLog. Thẻ chưa
 * từng học ghi `VOCAB_LEARNED`, thẻ đã có lịch ôn ghi `FLASHCARD_REVIEWED` — nhờ vậy mục
 * tiêu "số từ mỗi ngày" và nhiệm vụ ngày vẫn đếm đúng như trước.
 */
export async function submitAnswer(userId: number, timezone: string, input: SubmitAnswerInput): Promise<AnswerResult> {
  const payload = decodeQuestionToken(input.token, userId);
  await assertSourceEnabled(payload.source);

  // Kiểm tra quyền LẠI lúc nộp: bộ có thể vừa chuyển riêng tư, bị chặn, hoặc bị xoá
  // trong lúc người học đang làm.
  const card = await prisma.vocabulary.findFirst({
    where: { id: payload.cardId, topic: readableSetWhere(userId) },
    select: { id: true, word: true, meaning: true },
  });
  if (!card) throw new NotFoundError('Thẻ này không còn truy cập được');

  const graded = grade(payload, input, card);

  // Cram Mode: chấm để người học biết đúng sai, nhưng không ghi gì cả (BR-CRAM-02).
  if (payload.source === StudySource.CRAM) {
    return {
      isCorrect: graded.shownCorrect,
      correctIndex: graded.correctIndex,
      correctAnswer: graded.correctAnswer,
      nextReviewDate: null,
      intervalDays: null,
      duplicate: false,
    };
  }

  const attemptKey = attemptKeyOf(input.token);
  const earlier = await duplicateResult(userId, card.id, attemptKey, graded);
  if (earlier) return earlier;

  const today = todayLocalDate(timezone);

  try {
    return await prisma.$transaction(async (tx) => {
      const progress = await tx.userVocabProgress.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: card.id } },
      });

      const before = progress
        ? {
            repetitions: progress.repetitions,
            intervalDays: progress.intervalDays,
            easeFactor: progress.easeFactor,
            nextReviewDate: fromDbDate(progress.nextReviewDate),
          }
        : initialSrsState(today);
      const next = reviewCard(before, graded.quality, today);
      const counters = applyAnswerCounters(progress ?? { lapses: 0, correctCount: 0, wrongCount: 0 }, graded.quality);

      // Ghi lịch sử TRƯỚC: gửi trùng thì vấp unique ngay ở đây, chưa kịp đụng tới SRS.
      await tx.cardReview.create({
        data: {
          userId,
          vocabularyId: card.id,
          mode: payload.mode,
          isCorrect: graded.isCorrect,
          quality: graded.quality,
          responseMs: input.responseMs ?? null,
          intervalBefore: before.intervalDays,
          intervalAfter: next.intervalDays,
          attemptKey,
          sessionKey: payload.source === StudySource.LEARN ? (input.sessionKey ?? null) : null,
        },
      });

      const data = {
        repetitions: next.repetitions,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        nextReviewDate: toDbDate(next.nextReviewDate),
        lastReviewedAt: new Date(),
        ...counters,
      };
      if (progress) {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data });
      } else {
        await tx.userVocabProgress.create({ data: { userId, vocabularyId: card.id, ...data } });
      }

      await recordActivity({
        userId,
        type: progress ? ActivityType.FLASHCARD_REVIEWED : ActivityType.VOCAB_LEARNED,
        refId: card.id,
        timezone,
        tx,
      });

      return {
        isCorrect: graded.shownCorrect,
        correctIndex: graded.correctIndex,
        correctAnswer: graded.correctAnswer,
        nextReviewDate: next.nextReviewDate,
        intervalDays: next.intervalDays,
        duplicate: false,
      };
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const repeated = await duplicateResult(userId, card.id, attemptKey, graded);
    if (repeated) return repeated;
    // Trùng ở bảng tiến độ: hai câu KHÁC NHAU của cùng một thẻ mới được nộp cùng lúc.
    throw new ConflictError('Thẻ này đang được ghi, hãy thử lại');
  }
}

/**
 * Kết thúc một phiên Học: ghi thêm một dòng `QUIZ_COMPLETED` (D-19) — nguồn của mục
 * tiêu "số phiên học mỗi tuần".
 *
 * Số câu và số đúng đọc lại từ `card_reviews`, không nhận từ client. `dedupeKey` chặn
 * bấm kết thúc hai lần thành hai phiên.
 */
export async function finishSession(userId: number, timezone: string, sessionKey: string): Promise<FinishSessionResult> {
  await assertSourceEnabled(StudySource.LEARN);

  const reviews = await prisma.cardReview.findMany({
    where: { userId, sessionKey },
    select: { isCorrect: true, vocabulary: { select: { topicId: true } } },
  });

  const answered = reviews.length;
  const correct = reviews.filter((review) => review.isCorrect).length;
  if (answered === 0) return { logged: false, answered, correct };

  const dedupeKey = `SESSION:${sessionKey}`;
  const existing = await prisma.activityLog.findFirst({ where: { userId, dedupeKey }, select: { id: true } });
  if (existing) return { logged: false, answered, correct };

  try {
    await recordActivity({
      userId,
      type: ActivityType.QUIZ_COMPLETED,
      refId: reviews[0]?.vocabulary.topicId,
      value: correct,
      timezone,
      dedupeKey,
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { logged: false, answered, correct };
    throw error;
  }

  return { logged: true, answered, correct };
}

// ---------------------------------------------------------------------------
// Tổng quan, thống kê, lịch sử
// ---------------------------------------------------------------------------

async function nextUpcomingReview(userId: number, today: LocalDate): Promise<LocalDate | null> {
  const row = await prisma.userVocabProgress.findFirst({
    where: { userId, nextReviewDate: { gt: toDbDate(today) }, vocabulary: { topic: readableSetWhere(userId) } },
    orderBy: { nextReviewDate: 'asc' },
    select: { nextReviewDate: true },
  });
  return row ? fromDbDate(row.nextReviewDate) : null;
}

/** Bốn nhóm của màn Ôn tập, trên mọi bộ người học đang học. */
export async function getOverview(userId: number, timezone: string): Promise<StudyOverview> {
  await assertSourceEnabled(StudySource.REVIEW);

  const today = todayLocalDate(timezone);
  const todayDb = toDbDate(today);
  const topic = readableSetWhere(userId);

  const [due, overdue, weak, fresh, nextReviewDate] = await Promise.all([
    prisma.userVocabProgress.count({ where: { userId, nextReviewDate: todayDb, vocabulary: { topic } } }),
    prisma.userVocabProgress.count({ where: { userId, nextReviewDate: { lt: todayDb }, vocabulary: { topic } } }),
    findWeak(userId, topic),
    prisma.vocabulary.count({ where: { topic: startedSetWhere(userId), progress: { none: { userId } } } }),
    nextUpcomingReview(userId, today),
  ]);

  return { new: fresh, due, overdue, weak: weak.length, nextReviewDate };
}

/**
 * Số thẻ cần ôn hôm nay (tới hạn + quá hạn). Dùng cho huy hiệu sidebar, thẻ "Việc hôm
 * nay" và cron nhắc nhở — KHÔNG kiểm tra cờ tính năng, chỗ gọi tự kiểm tra.
 */
export async function countDueCards(userId: number, timezone: string): Promise<number> {
  return prisma.userVocabProgress.count({
    where: {
      userId,
      nextReviewDate: { lte: toDbDate(todayLocalDate(timezone)) },
      vocabulary: { topic: readableSetWhere(userId) },
    },
  });
}

export async function getDueCount(userId: number, timezone: string): Promise<number> {
  await assertSourceEnabled(StudySource.REVIEW);
  return countDueCards(userId, timezone);
}

export async function getStats(userId: number, timezone: string): Promise<StudyStats> {
  const today = todayLocalDate(timezone);
  const topic = readableSetWhere(userId);
  const learnWhere: Prisma.CardReviewWhereInput = { userId, sessionKey: { not: null } };

  const [sessions, learnAggregate, learnCorrect, totalReviews, totalCorrect, progressRows, weak, nextReviewDate] =
    await Promise.all([
      prisma.activityLog.count({
        where: { userId, type: ActivityType.QUIZ_COMPLETED, dedupeKey: { startsWith: 'SESSION:' } },
      }),
      prisma.cardReview.aggregate({ where: learnWhere, _count: { _all: true }, _sum: { responseMs: true } }),
      prisma.cardReview.count({ where: { ...learnWhere, isCorrect: true } }),
      prisma.cardReview.count({ where: { userId } }),
      prisma.cardReview.count({ where: { userId, isCorrect: true } }),
      prisma.userVocabProgress.findMany({ where: { userId, vocabulary: { topic } }, select: COUNTER_SELECT }),
      findWeak(userId, topic),
      nextUpcomingReview(userId, today),
    ]);

  const summary = summarizeProgress(progressRows.length, progressRows, today);
  const answered = learnAggregate._count._all;

  return {
    learning: {
      sessions,
      cardsLearned: progressRows.length,
      answered,
      correct: learnCorrect,
      wrong: answered - learnCorrect,
      accuracy: accuracyPercent(learnCorrect, answered),
      timeMs: learnAggregate._sum.responseMs ?? 0,
    },
    review: {
      totalReviews,
      due: summary.due,
      overdue: summary.overdue,
      weak: weak.length,
      mastered: summary.mastered,
      learning: progressRows.length - summary.mastered,
      accuracy: accuracyPercent(totalCorrect, totalReviews),
      nextReviewDate,
    },
  };
}

export async function listHistory(userId: number, query: ReviewHistoryQueryInput): Promise<Paginated<CardReviewRow>> {
  // Thẻ của bộ đã chuyển riêng tư hoặc bị chặn cũng rời khỏi lịch sử của người khác.
  const where: Prisma.CardReviewWhereInput = { userId, vocabulary: { topic: readableSetWhere(userId) } };

  const [rows, total] = await Promise.all([
    prisma.cardReview.findMany({
      where,
      orderBy: { reviewedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { vocabulary: { select: { word: true, meaning: true, topicId: true, topic: { select: { name: true } } } } },
    }),
    prisma.cardReview.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      setId: row.vocabulary.topicId,
      setName: row.vocabulary.topic.name,
      word: row.vocabulary.word,
      meaning: row.vocabulary.meaning,
      mode: row.mode,
      isCorrect: row.isCorrect,
      intervalBefore: row.intervalBefore,
      intervalAfter: row.intervalAfter,
      reviewedAt: row.reviewedAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
