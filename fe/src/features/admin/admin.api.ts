import type {
  AdminGroupDetail,
  AdminShopItemView,
  AdminShopTypeView,
  CreateShopItemInput,
  CreateShopTypeInput,
  UpdateShopItemInput,
  UpdateShopTypeInput,
  AdminGroupQueryInput,
  AdminGroupRow,
  AdminStudySetDetail,
  AdminStudySetReportQueryInput,
  AdminStudySetReportRow,
  VocabLevel,
  AccessLogQueryInput,
  AuditActorOption,
  AuditLogQueryInput,
  AuditLogRow,
  AuditTargetType,
  AccessOverview,
  AdminUserDetail,
  AdminUserQueryInput,
  AdminUserRow,
  CreateTopicInput,
  CreateVocabularyInput,
  StudySetVisibility,
  UpdateTopicInput,
  UpdateVocabularyInput,
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
import { withImageSrc } from '../shop/shop.api';

/** Lời gọi API của khu quản trị. Mọi endpoint đều nằm sau role-guard ADMIN ở backend. */

/** Bộ thẻ "Hệ thống" do quản trị viên soạn. Bộ người học tự tạo không hiện ở đây. */
export interface Topic {
  id: number;
  name: string;
  description: string | null;
  level: VocabLevel;
  /** Bộ "Hệ thống" luôn công khai — backend ghi tường minh lúc tạo, không sửa được. */
  visibility: StudySetVisibility;
  createdAt: string;
  updatedAt: string;
}

/** Một dòng trong danh sách — kèm số thẻ để hiện trên thẻ xem trước. */
export interface TopicWithCount extends Topic {
  vocabularyCount: number;
}

export interface Vocabulary {
  id: number;
  topicId: number;
  word: string;
  meaning: string;
  phonetic: string | null;
  example: string | null;
  audioUrl: string | null;
}

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

// --- Nhật ký thao tác (chỉ đọc) ---

/** Query string chỉ mang chuỗi: danh sách loại gửi dạng `TOPIC,VOCABULARY`. */
function targetTypesParam(targetTypes: readonly AuditTargetType[] | undefined): string | undefined {
  return targetTypes && targetTypes.length > 0 ? targetTypes.join(',') : undefined;
}

export async function listAuditLogs(query: Partial<AuditLogQueryInput> = {}): Promise<Paginated<AuditLogRow>> {
  const { data } = await apiClient.get<Paginated<AuditLogRow>>('/admin/audit-logs', {
    params: { ...query, targetTypes: targetTypesParam(query.targetTypes) },
  });
  return data;
}

export async function listAuditActors(targetTypes?: readonly AuditTargetType[]): Promise<AuditActorOption[]> {
  const { data } = await apiClient.get<AuditActorOption[]>('/admin/audit-logs/actors', {
    params: { targetTypes: targetTypesParam(targetTypes) },
  });
  return data;
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

export async function listTopics(): Promise<TopicWithCount[]> {
  const { data } = await apiClient.get<TopicWithCount[]>('/topics');
  return data;
}

export async function getTopic(id: number): Promise<Topic> {
  const { data } = await apiClient.get<Topic>(`/topics/${id}`);
  return data;
}

export async function listVocabularyByTopic(topicId: number): Promise<Vocabulary[]> {
  const { data } = await apiClient.get<Vocabulary[]>(`/topics/${topicId}/vocabulary`);
  return data;
}

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const { data } = await apiClient.post<Topic>('/admin/topics', input);
  return data;
}

export async function updateTopic(id: number, input: UpdateTopicInput): Promise<Topic> {
  const { data } = await apiClient.patch<Topic>(`/admin/topics/${id}`, input);
  return data;
}

export async function deleteTopic(id: number): Promise<void> {
  await apiClient.delete(`/admin/topics/${id}`);
}

export async function createVocabulary(input: CreateVocabularyInput): Promise<Vocabulary> {
  const { data } = await apiClient.post<Vocabulary>('/admin/vocabulary', input);
  return data;
}

export async function updateVocabulary(id: number, input: UpdateVocabularyInput): Promise<Vocabulary> {
  const { data } = await apiClient.patch<Vocabulary>(`/admin/vocabulary/${id}`, input);
  return data;
}

export async function deleteVocabulary(id: number): Promise<void> {
  await apiClient.delete(`/admin/vocabulary/${id}`);
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

// --- Kiểm duyệt bộ thẻ ---

export async function listStudySetReports(
  query: Partial<AdminStudySetReportQueryInput> = {},
): Promise<Paginated<AdminStudySetReportRow>> {
  const { data } = await apiClient.get<Paginated<AdminStudySetReportRow>>('/admin/study-set-reports', {
    params: query,
  });
  return data;
}

export async function dismissStudySetReport(reportId: number): Promise<void> {
  await apiClient.post(`/admin/study-set-reports/${reportId}/dismiss`);
}

export async function getStudySet(setId: number): Promise<AdminStudySetDetail> {
  const { data } = await apiClient.get<AdminStudySetDetail>(`/admin/study-sets/${setId}`);
  return data;
}

export async function blockStudySet(setId: number, reason: string): Promise<AdminStudySetDetail> {
  const { data } = await apiClient.post<AdminStudySetDetail>(`/admin/study-sets/${setId}/block`, { reason });
  return data;
}

export async function unblockStudySet(setId: number): Promise<AdminStudySetDetail> {
  const { data } = await apiClient.post<AdminStudySetDetail>(`/admin/study-sets/${setId}/unblock`);
  return data;
}

// --- Cửa hàng vật phẩm ---
//
// Nhánh /admin/shop KHÔNG chịu cờ tính năng SHOP: tắt cửa hàng phía người học không
// được làm quản trị viên mất chỗ soạn vật phẩm (xem be/src/app.ts).

export async function listShopTypes(): Promise<AdminShopTypeView[]> {
  const { data } = await apiClient.get<AdminShopTypeView[]>('/admin/shop/types');
  return data;
}

export async function createShopType(input: CreateShopTypeInput): Promise<AdminShopTypeView> {
  const { data } = await apiClient.post<AdminShopTypeView>('/admin/shop/types', input);
  return data;
}

export async function updateShopType(
  id: number,
  input: UpdateShopTypeInput,
): Promise<AdminShopTypeView> {
  const { data } = await apiClient.patch<AdminShopTypeView>(`/admin/shop/types/${id}`, input);
  return data;
}

export async function deleteShopType(id: number): Promise<void> {
  await apiClient.delete(`/admin/shop/types/${id}`);
}

export async function listShopItems(typeId?: number): Promise<AdminShopItemView[]> {
  const { data } = await apiClient.get<AdminShopItemView[]>('/admin/shop/items', {
    params: typeId ? { typeId } : undefined,
  });
  // Cùng lý do với shop.api: imageUrl của backend là đường dẫn dưới gốc API.
  return data.map(withImageSrc);
}

export async function createShopItem(input: CreateShopItemInput): Promise<AdminShopItemView> {
  const { data } = await apiClient.post<AdminShopItemView>('/admin/shop/items', input);
  return withImageSrc(data);
}

export async function updateShopItem(
  id: number,
  input: UpdateShopItemInput,
): Promise<AdminShopItemView> {
  const { data } = await apiClient.patch<AdminShopItemView>(`/admin/shop/items/${id}`, input);
  return withImageSrc(data);
}

export async function deleteShopItem(id: number): Promise<void> {
  await apiClient.delete(`/admin/shop/items/${id}`);
}

export async function deleteShopItemImage(id: number): Promise<AdminShopItemView> {
  const { data } = await apiClient.delete<AdminShopItemView>(`/admin/shop/items/${id}/image`);
  return withImageSrc(data);
}
