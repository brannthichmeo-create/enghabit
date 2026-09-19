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
import { communityKeys } from '../community/community.hooks';
import { libraryKeys } from '../library/library.hooks';
import { studyKeys } from '../study/study.hooks';
import * as groupApi from './group.api';

export const groupKeys = {
  all: ['groups'] as const,
  mine: () => ['groups', 'mine'] as const,
  myRequests: () => ['groups', 'mine', 'requests'] as const,
  search: (query: Partial<GroupSearchInput>) => ['groups', 'search', query] as const,
  detail: (id: number) => ['groups', 'detail', id] as const,
  byCode: (code: string) => ['groups', 'code', code] as const,
  mentions: (id: number) => ['groups', 'mentions', id] as const,
  documents: (id: number, query: Partial<GroupDocumentQueryInput>) =>
    ['groups', 'documents', id, query] as const,
  studySets: (id: number) => ['groups', 'study-sets', id] as const,
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
  { groupId: number; userId: number; approve: boolean; reason?: string }
> {
  return useGroupMutation(({ groupId, userId, approve, reason }) =>
    groupApi.decideRequest(groupId, userId, approve, reason),
  );
}

/**
 * Yêu cầu vào nhóm của chính mình — tab "Chờ duyệt".
 *
 * Nằm dưới `groupKeys.all` nên xin lại, rời nhóm hay được thêm vào nhóm đều làm mới nó
 * cùng lúc với "Nhóm của tôi": một nhóm không bao giờ hiện ở cả hai tab.
 */
export function useMyJoinRequests(): UseQueryResult<MyJoinRequestRow[]> {
  return useQuery({ queryKey: groupKeys.myRequests(), queryFn: groupApi.listMyJoinRequests });
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
 * Danh sách người có thể nhắc bằng @.
 *
 * `staleTime` dài vì danh sách thành viên đổi rất thưa, còn hook này bị gọi mỗi lần mở
 * ô soạn bài hay ô bình luận — hỏi lại server mỗi lần chỉ làm ô gợi ý hiện chậm hơn.
 * Người vừa được thêm vào nhóm vẫn nhắc được ngay vì mọi thao tác thành viên đều
 * `invalidate` cả `groupKeys.all`.
 */
export function useMentionTargets(groupId: number | null): UseQueryResult<MentionTarget[]> {
  return useQuery({
    queryKey: groupKeys.mentions(groupId ?? 0),
    queryFn: () => groupApi.listMentionTargets(groupId as number),
    enabled: groupId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupDocuments(
  groupId: number,
  query: Partial<GroupDocumentQueryInput>,
): UseQueryResult<Paginated<GroupDocumentRow>> {
  return useQuery({
    queryKey: groupKeys.documents(groupId, query),
    queryFn: () => groupApi.listGroupDocuments(groupId, query),
    // Giữ trang cũ trong lúc tải trang mới để danh sách không nháy trắng khi gõ tìm kiếm
    placeholderData: (previous) => previous,
  });
}

export function useGroupStudySets(groupId: number): UseQueryResult<GroupStudySetRow[]> {
  return useQuery({
    queryKey: groupKeys.studySets(groupId),
    queryFn: () => groupApi.listGroupStudySets(groupId),
  });
}

/**
 * Chia sẻ / gỡ bộ thẻ khỏi nhóm.
 *
 * Kéo theo `libraryKeys` và `studyKeys`: chia sẻ mở thêm quyền đọc cho thành viên, nên
 * nhóm ôn và danh sách bộ học được của họ đổi theo ngay — không làm mới thì người vừa
 * được chia sẻ vẫn thấy thư viện cũ cho tới lần tải lại trang.
 */
export function useShareStudySet(): UseMutationResult<
  GroupStudySetRow[],
  Error,
  { groupId: number; setId: number }
> {
  return useGroupMutation(({ groupId, setId }) => groupApi.shareStudySet(groupId, setId));
}

export function useUnshareStudySet(): UseMutationResult<
  void,
  Error,
  { groupId: number; setId: number }
> {
  return useGroupMutation(({ groupId, setId }) => groupApi.unshareStudySet(groupId, setId));
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
      // Bộ thẻ chia sẻ trong nhóm mở thêm quyền đọc, nên vào/rời nhóm và chia sẻ/gỡ bộ
      // đều làm đổi những gì người này học được ở Thư viện và Ôn tập.
      void queryClient.invalidateQueries({ queryKey: libraryKeys.all });
      void queryClient.invalidateQueries({ queryKey: studyKeys.all });
    },
  });
}
