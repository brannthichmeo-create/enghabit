import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { QuizResult, SubmitQuizInput } from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as quizApi from './quiz.api';
import type { QuizAttemptRecord, QuizForAttempt, QuizListItem } from './quiz.api';

export const quizKeys = {
  all: ['quizzes'] as const,
  list: (topicId?: number) => ['quizzes', 'list', topicId ?? 'all'] as const,
  detail: (id: number) => ['quizzes', 'detail', id] as const,
  attempts: () => ['quizzes', 'attempts'] as const,
};

export function useQuizzes(topicId?: number): UseQueryResult<QuizListItem[]> {
  return useQuery({ queryKey: quizKeys.list(topicId), queryFn: () => quizApi.listQuizzes(topicId) });
}

export function useQuiz(id: number | null): UseQueryResult<QuizForAttempt> {
  return useQuery({
    queryKey: quizKeys.detail(id ?? 0),
    queryFn: () => quizApi.getQuiz(id as number),
    enabled: id !== null,
    // Không cache đề bài: mỗi lần làm lại nên lấy bản mới nhất.
    staleTime: 0,
  });
}

export function useQuizAttempts(): UseQueryResult<QuizAttemptRecord[]> {
  return useQuery({ queryKey: quizKeys.attempts(), queryFn: () => quizApi.listAttempts() });
}

/** Nộp bài ghi ActivityLog nên phải làm mới thống kê/streak. */
export function useSubmitQuiz(): UseMutationResult<QuizResult, Error, { id: number; input: SubmitQuizInput }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => quizApi.submitQuiz(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quizKeys.attempts() });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}
