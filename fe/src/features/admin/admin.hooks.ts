import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
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
  AccessLogQueryInput,
  AccessOverview,
  AdminUserDetail,
  AdminUserQueryInput,
  AdminUserRow,
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
import * as adminApi from './admin.api';
import type { Topic, Vocabulary } from './admin.api';

export const adminKeys = {
  all: ['admin'] as const,
  topics: () => ['admin', 'topics'] as const,
  topicVocabulary: (topicId: number) => ['admin', 'topic-vocabulary', topicId] as const,
  studySetReports: (query: Partial<AdminStudySetReportQueryInput>) => ['admin', 'study-set-reports', query] as const,
  studySet: (id: number) => ['admin', 'study-set', id] as const,
  groups: (query: Partial<AdminGroupQueryInput>) => ['admin', 'groups', query] as const,
  group: (id: number) => ['admin', 'group', id] as const,
  overview: () => ['admin', 'overview'] as const,
  users: (query: Partial<AdminUserQueryInput>) => ['admin', 'users', query] as const,
  user: (id: number) => ['admin', 'user', id] as const,
  accessOverview: (days: number) => ['admin', 'access', 'overview', days] as const,
  accessLogs: (query: Partial<AccessLogQueryInput>) => ['admin', 'access', 'logs', query] as const,
  resetRequests: (query: Partial<ResetRequestQueryInput>) => ['admin', 'reset-requests', query] as const,
  shopTypes: () => ['admin', 'shop', 'types'] as const,
  shopItems: (typeId?: number) => ['admin', 'shop', 'items', typeId ?? 'all'] as const,
};

/** Số liệu tổng quan đổi liên tục nên làm mới định kỳ thay vì để người dùng bấm F5. */
const OVERVIEW_REFETCH_MS = 60_000;

export function useSystemOverview(): UseQueryResult<SystemOverview> {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: adminApi.getSystemOverview,
    refetchInterval: OVERVIEW_REFETCH_MS,
  });
}

export function useAdminUsers(query: Partial<AdminUserQueryInput>): UseQueryResult<Paginated<AdminUserRow>> {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => adminApi.listUsers(query),
    // Giữ trang cũ trong lúc tải trang mới để bảng không nháy trắng khi đổi bộ lọc
    placeholderData: (previous) => previous,
  });
}

export function useAdminUser(id: number | null): UseQueryResult<AdminUserDetail> {
  return useQuery({
    queryKey: adminKeys.user(id ?? 0),
    queryFn: () => adminApi.getUserDetail(id as number),
    enabled: id !== null,
  });
}

export function useAccessOverview(days: number): UseQueryResult<AccessOverview> {
  return useQuery({
    queryKey: adminKeys.accessOverview(days),
    queryFn: () => adminApi.getAccessOverview(days),
  });
}

