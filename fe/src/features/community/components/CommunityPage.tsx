import { useState } from 'react';
import { Heart, MessageCircle, MessagesSquare, Paperclip, Plus, Search } from 'lucide-react';
import type { PostQueryInput, PostSummary } from '@enghabit/shared';
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  SkeletonList,
} from '../../../shared/components/ui';
import { AuthorLine, PostDetailView } from './PostDetailView';
import { PostComposer } from './PostComposer';
import { usePosts } from '../community.hooks';
import { useT } from '../../../shared/i18n/language';

/**
 * Diễn đàn Cộng đồng.
 *
 * Một route duy nhất `/community`; xem chi tiết một bài là đổi trạng thái trong trang
 * chứ không đổi URL — cùng cách làm với màn chơi quiz và học bài (xem CLAUDE.md).
 *
 * Mở cho cả người học lẫn quản trị viên: đây là nơi trao đổi chung, không phải màn
 * hình học tập, nên không bọc route guard `Learner`.
 */

const SORTS: { value: PostQueryInput['sort']; label: string }[] = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'popular', label: 'Nhiều tim nhất' },
];

export function CommunityPage(): JSX.Element {
  const t = useT();

  const [openPostId, setOpenPostId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [sort, setSort] = useState<PostQueryInput['sort']>('latest');
  const [mine, setMine] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query: PostQueryInput = { page, pageSize: 10, sort, mine, ...(search ? { search } : {}) };
  const posts = usePosts(query);

  if (openPostId !== null) {
    return <PostDetailView postId={openPostId} onBack={() => setOpenPostId(null)} />;
  }

  const total = posts.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Cộng đồng')}
        description={t('Đặt câu hỏi, chia sẻ kinh nghiệm học tiếng Anh với mọi người.')}
        action={
          !composing && (
            <Button icon={Plus} onClick={() => setComposing(true)}>
              {t('Đăng bài')}
            </Button>
          )
        }
      />

      {composing && <PostComposer onDone={() => setComposing(false)} />}

      <Card>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <form noValidate
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
            className="flex min-w-0 flex-1 gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
                aria-hidden
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('Tìm trong tiêu đề và nội dung')}
                className="!mt-0 pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              {t('Tìm')}
            </Button>
          </form>

          <div className="flex gap-0.5 rounded-lg bg-sunken p-0.5" role="group" aria-label={t('Sắp xếp')}>
            {SORTS.map((option) => (
              <Tab
                key={option.value}
                label={t(option.label)}
                active={sort === option.value}
                onClick={() => {
                  setSort(option.value);
                  setPage(1);
                }}
              />
            ))}
            <Tab
              label={t('Bài của tôi')}
              active={mine}
              onClick={() => {
                setMine((current) => !current);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {posts.isLoading && <SkeletonList rows={4} />}

      {posts.isError && (
        <Card>
          <p className="py-6 text-center text-sm text-danger">{t('Không tải được danh sách bài viết')}</p>
        </Card>
      )}

      {posts.data && posts.data.items.length === 0 && (
        <EmptyState
          icon={MessagesSquare}
          title={search || mine ? t('Không có bài nào khớp') : t('Chưa có bài viết nào')}
          description={
            search || mine
              ? t('Thử bỏ bớt bộ lọc hoặc từ khoá khác.')
              : t('Hãy là người mở đầu — đặt một câu hỏi cho cộng đồng.')
          }
          action={
            !search && !mine ? (
              <Button icon={Plus} onClick={() => setComposing(true)}>
                {t('Đăng bài')}
              </Button>
            ) : undefined
          }
        />
      )}

      {posts.data && posts.data.items.length > 0 && (
        <div className={`space-y-3 transition-opacity ${posts.isPlaceholderData ? 'opacity-60' : ''}`}>
          {posts.data.items.map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => setOpenPostId(post.id)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t('Trước')}
          </Button>
          <span className="text-sm text-on-page-muted">
            {t('Trang {page}/{total}', { page, total: totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('Sau')}
          </Button>
        </div>
      )}
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-surface text-content shadow-sm' : 'text-content-muted hover:text-content-soft'
      }`}
    >
      {label}
    </button>
  );
}

/** Một bài trong danh sách. Cả thẻ bấm được để mở chi tiết. */
export function PostCard({ post, onOpen }: { post: PostSummary; onOpen: () => void }): JSX.Element {
  const t = useT();
  const imageCount = post.attachments.filter((file) => file.isImage).length;

  return (
    <Card interactive>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <AuthorLine author={post.author} createdAt={post.createdAt} />

        <h2 className="mt-2.5 font-semibold text-content">{post.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-content-soft">{post.excerpt}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
          <span className={`flex items-center gap-1 ${post.likedByMe ? 'text-danger' : ''}`}>
            <Heart className={`h-3.5 w-3.5 ${post.likedByMe ? 'fill-current' : ''}`} aria-hidden />
            <span className="tabular-nums">{post.likeCount}</span>
          </span>

          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{post.commentCount}</span>
          </span>

          {post.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" aria-hidden />
              {imageCount > 0
                ? t('{n} ảnh', { n: imageCount })
                : t('{n} tệp', { n: post.attachments.length })}
            </span>
          )}
        </div>
      </button>
    </Card>
  );
}
