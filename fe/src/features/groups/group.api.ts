import type {
  AddMemberInput,
  CreateGroupInput,
  GroupDetail,
  GroupDocumentQueryInput,
  GroupDocumentRow,
  GroupMemberRole,
  GroupMemberRow,
  GroupSearchInput,
  GroupStudySetRow,
  GroupSummary,
  JoinGroupResult,
  MentionTarget,
  MyJoinRequestRow,
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

/** Từ chối thì bắt buộc có `reason` — backend kiểm bằng `rejectJoinRequestSchema`. */
export async function decideRequest(
  groupId: number,
  userId: number,
  approve: boolean,
  reason?: string,
): Promise<void> {
  await apiClient.post(
    `/groups/${groupId}/requests/${userId}/${approve ? 'approve' : 'reject'}`,
    approve ? undefined : { reason },
  );
}

/** Yêu cầu vào nhóm mình đã gửi — đang chờ hoặc bị từ chối (tab "Chờ duyệt"). */
export async function listMyJoinRequests(): Promise<MyJoinRequestRow[]> {
  const { data } = await apiClient.get<MyJoinRequestRow[]>('/groups/mine/requests');
  return data;
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

/** Danh sách người có thể nhắc bằng @ — chính là thành viên nhóm. */
export async function listMentionTargets(groupId: number): Promise<MentionTarget[]> {
  const { data } = await apiClient.get<MentionTarget[]>(`/groups/${groupId}/mentions`);
  return data;
}

/**
 * Tài liệu chung của nhóm.
 *
 * Chỉ LIỆT KÊ ở đây. Tệp đi lên bằng bài đăng và tải về qua `fetchAttachmentUrl` của
 * module community — cùng một tệp thì chỉ có một đường lên và một đường xuống.
 */
export async function listGroupDocuments(
  groupId: number,
  query: Partial<GroupDocumentQueryInput>,
): Promise<Paginated<GroupDocumentRow>> {
  const { data } = await apiClient.get<Paginated<GroupDocumentRow>>(
    `/groups/${groupId}/documents`,
    { params: query },
  );
  return data;
}

export async function listGroupStudySets(groupId: number): Promise<GroupStudySetRow[]> {
  const { data } = await apiClient.get<GroupStudySetRow[]>(`/groups/${groupId}/study-sets`);
  return data;
}

export async function shareStudySet(groupId: number, setId: number): Promise<GroupStudySetRow[]> {
  const { data } = await apiClient.post<GroupStudySetRow[]>(`/groups/${groupId}/study-sets`, {
    setId,
  });
  return data;
}

export async function unshareStudySet(groupId: number, setId: number): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/study-sets/${setId}`);
}
