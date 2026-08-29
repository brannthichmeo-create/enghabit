import type { StatsRangeInput, StatsSummary, StreakSummary } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export async function getSummary(range: StatsRangeInput['range']): Promise<StatsSummary> {
  const { data } = await apiClient.get<StatsSummary>('/statistics/summary', { params: { range } });
  return data;
}

export async function getStreak(): Promise<StreakSummary> {
  const { data } = await apiClient.get<StreakSummary>('/statistics/streak');
  return data;
}
