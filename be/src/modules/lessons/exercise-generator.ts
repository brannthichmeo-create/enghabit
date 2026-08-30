import {
  EXERCISE_PROMPTS,
  ExerciseType,
  type Exercise,
} from '@enghabit/shared';
import type { Vocabulary } from '@prisma/client';

/**
 * Sinh bài tập từ danh sách từ vựng.
 *
 * Không lưu bài tập vào DB: mỗi lần vào bài học đều sinh lại, nên thêm từ vựng là
 * lộ trình tự dài ra mà không phải migrate.
 *
 * Đề bài gửi cho client KHÔNG chứa đáp án đúng — với dạng trắc nghiệm thì đáp án
 * nằm lẫn trong các lựa chọn, còn việc chấm do backend làm khi nhận bài nộp.
 */

/** Bộ sinh số giả ngẫu nhiên có hạt giống, để cùng một bài học luôn ra cùng đề. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** Lấy `count` phần tử khác `exclude` để làm đáp án nhiễu. */
function pickDistractors(pool: string[], exclude: string, count: number, rand: () => number): string[] {
  const candidates = pool.filter((item) => item !== exclude);
  return shuffle(candidates, rand).slice(0, count);
}

export interface GenerateOptions {
  /** Từ vựng của bài học. */
  words: Vocabulary[];
  /** Toàn bộ từ của chủ đề, dùng làm nguồn đáp án nhiễu sát thực tế hơn. */
  pool: Vocabulary[];
  seed: number;
}

/**
 * Sinh danh sách bài tập cho một bài học.
 *
 * Mỗi từ xuất hiện ở 2 dạng khác nhau để vừa nhận mặt chữ vừa chủ động nhớ lại,
 * cộng thêm một bài ghép cặp chung ở cuối để củng cố.
 */
export function generateLessonExercises({ words, pool, seed }: GenerateOptions): Exercise[] {
  const rand = seededRandom(seed);
  const exercises: Exercise[] = [];

  const meanings = pool.map((w) => w.meaning);
  const wordTexts = pool.map((w) => w.word);

  words.forEach((word, position) => {
    // Vòng 1: nhận biết — nhìn từ đoán nghĩa
    exercises.push(buildChoice(word, ExerciseType.CHOOSE_MEANING, meanings, rand));

    // Vòng 2: dạng khó dần, luân phiên để không lặp đơn điệu
    const secondRound = pickSecondRound(word, position);
    switch (secondRound) {
      case ExerciseType.FILL_BLANK:
        exercises.push(buildFillBlank(word, wordTexts, rand));
        break;
      case ExerciseType.ARRANGE_WORDS:
        exercises.push(buildArrangeWords(word, rand));
        break;
      case ExerciseType.TYPE_WORD:
        exercises.push(buildTypeWord(word));
        break;
      default:
        exercises.push(buildChoice(word, ExerciseType.CHOOSE_WORD, wordTexts, rand));
    }
  });

  // Bài ghép cặp đặt cuối cùng, gom lại toàn bộ từ trong bài
  if (words.length >= 3) {
    exercises.push(buildMatchPairs(words, rand));
  }

  return exercises;
}

/**
 * Chọn dạng bài vòng 2 cho từng từ.
 * Ưu tiên dạng cần câu ví dụ nếu từ đó có ví dụ; nếu không thì lùi về dạng không cần.
 */
function pickSecondRound(word: Vocabulary, position: number): ExerciseType {
  const hasExample = Boolean(word.example && word.example.trim().split(/\s+/).length >= 4);
  const containsWord = hasExample && word.example!.toLowerCase().includes(word.word.toLowerCase());

  const rotation = position % 3;
  if (rotation === 0 && containsWord) return ExerciseType.FILL_BLANK;
  if (rotation === 1 && hasExample) return ExerciseType.ARRANGE_WORDS;
  if (rotation === 2) return ExerciseType.TYPE_WORD;
  return ExerciseType.CHOOSE_WORD;
}

function buildChoice(
  word: Vocabulary,
  type: typeof ExerciseType.CHOOSE_MEANING | typeof ExerciseType.CHOOSE_WORD,
  pool: string[],
  rand: () => number,
): Exercise {
  const isMeaning = type === ExerciseType.CHOOSE_MEANING;
  const answer = isMeaning ? word.meaning : word.word;
  const options = shuffle([answer, ...pickDistractors(pool, answer, 3, rand)], rand);

  return {
    id: `${type}-${word.id}`,
    type,
    vocabularyId: word.id,
    prompt: EXERCISE_PROMPTS[type],
    question: isMeaning ? word.word : word.meaning,
    options,
    phonetic: isMeaning ? word.phonetic : null,
  };
}

/** Khoét từ khỏi câu ví dụ, cho chọn lại trong 4 lựa chọn. */
function buildFillBlank(word: Vocabulary, pool: string[], rand: () => number): Exercise {
  const sentence = (word.example ?? '').replace(new RegExp(word.word, 'gi'), '___');
  const options = shuffle([word.word, ...pickDistractors(pool, word.word, 3, rand)], rand);

  return {
    id: `${ExerciseType.FILL_BLANK}-${word.id}`,
    type: ExerciseType.FILL_BLANK,
    vocabularyId: word.id,
    prompt: EXERCISE_PROMPTS[ExerciseType.FILL_BLANK],
    sentence,
    options,
    hint: word.meaning,
  };
}

/** Xáo trộn các từ trong câu ví dụ để người học sắp xếp lại. */
function buildArrangeWords(word: Vocabulary, rand: () => number): Exercise {
  // Bỏ dấu câu cuối để việc so khớp không phụ thuộc dấu chấm
  const tokens = (word.example ?? '').replace(/[.!?]$/, '').split(/\s+/).filter(Boolean);

  return {
    id: `${ExerciseType.ARRANGE_WORDS}-${word.id}`,
    type: ExerciseType.ARRANGE_WORDS,
    vocabularyId: word.id,
    prompt: EXERCISE_PROMPTS[ExerciseType.ARRANGE_WORDS],
    tokens: shuffle(tokens, rand),
    hint: word.meaning,
  };
}

function buildTypeWord(word: Vocabulary): Exercise {
  return {
    id: `${ExerciseType.TYPE_WORD}-${word.id}`,
    type: ExerciseType.TYPE_WORD,
    vocabularyId: word.id,
    prompt: EXERCISE_PROMPTS[ExerciseType.TYPE_WORD],
    question: word.meaning,
    firstLetter: word.word.charAt(0),
  };
}

/** Hai cột xáo trộn độc lập, nếu không thì thứ tự sẽ tự lộ đáp án. */
function buildMatchPairs(words: Vocabulary[], rand: () => number): Exercise {
  const first = words[0] as Vocabulary;

  return {
    id: `${ExerciseType.MATCH_PAIRS}-${first.id}`,
    type: ExerciseType.MATCH_PAIRS,
    vocabularyId: first.id,
    prompt: EXERCISE_PROMPTS[ExerciseType.MATCH_PAIRS],
    words: shuffle(words, rand).map((w) => ({ id: w.id, text: w.word })),
    meanings: shuffle(words, rand).map((w) => ({ id: w.id, text: w.meaning })),
  };
}
