import type { LeaderboardQueryInput, LeaderboardResult } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export async function getLeaderboard(
  range: LeaderboardQueryInput['range'],
): Promise<LeaderboardResult> {
  const { data } = await apiClient.get<LeaderboardResult>('/leaderboard', { params: { range } });
  return data;
}
