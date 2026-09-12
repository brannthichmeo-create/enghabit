import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock, RotateCw, X } from 'lucide-react';
import {
  EXAM_QUESTION_SECONDS,
  ExerciseType,
  type Exercise,
  type LessonDetail,
  type LessonResult,
  type SubmitLessonInput,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, ErrorMessage } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import type { LessonSubmitAdapter } from '../lesson.hooks';
import { ExerciseView, type AnswerValue } from './ExerciseView';
import { useT } from '../../../shared/i18n/language';

/**
 * Màn hình làm bài: đi qua từng câu, cuối cùng nộp cả bài để backend chấm.
 *
 * Dùng chung cho cả bài học lẫn Kiểm tra ("Exam" kiểu OpenQuiz.ai) — hai chế độ khác
 * nhau ở NƠI nộp bài (payload khác hình dạng, xem `LessonSubmitAdapter`) và ở việc
 * Kiểm tra có tính giờ từng câu, nhưng cách chơi từng câu là một, không chép lại UI.
 *
 * Không chấm từng câu ngay khi trả lời vì đáp án đúng không được gửi xuống client —
 * đổi lại người học thấy toàn bộ kết quả một lần ở cuối, kèm chỗ nào sai.
 */
export function LessonPlayer({
  lesson,
  mode = 'lesson',
  submit,
  onExit,
  onFinished,
}: {
  lesson: LessonDetail;
  mode?: 'lesson' | 'exam';
  submit: LessonSubmitAdapter;
  onExit: () => void;
  onFinished?: (result: LessonResult) => void;
}): JSX.Element {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SubmitLessonInput['answers']>([]);
  const [current, setCurrent] = useState<AnswerValue | null>(null);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_QUESTION_SECONDS);

  // Màn làm bài không có URL riêng nên phải tự nối cấp cuối vào breadcrumb
  useBreadcrumbTail(lesson.title);

  const exercise = lesson.exercises[index];
  const isLast = index === lesson.exercises.length - 1;

  /** Gộp đáp án hiện có vào bài nộp rồi sang câu tiếp / nộp cả bài nếu là câu cuối. */
  const submitAnswer = (answer: AnswerValue | null): void => {
    if (!exercise) return;

    const next = [
      ...answers,
      {
        exerciseId: exercise.id,
        vocabularyId: exercise.vocabularyId,
        type: exercise.type,
        ...answer,
      },
    ];
    setAnswers(next);
    setCurrent(null);

    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }

    submit.run(next, (data) => {
      setResult(data);
      onFinished?.(data);
    });
  };

  const handleNext = (): void => {
    if (!current) return;
    submitAnswer(current);
  };

  // Hết giờ thì tự nộp câu đó dù chưa chọn xong — bỏ trống tính là sai, không chặn bài lại.
  const handleTimeoutRef = useRef<() => void>(() => {});
  handleTimeoutRef.current = () => submitAnswer(current);

  // Đếm giờ mỗi câu, chỉ bật ở chế độ Kiểm tra. Đặt TRƯỚC mọi early-return bên dưới
  // để không phá quy tắc "hook nào cũng phải chạy ở mọi lần render".
  useEffect(() => {
    if (mode !== 'exam' || !exercise || result) return undefined;

    setSecondsLeft(EXAM_QUESTION_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          handleTimeoutRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ cần chạy lại khi đổi câu
  }, [exercise?.id, mode, result]);

  if (result) {
    return <ResultView lesson={lesson} result={result} mode={mode} onExit={onExit} />;
  }

  if (!exercise) return <ErrorMessage>{t('Bài học không có câu hỏi nào')}</ErrorMessage>;

  const progress = (index / lesson.exercises.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onExit}
          className="rounded-lg p-1.5 text-content-muted transition-colors hover:bg-sunken hover:text-content-soft"
          aria-label={t('Thoát bài học')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="shrink-0 text-sm tabular-nums text-content-muted">
          {index + 1}/{lesson.exercises.length}
        </span>

        {mode === 'exam' && (
          <span
            className={`flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums ${
              secondsLeft <= 5 ? 'text-danger' : 'text-content-muted'
            }`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {secondsLeft}s
          </span>
        )}
      </div>

      {submit.isError && (
        <div className="mb-3">
          <ErrorMessage>{getErrorMessage(submit.error)}</ErrorMessage>
        </div>
      )}

      <Card className="min-h-[320px]">
        <p className="mb-5 text-center text-sm font-medium text-content-muted">{exercise.prompt}</p>
        <ExerciseView exercise={exercise} onAnswer={setCurrent} locked={submit.isPending} />
      </Card>

      <div className="mt-4">
        <Button
          onClick={handleNext}
          disabled={!current}
          loading={submit.isPending}
          icon={isLast ? Check : ArrowRight}
          className="w-full"
        >
          {isLast ? t('Nộp bài') : t('Câu tiếp theo')}
        </Button>
        {!current && (
          <p className="mt-2 text-center text-xs text-content-muted">{t('Hãy trả lời để tiếp tục')}</p>
        )}
      </div>
    </div>
  );
}

function ResultView({
  lesson,
  result,
  mode,
  onExit,
}: {
  lesson: LessonDetail;
  result: LessonResult;
  mode: 'lesson' | 'exam';
  onExit: () => void;
}): JSX.Element {
  const t = useT();
  const wrongIds = new Set(result.details.filter((d) => !d.isCorrect).map((d) => d.exerciseId));
  const wrongExercises = lesson.exercises.filter((e) => wrongIds.has(e.id));
  const isExam = mode === 'exam';

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            result.passed ? 'bg-success-soft' : 'bg-accent-soft'
          }`}
        >
          {result.passed ? (
            <Check className="h-7 w-7 text-success" aria-hidden />
          ) : (
            <RotateCw className="h-7 w-7 text-accent-ink" aria-hidden />
          )}
        </div>

        <p className="mt-3 text-2xl font-bold tabular-nums text-content">
          {result.correct}/{result.total}
        </p>
        <p className="mt-1 text-sm text-content-muted">
          {isExam
            ? result.passed
              ? t('Đạt {percent}% — kiến thức chủ đề này khá vững', { percent: result.percentage })
              : t('Đạt {percent}% — nên ôn lại thêm rồi kiểm tra lại', { percent: result.percentage })
            : result.passed
              ? t('Đạt {percent}% — bạn đã qua bài này', { percent: result.percentage })
              : t('Đạt {percent}% — cần đúng từ 70% để qua bài', { percent: result.percentage })}
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={onExit} variant={isExam || result.passed ? 'primary' : 'secondary'}>
            {isExam ? t('Về lộ trình') : result.passed ? t('Về lộ trình') : t('Quay lại')}
          </Button>
        </div>
      </Card>

      {wrongExercises.length > 0 && (
        <Card className="mt-4">
          <p className="mb-2 text-sm font-semibold text-content">
            {t('Những câu cần xem lại ({n})', { n: wrongExercises.length })}
          </p>
          <p className="mb-3 text-xs text-content-muted">
            {t('Các từ này đã được thêm vào mục "Ôn lại từ sai" để bạn luyện tiếp.')}
          </p>
          <ul className="space-y-1.5">
            {wrongExercises.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-sm text-content-soft">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
                <span>
                  {describeExercise(e)}
                  <span className="ml-1.5 text-xs text-content-muted">({e.prompt})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/**
 * Câu chữ nhận diện một bài tập, để danh sách câu sai nói rõ sai ở từ nào.
 * Nếu chỉ hiện `prompt` thì mọi câu cùng dạng sẽ trông giống hệt nhau.
 */
function describeExercise(exercise: Exercise): string {
  switch (exercise.type) {
    case ExerciseType.CHOOSE_MEANING:
    case ExerciseType.CHOOSE_WORD:
      return exercise.question;
    case ExerciseType.TYPE_WORD:
      return exercise.question;
    case ExerciseType.FILL_BLANK:
      return exercise.sentence;
    case ExerciseType.ARRANGE_WORDS:
      return exercise.hint;
    case ExerciseType.MATCH_PAIRS:
      return exercise.words.map((w) => w.text).join(', ');
    // Bài đã nộp xong nên hiện chữ ở đây không còn ảnh hưởng gì
    case ExerciseType.LISTEN_TYPE:
    case ExerciseType.LISTEN_CHOOSE:
      return exercise.speakText;
  }
}
