import { useState } from 'react';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, ErrorMessage, Loading, PageHeader } from '../../../shared/components/ui';
import { useQuizAttempts, useQuizzes } from '../quiz.hooks';
import { QuizAttempt } from './QuizAttempt';

export function QuizzesPage(): JSX.Element {
  const quizzes = useQuizzes();
  const attempts = useQuizAttempts();
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

  // Đang làm bài: chuyển hẳn sang màn làm bài để user không bị phân tâm.
  if (activeQuizId !== null) {
    return <QuizAttempt quizId={activeQuizId} onExit={() => setActiveQuizId(null)} />;
  }

  return (
    <div>
      <PageHeader title="Kiểm tra kiến thức" description="Làm quiz để củng cố những gì đã học" />

      {quizzes.isLoading && <Loading />}
      {quizzes.isError && <ErrorMessage>{getErrorMessage(quizzes.error)}</ErrorMessage>}

      {quizzes.data?.length === 0 && (
        <EmptyState title="Chưa có bài quiz nào" description="Quản trị viên cần thêm nội dung" />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {quizzes.data?.map((quiz) => (
          <Card key={quiz.id}>
            <div className="flex h-full flex-col justify-between gap-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{quiz.title}</h3>
                  <Badge>{quiz.topic.name}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{quiz._count.questions} câu hỏi</p>
              </div>
              <Button onClick={() => setActiveQuizId(quiz.id)}>Bắt đầu làm</Button>
            </div>
          </Card>
        ))}
      </div>

      {attempts.data && attempts.data.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-slate-900">Lịch sử làm bài</h2>
          <Card>
            <ul className="divide-y divide-slate-100">
              {attempts.data.slice(0, 10).map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{attempt.quiz.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(attempt.completedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      attempt.score / attempt.total >= 0.7 ? 'text-green-600' : 'text-slate-600'
                    }`}
                  >
                    {attempt.score}/{attempt.total}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
