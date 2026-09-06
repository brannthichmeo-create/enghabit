import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
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
import { communityKeys } from '../community/community.hooks';
import * as groupApi from './group.api';

export const groupKeys = {
  all: ['groups'] as const,
  mine: () => ['groups', 'mine'] as const,
  search: (query: Partial<GroupSearchInput>) => ['groups', 'search', query] as const,
  detail: (id: number) => ['groups', 'detail', id] as const,
  byCode: (code: string) => ['groups', 'code', code] as const,
};

export function useMyGroups(): UseQueryResult<GroupSummary[]> {
  return useQuery({ queryKey: groupKeys.mine(), queryFn: groupApi.listMyGroups });
}

export function useGroupSearch(
  query: Partial<GroupSearchInput>,
  enabled = true,
): UseQueryResult<Paginated<GroupSummary>> {
  return useQuery({
    queryKey: groupKeys.search(query),
    queryFn: () => groupApi.searchGroups(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

/**
 * Tra nhóm bằng mã 8 số.
 *
 * `retry: false` vì mã sai trả về 404 — thử lại ba lần chỉ làm người dùng chờ lâu hơn
 * mới thấy được thông báo "không tìm thấy".
 */
export function useGroupByCode(code: string | null): UseQueryResult<GroupSummary> {
  return useQuery({
    queryKey: groupKeys.byCode(code ?? ''),
    queryFn: () => groupApi.findByCode(code as string),
    enabled: code !== null && /^\d{8}$/.test(code),
    retry: false,
  });
}

export function useGroup(groupId: number | null): UseQueryResult<GroupDetail> {
  return useQuery({
    queryKey: groupKeys.detail(groupId ?? 0),
    queryFn: () => groupApi.getGroup(groupId as number),
    enabled: groupId !== null,
    retry: false,
  });
}

export function useCreateGroup(): UseMutationResult<GroupSummary, Error, CreateGroupInput> {
  return useGroupMutation(groupApi.createGroup);
}

export function useUpdateGroup(): UseMutationResult<
  GroupSummary,
  Error,
  { id: number; input: UpdateGroupInput }
> {
  return useGroupMutation(({ id, input }) => groupApi.updateGroup(id, input));
}

export function useDeleteGroup(): UseMutationResult<void, Error, number> {
  return useGroupMutation(groupApi.deleteGroup);
}

export function useJoinGroup(): UseMutationResult<
  JoinGroupResult,
  Error,
  { id: number; message?: string }
> {
  return useGroupMutation(({ id, message }) => groupApi.joinGroup(id, message));
}

export function useLeaveGroup(): UseMutationResult<void, Error, number> {
  return useGroupMutation(groupApi.leaveGroup);
}

export function useDecideRequest(): UseMutationResult<
  void,
  Error,
  { groupId: number; userId: number; approve: boolean }
> {
  return useGroupMutation(({ groupId, userId, approve }) =>
    groupApi.decideRequest(groupId, userId, approve),
  );
}

export function useAddMember(): UseMutationResult<
  GroupMemberRow,
  Error,
  { groupId: number; input: AddMemberInput }
> {
  return useGroupMutation(({ groupId, input }) => groupApi.addMember(groupId, input));
}

export function useUpdateMemberRole(): UseMutationResult<
  void,
  Error,
  { groupId: number; userId: number; role: GroupMemberRole }
> {
  return useGroupMutation(({ groupId, userId, role }) =>
    groupApi.updateMemberRole(groupId, userId, role),
  );
}

export function useRemoveMember(): UseMutationResult<
  void,
  Error,
  { groupId: number; userId: number }
> {
  return useGroupMutation(({ groupId, userId }) => groupApi.removeMember(groupId, userId));
}

/**
 * Mọi thao tác với nhóm đều làm mới cả dữ liệu nhóm lẫn bài đăng.
 *
 * Kéo theo `communityKeys` vì bài của nhóm nằm chung kho với diễn đàn chung: rời nhóm
 * xong mà bảng tin cũ còn trong cache thì người vừa rời vẫn đọc được nội dung nội bộ.
 */
function useGroupMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.all });
      void queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}
