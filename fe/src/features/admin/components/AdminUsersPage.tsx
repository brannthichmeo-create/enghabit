import { useEffect, useState } from 'react';
import { Lock, LockOpen, Search, ShieldCheck, Trash2, UserCog, X } from 'lucide-react';
import { UserRole, UserStatus, type AdminUserRow } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { USER_STATUS_LABELS } from '../../../shared/lib/labels';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Input,
  PageHeader,
  Select,
  SkeletonList,
} from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useCurrentUser } from '../../auth/auth.store';
import { useLocale, useT, type TranslateFn } from '../../../shared/i18n/language';
import {
  useAdminUser,
  useAdminUsers,
  useDeleteUser,
  useResetUserPassword,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '../admin.hooks';

/**
 * Quản lý tài khoản người dùng.
 *
 * Ba mức can thiệp, xếp theo mức độ khó đảo ngược: đổi vai trò → khoá (đảo được,
 * dữ liệu còn nguyên) → xoá (mất hết). Nút xoá vì vậy tách riêng và luôn hỏi lại.
 */
export function AdminUsersPage(): JSX.Element {
  const t = useT();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [status, setStatus] = useState<'' | UserStatus>('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'lastLogin' | 'mostActive'>('newest');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Chờ người dùng ngừng gõ rồi mới gọi API — gõ 10 ký tự không nên thành 10 request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const users = useAdminUsers({
    page,
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined,
    sort,
  });

  return (
    <div>
      <PageHeader
        title={t('Quản lý tài khoản')}
        description={t('Tìm kiếm, phân quyền, khoá và xoá tài khoản người dùng')}
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
              placeholder={t('Tìm theo tên hoặc email')}
              aria-label={t('Tìm người dùng')}
              className="pl-9"
            />
          </label>

          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as '' | UserRole);
              setPage(1);
            }}
            aria-label={t('Lọc theo vai trò')}
          >
            <option value="">{t('Mọi vai trò')}</option>
            <option value={UserRole.USER}>{t('Người học')}</option>
            <option value={UserRole.ADMIN}>{t('Quản trị viên')}</option>
          </Select>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as '' | UserStatus);
              setPage(1);
            }}
            aria-label={t('Lọc theo trạng thái')}
          >
            <option value="">{t('Mọi trạng thái')}</option>
            <option value={UserStatus.ACTIVE}>{t('Đang hoạt động')}</option>
            <option value={UserStatus.LOCKED}>{t('Đã khoá')}</option>
          </Select>

          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label={t('Sắp xếp')}
          >
            <option value="newest">{t('Mới đăng ký nhất')}</option>
            <option value="oldest">{t('Cũ nhất')}</option>
            <option value="lastLogin">{t('Đăng nhập gần đây')}</option>
            <option value="mostActive">{t('Học nhiều nhất')}</option>
          </Select>
        </div>
      </Card>

      {users.isLoading && <SkeletonList rows={5} />}
      {users.isError && <ErrorMessage>{getErrorMessage(users.error)}</ErrorMessage>}

      {users.data && users.data.items.length === 0 && (
        <EmptyState
          icon={Search}
          title={t('Không tìm thấy tài khoản nào')}
          description={t('Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm.')}
        />
      )}

      {users.data && users.data.items.length > 0 && (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-content-muted">
                  <th className="pb-2 font-medium">{t('Người dùng')}</th>
                  <th className="pb-2 font-medium">{t('Vai trò')}</th>
                  <th className="pb-2 font-medium">{t('Trạng thái')}</th>
                  <th className="pb-2 pr-6 text-right font-medium">{t('Hoạt động')}</th>
                  <th className="pb-2 font-medium">{t('Đăng nhập gần nhất')}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.data.items.map((user) => (
                  <UserRowView key={user.id} user={user} onOpen={() => setDetailId(user.id)} />
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination
            page={page}
            total={users.data.total}
            pageSize={users.data.pageSize}
            onChange={setPage}
          />
        </>
      )}

      {detailId !== null && <UserDetailDrawer userId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function UserRowView({ user, onOpen }: { user: AdminUserRow; onOpen: () => void }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const currentUser = useCurrentUser();
  const isSelf = user.id === currentUser?.id;

  return (
    <tr className={user.status === UserStatus.LOCKED ? 'opacity-70' : ''}>
      <td className="py-2.5">
        <button onClick={onOpen} className="text-left hover:underline">
          <span className="block font-medium text-content">
            {user.name}
            {isSelf && <span className="ml-1.5 text-xs font-normal text-content-muted">{t('(bạn)')}</span>}
          </span>
          <span className="block text-xs text-content-muted">{user.email}</span>
        </button>
      </td>
      <td className="py-2.5">
        <Badge tone={user.role === UserRole.ADMIN ? 'brand' : 'slate'}>
          {user.role === UserRole.ADMIN ? t('Quản trị viên') : t('Người học')}
        </Badge>
      </td>
      <td className="py-2.5">
        <Badge tone={user.status === UserStatus.ACTIVE ? 'green' : 'amber'}>
          {USER_STATUS_LABELS[user.status]}
        </Badge>
      </td>
      <td className="py-2.5 pr-6 text-right tabular-nums text-content-soft">
        {user.activityCount.toLocaleString(locale)}
      </td>
      <td className="whitespace-nowrap py-2.5 text-content-muted">{formatDateTime(user.lastLoginAt, t, locale)}</td>
      <td className="py-2.5 text-right">
        <Button variant="ghost" size="sm" icon={UserCog} onClick={onOpen}>
          {t('Quản lý')}
        </Button>
      </td>
    </tr>
  );
}

/**
 * Ngăn chi tiết một tài khoản. Mọi thao tác nguy hiểm gom về đây thay vì rải nút
 * trên từng dòng bảng — bấm nhầm nút "Xoá" ở dòng bên cạnh là lỗi rất dễ xảy ra.
 */
function UserDetailDrawer({ userId, onClose }: { userId: number; onClose: () => void }): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const detail = useAdminUser(userId);
  const currentUser = useCurrentUser();
  const toast = useToast();

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const resetPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();

  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const user = detail.data;
  const isSelf = userId === currentUser?.id;
  const error =
    updateRole.error ?? updateStatus.error ?? resetPassword.error ?? deleteUser.error ?? detail.error;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 shadow-xl"
        role="dialog"
        aria-label={t('Chi tiết tài khoản')}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-content">{user?.name ?? t('Đang tải…')}</h2>
            <p className="truncate text-sm text-content-muted">{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-content-muted hover:bg-sunken hover:text-content"
            aria-label={t('Đóng')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <ErrorMessage>{getErrorMessage(error)}</ErrorMessage>}
        {detail.isLoading && <SkeletonList rows={3} />}

        {user && (
          <>
            <dl className="mb-5 grid grid-cols-2 gap-3 text-sm">
              <Stat label={t('Tổng hoạt động')} value={user.activityCount.toLocaleString(locale)} />
              <Stat label={t('Chuỗi hiện tại')} value={t('{n} ngày', { n: user.currentStreak })} />
              <Stat label={t('Chuỗi dài nhất')} value={t('{n} ngày', { n: user.longestStreak })} />
              <Stat label={t('Từ đã học')} value={user.vocabLearned.toLocaleString(locale)} />
              <Stat label={t('Thói quen')} value={String(user.habitCount)} />
              <Stat label={t('Mục tiêu')} value={String(user.goalCount)} />
              <Stat label={t('Lượt làm quiz')} value={String(user.quizAttempts)} />
              <Stat label={t('Phiên đang mở')} value={String(user.activeSessions)} />
              <Stat label={t('Ngày tạo')} value={formatDateTime(user.createdAt, t, locale)} />
              <Stat label={t('Học gần nhất')} value={formatLocalDate(user.lastActivityDate, t, locale)} />
              <Stat label={t('Múi giờ')} value={user.timezone} />
              <Stat label={t('Đăng nhập gần nhất')} value={formatDateTime(user.lastLoginAt, t, locale)} />
            </dl>

            <Section title={t('Vai trò')}>
              <div className="flex gap-2">
                <Button
                  variant={user.role === UserRole.ADMIN ? 'primary' : 'secondary'}
                  size="sm"
                  icon={ShieldCheck}
                  disabled={user.role === UserRole.ADMIN}
                  loading={updateRole.isPending}
                  onClick={() =>
                    updateRole.mutate(
                      { id: user.id, role: UserRole.ADMIN },
                      { onSuccess: () => toast.success(t('Đã cấp quyền quản trị')) },
                    )
                  }
                >
                  {t('Quản trị viên')}
                </Button>
                <Button
                  variant={user.role === UserRole.USER ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={user.role === UserRole.USER || isSelf}
                  loading={updateRole.isPending}
                  onClick={() =>
                    updateRole.mutate(
                      { id: user.id, role: UserRole.USER },
                      { onSuccess: () => toast.success(t('Đã chuyển thành người học')) },
                    )
                  }
                >
                  {t('Người học')}
                </Button>
              </div>
            </Section>

            <Section title={t('Trạng thái tài khoản')}>
              {user.status === UserStatus.ACTIVE ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Lock}
                  disabled={isSelf}
                  loading={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate(
                      { id: user.id, status: UserStatus.LOCKED },
                      { onSuccess: () => toast.success(t('Đã khoá tài khoản và thu hồi phiên đăng nhập')) },
                    )
                  }
                >
                  {t('Khoá tài khoản')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={LockOpen}
                  loading={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate(
                      { id: user.id, status: UserStatus.ACTIVE },
                      { onSuccess: () => toast.success(t('Đã mở khoá tài khoản')) },
                    )
                  }
                >
                  {t('Mở khoá')}
                </Button>
              )}
              <p className="mt-1.5 text-xs text-content-muted">
                {t('Khoá không xoá dữ liệu học tập — mở khoá là người dùng vào lại được như cũ.')}
              </p>
            </Section>

            <Section title={t('Đặt lại mật khẩu')}>
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('Mật khẩu tạm')}
                  autoComplete="new-password"
                />
                <Button
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  disabled={newPassword.length < 8}
                  loading={resetPassword.isPending}
                  onClick={() =>
                    resetPassword.mutate(
                      { id: user.id, newPassword },
                      {
                        onSuccess: () => {
                          setNewPassword('');
                          toast.success(t('Đã đặt lại mật khẩu, mọi phiên cũ bị thu hồi'));
                        },
                      },
                    )
                  }
                >
                  {t('Đặt lại')}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-content-muted">
                {t('Ít nhất 8 ký tự, có cả chữ và số. Nhớ báo mật khẩu tạm cho người dùng qua kênh riêng.')}
              </p>
            </Section>

            <Section title={t('Đăng nhập gần đây')}>
              {user.recentLogins.length === 0 ? (
                <p className="text-xs text-content-muted">{t('Chưa có lượt đăng nhập nào được ghi lại.')}</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {user.recentLogins.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-2">
                      <span className="text-content-soft">{formatDateTime(event.createdAt, t, locale)}</span>
                      <Badge tone={event.success ? 'green' : 'amber'}>
                        {event.success ? t('Thành công') : t('Thất bại')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={t('Vùng nguy hiểm')}>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                disabled={isSelf}
                loading={deleteUser.isPending}
                onClick={() => {
                  if (
                    confirm(
                      t('Xoá vĩnh viễn {email}?\n\nToàn bộ {n} hoạt động, chuỗi ngày và tiến độ học sẽ mất và không khôi phục được. Nếu chỉ muốn chặn đăng nhập, hãy dùng "Khoá tài khoản".', { email: user.email, n: user.activityCount }),
                    )
                  ) {
                    deleteUser.mutate(user.id, {
                      onSuccess: () => {
                        toast.success(t('Đã xoá tài khoản'));
                        onClose();
                      },
                    });
                  }
                }}
              >
                {t('Xoá tài khoản')}
              </Button>
            </Section>
          </>
        )}
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="mb-5 border-t border-line pt-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">{title}</h3>
      {children}
    </section>
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

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}): JSX.Element | null {
  const t = useT();
  const locale = useLocale();
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        {t('Trước')}
      </Button>
      <span className="text-sm tabular-nums text-on-page-muted">
        {t('Trang {page} / {totalPages} · {total} bản ghi', {
          page,
          totalPages,
          total: total.toLocaleString(locale),
        })}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau
      </Button>
    </div>
  );
}

/** LocalDate `YYYY-MM-DD` sang dạng ngày Việt Nam. Không kèm giờ vì bản thân
 * localDate chỉ là nhãn ngày, không phải một mốc thời gian. */
function formatLocalDate(value: string | null, t: TranslateFn, locale: string): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | null, t: TranslateFn, locale: string): string {
  if (!value) return t('Chưa bao giờ');
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
