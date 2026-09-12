import { ExerciseType, type SubmitLessonInput } from '@enghabit/shared';
import type { Prisma, Vocabulary } from '@prisma/client';

/**
 * Chấm bài tập và cập nhật danh sách lỗi sai.
 *
 * Dùng chung cho cả bài học (lesson.service.ts) lẫn bài Kiểm tra (exam.service.ts) — hai nơi
 * cùng sinh bài từ `generateLessonExercises` nên cũng phải chấm và ghi lỗi sai theo đúng một
 * cách, không viết lại logic này lần thứ hai.
 */

/** So khớp đáp án với dữ liệu từ vựng, theo từng dạng bài. */
export function grade(answer: SubmitLessonInput['answers'][number], vocabulary: Vocabulary): boolean {
  switch (answer.type) {
    case ExerciseType.CHOOSE_MEANING:
    case ExerciseType.LISTEN_CHOOSE:
      return normalize(answer.value) === normalize(vocabulary.meaning);

    case ExerciseType.CHOOSE_WORD:
    case ExerciseType.FILL_BLANK:
    case ExerciseType.TYPE_WORD:
    case ExerciseType.LISTEN_TYPE:
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
export function normalize(value: string | undefined): string {
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

export async function updateMistakes(
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
