import { useEffect, useState } from 'react';
import {
  ChartColumn,
  History,
  Lock,
  LockOpen,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import {
  ADMIN_USER_TREND_DAYS,
  ActivityType,
  UserRole,
  UserStatus,
  type AdminUserDetail,
  type AdminUserEvent,
  type AdminUserRow,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  ACTIVITY_TYPE_LABELS,
  LOGIN_FAIL_LABELS,
  USER_STATUS_LABELS,
} from '../../../shared/lib/labels';
import { TrendChart, type TrendPoint } from './TrendChart';
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
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { Avatar } from '../../../shared/components/Sidebar';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useCurrentUser } from '../../auth/auth.store';
import { useLocale, useT, type TranslateFn } from '../../../shared/i18n/language';
import {
  useAdminUser,
  useAdminUsers,
  useDeleteUser,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '../admin.hooks';

/**
 * Quản lý tài khoản người dùng.
 *
 * Ba mức can thiệp, xếp theo mức độ khó đảo ngược: đổi vai trò → khoá (đảo được,
 * dữ liệu còn nguyên) → xoá (mất hết). Nút xoá vì vậy tách riêng và luôn hỏi lại.
 *
 * KHÔNG có chức năng đặt mật khẩu hộ người dùng — đã bỏ. Việc cấp lại mật khẩu đi
 * qua màn "Quản lý yêu cầu" (`/admin/requests`): người dùng tự đặt mật khẩu mới sau
 * khi quản trị viên duyệt. Giữ cả hai đường sẽ là hai cách làm cùng một việc, mà
 * đường cũ còn tệ hơn ở chỗ quản trị viên BIẾT mật khẩu của người dùng và phải tự
 * tìm cách báo lại cho họ. Xem docs/luong-quen-mat-khau.md.
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
              placeholder={t('Tìm theo tên, tên tài khoản hoặc email')}
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

      {detailId !== null && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}
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
            {isSelf && (
              <span className="ml-1.5 text-xs font-normal text-content-muted">{t('(bạn)')}</span>
            )}
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
      <td className="whitespace-nowrap py-2.5 text-content-muted">
        {formatDateTime(user.lastLoginAt, t, locale)}
      </td>
      <td className="py-2.5 text-right">
        <Button variant="ghost" size="sm" icon={UserCog} onClick={onOpen}>
          {t('Quản lý')}
        </Button>
      </td>
    </tr>
  );
}

/**
 * Hộp thoại chi tiết một tài khoản. Mọi thao tác nguy hiểm gom về đây thay vì rải nút
 * trên từng dòng bảng — bấm nhầm nút "Xoá" ở dòng bên cạnh là lỗi rất dễ xảy ra.
 *
 * Chỉ đóng được bằng nút X hoặc phím Esc, KHÔNG đóng khi bấm ra nền mờ: cùng lý do
 * với việc gom thao tác nguy hiểm vào đây — người dùng đang đọc số liệu để quyết định
 * có khoá hay xoá tài khoản, lỡ tay bấm trượt ra ngoài là mất cả bảng và phải tìm lại
 * đúng người trong danh sách.
 *
 * Chia ba tab theo CÂU HỎI người xem đang hỏi, không theo nguồn dữ liệu: "tài khoản
 * này là ai và tôi làm gì được với nó" (Thông tin cá nhân), "họ học ra sao" (Thống kê),
 * "họ vừa làm gì" (Hoạt động gần đây).
 */
const TABS = [
  { key: 'info', label: 'Thông tin cá nhân', icon: UserCog },
  { key: 'stats', label: 'Thống kê', icon: ChartColumn },
  { key: 'events', label: 'Hoạt động gần đây', icon: History },
] as const;

type DetailTab = (typeof TABS)[number]['key'];

/**
 * Chiều cao cố định của ruột hộp thoại, px.
 *
 * Lấy theo tab Thống kê — tab cao nhất trong ba tab, vì nó chứa biểu đồ. Cộng từ các
 * thành phần thật ra ~523px: thanh tab 44 + dòng chú dẫn 28 + lưới 8 ô 88 + mục "Cơ
 * cấu" 97 + mục "Tần suất" 41 + biểu đồ 160 + dòng chi tiết 45 + lề cuối 20.
 *
 * Cố định để đổi tab không làm hộp thoại nhảy kích thước. Đổi bố cục tab Thống kê thì
 * phải cộng lại con số này, nếu không tab đó sẽ sinh thanh cuộn thừa.
 */
const DETAIL_BODY_HEIGHT = 520;

function UserDetailModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const confirm = useConfirm();
  const detail = useAdminUser(userId);
  const currentUser = useCurrentUser();
  const toast = useToast();
  const [tab, setTab] = useState<DetailTab>('info');

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const user = detail.data;
  const isSelf = userId === currentUser?.id;
  const error = updateRole.error ?? updateStatus.error ?? deleteUser.error ?? detail.error;

  return (
    <Modal
      open
      onClose={onClose}
      title={t('Chi tiết tài khoản')}
      size="xl"
      bodyHeight={DETAIL_BODY_HEIGHT}
      // Bấm ra nền mờ KHÔNG đóng: hộp thoại này có nút đổi vai trò, khoá và xoá tài
      // khoản, mà những thao tác đó cần đọc số liệu ở trên trước khi bấm. Lỡ tay bấm
      // trượt ra ngoài là mất cả bảng, phải mở lại và tìm lại đúng người.
      closeOnBackdrop={false}
      titleContent={
        <div className="flex min-w-0 items-center gap-3">
          {/* Chỉ vẽ khi đã có dữ liệu: `Avatar` cần `name` để dựng chữ cái đầu, truyền
              chuỗi rỗng lúc đang tải sẽ hiện một vòng tròn "?" rồi nhảy sang ảnh thật. */}
          {user && <Avatar name={user.name} src={user.avatarDataUrl} size="lg" />}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-content">
              {user?.name ?? t('Đang tải…')}
            </h2>
            <p className="truncate text-sm text-content-muted">{user?.email}</p>
          </div>
        </div>
      }
    >
      {error && <ErrorMessage>{getErrorMessage(error)}</ErrorMessage>}
      {detail.isLoading && <SkeletonList rows={4} />}

      {user && (
        // Cột dọc cao bằng đúng ruột hộp thoại: thanh tab ĐỨNG YÊN ở trên, chỉ vùng
        // nội dung bên dưới mới cuộn. Trước đây thanh tab nằm chung trong vùng cuộn và
        // phải dùng `sticky` để bám lại — cách này bỏ được hẳn mẹo đó, và cho vùng nội
        // dung một chiều cao XÁC ĐỊNH để các tab ngắn có chỗ mà dàn ra cho cân.
        <div className="flex h-full flex-col">
          <div className="mb-4 flex shrink-0 gap-1" role="tablist" aria-label={t('Phần thông tin')}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                  tab === key
                    ? 'bg-brand-soft font-medium text-brand-strong'
                    : 'text-content-soft hover:bg-sunken'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t(label)}
              </button>
            ))}
          </div>

          {/* Vùng nội dung: cao đúng phần còn lại, tự cuộn khi tab nào dài hơn. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'info' && (
              // Hai cột cùng CAO HẾT vùng nội dung rồi mới dàn bên trong, thay vì
              // `items-start` để cả hai dồn lên trên và bỏ trống một mảng lớn phía dưới.
              <div className="grid gap-x-6 lg:h-full lg:grid-cols-2">
                <Section title={t('Định danh')} className="lg:flex lg:h-full lg:flex-col">
                  {/* Dàn đều tám dòng theo chiều cao thay vì dồn lên đầu — mỗi dòng đã có
                      đường kẻ dưới nên giãn ra vẫn đọc như một danh sách thông tin. */}
                  <dl className="space-y-2 lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:space-y-0">
                    <InfoRow label={t('Tên tài khoản')} value={user.username} />
                    <InfoRow label={t('Email')} value={user.email} />
                    <InfoRow
                      label={t('Vai trò')}
                      value={
                        <Badge tone={user.role === UserRole.ADMIN ? 'brand' : 'slate'}>
                          {user.role === UserRole.ADMIN ? t('Quản trị viên') : t('Người học')}
                        </Badge>
                      }
                    />
                    <InfoRow
                      label={t('Trạng thái tài khoản')}
                      value={
                        <Badge tone={user.status === UserStatus.ACTIVE ? 'green' : 'red'}>
                          {USER_STATUS_LABELS[user.status]}
                        </Badge>
                      }
                    />
                    <InfoRow label={t('Múi giờ')} value={user.timezone} />
                    <InfoRow
                      label={t('Ngày tạo')}
                      value={formatDateTime(user.createdAt, t, locale)}
                    />
                    <InfoRow
                      label={t('Đăng nhập gần nhất')}
                      value={formatDateTime(user.lastLoginAt, t, locale)}
                    />
                    <InfoRow label={t('Phiên đang mở')} value={String(user.activeSessions)} />
                  </dl>
                </Section>

                <div className="lg:flex lg:h-full lg:flex-col">
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
                            {
                              onSuccess: () =>
                                toast.success(t('Đã khoá tài khoản và thu hồi phiên đăng nhập')),
                            },
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
                      {t(
                        'Khoá không xoá dữ liệu học tập — mở khoá là người dùng vào lại được như cũ.',
                      )}
                    </p>
                  </Section>

                  {/* Không dùng `Section` ở đây: nút đã đỏ, đã có biểu tượng thùng rác và
                    còn hỏi lại trước khi xoá — thêm một dòng tiêu đề "Vùng nguy hiểm"
                    phía trên chỉ là cảnh báo thứ tư cho cùng một nút. Vẫn giữ đường kẻ
                    và khoảng trắng của Section để nó tách khỏi các thao tác đảo ngược
                    được ở trên. */}
                  <section className="mb-5 border-t border-line pt-4 lg:mt-auto">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      disabled={isSelf}
                      loading={deleteUser.isPending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: t('Xoá vĩnh viễn {email}?', { email: user.email }),
                          message: t(
                            'Toàn bộ {n} hoạt động, chuỗi ngày và tiến độ học sẽ mất và không khôi phục được. Nếu chỉ muốn chặn đăng nhập, hãy dùng "Khoá tài khoản".',
                            { n: user.activityCount },
                          ),
                          confirmLabel: t('Xoá tài khoản'),
                          tone: 'danger',
                        });
                        if (ok) {
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
                  </section>
                </div>
              </div>
            )}

            {tab === 'stats' && <StatsTab user={user} />}
            {tab === 'events' && <EventsTab events={user.recentEvents} />}
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Một dòng "nhãn — giá trị" trong tab Thông tin cá nhân. Giá trị nhận cả node để
 *  chỗ nào cần huy hiệu thì truyền thẳng huy hiệu vào. */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <dt className="shrink-0 text-xs text-content-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-content">{value}</dd>
    </div>
  );
}

