import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, RotateCw, SkipForward, X, Zap } from 'lucide-react';
import {
  MAX_RESPONSE_MS,
  ReviewRating,
  STUDY_BATCH_DEFAULT,
  StudyMode,
  StudySource,
  accuracyPercent,
  type AnswerResult,
  type FlashcardQuestion,
  type MultipleChoiceQuestionView,
  type StudyGroup,
  type StudyQuestion,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, EmptyState, ErrorMessage, Skeleton } from '../../../shared/components/ui';
import { useT, type TranslateFn } from '../../../shared/i18n/language';
import { useFinishSession, useLoadQuestions, useRefreshAfterSession, useSubmitAnswer } from '../study.hooks';

/**
 * Một phiên làm thẻ — dùng chung cho Học, Ôn tập và Cram Mode.
 *
 * Mỗi câu chấm và ghi NGAY khi trả lời (không nộp cả phiên), nên tải lại trang hay mất
 * mạng giữa chừng không mất kết quả các câu đã làm. Đổi lại không có Pause/Resume: tải
 * lại là một phiên mới, thẻ vừa làm không còn nằm trong nhóm cũ nữa.
 *
 * Danh sách câu hỏi giữ ở state cục bộ suốt phiên. Không làm mới dữ liệu giữa chừng:
 * câu vừa làm sẽ rời khỏi nhóm và làm nhảy vị trí đang học.
 */

/**
 * Bốn mức nhớ ở chế độ Flashcard. Chữ trên nút luôn là `on-fill`, nên nền phải đủ đậm
 * cho 4.5:1 ở cả hai chế độ — giữ nguyên bộ màu đã đo của màn ôn flashcard cũ, đừng
 * đổi sang `bg-brand` (3.29 với chữ trắng) hay màu chuỗi biểu đồ (R23).
 */
const RATINGS: { rating: ReviewRating; label: string; hint: string; className: string }[] = [
  { rating: ReviewRating.AGAIN, label: 'Quên rồi', hint: 'Ôn lại ngày mai', className: 'bg-danger' },
  { rating: ReviewRating.HARD, label: 'Khó nhớ', hint: 'Ôn lại sớm', className: 'bg-accent-ink' },
  { rating: ReviewRating.GOOD, label: 'Nhớ được', hint: 'Giãn cách bình thường', className: 'bg-brand-strong' },
  { rating: ReviewRating.EASY, label: 'Rất dễ', hint: 'Giãn cách dài hơn', className: 'bg-success' },
];

interface CardResult {
  label: string;
  correctAnswer: string;
  /** Chế độ Flashcard: "Quên rồi" tính là sai, ba mức còn lại tính là nhớ. */
  isCorrect: boolean;
  responseMs: number;
}

