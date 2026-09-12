import {
  ActivityType,
  EXAM_WORD_COUNT,
  LESSON_PASS_RATIO,
  type LessonDetail,
  type LessonResult,
  type SubmitExamInput,
} from '@enghabit/shared';
import type { Vocabulary } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { recordActivity } from '../activity-logs/activity-log.service.js';
import { generateLessonExercises, seededRandom, shuffle } from './exercise-generator.js';
import { grade, updateMistakes } from './grading.js';

/**
 * Chế độ "Kiểm tra" (kiểu Exam của OpenQuiz.ai) — thay cho module `quizzes` cũ.
 *
 * Khác bài học: đề không lấy một lát WORDS_PER_LESSON cố định mà lấy tới EXAM_WORD_COUNT
 * từ CỦA CẢ CHỦ ĐỀ, ưu tiên từ user đang sai (bảng Mistake) trước, sau đó lấp đầy ngẫu
 * nhiên có hạt giống theo ngày. Không lưu đề, không gate mở khoá gì — chỉ ghi lại điểm ở
 * ExamAttempt và ActivityLog (QUIZ_COMPLETED) như quiz cũ từng làm.
 */

/** Đề bài Kiểm tra của một chủ đề. */
export async function getTopicExam(userId: number, topicId: number): Promise<LessonDetail> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { vocabularies: { orderBy: { id: 'asc' } } },
  });
  if (!topic) throw new NotFoundError('Không tìm thấy chủ đề');
  if (topic.vocabularies.length === 0) throw new NotFoundError('Chủ đề này chưa có từ vựng');

  const vocabIds = topic.vocabularies.map((v) => v.id);
  const mistakes = await prisma.mistake.findMany({
    where: { userId, vocabularyId: { in: vocabIds } },
    orderBy: [{ timesWrong: 'desc' }, { lastWrongAt: 'desc' }],
    select: { vocabularyId: true },
  });

  const byId = new Map(topic.vocabularies.map((v) => [v.id, v]));
  const priorityIds = new Set<number>();
  const priorityWords: Vocabulary[] = [];
  for (const mistake of mistakes) {
    const word = byId.get(mistake.vocabularyId);
    // Một từ có thể sai ở nhiều dạng bài — nhiều dòng Mistake trỏ cùng một từ, chỉ lấy một lần.
    if (word && !priorityIds.has(word.id)) {
      priorityIds.add(word.id);
      priorityWords.push(word);
    }
  }

  // Hạt giống đổi theo ngày (giống getMistakePractice) để hôm sau vào lại thấy đề khác đi,
  // nhưng vào lại trong cùng ngày vẫn ra đúng đề đó.
  const seed = topicId * 1000 + Math.floor(Date.now() / 86_400_000);
  const rest = shuffle(
    topic.vocabularies.filter((v) => !priorityIds.has(v.id)),
    seededRandom(seed),
  );

  const words = [...priorityWords, ...rest].slice(0, EXAM_WORD_COUNT);

  return {
    topicId,
    // Không phải một bài có thứ tự trên lộ trình — không dùng để tra LessonProgress.
    index: -2,
    title: `Kiểm tra: ${topic.name}`,
    exercises: generateLessonExercises({ words, pool: topic.vocabularies, seed }),
  };
}

/**
 * Chấm bài Kiểm tra và ghi nhận kết quả.
 *
 * Dùng lại đúng cách chấm và cập nhật lỗi sai của bài học (`grading.ts`) — sai ở Kiểm tra
 * cũng vào thẳng "Ôn lại từ sai" như sai ở bài học, chỉ một nơi theo dõi lỗi sai.
 */
export async function submitExam(
  userId: number,
  timezone: string,
  input: SubmitExamInput,
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

    await tx.examAttempt.create({
      data: { userId, topicId: input.topicId, correct, total },
    });

    await recordActivity({
      userId,
      type: ActivityType.QUIZ_COMPLETED,
      refId: input.topicId,
      value: correct,
      timezone,
      tx,
    });
  });

  return {
    correct,
    total,
    percentage,
    passed,
    details: details.map(({ exerciseId, isCorrect }) => ({ exerciseId, isCorrect })),
    // Kiểm tra không mở khoá gì cả — không phải một bước trên lộ trình.
    nextLesson: null,
  };
}
