import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FriendsPageData } from '@enghabit/shared';
import * as api from './friends.api';

export const friendKeys = { all: ['friends'] as const, data: (search = '') => ['friends', search] as const, profile: (publicId: string) => ['friend-profile', publicId] as const };

export function useFriends(search = ''): UseQueryResult<FriendsPageData> {
  return useQuery({ queryKey: friendKeys.data(search), queryFn: () => api.getFriends(search) });
}
export function useFriendProfile(publicId: string) {
  return useQuery({ queryKey: friendKeys.profile(publicId), queryFn: () => api.getFriendProfile(publicId), enabled: Boolean(publicId) });
}
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: friendKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['friend-profile'] });
}
export function useSendFriendRequest() { const queryClient = useQueryClient(); return useMutation({ mutationFn: api.sendFriendRequest, onSuccess: () => invalidate(queryClient) }); }
export function useAcceptFriendRequest() { const queryClient = useQueryClient(); return useMutation({ mutationFn: api.acceptFriendRequest, onSuccess: () => invalidate(queryClient) }); }
export function useRemoveFriendRequest() { const queryClient = useQueryClient(); return useMutation({ mutationFn: api.removeFriendRequest, onSuccess: () => invalidate(queryClient) }); }
export function useRemoveFriend() { const queryClient = useQueryClient(); return useMutation({ mutationFn: api.removeFriend, onSuccess: () => invalidate(queryClient) }); }
export function useSearchFriend() { return useMutation({ mutationFn: api.searchFriend }); }