export function StudySession({
  source,
  setId,
  group,
  mode,
  onExit,
}: {
  source: StudySource;
  setId?: number;
  group: StudyGroup;
  mode: StudyMode;
  onExit: () => void;
}): JSX.Element {
  const t = useT();
  const load = useLoadQuestions();
  const refresh = useRefreshAfterSession();
  const finish = useFinishSession();

  // Mỗi lượt thẻ là một phiên riêng: "Tải lượt mới" đổi khoá để bấm kết thúc hai lượt
  // không bị gộp thành một phiên.
  const [batch, setBatch] = useState(0);
  const sessionKey = useMemo(
    () => (source === StudySource.LEARN ? crypto.randomUUID() : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- đổi khoá đúng khi sang lượt mới
    [source, batch],
  );

  const [questions, setQuestions] = useState<StudyQuestion[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<CardResult[]>([]);

  useEffect(() => {
    setQuestions(null);
    setIndex(0);
    setResults([]);
    load.mutate(
      { source, setId, group, mode, limit: STUDY_BATCH_DEFAULT },
      {
        onSuccess: (data) => {
          setQuestions(data.questions);
          setSkipped(data.skipped);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi sang lượt mới
  }, [batch]);

  const done = questions !== null && index >= questions.length;

  // Hết lượt: làm mới dữ liệu đã đổi, và phiên Học có câu trả lời thì ghi "hoàn thành phiên".
  const finishedBatch = useRef<number | null>(null);
  useEffect(() => {
    if (!done || finishedBatch.current === batch) return;
    finishedBatch.current = batch;
    if (sessionKey && results.length > 0) {
      finish.mutate(sessionKey, { onSettled: refresh });
    } else {
      refresh();
    }
  }, [done, batch, sessionKey, results.length, finish, refresh]);

  const exit = (): void => {
    // Thoát giữa chừng vẫn là một phiên nếu đã làm được câu nào.
    if (!done && sessionKey && results.length > 0) finish.mutate(sessionKey, { onSettled: refresh });
    else if (!done && results.length > 0) refresh();
    onExit();
  };

  if (load.isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <ErrorMessage>{getErrorMessage(load.error)}</ErrorMessage>
        <Button variant="secondary" onClick={onExit}>
          {t('Quay lại')}
        </Button>
      </div>
    );
  }

  if (questions === null) return <Skeleton className="mx-auto h-[320px] w-full max-w-2xl" />;

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={CheckCircle2}
          title={t('Nhóm này không còn thẻ nào')}
          description={
            skipped > 0
              ? t('{n} thẻ bị bỏ qua vì bộ của chúng chưa đủ 4 thẻ để làm trắc nghiệm.', { n: skipped })
              : t('Chọn nhóm khác, hoặc quay lại sau.')
          }
          action={
            <Button variant="secondary" onClick={onExit}>
              {t('Quay lại')}
            </Button>
          }
        />
      </div>
    );
  }

  if (done) {
    return (
      <SessionResult
        results={results}
        source={source}
        onMore={() => setBatch((b) => b + 1)}
        onExit={onExit}
      />
    );
  }

  const question = questions[index] as StudyQuestion;
  const correctSoFar = results.filter((r) => r.isCorrect).length;

  const next = (result: CardResult | null): void => {
    if (result) setResults((current) => [...current, result]);
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {source === StudySource.CRAM && (
        <p className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content-soft">
          <Zap className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
          {t('Ôn nhanh: không ảnh hưởng lịch ôn và không tính vào chuỗi ngày.')}
        </p>
      )}

      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={exit}
          className="rounded-lg p-1.5 text-on-page-muted transition-colors hover:bg-hover hover:text-on-page"
          aria-label={t('Thoát phiên')}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-on-page-muted">
          {index + 1}/{questions.length}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-on-page-muted" aria-label={t('Số câu đúng')}>
          <Check className="mr-0.5 inline h-3.5 w-3.5 text-success" aria-hidden />
          {correctSoFar}
        </span>
      </div>

      {question.kind === StudyMode.FLASHCARD ? (
        <FlashcardView key={question.token} question={question} sessionKey={sessionKey} onNext={next} />
      ) : (
        <MultipleChoiceView key={question.token} question={question} sessionKey={sessionKey} onNext={next} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chế độ Flashcard
// ---------------------------------------------------------------------------

function FlashcardView({
  question,
  sessionKey,
  onNext,
}: {
  question: FlashcardQuestion;
  sessionKey?: string;
  onNext: (result: CardResult | null) => void;
}): JSX.Element {
  const t = useT();
  const submit = useSubmitAnswer();
  const [revealed, setRevealed] = useState(false);
  const shownAt = useRef(Date.now());

  const rate = (rating: ReviewRating): void => {
    const responseMs = Math.min(Date.now() - shownAt.current, MAX_RESPONSE_MS);
    submit.mutate(
      { token: question.token, rating, responseMs, sessionKey },
      {
        onSuccess: () =>
          onNext({
            label: question.word,
            correctAnswer: question.meaning,
            isCorrect: rating !== ReviewRating.AGAIN,
            responseMs,
          }),
      },
    );
  };

  return (
    <div>
      {submit.isError && (
        <div className="mb-3">
          <ErrorMessage>{getErrorMessage(submit.error)}</ErrorMessage>
        </div>
      )}

      <Card className="mb-4 flex min-h-[260px] flex-col items-center justify-center text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-content-muted">{question.setName}</span>
        <p className="mt-4 text-4xl font-bold tracking-tight text-content">{question.word}</p>
        {question.phonetic && <p className="mt-1.5 text-sm text-content-muted">{question.phonetic}</p>}

        {revealed ? (
          <div className="mt-6 w-full animate-fade-in border-t border-line pt-5">
            <p className="text-xl font-medium text-brand-strong">{question.meaning}</p>
            {question.example && <p className="mt-2 text-sm italic text-content-muted">"{question.example}"</p>}
          </div>
        ) : (
          <Button variant="secondary" className="mt-8" onClick={() => setRevealed(true)}>
            {t('Lật thẻ')}
          </Button>
        )}
      </Card>

      {revealed ? (
        <div className="animate-slide-up">
          <p className="mb-2.5 text-center text-sm text-on-page-muted">{t('Bạn nhớ thẻ này ở mức nào?')}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((item) => (
              <button
                key={item.rating}
                onClick={() => rate(item.rating)}
                disabled={submit.isPending}
                className={`flex flex-col items-center rounded-xl px-2 py-3 text-on-fill transition-[filter] hover:brightness-95 disabled:opacity-50 ${item.className}`}
              >
                <span className="text-sm font-medium">{t(item.label)}</span>
                <span className="mt-0.5 text-xs">{t(item.hint)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" icon={SkipForward} onClick={() => onNext(null)}>
            {t('Bỏ qua')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chế độ trắc nghiệm
// ---------------------------------------------------------------------------

function MultipleChoiceView({
  question,
  sessionKey,
  onNext,
}: {
  question: MultipleChoiceQuestionView;
  sessionKey?: string;
  onNext: (result: CardResult | null) => void;
}): JSX.Element {
  const t = useT();
  const submit = useSubmitAnswer();
  const [chosen, setChosen] = useState<number | null>(null);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [responseMs, setResponseMs] = useState(0);
  const shownAt = useRef(Date.now());

  const choose = (choiceIndex: number): void => {
    // Đã chọn thì khoá lại — bấm lần hai không được đổi đáp án sau khi thấy kết quả.
    if (chosen !== null || submit.isPending) return;
    const elapsed = Math.min(Date.now() - shownAt.current, MAX_RESPONSE_MS);
    setChosen(choiceIndex);
    setResponseMs(elapsed);
    submit.mutate(
      { token: question.token, choiceIndex, responseMs: elapsed, sessionKey },
      { onSuccess: setAnswer, onError: () => setChosen(null) },
    );
  };

  const optionClass = (optionIndex: number): string => {
    if (!answer) {
      return chosen === optionIndex ? 'border-brand bg-brand-soft text-brand-strong' : 'border-line hover:border-line-strong';
    }
    if (optionIndex === answer.correctIndex) return 'border-success bg-success-soft text-success';
    if (optionIndex === chosen) return 'border-danger bg-danger-soft text-danger';
    return 'border-line text-content-muted';
  };

  return (
    <div>
      {submit.isError && (
        <div className="mb-3">
          <ErrorMessage>{getErrorMessage(submit.error)}</ErrorMessage>
        </div>
      )}

      <Card className="mb-4">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-content-muted">
          {question.direction === 'WORD_TO_MEANING' ? t('Chọn nghĩa đúng') : t('Chọn từ đúng')}
        </p>
        <p className="mt-3 text-center text-3xl font-bold tracking-tight text-content">{question.prompt}</p>
        {question.phonetic && <p className="mt-1 text-center text-sm text-content-muted">{question.phonetic}</p>}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => (
            <button
              key={optionIndex}
              onClick={() => choose(optionIndex)}
              disabled={chosen !== null}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${optionClass(optionIndex)}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                {optionIndex + 1}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
            </button>
          ))}
        </div>

        {answer && (
          <p
            className={`mt-4 text-center text-sm font-medium ${answer.isCorrect ? 'text-success' : 'text-danger'}`}
            role="status"
          >
            {answer.isCorrect ? t('Chính xác!') : t('Chưa đúng. Đáp án: {answer}', { answer: answer.correctAnswer })}
          </p>
        )}
      </Card>

      <div className="flex justify-center gap-2">
        {answer ? (
          <Button
            icon={ArrowRight}
            onClick={() =>
              onNext({
                label: question.prompt,
                correctAnswer: answer.correctAnswer,
                isCorrect: answer.isCorrect === true,
                responseMs,
              })
            }
          >
            {t('Câu tiếp')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon={SkipForward} disabled={chosen !== null} onClick={() => onNext(null)}>
            {t('Bỏ qua')}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kết quả
// ---------------------------------------------------------------------------

export function formatDuration(ms: number, t: TranslateFn): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? t('{m} phút {s} giây', { m: minutes, s: seconds }) : t('{s} giây', { s: seconds });
}

function SessionResult({
  results,
  source,
  onMore,
  onExit,
}: {
  results: CardResult[];
  source: StudySource;
  onMore: () => void;
  onExit: () => void;
}): JSX.Element {
  const t = useT();
  const correct = results.filter((r) => r.isCorrect).length;
  const wrong = results.length - correct;
  const timeMs = results.reduce((sum, r) => sum + r.responseMs, 0);
  const weak = results.filter((r) => !r.isCorrect);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="text-center">
        <img src="/logo.png" alt="" aria-hidden className="mx-auto mb-2 h-20 w-20 object-contain" />
        <p className="text-lg font-semibold text-content">{t('Hoàn thành lượt thẻ')}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">
          {source === StudySource.CRAM
            ? t('Ôn nhanh không đổi lịch ôn của bạn.')
            : t('Kết quả đã được ghi vào lịch ôn và chuỗi ngày học.')}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat label={t('Đã làm')} value={String(results.length)} />
          <ResultStat label={t('Đúng')} value={String(correct)} />
          <ResultStat label={t('Sai')} value={String(wrong)} />
          <ResultStat label={t('Độ chính xác')} value={`${accuracyPercent(correct, results.length)}%`} />
        </dl>
        <p className="mt-3 text-xs text-content-muted">{t('Thời gian: {time}', { time: formatDuration(timeMs, t) })}</p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button icon={RotateCw} onClick={onMore}>
            {t('Tải lượt mới')}
          </Button>
          <Button variant="secondary" onClick={onExit}>
            {t('Xong')}
          </Button>
        </div>
      </Card>

      {weak.length > 0 && (
        <Card>
          <h2 className="font-semibold text-content">{t('Thẻ cần củng cố')}</h2>
          <ul className="mt-3 divide-y divide-line">
            {weak.map((item, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                <span className="font-medium text-content">{item.label}</span>
                <span className="text-content-soft">{item.correctAnswer}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg bg-sunken px-3 py-2">
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums text-content">{value}</dd>
    </div>
  );
}
