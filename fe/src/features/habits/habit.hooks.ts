import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { CheckInHabitInput, CreateHabitInput, LocalDate, UpdateHabitInput } from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as habitApi from './habit.api';
import type { CheckInRecord, CompletionRate, Habit } from './habit.api';

export const habitKeys = {
  all: ['habits'] as const,
  list: () => ['habits', 'list'] as const,
  checkIns: (id: number) => ['habits', id, 'check-ins'] as const,
  completionRate: (id: number, from: LocalDate, to: LocalDate) =>
    ['habits', id, 'completion-rate', from, to] as const,
};

export function useHabits(): UseQueryResult<Habit[]> {
  return useQuery({ queryKey: habitKeys.list(), queryFn: habitApi.listHabits });
}

export function useCreateHabit(): UseMutationResult<Habit, Error, CreateHabitInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: habitApi.createHabit,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  });
}

export function useUpdateHabit(): UseMutationResult<Habit, Error, { id: number; input: UpdateHabitInput }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => habitApi.updateHabit(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  });
}

export function useDeleteHabit(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: habitApi.deleteHabit,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  });
}

/**
 * Check-in tạo ActivityLog ở backend nên streak và thống kê đổi theo.
 * Phải invalidate cả statisticsKeys, nếu không dashboard sẽ hiện số liệu cũ.
 */
export function useCheckInHabit(): UseMutationResult<
  { date: LocalDate },
  Error,
  { id: number; input?: CheckInHabitInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => habitApi.checkIn(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: habitKeys.all });
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}

export function useHabitCheckIns(id: number, enabled = true): UseQueryResult<CheckInRecord[]> {
  return useQuery({
    queryKey: habitKeys.checkIns(id),
    queryFn: () => habitApi.listCheckIns(id),
    enabled,
  });
}

export function useCompletionRate(id: number, from: LocalDate, to: LocalDate): UseQueryResult<CompletionRate> {
  return useQuery({
    queryKey: habitKeys.completionRate(id, from, to),
    queryFn: () => habitApi.getCompletionRate(id, from, to),
  });
}
