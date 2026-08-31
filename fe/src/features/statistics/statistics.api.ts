import type {
  ActivityCalendar,
  LevelSummary,
  StatsRangeInput,
  StatsSummary,
  StreakSummary,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export async function getSummary(range: StatsRangeInput['range']): Promise<StatsSummary> {
  const { data } = await apiClient.get<StatsSummary>('/statistics/summary', { params: { range } });
  return data;
}

export async function getStreak(): Promise<StreakSummary> {
  const { data } = await apiClient.get<StreakSummary>('/statistics/streak');
  return data;
}

/** Lịch hoạt động 12 tháng gần nhất cho biểu đồ dạng lịch. */
export async function getCalendar(months = 12): Promise<ActivityCalendar> {
  const { data } = await apiClient.get<ActivityCalendar>('/statistics/calendar', { params: { months } });
  return data;
}

export async function getLevel(): Promise<LevelSummary> {
  const { data } = await apiClient.get<LevelSummary>('/statistics/level');
  return data;
}
