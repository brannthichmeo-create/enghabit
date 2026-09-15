import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  AnswerResult,
  CardReviewRow,
  FinishSessionResult,
  Paginated,
  StudyOverview,
  StudyQuestionsInput,
  StudyQuestionsResult,
  StudyStats,
  SubmitAnswerInput,
} from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as studyApi from './study.api';

export const studyKeys = {
  all: ['study'] as const,
  overview: () => ['study', 'overview'] as const,
  dueCount: () => ['study', 'due-count'] as const,
  stats: () => ['study', 'stats'] as const,
  history: (page: number) => ['study', 'history', page] as const,
};

export function useStudyOverview(enabled = true): UseQueryResult<StudyOverview> {
  return useQuery({ queryKey: studyKeys.overview(), queryFn: studyApi.getOverview, enabled });
}

/** Số thẻ cần ôn hôm nay (tới hạn + quá hạn) — huy hiệu sidebar và thẻ "Việc hôm nay". */
export function useDueCount(enabled = true): UseQueryResult<number> {
  return useQuery({ queryKey: studyKeys.dueCount(), queryFn: studyApi.getDueCount, enabled });
}

export function useStudyStats(enabled = true): UseQueryResult<StudyStats> {
  return useQuery({ queryKey: studyKeys.stats(), queryFn: studyApi.getStats, enabled });
}

export function useReviewHistory(page: number, enabled = true): UseQueryResult<Paginated<CardReviewRow>> {
  return useQuery({
    queryKey: studyKeys.history(page),
    queryFn: () => studyApi.getHistory({ page }),
    enabled,
    placeholderData: (previous) => previous,
  });
}

/** Lấy một lượt thẻ. Là mutation vì mỗi lần gọi phát ra một bộ câu hỏi mới — không được cache. */
export function useLoadQuestions(): UseMutationResult<StudyQuestionsResult, Error, StudyQuestionsInput> {
  return useMutation({ mutationFn: studyApi.getQuestions });
}

/**
 * Nộp một câu. KHÔNG làm mới dữ liệu sau từng câu — cả trang tổng quan, huy hiệu và
 * thống kê sẽ tải lại liên tục giữa phiên. Làm mới một lần khi phiên kết thúc
 * (`useRefreshAfterSession`).
 */
export function useSubmitAnswer(): UseMutationResult<AnswerResult, Error, SubmitAnswerInput> {
  return useMutation({ mutationFn: studyApi.submitAnswer });
}

export function useFinishSession(): UseMutationResult<FinishSessionResult, Error, string> {
  return useMutation({ mutationFn: studyApi.finishSession });
}

/**
 * Làm mới mọi thứ phiên học vừa làm thay đổi: nhóm ôn, tiến độ bộ thẻ, streak, thống kê.
 * Khoá thư viện ghi dạng mảng thẳng vì `library.hooks` đã import từ file này.
 */
export function useRefreshAfterSession(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: studyKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['library'] });
    void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
  };
}
