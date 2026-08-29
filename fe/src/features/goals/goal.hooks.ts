import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { CreateGoalInput, GoalProgress, UpdateGoalInput } from '@enghabit/shared';
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

export function useGoalProgress(): UseQueryResult<GoalProgress[]> {
  return useQuery({ queryKey: goalKeys.progress(), queryFn: goalApi.getProgress });
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

export function useDeleteGoal(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: goalApi.deleteGoal,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
