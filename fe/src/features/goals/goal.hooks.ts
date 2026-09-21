import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { CreateGoalInput, FinishGoalInput, GoalProgress, UpdateGoalInput } from '@enghabit/shared';
import { habitKeys } from '../habits/habit.hooks';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as goalApi from './goal.api';
import type { Goal } from './goal.api';

export const goalKeys = {
  all: ['goals'] as const,
  list: () => ['goals', 'list'] as const,
  progress: () => ['goals', 'progress'] as const,
};

/** `enabled` để biểu mẫu thói quen khỏi gọi khi quản trị viên đã tắt tính năng Mục tiêu. */
export function useGoals(enabled = true): UseQueryResult<Goal[]> {
  return useQuery({ queryKey: goalKeys.list(), queryFn: goalApi.listGoals, enabled });
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
 * Làm mới sau khi một mục tiêu đổi trạng thái (kết thúc, tạm dừng, xoá).
 *
 * Thẻ thói quen hiện tên mục tiêu nó phục vụ, còn trang Báo cáo chỉ chấm mục tiêu đang
 * theo dõi — hai ô cache đó đều phải đổi theo, không thì mục tiêu vừa kết thúc vẫn nằm
 * trên thẻ thói quen và trong báo cáo.
 */
function invalidateAfterStatusChange(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: goalKeys.all });
  void queryClient.invalidateQueries({ queryKey: habitKeys.all });
  void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
}

export function useFinishGoal(): UseMutationResult<Goal, Error, { id: number; input: FinishGoalInput }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => goalApi.finishGoal(id, input),
    onSuccess: () => invalidateAfterStatusChange(queryClient),
  });
}

export function usePauseGoal(): UseMutationResult<Goal, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalApi.pauseGoal,
    onSuccess: () => invalidateAfterStatusChange(queryClient),
  });
}

export function useResumeGoal(): UseMutationResult<Goal, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalApi.resumeGoal,
    onSuccess: () => invalidateAfterStatusChange(queryClient),
  });
}

export function useDeleteGoal(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalApi.deleteGoal,
    onSuccess: () => invalidateAfterStatusChange(queryClient),
  });
}
