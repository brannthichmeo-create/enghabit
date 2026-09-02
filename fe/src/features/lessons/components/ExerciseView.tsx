import { useEffect, useState } from 'react';
import { ExerciseType, type Exercise } from '@enghabit/shared';
import { Input } from '../../../shared/components/ui';
import { AudioButton } from './AudioButton';
import { useT } from '../../../shared/i18n/language';

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
    case ExerciseType.LISTEN_CHOOSE:
    case ExerciseType.LISTEN_TYPE:
      return <ListenView exercise={exercise} onAnswer={onAnswer} locked={locked} />;
  }
}

/**
 * Bài nghe: phát âm rồi chọn nghĩa hoặc gõ lại từ.
 *
 * KHÔNG hiển thị `speakText` ra màn hình — hiện chữ là mất hẳn ý nghĩa luyện nghe.
 */
function ListenView({
  exercise,
  onAnswer,
  locked,
}: {
  exercise: Extract<Exercise, { speakText: string }>;
  onAnswer: Props['onAnswer'];
  locked: boolean;
}): JSX.Element {
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    setSelected(null);
    setText('');
    onAnswer(null);
  }, [exercise.id]);

  const isChoose = exercise.type === ExerciseType.LISTEN_CHOOSE;

  return (
    <div>
      <div className="flex flex-col items-center gap-3">
        <AudioButton text={exercise.speakText} audioUrl={exercise.audioUrl} autoPlay />
        <p className="text-xs text-content-muted">{t('Bấm loa để nghe lại')}</p>
      </div>

      {isChoose ? (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {(exercise.options ?? []).map((option) => (
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
                  : 'border-line hover:border-line-strong'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-xs">
          <Input
            value={text}
            disabled={locked}
            placeholder={t('Gõ từ bạn nghe được...')}
            onChange={(e) => {
              setText(e.target.value);
              onAnswer(e.target.value.trim() ? { value: e.target.value } : null);
            }}
            className="text-center"
          />
          <p className="mt-2 text-center text-xs text-content-muted">
            {t('Từ này có {n} chữ cái', { n: exercise.letterCount ?? 0 })}
          </p>
        </div>
      )}
    </div>
  );
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
          <p className="text-xl leading-relaxed text-content">{exercise.sentence}</p>
          <p className="mt-2 text-sm text-content-muted">{exercise.hint}</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight text-content">{exercise.question}</p>
          {'phonetic' in exercise && exercise.phonetic && (
            <p className="mt-1.5 text-sm text-content-muted">{exercise.phonetic}</p>
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
                : 'border-line hover:border-line-strong'
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
  const t = useT();
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
      <p className="text-center text-sm text-content-muted">{exercise.hint}</p>

      {/* Vùng câu đang ghép — luôn giữ chiều cao để không nhảy layout khi thêm/bớt từ */}
      <div className="mt-4 min-h-[64px] rounded-xl border-2 border-dashed border-line p-3">
        <div className="flex flex-wrap gap-2">
          {picked.map((tokenIndex, position) => (
            <button
              key={`${tokenIndex}-${position}`}
              disabled={locked}
              onClick={() => update(picked.filter((_, i) => i !== position))}
              className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm shadow-sm"
            >
              {exercise.tokens[tokenIndex]}
            </button>
          ))}
          {picked.length === 0 && (
            <span className="px-1 py-1.5 text-sm text-content-muted">{t('Chọn từ bên dưới để ghép câu')}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {exercise.tokens.map((token, index) =>
          picked.includes(index) ? (
            // Giữ chỗ trống để các từ còn lại không bị dồn vị trí
            <span key={index} className="rounded-lg bg-sunken px-3 py-1.5 text-sm text-transparent">
              {token}
            </span>
          ) : (
            <button
              key={index}
              disabled={locked}
              onClick={() => update([...picked, index])}
              className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm transition-colors hover:border-brand"
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
  const t = useT();
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
    onAnswer(null);
  }, [exercise.id]);

  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-content">{exercise.question}</p>
      <p className="mt-1.5 text-sm text-content-muted">
          {t('Bắt đầu bằng chữ "{letter}"', { letter: exercise.firstLetter })}
        </p>

      <div className="mx-auto mt-6 max-w-xs">
        <Input
          value={text}
          disabled={locked}
          autoFocus
          placeholder={t('Gõ từ tiếng Anh...')}
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
  const t = useT();
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
                  ? 'border-success/40 bg-success-soft text-success'
                  : activeWord === word.id
                    ? 'border-brand bg-brand-soft text-brand-strong'
                    : 'border-line hover:border-line-strong'
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
                  ? 'border-success/40 bg-success-soft text-success'
                  : 'border-line hover:border-line-strong'
              }`}
            >
              {meaning.text}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-content-muted">
        {activeWord === null ? t('Chọn một từ ở cột trái') : t('Giờ chọn nghĩa tương ứng ở cột phải')}
      </p>
    </div>
  );
}
