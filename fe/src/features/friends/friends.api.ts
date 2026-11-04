import type { FriendProfile, FriendUser, FriendsPageData } from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

export async function getFriends(search = ''): Promise<FriendsPageData> {
  const { data } = await apiClient.get('/friends', { params: { search } });
  return data;
}
export async function searchFriend(publicId: string): Promise<FriendUser> {
  const { data } = await apiClient.get('/friends/search', { params: { publicId } });
  return data;
}
export async function getFriendProfile(publicId: string): Promise<FriendProfile> {
  const { data } = await apiClient.get(`/friends/users/${encodeURIComponent(publicId)}/profile`);
  return data;
}
export async function sendFriendRequest(publicId: string): Promise<void> {
  await apiClient.post(`/friends/requests/${encodeURIComponent(publicId)}`);
}
export async function acceptFriendRequest(id: number): Promise<void> {
  await apiClient.post(`/friends/requests/${id}/accept`);
}
export async function removeFriendRequest(id: number): Promise<void> {
  await apiClient.delete(`/friends/requests/${id}`);
}
export async function removeFriend(userId: number): Promise<void> {
  await apiClient.delete(`/friends/${userId}`);
}
