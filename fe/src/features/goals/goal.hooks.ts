import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { CreateGoalInput, FinishGoalInput, GoalProgress, UpdateGoalInput } from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as goalApi from './goal.api';
import type { Goal } from './goal.api';

export const goalKeys = {
  all: ['goals'] as const,
  list: () => ['goals', 'list'] as const,
  progress: () => ['goals', 'progress'] as const,
};

export function useGoals(): UseQueryResult<Goal[]> {
  return useQuery({ queryKey: goalKeys.list(), queryFn: goalApi.listGoals });
}

/** `enabled` để trang chủ khỏi gọi khi quản trị viên đã tắt tính năng Mục tiêu. */
export function useGoalProgress(enabled = true): UseQueryResult<GoalProgress[]> {
  return useQuery({ queryKey: goalKeys.progress(), queryFn: goalApi.getProgress, enabled });
}

export function useCreateGoal(): UseMutationResult<Goal, Error, CreateGoalInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalApi.createGoal,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useUpdateGoal(): UseMutationResult<Goal, Error, { id: number; input: UpdateGoalInput }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => goalApi.updateGoal(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

/**
 * Kết thúc mục tiêu. Làm mới cả thống kê: trang Báo cáo chỉ chấm mục tiêu đang theo
 * dõi, nên mục tiêu vừa kết thúc phải rời khỏi đó ngay.
 */
export function useFinishGoal(): UseMutationResult<Goal, Error, { id: number; input: FinishGoalInput }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => goalApi.finishGoal(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}

export function useDeleteGoal(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalApi.deleteGoal,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