export function useLoginEvents(query: Partial<AccessLogQueryInput>): UseQueryResult<Paginated<LoginEventRow>> {
  return useQuery({
    queryKey: adminKeys.accessLogs(query),
    queryFn: () => adminApi.listLoginEvents(query),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateUserRole(): UseMutationResult<AdminUserRow, Error, { id: number; role: UserRole }> {
  return useAdminMutation(({ id, role }) => adminApi.updateUserRole(id, role));
}

export function useUpdateUserStatus(): UseMutationResult<
  AdminUserRow,
  Error,
  { id: number; status: UserStatus }
> {
  return useAdminMutation(({ id, status }) => adminApi.updateUserStatus(id, status));
}

export function useDeleteUser(): UseMutationResult<void, Error, number> {
  return useAdminMutation(adminApi.deleteUser);
}

// --- Yêu cầu cấp lại mật khẩu ---

export function useResetRequests(
  query: Partial<ResetRequestQueryInput>,
): UseQueryResult<Paginated<ResetRequestRow>> {
  return useQuery({
    queryKey: adminKeys.resetRequests(query),
    queryFn: () => adminApi.listResetRequests(query as ResetRequestQueryInput),
    placeholderData: (previous) => previous,
  });
}

/**
 * Duyệt và từ chối đều đi qua `useAdminMutation` nên sau khi xong sẽ làm mới CẢ HAI
 * tab: một yêu cầu vừa rời hàng chờ thì đồng thời phải xuất hiện trong nhật ký.
 */
export function useApproveResetRequest(): UseMutationResult<void, Error, number> {
  return useAdminMutation(adminApi.approveResetRequest);
}

export function useRejectResetRequest(): UseMutationResult<
  void,
  Error,
  { id: number; input: RejectResetRequestInput }
> {
  return useAdminMutation(({ id, input }) => adminApi.rejectResetRequest(id, input));
}

/**
 * Mutation quản trị: sau khi xong thì làm mới toàn bộ dữ liệu admin.
 *
 * Dùng chung một helper vì mọi thao tác quản trị đều ảnh hưởng nhiều bảng số liệu
 * cùng lúc (đổi vai trò làm lệch cả danh sách lẫn thống kê tổng quan).
 */
function useAdminMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

// --- Nội dung học tập: đụng cả dữ liệu phía người học nên invalidate thêm thư viện ---

export function useTopics(): UseQueryResult<Topic[]> {
  return useQuery({ queryKey: adminKeys.topics(), queryFn: adminApi.listTopics });
}

export function useTopicVocabulary(topicId: number | null): UseQueryResult<Vocabulary[]> {
  return useQuery({
    queryKey: adminKeys.topicVocabulary(topicId ?? 0),
    queryFn: () => adminApi.listVocabularyByTopic(topicId as number),
    enabled: topicId !== null,
  });
}

export function useCreateTopic(): UseMutationResult<Topic, Error, CreateTopicInput> {
  return useContentMutation(adminApi.createTopic);
}

export function useDeleteTopic(): UseMutationResult<void, Error, number> {
  return useContentMutation(adminApi.deleteTopic);
}

export function useCreateVocabulary(): UseMutationResult<Vocabulary, Error, CreateVocabularyInput> {
  return useContentMutation(adminApi.createVocabulary);
}

function useContentMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

// --- Quản lý nhóm lớp ---

export function useAdminGroups(
  query: Partial<AdminGroupQueryInput>,
): UseQueryResult<Paginated<AdminGroupRow>> {
  return useQuery({
    queryKey: adminKeys.groups(query),
    queryFn: () => adminApi.listGroups(query),
    placeholderData: (previous) => previous,
  });
}

export function useAdminGroup(groupId: number | null): UseQueryResult<AdminGroupDetail> {
  return useQuery({
    queryKey: adminKeys.group(groupId ?? 0),
    queryFn: () => adminApi.getGroupDetail(groupId as number),
    enabled: groupId !== null,
  });
}

export function useWarnGroup(): UseMutationResult<
  { recipients: number },
  Error,
  { groupId: number; message: string }
> {
  return useAdminMutation(({ groupId, message }) => adminApi.warnGroup(groupId, message));
}

export function useBlockGroup(): UseMutationResult<
  AdminGroupDetail,
  Error,
  { groupId: number; reason: string }
> {
  return useAdminMutation(({ groupId, reason }) => adminApi.blockGroup(groupId, reason));
}

export function useUnblockGroup(): UseMutationResult<AdminGroupDetail, Error, number> {
  return useAdminMutation(adminApi.unblockGroup);
}

// --- Kiểm duyệt bộ thẻ ---

export function useStudySetReports(
  query: Partial<AdminStudySetReportQueryInput>,
): UseQueryResult<Paginated<AdminStudySetReportRow>> {
  return useQuery({
    queryKey: adminKeys.studySetReports(query),
    queryFn: () => adminApi.listStudySetReports(query),
    placeholderData: (previous) => previous,
  });
}

export function useAdminStudySet(setId: number | null): UseQueryResult<AdminStudySetDetail> {
  return useQuery({
    queryKey: adminKeys.studySet(setId ?? 0),
    queryFn: () => adminApi.getStudySet(setId as number),
    enabled: setId !== null,
  });
}

export function useDismissStudySetReport(): UseMutationResult<void, Error, number> {
  return useAdminMutation(adminApi.dismissStudySetReport);
}

export function useBlockStudySet(): UseMutationResult<AdminStudySetDetail, Error, { setId: number; reason: string }> {
  return useAdminMutation(({ setId, reason }) => adminApi.blockStudySet(setId, reason));
}

export function useUnblockStudySet(): UseMutationResult<AdminStudySetDetail, Error, number> {
  return useAdminMutation(adminApi.unblockStudySet);
}

// --- Cửa hàng vật phẩm ---
//
// Mọi thao tác đi qua `useAdminMutation` nên sau khi xong sẽ làm mới cả danh sách loại
// lẫn danh sách vật phẩm: đổi loại của một vật phẩm là số đếm của HAI loại cùng lệch.

export function useAdminShopTypes(): UseQueryResult<AdminShopTypeView[]> {
  return useQuery({ queryKey: adminKeys.shopTypes(), queryFn: adminApi.listShopTypes });
}

export function useAdminShopItems(typeId?: number): UseQueryResult<AdminShopItemView[]> {
  return useQuery({
    queryKey: adminKeys.shopItems(typeId),
    queryFn: () => adminApi.listShopItems(typeId),
  });
}

export function useCreateShopType(): UseMutationResult<AdminShopTypeView, Error, CreateShopTypeInput> {
  return useAdminMutation(adminApi.createShopType);
}

export function useUpdateShopType(): UseMutationResult<
  AdminShopTypeView,
  Error,
  { id: number; input: UpdateShopTypeInput }
> {
  return useAdminMutation(({ id, input }) => adminApi.updateShopType(id, input));
}

export function useDeleteShopType(): UseMutationResult<void, Error, number> {
  return useAdminMutation(adminApi.deleteShopType);
}

export function useCreateShopItem(): UseMutationResult<AdminShopItemView, Error, CreateShopItemInput> {
  return useAdminMutation(adminApi.createShopItem);
}

export function useUpdateShopItem(): UseMutationResult<
  AdminShopItemView,
  Error,
  { id: number; input: UpdateShopItemInput }
> {
  return useAdminMutation(({ id, input }) => adminApi.updateShopItem(id, input));
}

export function useDeleteShopItem(): UseMutationResult<void, Error, number> {
  return useAdminMutation(adminApi.deleteShopItem);
}

export function useDeleteShopItemImage(): UseMutationResult<AdminShopItemView, Error, number> {
  return useAdminMutation(adminApi.deleteShopItemImage);
}
