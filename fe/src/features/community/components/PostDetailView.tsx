import { useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { UserRole, type PostAuthor, type PostDetail } from '@enghabit/shared';
import { Button, Card, Skeleton } from '../../../shared/components/ui';
import { Avatar } from '../../../shared/components/Sidebar';
import { useBreadcrumbTail } from '../../../shared/components/Breadcrumb';
import { useToast } from '../../../shared/components/Toast';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { AttachmentList } from './AttachmentView';
import {
  useCreateComment,
  useDeleteComment,
  useDeletePost,
  usePost,
  useToggleLike,
} from '../community.hooks';
import { useLocale, useT } from '../../../shared/i18n/language';

/**
 * Chi tiết một bài viết kèm bình luận.
 *
 * Nằm TRONG route `/community` chứ không có URL riêng — cùng cách làm với màn làm
 * Kiểm tra và màn học bài (xem CLAUDE.md). Breadcrumb nối thêm một cấp bằng
 * `useBreadcrumbTail`, hook tự gỡ khi rời màn.
 */
export function PostDetailView({
  postId,
  onBack,
}: {
  postId: number;
  onBack: () => void;
}): JSX.Element {
  const t = useT();
  const post = usePost(postId);

  useBreadcrumbTail(post.data?.title ?? t('Bài viết'));

  if (post.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (post.isError || !post.data) {
    return (
      <Card>
        <p className="text-center text-sm text-danger">{t('Không tải được bài viết')}</p>
        <div className="mt-3 text-center">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
            {t('Quay lại')}
          </Button>
        </div>
      </Card>
    );
  }

  return <Loaded post={post.data} onBack={onBack} />;
}

function Loaded({ post, onBack }: { post: PostDetail; onBack: () => void }): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const toast = useToast();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
        {t('Quay lại danh sách')}
      </Button>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <AuthorLine author={post.author} createdAt={post.createdAt} />

          {post.canDelete && (
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: t('Xoá bài viết này?'),
                  message: t('Bình luận và tệp đính kèm của bài cũng mất theo. Thao tác không thể hoàn tác.'),
                  confirmLabel: t('Xoá bài viết'),
                  tone: 'danger',
                });
                if (!ok) return;
                deletePost.mutate(post.id, {
                  onSuccess: () => {
                    toast.success(t('Đã xoá bài viết'));
                    onBack();
                  },
                  onError: (error) => toast.error(getErrorMessage(error)),
                });
              }}
              className="shrink-0 rounded p-1 text-content-muted transition-colors hover:text-danger"
              aria-label={t('Xoá bài viết')}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <h1 className="mt-3 text-xl font-bold text-content">{post.title}</h1>

        {/*
          `whitespace-pre-wrap` giữ xuống dòng người dùng gõ. Nội dung được React chèn
          làm text node nên thẻ HTML trong đó hiện ra như chữ thường, không chạy.
        */}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-content-soft">{post.body}</p>

        <AttachmentList attachments={post.attachments} />

        <div className="mt-4 flex items-center gap-4 border-t border-line pt-3">
          <button
            type="button"
            onClick={() =>
              toggleLike.mutate(post.id, {
                onError: (error) => toast.error(getErrorMessage(error)),
              })
            }
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors ${
              post.likedByMe ? 'text-danger' : 'text-content-muted hover:text-content-soft'
            }`}
            aria-pressed={post.likedByMe}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} aria-hidden />
            <span className="tabular-nums">{post.likeCount}</span>
            <span className="sr-only">{t('Thả tim')}</span>
          </button>

          <span className="flex items-center gap-1.5 text-sm text-content-muted">
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span className="tabular-nums">{post.commentCount}</span>
          </span>
        </div>
      </Card>

      <CommentSection post={post} />
    </div>
  );
}

function CommentSection({ post }: { post: PostDetail }): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const toast = useToast();
  const [body, setBody] = useState('');
  const createComment = useCreateComment(post.id);
  const deleteComment = useDeleteComment();

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    createComment.mutate(
      { body: trimmed },
      {
        onSuccess: () => setBody(''),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <Card>
      <h2 className="font-semibold text-content">
        {t('Bình luận ({n})', { n: post.comments.length })}
      </h2>

      <form noValidate onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('Viết bình luận của bạn…')}
          maxLength={2000}
          className="min-w-0 flex-1 rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <Button type="submit" icon={Send} loading={createComment.isPending} disabled={!body.trim()}>
          {t('Gửi')}
        </Button>
      </form>

      {post.comments.length === 0 ? (
        <p className="mt-4 text-sm text-content-muted">
          {t('Chưa có bình luận nào. Hãy là người đầu tiên trả lời.')}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {post.comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <Avatar name={comment.author.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <AuthorLine author={comment.author} createdAt={comment.createdAt} compact />
                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: t('Xoá bình luận này?'),
                          confirmLabel: t('Xoá bình luận'),
                          tone: 'danger',
                        });
                        if (!ok) return;
                        deleteComment.mutate(comment.id, {
                          onSuccess: () => toast.success(t('Đã xoá bình luận')),
                          onError: (error) => toast.error(getErrorMessage(error)),
                        });
                      }}
                      className="shrink-0 rounded p-0.5 text-content-muted transition-colors hover:text-danger"
                      aria-label={t('Xoá bình luận')}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-content-soft">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Nhãn đứng cạnh tên người viết.
 *
 * Mỗi người có ĐÚNG MỘT nhãn, không bao giờ có cả hai: quản trị viên vận hành hệ thống
 * chứ không đi học nên họ không có cấp độ (xem CLAUDE.md > Chức năng cho quản trị viên),
 * còn người học thì cấp độ chính là thứ nói lên họ đã học được bao nhiêu.
 */
function AuthorTag({ author }: { author: PostAuthor }): JSX.Element {
  const t = useT();

  // Nhãn quản trị viên dùng màu thương hiệu để câu trả lời chính thức nổi lên giữa
  // luồng thảo luận; cấp độ dùng màu trung tính vì nó chỉ là thông tin phụ.
  if (author.role === UserRole.ADMIN) {
    return (
      <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-strong">
        {t('Quản trị viên')}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">
      {t('Cấp {n}', { n: author.level ?? 1 })}
    </span>
  );
}

/** Tên người viết, nhãn cấp độ hoặc vai trò, và thời điểm. */
export function AuthorLine({
  author,
  createdAt,
  compact = false,
}: {
  author: PostAuthor;
  createdAt: string;
  compact?: boolean;
}): JSX.Element {
  const t = useT();
  const locale = useLocale();

  return (
    <span className={compact ? '' : 'flex items-center gap-2.5'}>
      {!compact && <Avatar name={author.name} />}
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-content">{author.name}</span>
          <AuthorTag author={author} />
        </span>
        <span className="block text-xs text-content-muted">
          {new Date(createdAt).toLocaleString(locale, {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </span>
    </span>
  );
}
