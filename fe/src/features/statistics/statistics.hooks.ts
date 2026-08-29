import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { StatsRangeInput, StatsSummary, StreakSummary } from '@enghabit/shared';
import * as statisticsApi from './statistics.api';

/** Key query gom lại một chỗ để invalidate đúng chỗ khi có hoạt động mới. */
export const statisticsKeys = {
  all: ['statistics'] as const,
  summary: (range: StatsRangeInput['range']) => ['statistics', 'summary', range] as const,
  streak: () => ['statistics', 'streak'] as const,
};

export function useStatsSummary(range: StatsRangeInput['range']): UseQueryResult<StatsSummary> {
  return useQuery({
    queryKey: statisticsKeys.summary(range),
    queryFn: () => statisticsApi.getSummary(range),
  });
}

export function useStreak(): UseQueryResult<StreakSummary> {
  return useQuery({ queryKey: statisticsKeys.streak(), queryFn: statisticsApi.getStreak });
}
