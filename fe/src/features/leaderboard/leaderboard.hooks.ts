import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { LeaderboardQueryInput, LeaderboardResult } from '@enghabit/shared';
import * as leaderboardApi from './leaderboard.api';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  filter: (range: LeaderboardQueryInput['range'], metric: LeaderboardQueryInput['metric'], scope: LeaderboardQueryInput['scope']) =>
    ['leaderboard', range, metric, scope] as const,
};

export function useLeaderboard(
  range: LeaderboardQueryInput['range'],
  metric: LeaderboardQueryInput['metric'],
  scope: LeaderboardQueryInput['scope'] = 'all',
): UseQueryResult<LeaderboardResult> {
  return useQuery({
    queryKey: leaderboardKeys.filter(range, metric, scope),
    queryFn: () => leaderboardApi.getLeaderboard(range, metric, scope),
    // Giữ bảng cũ trong lúc đổi khoảng/tiêu chí để danh sách không nháy trắng một nhịp.
    placeholderData: (previous) => previous,
    refetchInterval: 30_000,
  });
}
