import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  ActivityCalendar,
  LevelSummary,
  StatsRangeInput,
  StatsSummary,
  StreakSummary,
} from '@enghabit/shared';
import * as statisticsApi from './statistics.api';

/** Key query gom lại một chỗ để invalidate đúng chỗ khi có hoạt động mới. */
export const statisticsKeys = {
  all: ['statistics'] as const,
  summary: (range: StatsRangeInput['range']) => ['statistics', 'summary', range] as const,
  streak: () => ['statistics', 'streak'] as const,
  level: () => ['statistics', 'level'] as const,
  calendar: (months: number) => ['statistics', 'calendar', months] as const,
};

export function useStatsSummary(range: StatsRangeInput['range']): UseQueryResult<StatsSummary> {
  return useQuery({
    queryKey: statisticsKeys.summary(range),
    queryFn: () => statisticsApi.getSummary(range),
  });
}

export function useStreak(enabled = true): UseQueryResult<StreakSummary> {
  return useQuery({ queryKey: statisticsKeys.streak(), queryFn: statisticsApi.getStreak, enabled });
}

export function useActivityCalendar(months = 12): UseQueryResult<ActivityCalendar> {
  return useQuery({
    queryKey: statisticsKeys.calendar(months),
    queryFn: () => statisticsApi.getCalendar(months),
  });
}

/** Cấp độ dùng ở sidebar và trang cá nhân — tách riêng để không phải tải cả thống kê. */
export function useLevel(enabled = true): UseQueryResult<LevelSummary> {
  return useQuery({ queryKey: statisticsKeys.level(), queryFn: statisticsApi.getLevel, enabled });
}
