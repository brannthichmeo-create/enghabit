import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  CreateCommentInput,
  CreatePostInput,
  LikeResult,
  Paginated,
  PostCommentRow,
  PostDetail,
  PostQueryInput,
  PostSummary,
} from '@enghabit/shared';
import * as communityApi from './community.api';

export const communityKeys = {
  all: ['community'] as const,
  /**
   * `groupId` BẮT BUỘC có trong khoá: thiếu nó thì bảng tin của nhóm và diễn đàn chung
   * dùng chung một ô cache, và người vừa mở nhóm xong quay ra diễn đàn sẽ thấy đúng
   * danh sách bài nội bộ vừa xem.
   */
  list: (query: PostQueryInput) =>
    [
      'community',
      'posts',
      query.groupId ?? null,
      query.page,
      query.pageSize,
      query.sort,
      query.search ?? '',
      // Đủ CẢ BỐN bộ lọc: thiếu một cái thì bật/tắt nó xong danh sách vẫn là bản cũ
      // trong cache, người dùng tưởng bộ lọc hỏng.
      query.mine,
      query.liked,
      query.hasFiles,
      query.unanswered,
    ] as const,
  detail: (postId: number) => ['community', 'post', postId] as const,
};

export function usePosts(query: PostQueryInput): UseQueryResult<Paginated<PostSummary>> {
  return useQuery({
    queryKey: communityKeys.list(query),
    queryFn: () => communityApi.listPosts(query),
    // Giữ trang cũ khi chuyển trang/đổi bộ lọc để danh sách không nháy trắng.
    placeholderData: (previous) => previous,
  });
}

export function usePost(postId: number | null): UseQueryResult<PostDetail> {
  return useQuery({
    queryKey: communityKeys.detail(postId ?? 0),
    queryFn: () => communityApi.getPost(postId as number),
    enabled: postId !== null,
  });
}

export function useCreatePost(): UseMutationResult<PostDetail, Error, CreatePostInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.createPost,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communityKeys.all }),
  });
}

export function useDeletePost(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.deletePost,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communityKeys.all }),
  });
}

export function useCreateComment(
  postId: number,
): UseMutationResult<PostCommentRow, Error, CreateCommentInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => communityApi.createComment(postId, input),
    // Làm mới cả danh sách vì số bình luận hiện trên thẻ bài ở trang danh sách.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communityKeys.all }),
  });
}

export function useDeleteComment(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.deleteComment,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communityKeys.all }),
  });
}

export function useToggleLike(): UseMutationResult<LikeResult, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.toggleLike,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: communityKeys.all }),
  });
}
