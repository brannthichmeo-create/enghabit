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
import { apiClient } from '../../shared/lib/api-client';

export async function listPosts(query: PostQueryInput): Promise<Paginated<PostSummary>> {
  const { data } = await apiClient.get<Paginated<PostSummary>>('/community/posts', { params: query });
  return data;
}

export async function getPost(postId: number): Promise<PostDetail> {
  const { data } = await apiClient.get<PostDetail>(`/community/posts/${postId}`);
  return data;
}

export async function createPost(input: CreatePostInput): Promise<PostDetail> {
  const { data } = await apiClient.post<PostDetail>('/community/posts', input);
  return data;
}

export async function deletePost(postId: number): Promise<void> {
  await apiClient.delete(`/community/posts/${postId}`);
}

export async function createComment(
  postId: number,
  input: CreateCommentInput,
): Promise<PostCommentRow> {
  const { data } = await apiClient.post<PostCommentRow>(`/community/posts/${postId}/comments`, input);
  return data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/community/comments/${commentId}`);
}

export async function toggleLike(postId: number): Promise<LikeResult> {
  const { data } = await apiClient.post<LikeResult>(`/community/posts/${postId}/like`);
  return data;
}

/**
 * Tải nội dung một tệp đính kèm về dạng blob URL.
 *
 * Phải đi qua `apiClient` chứ không đặt thẳng đường dẫn vào `src` của thẻ `img`: endpoint
 * cần header `Authorization`, mà thẻ `img` thì không gửi header được. Cách còn lại là mở
 * endpoint cho truy cập ẩn danh — không làm, vì tệp là nội dung riêng của người dùng.
 *
 * Nơi gọi có trách nhiệm gọi `URL.revokeObjectURL` khi không dùng nữa, nếu không mỗi
 * lần mở bài là giữ thêm một bản sao tệp trong bộ nhớ tab.
 */
export async function fetchAttachmentUrl(attachmentId: number): Promise<string> {
  const { data } = await apiClient.get<Blob>(`/community/attachments/${attachmentId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}
