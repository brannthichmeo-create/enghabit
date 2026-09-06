import type {
  AdminGroupDetail,
  AdminGroupQueryInput,
  AdminGroupRow,
  AccessLogQueryInput,
  AccessOverview,
  AdminUserDetail,
  AdminUserQueryInput,
  AdminUserRow,
  CreateQuizInput,
  CreateQuizQuestionInput,
  CreateTopicInput,
  CreateVocabularyInput,
  LoginEventRow,
  Paginated,
  RejectResetRequestInput,
  ResetRequestQueryInput,
  ResetRequestRow,
  SystemOverview,
  UserRole,
  UserStatus,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';
import type { Topic, Vocabulary } from '../vocabulary/vocabulary.api';

/** Lời gọi API của khu quản trị. Mọi endpoint đều nằm sau role-guard ADMIN ở backend. */

export async function getSystemOverview(): Promise<SystemOverview> {
  const { data } = await apiClient.get<SystemOverview>('/admin/overview');
  return data;
}

// --- Người dùng ---

export async function listUsers(query: Partial<AdminUserQueryInput> = {}): Promise<Paginated<AdminUserRow>> {
  const { data } = await apiClient.get<Paginated<AdminUserRow>>('/admin/users', { params: query });
  return data;
}

export async function getUserDetail(id: number): Promise<AdminUserDetail> {
  const { data } = await apiClient.get<AdminUserDetail>(`/admin/users/${id}`);
  return data;
}

export async function updateUserRole(id: number, role: UserRole): Promise<AdminUserRow> {
  const { data } = await apiClient.patch<AdminUserRow>(`/admin/users/${id}/role`, { role });
  return data;
}

export async function updateUserStatus(id: number, status: UserStatus): Promise<AdminUserRow> {
  const { data } = await apiClient.patch<AdminUserRow>(`/admin/users/${id}/status`, { status });
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

// --- Lượt truy cập ---

export async function getAccessOverview(days: number): Promise<AccessOverview> {
  const { data } = await apiClient.get<AccessOverview>('/admin/access/overview', { params: { days } });
  return data;
}

export async function listLoginEvents(
  query: Partial<AccessLogQueryInput> = {},
): Promise<Paginated<LoginEventRow>> {
  const { data } = await apiClient.get<Paginated<LoginEventRow>>('/admin/access/logs', { params: query });
  return data;
}

// --- Nội dung học tập ---

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const { data } = await apiClient.post<Topic>('/admin/topics', input);
  return data;
}

export async function deleteTopic(id: number): Promise<void> {
  await apiClient.delete(`/admin/topics/${id}`);
}

export async function createVocabulary(input: CreateVocabularyInput): Promise<Vocabulary> {
  const { data } = await apiClient.post<Vocabulary>('/admin/vocabulary', input);
  return data;
}

export async function deleteVocabulary(id: number): Promise<void> {
  await apiClient.delete(`/admin/vocabulary/${id}`);
}

export async function createQuiz(input: CreateQuizInput): Promise<{ id: number; title: string }> {
  const { data } = await apiClient.post<{ id: number; title: string }>('/admin/quizzes', input);
  return data;
}

export async function addQuizQuestion(quizId: number, input: CreateQuizQuestionInput): Promise<{ id: number }> {
  const { data } = await apiClient.post<{ id: number }>(`/admin/quizzes/${quizId}/questions`, input);
  return data;
}

// --- Yêu cầu cấp lại mật khẩu ---
//
// Hai tab của màn "Quản lý yêu cầu" dùng CHUNG endpoint này, khác nhau ở `tab`:
// `pending` là hàng chờ xử lý, `log` là nhật ký các yêu cầu đã xử lý.

export async function listResetRequests(
  query: ResetRequestQueryInput,
): Promise<Paginated<ResetRequestRow>> {
  const { data } = await apiClient.get<Paginated<ResetRequestRow>>('/admin/password-reset-requests', {
    params: query,
  });
  return data;
}

export async function approveResetRequest(id: number): Promise<void> {
  await apiClient.post(`/admin/password-reset-requests/${id}/approve`);
}

export async function rejectResetRequest(id: number, input: RejectResetRequestInput): Promise<void> {
  await apiClient.post(`/admin/password-reset-requests/${id}/reject`, input);
}

// --- Nhóm lớp ---

export async function listGroups(
  query: Partial<AdminGroupQueryInput> = {},
): Promise<Paginated<AdminGroupRow>> {
  const { data } = await apiClient.get<Paginated<AdminGroupRow>>('/admin/groups', { params: query });
  return data;
}

export async function getGroupDetail(groupId: number): Promise<AdminGroupDetail> {
  const { data } = await apiClient.get<AdminGroupDetail>(`/admin/groups/${groupId}`);
  return data;
}

export async function warnGroup(groupId: number, message: string): Promise<{ recipients: number }> {
  const { data } = await apiClient.post<{ recipients: number }>(`/admin/groups/${groupId}/warn`, {
    message,
  });
  return data;
}

export async function blockGroup(groupId: number, reason: string): Promise<AdminGroupDetail> {
  const { data } = await apiClient.post<AdminGroupDetail>(`/admin/groups/${groupId}/block`, { reason });
  return data;
}

export async function unblockGroup(groupId: number): Promise<AdminGroupDetail> {
  const { data } = await apiClient.post<AdminGroupDetail>(`/admin/groups/${groupId}/unblock`);
  return data;
}
