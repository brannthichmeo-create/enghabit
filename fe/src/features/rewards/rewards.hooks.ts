import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { ClaimMissionInput, CoinChangeResult, RewardsSummary } from '@enghabit/shared';
import { statisticsKeys } from '../statistics/statistics.hooks';
import * as rewardsApi from './rewards.api';

export const rewardsKeys = {
  all: ['rewards'] as const,
  summary: () => ['rewards', 'summary'] as const,
};

/**
 * Toàn bộ khu phần thưởng trong một query. Dùng ở cả thanh trên cùng lẫn trang tổng
 * quan — gọi chung một key nên hai nơi luôn hiện cùng một số dư.
 */
export function useRewards(enabled = true): UseQueryResult<RewardsSummary> {
  return useQuery({ queryKey: rewardsKeys.summary(), queryFn: rewardsApi.getRewards, enabled });
}

/**
 * Mọi hành động phần thưởng đều trả về summary mới, nên ghi thẳng vào cache thay vì
 * gọi lại API. Riêng vật phẩm giữ chuỗi có thể đổi cả streak nên vẫn làm mới thống kê.
 */
function useRewardMutation<TInput>(
  mutationFn: (input: TInput) => Promise<CoinChangeResult>,
): UseMutationResult<CoinChangeResult, Error, TInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.setQueryData(rewardsKeys.summary(), result.summary);
      void queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
    },
  });
}

export function useCheckIn(): UseMutationResult<CoinChangeResult, Error, void> {
  return useRewardMutation<void>(() => rewardsApi.checkIn());
}

export function useClaimMission(): UseMutationResult<CoinChangeResult, Error, ClaimMissionInput> {
  return useRewardMutation<ClaimMissionInput>(rewardsApi.claimMission);
}

export function useBuyStreakFreeze(): UseMutationResult<CoinChangeResult, Error, void> {
  return useRewardMutation<void>(() => rewardsApi.buyStreakFreeze());
}
