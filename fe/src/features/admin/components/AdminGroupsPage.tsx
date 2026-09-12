import { useEffect, useState, type FormEvent } from 'react';
import { Ban, Globe, Lock, Megaphone, Search, ShieldCheck, UsersRound, X } from 'lucide-react';
import {
  GroupMemberRole,
  GroupVisibility,
  blockGroupSchema,
  warnGroupSchema,
  type AdminGroupRow,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  Select,
  SkeletonList,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useLocale, useT } from '../../../shared/i18n/language';
import {
  useAdminGroup,
  useAdminGroups,
  useBlockGroup,
  useUnblockGroup,
  useWarnGroup,
} from '../admin.hooks';

/**
 * Quản lý toàn bộ nhóm lớp.
 *
 * Quản trị viên KHÔNG tham gia nhóm nào: không đọc bài, không duyệt yêu cầu vào nhóm.
 * Chỉ ba việc — xem thông tin, gửi cảnh báo vi phạm, chặn/mở chặn — nên trang này là
 * bảng giám sát chứ không phải bản sao giao diện nhóm của người học.
 */
export function AdminGroupsPage(): JSX.Element {
  const t = useT();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [visibility, setVisibility] = useState<'' | GroupVisibility>('');
  const [sort, setSort] = useState<'newest' | 'members' | 'posts'>('newest');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const groups = useAdminGroups({
    page,
    search: debounced || undefined,
    status,
    ...(visibility ? { visibility } : {}),
    sort,
  });

  const totalPages = groups.data ? Math.ceil(groups.data.total / groups.data.pageSize) : 1;

  return (
    <div>
      <PageHeader
        title={t('Quản lý nhóm')}
        description={t('Giám sát nhóm lớp do người học lập, gửi cảnh báo và chặn nhóm vi phạm')}
      />

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm theo tên nhóm hoặc mã')}
              aria-label={t('Tìm nhóm')}
              className="pl-9"
            />
          </label>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            aria-label={t('Lọc theo trạng thái')}
          >
            <option value="all">{t('Mọi trạng thái')}</option>
            <option value="active">{t('Đang hoạt động')}</option>
            <option value="blocked">{t('Đang bị chặn')}</option>
          </Select>

          <Select
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value as '' | GroupVisibility);
              setPage(1);
            }}
            aria-label={t('Lọc theo quyền riêng tư')}
          >
            <option value="">{t('Công khai và riêng tư')}</option>
            <option value={GroupVisibility.PUBLIC}>{t('Chỉ nhóm công khai')}</option>
            <option value={GroupVisibility.PRIVATE}>{t('Chỉ nhóm riêng tư')}</option>
          </Select>

          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t('Sắp xếp')}>
            <option value="newest">{t('Mới lập nhất')}</option>
            <option value="members">{t('Nhiều thành viên nhất')}</option>
            <option value="posts">{t('Nhiều bài đăng nhất')}</option>
          </Select>
        </div>
      </Card>

      {groups.isLoading && <SkeletonList rows={4} />}
      {groups.isError && <ErrorMessage>{getErrorMessage(groups.error)}</ErrorMessage>}

      {groups.data?.items.length === 0 && (
        <EmptyState
          icon={UsersRound}
          title={t('Không có nhóm nào khớp')}
          description={t('Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.')}
        />
      )}

      {groups.data && groups.data.items.length > 0 && (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-content-muted">
                  <th className="pb-2 font-medium">{t('Nhóm')}</th>
                  <th className="pb-2 font-medium">{t('Trưởng nhóm')}</th>
                  <th className="pb-2 pr-6 text-right font-medium">{t('Thành viên')}</th>
                  <th className="pb-2 pr-6 text-right font-medium">{t('Bài đăng')}</th>
                  <th className="pb-2 font-medium">{t('Trạng thái')}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {groups.data.items.map((group) => (
                  <GroupRow key={group.id} group={group} onOpen={() => setDetailId(group.id)} />
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                {t('Trước')}
              </Button>
              <span className="text-sm tabular-nums text-on-page-muted">
                {t('Trang {page} / {total}', { page, total: totalPages })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Sau')}
              </Button>
            </div>
          )}
        </>
      )}

      {detailId !== null && <GroupDetailModal groupId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function GroupRow({ group, onOpen }: { group: AdminGroupRow; onOpen: () => void }): JSX.Element {
  const t = useT();

  return (
    <tr className={group.block ? 'opacity-70' : ''}>
      <td className="py-2.5">
        <button onClick={onOpen} className="text-left hover:underline">
          <span className="flex items-center gap-2 font-medium text-content">
            {group.name}
            {group.visibility === GroupVisibility.PRIVATE ? (
              <Lock className="h-3.5 w-3.5 text-content-muted" aria-label={t('Riêng tư')} />
            ) : (
              <Globe className="h-3.5 w-3.5 text-content-muted" aria-label={t('Công khai')} />
            )}
          </span>
          <span className="block text-xs tabular-nums text-content-muted">#{group.code}</span>
        </button>
      </td>
      <td className="py-2.5 text-content-soft">
        {group.leaders.length === 0 ? (
          // Không nên xảy ra (luôn còn ít nhất một trưởng nhóm), nhưng nếu dữ liệu cũ
          // lỡ rơi vào trạng thái này thì phải nhìn ra ngay chứ không hiện ô trống.
          <span className="text-danger">{t('Nhóm không còn trưởng nhóm')}</span>
        ) : (
          <>
            <span className="block">{group.leaders[0]?.name}</span>
            <span className="block text-xs text-content-muted">
              @{group.leaders[0]?.username}
              {group.leaders.length > 1 && ` +${group.leaders.length - 1}`}
            </span>
          </>
        )}
      </td>
      <td className="py-2.5 pr-6 text-right tabular-nums text-content-soft">{group.memberCount}</td>
      <td className="py-2.5 pr-6 text-right tabular-nums text-content-soft">{group.postCount}</td>
      <td className="py-2.5">
        {group.block ? (
          <Badge tone="amber" icon={Ban}>
            {t('Đang bị chặn')}
          </Badge>
        ) : (
          <Badge tone="green">{t('Đang hoạt động')}</Badge>
        )}
      </td>
      <td className="py-2.5 text-right">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          {t('Xem')}
        </Button>
      </td>
    </tr>
  );
}

/** Hồ sơ một nhóm kèm ba thao tác quản trị. */
function GroupDetailModal({ groupId, onClose }: { groupId: number; onClose: () => void }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const detail = useAdminGroup(groupId);

  const [action, setAction] = useState<'none' | 'warn' | 'block'>('none');

  const group = detail.data;

  return (
    <Modal open onClose={onClose} title={group?.name ?? t('Thông tin nhóm')} size="lg">
      {detail.isLoading && <SkeletonList rows={3} />}
      {detail.isError && <ErrorMessage>{getErrorMessage(detail.error)}</ErrorMessage>}

      {group && (
        <div className="space-y-5">
          {group.block && (
            <div className="rounded-lg border border-danger/40 bg-danger-soft px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-danger">
                <Ban className="h-4 w-4" aria-hidden />
                {t('Nhóm đang bị chặn')}
              </p>
              <p className="mt-1 text-sm text-content-soft">{group.block.reason}</p>
              <p className="mt-1 text-xs text-content-muted">
                {t('Chặn lúc {time}', {
                  time: new Date(group.block.blockedAt).toLocaleString(locale),
                })}
                {group.block.blockedBy ? ` · ${group.block.blockedBy}` : ''}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label={t('Mã nhóm')} value={group.code} />
            <Stat
              label={t('Quyền riêng tư')}
              value={group.visibility === GroupVisibility.PUBLIC ? t('Công khai') : t('Riêng tư')}
            />
            <Stat label={t('Thành viên')} value={String(group.memberCount)} />
            <Stat label={t('Bài đăng')} value={String(group.postCount)} />
            <Stat label={t('Chờ duyệt')} value={String(group.pendingCount)} />
            <Stat
              label={t('Phê duyệt thành viên')}
              value={group.requireApproval ? t('Bật') : t('Tắt')}
            />
            <Stat
              label={t('Bài mới nhất')}
              value={group.lastPostAt ? new Date(group.lastPostAt).toLocaleDateString(locale) : '—'}
            />
          </dl>

          {group.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                {t('Mô tả nhóm')}
              </p>
              <p className="mt-1 text-sm text-content-soft">{group.description}</p>
            </div>
          )}

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
              {t('Thành viên')}
            </p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-line">
              <ul className="divide-y divide-line">
                {group.members.map((member) => (
                  <li key={member.userId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate text-content">{member.name}</span>
                      <span className="block text-xs text-content-muted">@{member.username}</span>
                    </span>
                    {member.role === GroupMemberRole.LEADER && (
                      <Badge tone="brand">{t('Trưởng nhóm')}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
              {t('Bài đăng gần đây')}
            </p>
            {group.recentPosts.length === 0 ? (
              <p className="text-sm text-content-muted">{t('Nhóm chưa có bài nào')}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {group.recentPosts.map((post) => (
                  <li key={post.id} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-content">{post.title}</span>
                    <span className="text-xs text-content-muted">
                      {post.authorName} · {new Date(post.createdAt).toLocaleDateString(locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {action === 'warn' && (
            <WarnForm groupId={group.id} onDone={() => setAction('none')} />
          )}
          {action === 'block' && (
            <BlockForm groupId={group.id} onDone={() => setAction('none')} />
          )}

          {action === 'none' && (
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button variant="secondary" icon={Megaphone} onClick={() => setAction('warn')}>
                {t('Gửi cảnh báo vi phạm')}
              </Button>
              {group.block ? (
                <UnblockButton groupId={group.id} />
              ) : (
                <Button variant="danger" icon={Ban} onClick={() => setAction('block')}>
                  {t('Chặn nhóm')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Cảnh báo vi phạm — gửi tới toàn bộ thành viên nhóm. */
function WarnForm({ groupId, onDone }: { groupId: number; onDone: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const warn = useWarnGroup();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const parsed = warnGroupSchema.safeParse({ message });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    warn.mutate(
      { groupId, message: parsed.data.message },
      {
        onSuccess: (result) => {
          toast.success(t('Đã gửi cảnh báo tới {n} thành viên', { n: result.recipients }));
          onDone();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-3 border-t border-line pt-4">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <label className="block">
        <span className="text-sm font-medium text-content-soft">{t('Nội dung cảnh báo')}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          autoFocus
          placeholder={t('Ví dụ: Nhóm có bài đăng sai nội quy, đề nghị trưởng nhóm rà soát lại.')}
          className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <span className="mt-1 block text-xs text-content-muted">
          {t('Mọi thành viên trong nhóm đều nhận được thông báo này.')}
        </span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" icon={Megaphone} loading={warn.isPending}>
          {t('Gửi cảnh báo')}
        </Button>
        <Button type="button" variant="ghost" icon={X} onClick={onDone}>
          {t('Huỷ')}
        </Button>
      </div>
    </form>
  );
}

/** Chặn nhóm — bắt buộc nhập lý do, vì chính câu này hiện cho thành viên đọc. */
function BlockForm({ groupId, onDone }: { groupId: number; onDone: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const block = useBlockGroup();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const parsed = blockGroupSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    block.mutate(
      { groupId, reason: parsed.data.reason },
      {
        onSuccess: () => {
          toast.success(t('Đã chặn nhóm'));
          onDone();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-3 border-t border-line pt-4">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <label className="block">
        <span className="text-sm font-medium text-content-soft">{t('Lý do chặn nhóm')}</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          autoFocus
          placeholder={t('Ví dụ: Nhóm chia sẻ nội dung vi phạm nội quy học tập.')}
          className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <span className="mt-1 block text-xs text-content-muted">
          {t('Thành viên nhóm sẽ đọc đúng câu này khi mở nhóm, nên viết cho họ hiểu.')}
        </span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="danger" icon={Ban} loading={block.isPending}>
          {t('Chặn nhóm')}
        </Button>
        <Button type="button" variant="ghost" icon={X} onClick={onDone}>
          {t('Huỷ')}
        </Button>
      </div>
    </form>
  );
}

function UnblockButton({ groupId }: { groupId: number }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const unblock = useUnblockGroup();

  return (
    <Button
      icon={ShieldCheck}
      loading={unblock.isPending}
      onClick={() =>
        unblock.mutate(groupId, {
          onSuccess: () => toast.success(t('Đã mở chặn nhóm')),
          onError: (err) => toast.error(getErrorMessage(err)),
        })
      }
    >
      {t('Mở chặn nhóm')}
    </Button>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-content">{value}</dd>
    </div>
  );
}
