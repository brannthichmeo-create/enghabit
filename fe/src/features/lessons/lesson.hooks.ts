import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  LessonDetail,
  LessonResult,
  MistakeItem,
  PathTopic,
  SubmitExamInput,
  SubmitLessonInput,
} from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as lessonApi from './lesson.api';

export const lessonKeys = {
  all: ['lessons'] as const,
  path: () => ['lessons', 'path'] as const,
  detail: (topicId: number, index: number) => ['lessons', 'detail', topicId, index] as const,
  mistakes: () => ['lessons', 'mistakes'] as const,
  mistakeCount: () => ['lessons', 'mistakes', 'count'] as const,
  mistakePractice: () => ['lessons', 'mistakes', 'practice'] as const,
  exam: (topicId: number) => ['lessons', 'exam', topicId] as const,
};

export function usePath(): UseQueryResult<PathTopic[]> {
  return useQuery({ queryKey: lessonKeys.path(), queryFn: lessonApi.getPath });
}

export function useLesson(topicId: number, index: number): UseQueryResult<LessonDetail> {
  return useQuery({
    queryKey: lessonKeys.detail(topicId, index),
    queryFn: () => lessonApi.getLesson(topicId, index),
    // Không cache đề bài: vào lại bài phải lấy bản mới nhất
    staleTime: 0,
  });
}

export function useMistakes(limit = 10): UseQueryResult<MistakeItem[]> {
  return useQuery({ queryKey: lessonKeys.mistakes(), queryFn: () => lessonApi.getMistakes(limit) });
}

export function useMistakeCount(enabled = true): UseQueryResult<number> {
  return useQuery({ queryKey: lessonKeys.mistakeCount(), queryFn: lessonApi.getMistakeCount, enabled });
}

export function useMistakePractice(enabled: boolean, limit = 10): UseQueryResult<LessonDetail> {
  return useQuery({
    queryKey: lessonKeys.mistakePractice(),
    queryFn: () => lessonApi.getMistakePractice(limit),
    enabled,
    staleTime: 0,
    // Không có từ nào sai thì backend trả 404 — đó là trạng thái bình thường, đừng thử lại
    retry: false,
  });
}

/**
 * Nộp bài học.
 * Nộp bài ghi ActivityLog và có thể mở khoá bài mới, nên phải làm mới cả lộ trình,
 * danh sách lỗi sai và thống kê — nếu không, màn hình sẽ hiện trạng thái cũ.
 */
export function useSubmitLesson(): UseMutationResult<LessonResult, Error, SubmitLessonInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonApi.submitLesson,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lessonKeys.all });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}

/** Đề bài Kiểm tra của một chủ đề. Không cache: vào lại phải lấy đề mới nhất (giống bài học). */
export function useExam(topicId: number, enabled = true): UseQueryResult<LessonDetail> {
  return useQuery({
    queryKey: lessonKeys.exam(topicId),
    queryFn: () => lessonApi.getTopicExam(topicId),
    enabled,
    staleTime: 0,
  });
}

/**
 * Nộp bài Kiểm tra.
 * Cũng ghi ActivityLog và có thể đổi danh sách lỗi sai, nên làm mới giống hệt bài học.
 */
export function useSubmitExam(): UseMutationResult<LessonResult, Error, SubmitExamInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lessonApi.submitExam,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lessonKeys.all });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}

/**
 * Cách `LessonPlayer` nộp bài, không phụ thuộc payload cụ thể của bài học hay Kiểm tra —
 * hai màn dùng CHUNG một component chơi bài (`LessonPlayer`) nhưng nộp lên hai endpoint
 * khác nhau với hai hình dạng payload khác nhau (bài học có `index`, Kiểm tra thì không).
 */
export interface LessonSubmitAdapter {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  run: (answers: SubmitLessonInput['answers'], onSuccess: (result: LessonResult) => void) => void;
}

/** Adapter nộp bài học/luyện tập — dùng cho cả bài học bình thường lẫn "Ôn lại từ sai". */
export function useLessonSubmit(topicId: number, index: number): LessonSubmitAdapter {
  const mutation = useSubmitLesson();
  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    run: (answers, onSuccess) => mutation.mutate({ topicId, index, answers }, { onSuccess }),
  };
}

/** Adapter nộp bài Kiểm tra. */
export function useExamSubmit(topicId: number): LessonSubmitAdapter {
  const mutation = useSubmitExam();
  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    run: (answers, onSuccess) => mutation.mutate({ topicId, answers }, { onSuccess }),
  };
}
