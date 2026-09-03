import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { LeaderboardQueryInput, LeaderboardResult } from '@enghabit/shared';
import * as leaderboardApi from './leaderboard.api';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  range: (range: LeaderboardQueryInput['range']) => ['leaderboard', range] as const,
};

export function useLeaderboard(
  range: LeaderboardQueryInput['range'],
): UseQueryResult<LeaderboardResult> {
  return useQuery({
    queryKey: leaderboardKeys.range(range),
    queryFn: () => leaderboardApi.getLeaderboard(range),
    // Giữ bảng cũ trong lúc đổi khoảng thời gian để danh sách không nháy trắng một nhịp.
    placeholderData: (previous) => previous,
  });
}