/**
 * Tab Thống kê — số liệu TOÀN THỜI GIAN cộng biểu đồ tần suất gần đây.
 *
 * Hai thang thời gian khác nhau nằm cùng một tab nên phải nói rõ bằng chữ: các ô số
 * là từ lúc tạo tài khoản, còn biểu đồ chỉ 30 ngày. Không ghi thì người đọc mặc định
 * cho rằng cả hai cùng một khoảng.
 */
function StatsTab({ user }: { user: AdminUserDetail }): JSX.Element {
  const t = useT();
  const locale = useLocale();

  const points: TrendPoint[] = user.activityTrend.map((day) => ({
    date: day.date,
    primary: day.totalActivities,
    secondary: day.vocabLearned,
  }));

  return (
    <>
      <p className="mb-3 text-xs text-content-muted">
        {t('Các ô số liệu tính từ lúc tạo tài khoản đến hiện tại.')}
      </p>

      <dl className="mb-1 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <Stat label={t('Tổng hoạt động')} value={user.activityCount.toLocaleString(locale)} />
        <Stat label={t('Chuỗi hiện tại')} value={t('{n} ngày', { n: user.currentStreak })} />
        <Stat label={t('Chuỗi dài nhất')} value={t('{n} ngày', { n: user.longestStreak })} />
        <Stat label={t('Lượt làm quiz')} value={String(user.quizAttempts)} />
        <Stat label={t('Thói quen')} value={String(user.habitCount)} />
        <Stat label={t('Mục tiêu')} value={String(user.goalCount)} />
        <Stat label={t('Ngày tạo')} value={formatDateTime(user.createdAt, t, locale)} />
        <Stat label={t('Học gần nhất')} value={formatLocalDate(user.lastActivityDate, t, locale)} />
      </dl>

      <Section title={t('Cơ cấu hoạt động')}>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => (
            <Stat
              key={type}
              label={t(ACTIVITY_TYPE_LABELS[type])}
              value={user.activityByType[type].toLocaleString(locale)}
            />
          ))}
        </dl>
      </Section>

      <Section title={t('Tần suất {n} ngày gần đây', { n: ADMIN_USER_TREND_DAYS })}>
        <TrendChart points={points} primaryLabel={t('Hoạt động')} secondaryLabel={t('Từ đã học')} />
      </Section>
    </>
  );
}

