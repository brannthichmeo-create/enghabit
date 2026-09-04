import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { LeaderboardQueryInput, LeaderboardResult } from '@enghabit/shared';
import * as leaderboardApi from './leaderboard.api';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  filter: (range: LeaderboardQueryInput['range'], metric: LeaderboardQueryInput['metric']) =>
    ['leaderboard', range, metric] as const,
};

export function useLeaderboard(
  range: LeaderboardQueryInput['range'],
  metric: LeaderboardQueryInput['metric'],
): UseQueryResult<LeaderboardResult> {
  return useQuery({
    queryKey: leaderboardKeys.filter(range, metric),
    queryFn: () => leaderboardApi.getLeaderboard(range, metric),
    // Giữ bảng cũ trong lúc đổi khoảng/tiêu chí để danh sách không nháy trắng một nhịp.
    placeholderData: (previous) => previous,
  });
}
