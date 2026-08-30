import {
  ActivityType,
  ExerciseType,
  LESSON_PASS_RATIO,
  WORDS_PER_LESSON,
  type LessonDetail,
  type LessonResult,
  type MistakeItem,
  type PathTopic,
  type SubmitLessonInput,
} from '@enghabit/shared';
import type { Prisma, Vocabulary } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';
import { generateLessonExercises } from './exercise-generator.js';

/**
 * Lộ trình học và bài tập.
 *
 * Bài học là đơn vị DẪN XUẤT: chia danh sách từ vựng của chủ đề thành từng nhóm
 * WORDS_PER_LESSON từ, theo thứ tự id. DB chỉ lưu tiến độ (LessonProgress) và lỗi
 * sai (Mistake) — thêm từ vựng là lộ trình tự dài ra, không cần migrate.
 */

/** Lộ trình đầy đủ: các chủ đề, mỗi chủ đề gồm danh sách bài và trạng thái mở khoá. */
export async function getPath(userId: number): Promise<PathTopic[]> {
  const [topics, progress] = await Promise.all([
    prisma.topic.findMany({
      orderBy: [{ level: 'asc' }, { id: 'asc' }],
      include: { vocabularies: { select: { id: true }, orderBy: { id: 'asc' } } },
    }),
    prisma.lessonProgress.findMany({ where: { userId } }),
  ]);

  const progressKey = (topicId: number, index: number): string => `${topicId}:${index}`;
  const progressMap = new Map(
    progress.map((p) => [progressKey(p.topicId, p.lessonIndex), p.bestScore]),
  );

  return topics.map((topic) => {
    const lessonCount = Math.ceil(topic.vocabularies.length / WORDS_PER_LESSON);
    let completedLessons = 0;

    const lessons = Array.from({ length: lessonCount }, (_, index) => {
      const bestScore = progressMap.get(progressKey(topic.id, index)) ?? null;
      const isCompleted = bestScore !== null;
      if (isCompleted) completedLessons += 1;

      const wordCount = Math.min(
        WORDS_PER_LESSON,
        topic.vocabularies.length - index * WORDS_PER_LESSON,
      );

      return {
        topicId: topic.id,
        index,
        title: `Bài ${index + 1}`,
        wordCount,
        isCompleted,
        // Bài đầu luôn mở; các bài sau mở khi bài liền trước đã xong.
        isUnlocked: index === 0 || progressMap.has(progressKey(topic.id, index - 1)),
        bestScore,
      };
    });

    return {
      topicId: topic.id,
      name: topic.name,
      description: topic.description,
      level: topic.level,
      lessons,
      completedLessons,
    };
  });
}

/** Đề bài của một bài học. */
export async function getLesson(topicId: number, index: number): Promise<LessonDetail> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { vocabularies: { orderBy: { id: 'asc' } } },
  });
  if (!topic) throw new NotFoundError('Không tìm thấy chủ đề');

  const words = topic.vocabularies.slice(index * WORDS_PER_LESSON, (index + 1) * WORDS_PER_LESSON);
  if (words.length === 0) throw new NotFoundError('Không tìm thấy bài học');

  return {
    topicId,
    index,
    title: `Bài ${index + 1} — ${topic.name}`,
    // Hạt giống cố định theo bài để vào lại vẫn ra đúng đề đó, không bị xáo lại
    exercises: generateLessonExercises({
      words,
      pool: topic.vocabularies,
      seed: topicId * 1000 + index,
    }),
  };
}

/**
 * Chấm bài và ghi nhận kết quả.
 *
 * Backend tự chấm bằng cách đối chiếu với bản ghi từ vựng — không tin đánh giá
 * đúng/sai do client gửi lên, vì kết quả ảnh hưởng tới streak và thống kê.
 */
export async function submitLesson(
  userId: number,
  timezone: string,
  input: SubmitLessonInput,
): Promise<LessonResult> {
  const vocabularyIds = [...new Set(input.answers.map((a) => a.vocabularyId))];
  const vocabularies = await prisma.vocabulary.findMany({ where: { id: { in: vocabularyIds } } });
  const vocabById = new Map(vocabularies.map((v) => [v.id, v]));

  const details = input.answers.map((answer) => {
    const vocabulary = vocabById.get(answer.vocabularyId);
    return {
      exerciseId: answer.exerciseId,
      vocabularyId: answer.vocabularyId,
      type: answer.type,
      isCorrect: vocabulary ? grade(answer, vocabulary) : false,
    };
  });

  const correct = details.filter((d) => d.isCorrect).length;
  const total = details.length;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
  const passed = total > 0 && correct / total >= LESSON_PASS_RATIO;

  await prisma.$transaction(async (tx) => {
    await updateMistakes(tx, userId, details);

    if (passed) {
      await tx.lessonProgress.upsert({
        where: {
          userId_topicId_lessonIndex: { userId, topicId: input.topicId, lessonIndex: input.index },
        },
        create: {
          userId,
          topicId: input.topicId,
          lessonIndex: input.index,
          bestScore: percentage,
        },
        // Chỉ nâng điểm, không hạ — làm lại bài mà kém hơn thì giữ điểm cũ
        update: { bestScore: { set: percentage } },
      });
    }

    await recordActivity({
      userId,
      type: ActivityType.VOCAB_LEARNED,
      refId: input.topicId,
      value: correct,
      timezone,
      tx,
    });
  });

  const nextLesson = passed ? await findNextLesson(input.topicId, input.index) : null;

  return {
    correct,
    total,
    percentage,
    passed,
    details: details.map(({ exerciseId, isCorrect }) => ({ exerciseId, isCorrect })),
    nextLesson,
  };
}

