import { useState } from 'react';
import { ArrowRight, Check, RotateCw, X } from 'lucide-react';
import { ExerciseType, type Exercise, type LessonDetail, type LessonResult, type SubmitLessonInput } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, ErrorMessage } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useSubmitLesson } from '../lesson.hooks';
import { ExerciseView, type AnswerValue } from './ExerciseView';

/**
 * Màn hình làm bài: đi qua từng câu, cuối cùng nộp cả bài để backend chấm.
 *
 * Không chấm từng câu ngay khi trả lời vì đáp án đúng không được gửi xuống client —
 * đổi lại người học thấy toàn bộ kết quả một lần ở cuối, kèm chỗ nào sai.
 */
export function LessonPlayer({
  lesson,
  onExit,
  onFinished,
}: {
  lesson: LessonDetail;
  onExit: () => void;
  onFinished?: (result: LessonResult) => void;
}): JSX.Element {
  const submit = useSubmitLesson();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SubmitLessonInput['answers']>([]);
  const [current, setCurrent] = useState<AnswerValue | null>(null);
  const [result, setResult] = useState<LessonResult | null>(null);

  // Màn làm bài không có URL riêng nên phải tự nối cấp cuối vào breadcrumb
  useBreadcrumbTail(lesson.title);

  const exercise = lesson.exercises[index];
  const isLast = index === lesson.exercises.length - 1;

  if (result) {
    return <ResultView lesson={lesson} result={result} onExit={onExit} />;
  }

  if (!exercise) return <ErrorMessage>Bài học không có câu hỏi nào</ErrorMessage>;

  const handleNext = (): void => {
    if (!current) return;

    const next = [
      ...answers,
      {
        exerciseId: exercise.id,
        vocabularyId: exercise.vocabularyId,
        type: exercise.type,
        ...current,
      },
    ];
    setAnswers(next);
    setCurrent(null);

    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }

    submit.mutate(
      { topicId: lesson.topicId, index: lesson.index, answers: next },
      {
        onSuccess: (data) => {
          setResult(data);
          onFinished?.(data);
        },
      },
    );
  };

  const progress = (index / lesson.exercises.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onExit}
          className="rounded-lg p-1.5 text-content-muted transition-colors hover:bg-sunken hover:text-content-soft"
          aria-label="Thoát bài học"
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
          {isLast ? 'Nộp bài' : 'Câu tiếp theo'}
        </Button>
        {!current && (
          <p className="mt-2 text-center text-xs text-content-muted">Hãy trả lời để tiếp tục</p>
        )}
      </div>
    </div>
  );
}

function ResultView({
  lesson,
  result,
  onExit,
}: {
  lesson: LessonDetail;
  result: LessonResult;
  onExit: () => void;
}): JSX.Element {
  const wrongIds = new Set(result.details.filter((d) => !d.isCorrect).map((d) => d.exerciseId));
  const wrongExercises = lesson.exercises.filter((e) => wrongIds.has(e.id));

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
          {result.passed
            ? `Đạt ${result.percentage}% — bạn đã qua bài này`
            : `Đạt ${result.percentage}% — cần đúng từ 70% để qua bài`}
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={onExit} variant={result.passed ? 'primary' : 'secondary'}>
            {result.passed ? 'Về lộ trình' : 'Quay lại'}
          </Button>
        </div>
      </Card>

      {wrongExercises.length > 0 && (
        <Card className="mt-4">
          <p className="mb-2 text-sm font-semibold text-content">
            Những câu cần xem lại ({wrongExercises.length})
          </p>
          <p className="mb-3 text-xs text-content-muted">
            Các từ này đã được thêm vào mục "Ôn lại từ sai" để bạn luyện tiếp.
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
