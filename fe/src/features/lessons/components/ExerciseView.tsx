import { useEffect, useState } from 'react';
import { ExerciseType, type Exercise } from '@enghabit/shared';
import { Input } from '../../../shared/components/ui';

/**
 * Hiển thị một bài tập và thu đáp án của người học.
 *
 * Component KHÔNG tự chấm đúng/sai — nó chỉ báo ra đáp án đã chọn qua `onAnswer`.
 * Việc chấm do backend làm (xem be/src/modules/lessons/lesson.service.ts).
 */

export interface AnswerValue {
  value?: string;
  pairs?: { wordId: number; meaningId: number }[];
}

interface Props {
  exercise: Exercise;
  /** Gọi mỗi khi đáp án thay đổi; null nghĩa là chưa trả lời xong. */
  onAnswer: (answer: AnswerValue | null) => void;
  /** Khoá tương tác sau khi đã nộp câu này. */
  locked: boolean;
}

export function ExerciseView({ exercise, onAnswer, locked }: Props): JSX.Element {
  switch (exercise.type) {
    case ExerciseType.CHOOSE_MEANING:
    case ExerciseType.CHOOSE_WORD:
    case ExerciseType.FILL_BLANK:
      return <ChoiceView exercise={exercise} onAnswer={onAnswer} locked={locked} />;
    case ExerciseType.ARRANGE_WORDS:
      return <ArrangeView exercise={exercise} onAnswer={onAnswer} locked={locked} />;
    case ExerciseType.TYPE_WORD:
      return <TypeView exercise={exercise} onAnswer={onAnswer} locked={locked} />;
    case ExerciseType.MATCH_PAIRS:
      return <MatchView exercise={exercise} onAnswer={onAnswer} locked={locked} />;
  }
}

/** Dạng trắc nghiệm: chọn nghĩa, chọn từ, và điền chỗ trống. */
function ChoiceView({
  exercise,
  onAnswer,
  locked,
}: {
  exercise: Extract<Exercise, { options: string[] }>;
  onAnswer: Props['onAnswer'];
  locked: boolean;
}): JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);

  // Đổi câu thì xoá lựa chọn cũ, tránh câu sau bị dính đáp án câu trước
  useEffect(() => {
    setSelected(null);
    onAnswer(null);
  }, [exercise.id]);

  const isFillBlank = exercise.type === ExerciseType.FILL_BLANK;

  return (
    <div>
      {isFillBlank ? (
        <div className="text-center">
          <p className="text-xl leading-relaxed text-slate-900">{exercise.sentence}</p>
          <p className="mt-2 text-sm text-slate-500">{exercise.hint}</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight text-slate-900">{exercise.question}</p>
          {'phonetic' in exercise && exercise.phonetic && (
            <p className="mt-1.5 text-sm text-slate-500">{exercise.phonetic}</p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {exercise.options.map((option) => (
          <button
            key={option}
            disabled={locked}
            onClick={() => {
              setSelected(option);
              onAnswer({ value: option });
            }}
            className={`rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${
              selected === option
                ? 'border-brand bg-brand-soft text-brand-strong'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Sắp xếp các mảnh từ thành câu hoàn chỉnh. */
function ArrangeView({
  exercise,
  onAnswer,
  locked,
}: {
  exercise: Extract<Exercise, { tokens: string[] }>;
  onAnswer: Props['onAnswer'];
  locked: boolean;
}): JSX.Element {
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    setPicked([]);
    onAnswer(null);
  }, [exercise.id]);

  const update = (next: number[]): void => {
    setPicked(next);
    // Chưa dùng hết mảnh thì coi như chưa trả lời xong
    onAnswer(next.length === exercise.tokens.length ? { value: next.map((i) => exercise.tokens[i]).join(' ') } : null);
  };

  return (
    <div>
      <p className="text-center text-sm text-slate-500">{exercise.hint}</p>

      {/* Vùng câu đang ghép — luôn giữ chiều cao để không nhảy layout khi thêm/bớt từ */}
      <div className="mt-4 min-h-[64px] rounded-xl border-2 border-dashed border-slate-200 p-3">
        <div className="flex flex-wrap gap-2">
          {picked.map((tokenIndex, position) => (
            <button
              key={`${tokenIndex}-${position}`}
              disabled={locked}
              onClick={() => update(picked.filter((_, i) => i !== position))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm"
            >
              {exercise.tokens[tokenIndex]}
            </button>
          ))}
          {picked.length === 0 && (
            <span className="px-1 py-1.5 text-sm text-slate-400">Chọn từ bên dưới để ghép câu</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {exercise.tokens.map((token, index) =>
          picked.includes(index) ? (
            // Giữ chỗ trống để các từ còn lại không bị dồn vị trí
            <span key={index} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-transparent">
              {token}
            </span>
          ) : (
            <button
              key={index}
              disabled={locked}
              onClick={() => update([...picked, index])}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm transition-colors hover:border-brand"
            >
              {token}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/** Gõ lại từ tiếng Anh khi nhìn thấy nghĩa. */
function TypeView({
  exercise,
  onAnswer,
  locked,
}: {
  exercise: Extract<Exercise, { firstLetter: string }>;
  onAnswer: Props['onAnswer'];
  locked: boolean;
}): JSX.Element {
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
    onAnswer(null);
  }, [exercise.id]);

  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-slate-900">{exercise.question}</p>
      <p className="mt-1.5 text-sm text-slate-500">Bắt đầu bằng chữ "{exercise.firstLetter}"</p>

      <div className="mx-auto mt-6 max-w-xs">
        <Input
          value={text}
          disabled={locked}
          autoFocus
          placeholder="Gõ từ tiếng Anh..."
          onChange={(e) => {
            setText(e.target.value);
            onAnswer(e.target.value.trim() ? { value: e.target.value } : null);
          }}
          className="text-center"
        />
      </div>
    </div>
  );
}

/** Ghép từ ở cột trái với nghĩa ở cột phải. */
function MatchView({
  exercise,
  onAnswer,
  locked,
}: {
  exercise: Extract<Exercise, { words: { id: number; text: string }[] }>;
  onAnswer: Props['onAnswer'];
  locked: boolean;
}): JSX.Element {
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [pairs, setPairs] = useState<{ wordId: number; meaningId: number }[]>([]);

  useEffect(() => {
    setActiveWord(null);
    setPairs([]);
    onAnswer(null);
  }, [exercise.id]);

  const matchedWords = new Set(pairs.map((p) => p.wordId));
  const matchedMeanings = new Set(pairs.map((p) => p.meaningId));

  const selectMeaning = (meaningId: number): void => {
    if (activeWord === null) return;
    const next = [...pairs, { wordId: activeWord, meaningId }];
    setPairs(next);
    setActiveWord(null);
    onAnswer(next.length === exercise.words.length ? { pairs: next } : null);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {exercise.words.map((word) => (
            <button
              key={word.id}
              disabled={locked || matchedWords.has(word.id)}
              onClick={() => setActiveWord(word.id)}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm transition-colors ${
                matchedWords.has(word.id)
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : activeWord === word.id
                    ? 'border-brand bg-brand-soft text-brand-strong'
                    : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {word.text}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {exercise.meanings.map((meaning) => (
            <button
              key={meaning.id}
              disabled={locked || matchedMeanings.has(meaning.id) || activeWord === null}
              onClick={() => selectMeaning(meaning.id)}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                matchedMeanings.has(meaning.id)
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {meaning.text}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {activeWord === null ? 'Chọn một từ ở cột trái' : 'Giờ chọn nghĩa tương ứng ở cột phải'}
      </p>
    </div>
  );
}