/** So khớp đáp án với dữ liệu từ vựng, theo từng dạng bài. */
function grade(answer: SubmitLessonInput['answers'][number], vocabulary: Vocabulary): boolean {
  switch (answer.type) {
    case ExerciseType.CHOOSE_MEANING:
      return normalize(answer.value) === normalize(vocabulary.meaning);

    case ExerciseType.CHOOSE_WORD:
    case ExerciseType.FILL_BLANK:
    case ExerciseType.TYPE_WORD:
      return normalize(answer.value) === normalize(vocabulary.word);

    case ExerciseType.ARRANGE_WORDS: {
      const expected = normalize((vocabulary.example ?? '').replace(/[.!?]$/, ''));
      return normalize(answer.value) === expected;
    }

    case ExerciseType.MATCH_PAIRS:
      // Đúng khi mọi cặp đều nối từ với chính nghĩa của nó
      return (answer.pairs ?? []).length > 0 && (answer.pairs ?? []).every((p) => p.wordId === p.meaningId);

    default:
      return false;
  }
}

/** Bỏ hoa/thường, dấu câu và khoảng trắng thừa để so khớp không quá khắt khe. */
function normalize(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[.,!?;:"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cập nhật danh sách lỗi sai.
 * Sai thì thêm/tăng; đúng thì tăng bộ đếm đúng, đủ 2 lần đúng thì coi như đã sửa được và xoá.
 */
const CORRECT_TO_CLEAR = 2;

async function updateMistakes(
  tx: Prisma.TransactionClient,
  userId: number,
  details: { vocabularyId: number; type: ExerciseType; isCorrect: boolean }[],
): Promise<void> {
  for (const detail of details) {
    const where = {
      userId_vocabularyId_exerciseType: {
        userId,
        vocabularyId: detail.vocabularyId,
        exerciseType: detail.type,
      },
    };

    if (!detail.isCorrect) {
      await tx.mistake.upsert({
        where,
        create: { userId, vocabularyId: detail.vocabularyId, exerciseType: detail.type },
        update: { timesWrong: { increment: 1 }, timesCorrect: 0, lastWrongAt: new Date() },
      });
      continue;
    }

    const existing = await tx.mistake.findUnique({ where });
    if (!existing) continue;

    if (existing.timesCorrect + 1 >= CORRECT_TO_CLEAR) {
      await tx.mistake.delete({ where: { id: existing.id } });
    } else {
      await tx.mistake.update({ where: { id: existing.id }, data: { timesCorrect: { increment: 1 } } });
    }
  }
}

async function findNextLesson(
  topicId: number,
  index: number,
): Promise<{ topicId: number; index: number } | null> {
  const count = await prisma.vocabulary.count({ where: { topicId } });
  const lessonCount = Math.ceil(count / WORDS_PER_LESSON);
  return index + 1 < lessonCount ? { topicId, index: index + 1 } : null;
}

// --- Ôn lại câu sai ---

/** Danh sách từ đang sai, ưu tiên từ sai nhiều lần và sai gần đây. */
export async function listMistakes(userId: number, limit: number): Promise<MistakeItem[]> {
  const rows = await prisma.mistake.findMany({
    where: { userId },
    orderBy: [{ timesWrong: 'desc' }, { lastWrongAt: 'desc' }],
    take: limit,
    include: { vocabulary: { include: { topic: { select: { name: true } } } } },
  });

  // Một từ có thể sai ở nhiều dạng bài; gộp lại để không hiện trùng
  const byVocabulary = new Map<number, MistakeItem>();
  for (const row of rows) {
    const existing = byVocabulary.get(row.vocabularyId);
    if (existing) {
      existing.timesWrong += row.timesWrong;
      continue;
    }
    byVocabulary.set(row.vocabularyId, {
      vocabularyId: row.vocabularyId,
      word: row.vocabulary.word,
      meaning: row.vocabulary.meaning,
      phonetic: row.vocabulary.phonetic,
      example: row.vocabulary.example,
      topicName: row.vocabulary.topic.name,
      timesWrong: row.timesWrong,
    });
  }

  return [...byVocabulary.values()];
}

export async function countMistakes(userId: number): Promise<number> {
  const rows = await prisma.mistake.findMany({ where: { userId }, select: { vocabularyId: true }, distinct: ['vocabularyId'] });
  return rows.length;
}

/** Bài luyện tập gồm các từ đang sai, dùng chung bộ sinh bài tập với bài học. */
export async function getMistakePractice(userId: number, limit: number): Promise<LessonDetail> {
  const mistakes = await listMistakes(userId, limit);
  if (mistakes.length === 0) throw new NotFoundError('Bạn chưa có từ nào cần ôn lại');

  const ids = mistakes.map((m) => m.vocabularyId);
  const words = await prisma.vocabulary.findMany({ where: { id: { in: ids } } });

  // Nguồn đáp án nhiễu lấy rộng hơn để không chỉ quanh quẩn mấy từ đang sai
  const pool = await prisma.vocabulary.findMany({ take: 40, orderBy: { id: 'asc' } });

  return {
    topicId: 0,
    index: -1,
    title: 'Ôn lại từ đã sai',
    // Hạt giống đổi theo ngày để mỗi ngày ôn lại thấy đề khác đi
    exercises: generateLessonExercises({ words, pool, seed: Math.floor(Date.now() / 86_400_000) }),
  };
}
