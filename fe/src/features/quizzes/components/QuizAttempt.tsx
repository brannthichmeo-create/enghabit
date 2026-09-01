import { useState } from 'react';
import type { QuizResult } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, ErrorMessage, SkeletonList, PageHeader } from '../../../shared/components/ui';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useQuiz, useSubmitQuiz } from '../quiz.hooks';

/** Màn làm bài quiz: chọn đáp án từng câu rồi nộp, backend chấm và trả kết quả. */
export function QuizAttempt({ quizId, onExit }: { quizId: number; onExit: () => void }): JSX.Element {
  const quiz = useQuiz(quizId);
  const submitQuiz = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  // Màn làm bài không có URL riêng nên phải tự nối cấp cuối vào breadcrumb
  useBreadcrumbTail(quiz.data?.title ?? null);

  if (quiz.isLoading) return <SkeletonList rows={3} />;
  if (quiz.isError) return <ErrorMessage>{getErrorMessage(quiz.error)}</ErrorMessage>;
  if (!quiz.data) return <ErrorMessage>Không tải được đề bài</ErrorMessage>;

  if (result) {
    return <QuizResultView quiz={quiz.data} result={result} onExit={onExit} />;
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.data.questions.length;

  const handleSubmit = (): void => {
    submitQuiz.mutate(
      {
        id: quizId,
        input: {
          answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
            questionId: Number(questionId),
            selectedIndex,
          })),
        },
      },
      { onSuccess: setResult },
    );
  };

  return (
    <div>
      <PageHeader
        title={quiz.data.title}
        description={`Đã trả lời ${answeredCount} / ${quiz.data.questions.length} câu`}
        action={
          <Button variant="secondary" onClick={onExit}>
            Thoát
          </Button>
        }
      />

      {submitQuiz.isError && <ErrorMessage>{getErrorMessage(submitQuiz.error)}</ErrorMessage>}

      <div className="space-y-3">
        {quiz.data.questions.map((question, questionIndex) => (
          <Card key={question.id}>
            <p className="font-medium text-content">
              <span className="text-content-muted">Câu {questionIndex + 1}.</span> {question.questionText}
            </p>

            <div className="mt-3 space-y-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[question.id] === optionIndex;
                return (
                  <button
                    key={optionIndex}
                    onClick={() => setAnswers({ ...answers, [question.id]: optionIndex })}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? 'border-brand bg-brand-soft text-brand-strong'
                        : 'border-line hover:border-line-strong'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={handleSubmit} disabled={!allAnswered || submitQuiz.isPending}>
          {submitQuiz.isPending ? 'Đang nộp bài...' : 'Nộp bài'}
        </Button>
        {!allAnswered && (
          <p className="mt-2 text-sm text-content-muted">Hãy trả lời tất cả các câu trước khi nộp</p>
        )}
      </div>
    </div>
  );
}

function QuizResultView({
  quiz,
  result,
  onExit,
}: {
  quiz: { title: string; questions: { id: number; questionText: string; options: string[] }[] };
  result: QuizResult;
  onExit: () => void;
}): JSX.Element {
  const questionById = new Map(quiz.questions.map((q) => [q.id, q]));

  return (
    <div>
      <PageHeader
        title="Kết quả"
        description={quiz.title}
        action={
          <Button variant="secondary" onClick={onExit}>
            Quay lại
          </Button>
        }
      />

      <Card className="mb-4 text-center">
        <p className="text-4xl font-bold text-brand">
          {result.score}/{result.total}
        </p>
        <p className="mt-1 text-sm text-content-muted">Đạt {result.percentage}%</p>
      </Card>

      <h2 className="mb-3 font-semibold text-content">Chi tiết đáp án</h2>
      <div className="space-y-3">
        {result.details.map((detail, index) => {
          const question = questionById.get(detail.questionId);
          if (!question) return null;

          return (
            <Card key={detail.questionId}>
              <p className="font-medium text-content">
                <span className="text-content-muted">Câu {index + 1}.</span> {question.questionText}
              </p>

              <div className="mt-2 space-y-1 text-sm">
                <p className={detail.isCorrect ? 'text-success' : 'text-danger'}>
                  {detail.isCorrect ? '✓' : '✗'} Bạn chọn: {question.options[detail.selectedIndex]}
                </p>
                {!detail.isCorrect && (
                  <p className="text-success">✓ Đáp án đúng: {question.options[detail.correctIndex]}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
