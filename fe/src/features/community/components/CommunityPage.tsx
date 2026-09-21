import { useState } from 'react';
import { AuditTargetType, UserRole } from '@enghabit/shared';
import { Check, Heart, MessageCircle, MessagesSquare, Paperclip, Plus, Search } from 'lucide-react';
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
import { Modal } from '../../../shared/components/Modal';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { usePosts } from '../community.hooks';
import { useT } from '../../../shared/i18n/language';
import { AdminLogTabs, useAdminLogTab } from '../../admin/components/AdminLogTabs';
import { useCurrentUser } from '../../auth/auth.store';

/**
 * Diễn đàn Cộng đồng.
 *
 * Một route duy nhất `/community`; xem chi tiết một bài là đổi trạng thái trong trang
 * chứ không đổi URL — cùng cách làm với màn làm Kiểm tra và học bài (xem CLAUDE.md).
 *
 * Mở cho cả người học lẫn quản trị viên: đây là nơi trao đổi chung, không phải màn
 * hình học tập, nên không bọc route guard `Learner`.
 */

const SORTS: { value: PostQueryInput['sort']; label: string }[] = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'popular', label: 'Nhiều tim nhất' },
];

/**
 * Các bộ lọc CỘNG DỒN — chọn bao nhiêu cái cũng được, kết quả phải thoả hết.
 *
 * Tách khỏi nhóm sắp xếp vì hai thứ khác bản chất: một danh sách chỉ có MỘT thứ tự
 * (không thể vừa xếp theo tim vừa xếp theo ngày), nhưng lọc thì chồng lên nhau được.
 * Trước đây ba nút nằm chung một dải nên trông như chọn một trong ba.
 */
type FilterKey = 'mine' | 'liked' | 'hasFiles' | 'unanswered';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'mine', label: 'Bài của tôi' },
  { key: 'liked', label: 'Bài tôi đã thích' },
  { key: 'hasFiles', label: 'Có tệp đính kèm' },
  { key: 'unanswered', label: 'Chưa có trả lời' },
];

export function CommunityPage(): JSX.Element {
  const t = useT();
  // Diễn đàn dùng chung hai vai trò; chỉ quản trị viên có tab Nhật ký kiểm duyệt (bài và
  // bình luận của người khác mà họ đã xoá). Ở tab đó thì ẩn nút Đăng bài — ô soạn bài
  // nằm trong tab Diễn đàn.
  const isAdmin = useCurrentUser()?.role === UserRole.ADMIN;
  const logTab = useAdminLogTab() && isAdmin;
  const confirm = useConfirm();

  const [openPostId, setOpenPostId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [composerDirty, setComposerDirty] = useState(false);
  const [sort, setSort] = useState<PostQueryInput['sort']>('latest');
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query: PostQueryInput = {
    page,
    pageSize: 10,
    sort,
    mine: filters.has('mine'),
    liked: filters.has('liked'),
    hasFiles: filters.has('hasFiles'),
    unanswered: filters.has('unanswered'),
    ...(search ? { search } : {}),
  };
  const posts = usePosts(query);

  /**
   * Đóng ô soạn bài. Đang có chữ thì hỏi lại — nút ✕, phím Esc và nút Huỷ đều đi qua
   * đây nên chỉ cần một chỗ canh.
   */
  const requestCloseComposer = async (): Promise<void> => {
    if (composerDirty) {
      const ok = await confirm({
        title: t('Xác nhận hủy đăng bài?'),
        message: t('Nội dung bạn đang soạn sẽ mất.'),
        confirmLabel: t('Hủy đăng bài'),
        cancelLabel: t('Tiếp tục soạn'),
        tone: 'danger',
      });
      if (!ok) return;
    }
    setComposerDirty(false);
    setComposing(false);
  };

  const toggleFilter = (key: FilterKey): void => {
    setFilters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPage(1);
  };

  if (openPostId !== null) {
    return <PostDetailView postId={openPostId} onBack={() => setOpenPostId(null)} />;
  }

  const total = posts.data?.total ?? 0;
  /** Có đang lọc hay tìm gì không — quyết định câu chữ lúc danh sách rỗng. */
  const hasQuery = search !== '' || filters.size > 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Cộng đồng')}
        description={t('Đặt câu hỏi, chia sẻ kinh nghiệm học tiếng Anh với mọi người.')}
        action={
          logTab ? undefined : (
            <Button icon={Plus} onClick={() => setComposing(true)}>
              {t('Đăng bài')}
            </Button>
          )
        }
      />
      <AdminLogTabs targetTypes={[AuditTargetType.POST, AuditTargetType.COMMENT]} mainLabel="Diễn đàn" enabled={isAdmin}>
        {/*
          Soạn bài trong hộp thoại thay vì chèn thẳng vào trang: ô soạn cao gần hết màn
          hình nên khi mở, danh sách bài bị đẩy xuống dưới và người dùng mất chỗ đang đọc.
        */}
        <Modal
          open={composing}
          onClose={() => void requestCloseComposer()}
          title={t('Đăng bài viết')}
          size="lg"
          // Đang soạn dở mà bấm trượt ra nền là mất cả bài — chỉ đóng bằng nút hoặc Esc.
          closeOnBackdrop={false}
        >
          <PostComposer
            onDone={() => {
              // Đăng xong thì nội dung đã gửi đi rồi, đóng thẳng không hỏi lại.
              setComposerDirty(false);
              setComposing(false);
            }}
            onCancel={() => void requestCloseComposer()}
            onDirtyChange={setComposerDirty}
          />
        </Modal>

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
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-xs font-medium uppercase tracking-wide text-content-muted">
              {t('Lọc')}
            </span>

            {FILTERS.map((filter) => (
              <FilterChip
                key={filter.key}
                label={t(filter.label)}
                active={filters.has(filter.key)}
                onClick={() => toggleFilter(filter.key)}
              />
            ))}

            {filters.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilters(new Set());
                  setPage(1);
                }}
                className="ml-auto text-xs text-brand-strong hover:underline"
              >
                {t('Bỏ tất cả bộ lọc ({n})', { n: filters.size })}
              </button>
            )}
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
            title={hasQuery ? t('Không có bài nào khớp') : t('Chưa có bài viết nào')}
            description={
              hasQuery
                ? t('Các bộ lọc cộng dồn với nhau — bỏ bớt một cái hoặc đổi từ khoá.')
                : t('Hãy là người mở đầu — đặt một câu hỏi cho cộng đồng.')
            }
            action={
              !hasQuery ? (
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
      </AdminLogTabs>
    </div>
  );
}

/**
 * Một bộ lọc bật/tắt. Dùng `role="checkbox"` chứ không phải nút thường: người dùng
 * trình đọc màn hình phải nghe được đây là thứ chọn nhiều, khác với dải sắp xếp
 * bên trên chỉ chọn một.
 */
function FilterChip({
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
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'border-brand bg-brand-soft text-brand-strong'
          : 'border-line-control text-content-soft hover:bg-sunken'
      }`}
    >
      {/* Dấu tích chỉ hiện khi bật — màu không phải dấu hiệu duy nhất (docs/color-rules.md R21) */}
      {active && <Check className="h-3 w-3" aria-hidden />}
      {label}
    </button>
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
