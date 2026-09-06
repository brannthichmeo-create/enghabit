import type {
  AddMemberInput,
  CreateGroupInput,
  GroupDetail,
  GroupMemberRole,
  GroupMemberRow,
  GroupSearchInput,
  GroupSummary,
  JoinGroupResult,
  Paginated,
  UpdateGroupInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Nhóm lớp. Bài đăng trong nhóm dùng lại API của module community, chỉ thêm `groupId`. */

export async function listMyGroups(): Promise<GroupSummary[]> {
  const { data } = await apiClient.get<GroupSummary[]>('/groups/mine');
  return data;
}

export async function searchGroups(query: Partial<GroupSearchInput>): Promise<Paginated<GroupSummary>> {
  const { data } = await apiClient.get<Paginated<GroupSummary>>('/groups/search', { params: query });
  return data;
}

export async function findByCode(code: string): Promise<GroupSummary> {
  const { data } = await apiClient.get<GroupSummary>(`/groups/code/${code}`);
  return data;
}

export async function getGroup(groupId: number): Promise<GroupDetail> {
  const { data } = await apiClient.get<GroupDetail>(`/groups/${groupId}`);
  return data;
}

export async function createGroup(input: CreateGroupInput): Promise<GroupSummary> {
  const { data } = await apiClient.post<GroupSummary>('/groups', input);
  return data;
}

export async function updateGroup(groupId: number, input: UpdateGroupInput): Promise<GroupSummary> {
  const { data } = await apiClient.patch<GroupSummary>(`/groups/${groupId}`, input);
  return data;
}

export async function deleteGroup(groupId: number): Promise<void> {
  await apiClient.delete(`/groups/${groupId}`);
}

export async function joinGroup(groupId: number, message?: string): Promise<JoinGroupResult> {
  const { data } = await apiClient.post<JoinGroupResult>(`/groups/${groupId}/join`, { message });
  return data;
}

export async function leaveGroup(groupId: number): Promise<void> {
  await apiClient.post(`/groups/${groupId}/leave`);
}

export async function decideRequest(
  groupId: number,
  userId: number,
  approve: boolean,
): Promise<void> {
  await apiClient.post(`/groups/${groupId}/requests/${userId}/${approve ? 'approve' : 'reject'}`);
}

export async function addMember(groupId: number, input: AddMemberInput): Promise<GroupMemberRow> {
  const { data } = await apiClient.post<GroupMemberRow>(`/groups/${groupId}/members`, input);
  return data;
}

export async function updateMemberRole(
  groupId: number,
  userId: number,
  role: GroupMemberRole,
): Promise<void> {
  await apiClient.patch(`/groups/${groupId}/members/${userId}/role`, { role });
}

export async function removeMember(groupId: number, userId: number): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
}
