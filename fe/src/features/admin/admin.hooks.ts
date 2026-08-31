import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  AccessLogQueryInput,
  AccessOverview,
  AdminUserDetail,
  AdminUserQueryInput,
  AdminUserRow,
  CreateTopicInput,
  CreateVocabularyInput,
  LoginEventRow,
  Paginated,
  SystemOverview,
  UserRole,
  UserStatus,
} from '@enghabit/shared';
import { vocabularyKeys } from '../vocabulary/vocabulary.hooks';
import type { Topic, Vocabulary } from '../vocabulary/vocabulary.api';
import * as adminApi from './admin.api';

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => ['admin', 'overview'] as const,
  users: (query: Partial<AdminUserQueryInput>) => ['admin', 'users', query] as const,
  user: (id: number) => ['admin', 'user', id] as const,
  accessOverview: (days: number) => ['admin', 'access', 'overview', days] as const,
  accessLogs: (query: Partial<AccessLogQueryInput>) => ['admin', 'access', 'logs', query] as const,
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

export function useResetUserPassword(): UseMutationResult<void, Error, { id: number; newPassword: string }> {
  return useAdminMutation(({ id, newPassword }) => adminApi.resetUserPassword(id, newPassword));
}

export function useDeleteUser(): UseMutationResult<void, Error, number> {
  return useAdminMutation(adminApi.deleteUser);
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

// --- Nội dung học tập: đụng cả dữ liệu phía người học nên invalidate thêm vocabularyKeys ---

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
      void queryClient.invalidateQueries({ queryKey: vocabularyKeys.all });
    },
  });
}