/**
 * Tab Hoạt động gần đây — nhật ký gộp đăng nhập và hoạt động học, mới nhất trước.
 *
 * Gộp một bảng chứ không tách hai: chuỗi "đăng nhập lúc 9h rồi làm quiz lúc 9h05" chỉ
 * đọc ra được khi hai loại nằm chung một trục thời gian.
 */
function EventsTab({ events }: { events: AdminUserEvent[] }): JSX.Element {
  const t = useT();
  const locale = useLocale();

  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-content-muted">
        {t('Chưa ghi nhận hoạt động nào cho tài khoản này.')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-content-muted">
            <th className="pb-2 font-medium">{t('Thời điểm')}</th>
            <th className="pb-2 font-medium">{t('Loại')}</th>
            <th className="pb-2 font-medium">{t('Chi tiết')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {events.map((event) => (
            <tr key={event.key}>
              <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-content-soft">
                {formatDateTime(event.at, t, locale)}
              </td>
              <td className="py-2.5 pr-4">
                {event.kind === 'LOGIN' ? (
                  <Badge tone="slate">{t('Đăng nhập')}</Badge>
                ) : (
                  <Badge tone="brand">{t(ACTIVITY_TYPE_LABELS[event.type])}</Badge>
                )}
              </td>
              <td className="py-2.5 text-content-soft">
                {event.kind === 'LOGIN' ? (
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone={event.success ? 'green' : 'red'}>
                      {event.success
                        ? t('Thành công')
                        : t(LOGIN_FAIL_LABELS[event.reason ?? ''] ?? 'Thất bại')}
                    </Badge>
                    {event.ipAddress && (
                      <span className="text-xs text-content-muted">{event.ipAddress}</span>
                    )}
                  </span>
                ) : (
                  <span className="tabular-nums">{event.value.toLocaleString(locale)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  /** Thêm lớp cho chính thẻ `section` — dùng khi mục cần cao bằng cột chứa nó. */
  className?: string;
}): JSX.Element {
  return (
    <section className={`mb-5 border-t border-line pt-4 ${className}`}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
        {title}
      </h3>
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
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        {t('Trước')}
      </Button>
      <span className="text-sm tabular-nums text-on-page-muted">
        {t('Trang {page} / {totalPages} · {total} bản ghi', {
          page,
          totalPages,
          total: total.toLocaleString(locale),
        })}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
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
