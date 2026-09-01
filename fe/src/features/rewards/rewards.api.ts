import type { ClaimMissionInput, CoinChangeResult, RewardsSummary } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export async function getRewards(): Promise<RewardsSummary> {
  const { data } = await apiClient.get<RewardsSummary>('/rewards');
  return data;
}

export async function checkIn(): Promise<CoinChangeResult> {
  const { data } = await apiClient.post<CoinChangeResult>('/rewards/check-in');
  return data;
}

export async function claimMission(input: ClaimMissionInput): Promise<CoinChangeResult> {
  const { data } = await apiClient.post<CoinChangeResult>('/rewards/missions/claim', input);
  return data;
}

export async function buyStreakFreeze(): Promise<CoinChangeResult> {
  const { data } = await apiClient.post<CoinChangeResult>('/rewards/streak-freeze/buy');
  return data;
}
