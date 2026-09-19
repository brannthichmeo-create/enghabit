import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Compass,
  Copy,
  Delete,
  FileText,
  Globe,
  Hash,
  Lock,
  Plus,
  RotateCcw,
  Search,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GROUP_CODE_LENGTH,
  GroupJoinStatus,
  GroupViewerState,
  GroupVisibility,
  createGroupSchema,
  type GroupSummary,
  type MyJoinRequestRow,
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
  useCreateGroup,
  useGroupByCode,
  useGroupSearch,
  useJoinGroup,
  useMyGroups,
  useMyJoinRequests,
} from '../group.hooks';

type Tab = 'mine' | 'pending' | 'discover';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'mine', label: 'Nhóm của tôi', icon: Users },
  { key: 'pending', label: 'Chờ duyệt', icon: Clock },
  { key: 'discover', label: 'Khám phá nhóm', icon: Compass },
];

/** Tab trên URL lạ (gõ tay, liên kết cũ) thì về tab mặc định thay vì vẽ một trang trống. */
function parseTab(value: string | null): Tab {
  return TABS.some((item) => item.key === value) ? (value as Tab) : 'mine';
}

/**
 * Trang nhóm lớp — ba tab: nhóm đã tham gia, yêu cầu đang chờ duyệt, và nhóm công khai
 * để khám phá.
 *
 * Chia tab vì các việc này khác nhau về ý định: một bên là quay lại chỗ quen, một bên
 * là theo dõi chỗ mình đang xin vào, một bên là đi tìm chỗ mới.
 *
 * Tab đang mở nằm trên URL (`?tab=pending`) chứ không trong state của component: mở một
 * nhóm rồi bấm Quay lại phải về ĐÚNG tab vừa đứng, và thông báo "bị từ chối" dẫn thẳng
 * được tới tab Chờ duyệt. State cục bộ thì mỗi lần quay lại đều rơi về tab đầu tiên.
 *
 * Vào nhóm bằng mã nằm trong hộp thoại riêng chứ không phải một mục trên trang: nó chỉ
 * dùng khi đã có mã trong tay, mà lúc đó người dùng không cần nhìn thấy gì khác.
 */
export function GroupsPage(): JSX.Element {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get('tab'));
  const [creating, setCreating] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Số trên tab Chờ duyệt. Cùng khoá truy vấn với chính tab đó nên không tốn thêm request.
  const myRequests = useMyJoinRequests();
  const counts: Partial<Record<Tab, number>> = { pending: myRequests.data?.length ?? 0 };

  // `replace` để đổi tab không chồng thêm mục vào lịch sử: bấm Quay lại của trình duyệt
  // phải rời trang Nhóm lớp, không phải lùi qua từng tab đã bấm.
  const selectTab = (next: Tab): void => {
    setParams(next === 'mine' ? {} : { tab: next }, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title={t('Nhóm lớp')}
        description={t('Tạo nhóm để trao đổi nội bộ, hoặc tham gia nhóm đã có')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button icon={Hash} variant="secondary" onClick={() => setCodeOpen(true)}>
              {t('Nhập mã nhóm')}
            </Button>
            <Button
              icon={creating ? X : Plus}
              variant={creating ? 'secondary' : 'primary'}
              onClick={() => setCreating((v) => !v)}
            >
              {creating ? t('Đóng') : t('Tạo nhóm')}
            </Button>
          </div>
        }
      />

      {creating && <CreateGroupForm onDone={() => setCreating(false)} />}

      <div
        // Ba tab không vừa bề ngang điện thoại — cuộn ngang thay vì để chữ xuống dòng.
        className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-sunken p-1"
        role="tablist"
        aria-label={t('Loại danh sách')}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => selectTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-1.5 text-sm transition ${
              tab === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t(label)}
            {(counts[key] ?? 0) > 0 && (
              <span className="tabular-nums text-content-muted">{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'mine' && <MyGroupsTab />}
      {tab === 'pending' && <PendingTab />}
      {tab === 'discover' && <DiscoverTab />}

      <JoinByCodeModal open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab "Nhóm của tôi"
// ---------------------------------------------------------------------------

type MineFilter = 'all' | 'member' | 'leader';

const MINE_FILTERS: { value: MineFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'member', label: 'Là thành viên' },
  { value: 'leader', label: 'Là trưởng nhóm' },
];

/**
 * Nhóm đã tham gia, lọc theo vai trò của mình trong nhóm.
 *
 * Lọc ngay tại client: API `/groups/mine` vốn trả về đúng những nhóm của một người,
 * số lượng nhỏ nên gọi lại máy chủ mỗi lần đổi bộ lọc chỉ làm danh sách nháy.
 */
function MyGroupsTab(): JSX.Element {
  const t = useT();
  const [filter, setFilter] = useState<MineFilter>('all');
  const myGroups = useMyGroups();

  const groups = (myGroups.data ?? []).filter((group) => {
    if (filter === 'leader') return group.viewerState === GroupViewerState.LEADER;
    if (filter === 'member') return group.viewerState === GroupViewerState.MEMBER;
    return true;
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-on-page-soft">{t('Vai trò')}</span>
        <div className="w-52">
          {/* `!mt-0`: ô chọn mặc định có khoảng đệm trên để đứng dưới nhãn của `Field`;
              ở đây nhãn đứng NGANG hàng nên khoảng đó đẩy ô tụt xuống lệch khỏi chữ "Vai trò". */}
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as MineFilter)}
            aria-label={t('Lọc theo vai trò trong nhóm')}
            className="!mt-0"
          >
            {MINE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {myGroups.isLoading && <SkeletonList rows={2} />}
      {myGroups.isError && <ErrorMessage>{getErrorMessage(myGroups.error)}</ErrorMessage>}

      {myGroups.data?.length === 0 && (
        <EmptyState
          icon={Users}
          title={t('Bạn chưa ở nhóm nào')}
          description={t('Tạo một nhóm mới, hoặc sang tab Khám phá nhóm để xin vào một nhóm công khai.')}
        />
      )}

      {/* Có nhóm nhưng bộ lọc không khớp cái nào — nói rõ là do bộ lọc, không phải chưa có nhóm. */}
      {myGroups.data && myGroups.data.length > 0 && groups.length === 0 && (
        <EmptyState
          icon={Users}
          title={
            filter === 'leader'
              ? t('Bạn chưa làm trưởng nhóm ở nhóm nào')
              : t('Bạn là trưởng nhóm ở tất cả các nhóm của mình')
          }
          description={t('Chọn "Tất cả" để xem lại toàn bộ nhóm của bạn.')}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tab "Khám phá nhóm"
// ---------------------------------------------------------------------------

/**
 * Nhóm công khai trong hệ thống.
 *
 * Không có bộ lọc công khai/riêng tư ở đây vì mọi nhóm trong danh sách này đều là nhóm
 * công khai: nhóm riêng tư không xuất hiện trong tìm kiếm là điều làm nên chữ "riêng tư"
 * (xem `searchPublicGroups` ở BE). Muốn vào nhóm riêng tư thì dùng nút "Nhập ID nhóm".
 */
function DiscoverTab(): JSX.Element {
  const t = useT();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const results = useGroupSearch({ search: search || undefined, page: 1, pageSize: 12 });

  return (
    <section>
      <form
        noValidate
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
            aria-hidden
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Tìm theo tên nhóm')}
            className="!mt-0 pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t('Tìm')}
        </Button>
      </form>

      {results.isLoading && <SkeletonList rows={2} />}
      {results.isError && <ErrorMessage>{getErrorMessage(results.error)}</ErrorMessage>}

      {results.data?.items.length === 0 && (
        <EmptyState
          icon={Search}
          title={t('Không có nhóm công khai nào khớp')}
          description={t('Nhóm riêng tư không hiện ở đây — muốn vào thì cần mã 8 số.')}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {results.data?.items.map((group) => <GroupCard key={group.id} group={group} />)}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tab "Chờ duyệt"
// ---------------------------------------------------------------------------

/**
 * Nhóm mình đã xin vào mà chưa thành thành viên: đang chờ, hoặc đã bị từ chối.
 *
 * Được duyệt thì nhóm tự rời tab này sang "Nhóm của tôi" — cả hai danh sách cùng nằm
 * dưới `groupKeys.all` nên làm mới cùng lúc. Bị từ chối thì thẻ ở lại với lý do và nút
 * xin lại, thay vì biến mất khiến người dùng không biết yêu cầu của mình đã đi đâu.
 */
function PendingTab(): JSX.Element {
  const t = useT();
  const requests = useMyJoinRequests();

  return (
    <section>
      {requests.isLoading && <SkeletonList rows={2} />}
      {requests.isError && <ErrorMessage>{getErrorMessage(requests.error)}</ErrorMessage>}

      {requests.data?.length === 0 && (
        <EmptyState
          icon={Clock}
          title={t('Không có yêu cầu nào đang chờ')}
          description={t('Yêu cầu vào nhóm bạn gửi sẽ hiện ở đây cho tới khi trưởng nhóm duyệt.')}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {requests.data?.map((request) => (
          <JoinRequestCard key={request.group.id} request={request} />
        ))}
      </div>
    </section>
  );
}

/** Một yêu cầu của mình: trạng thái, lúc gửi hoặc lúc bị từ chối, và việc làm tiếp. */
function JoinRequestCard({ request }: { request: MyJoinRequestRow }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const join = useJoinGroup();
  const [reasonOpen, setReasonOpen] = useState(false);

  const { group } = request;
  const rejected = request.status === GroupJoinStatus.REJECTED;
  // Nhóm bị chặn không nhận thành viên mới — backend cũng từ chối, nhưng khoá nút ngay
  // ở đây để người dùng không phải bấm rồi mới đọc lỗi.
  const blocked = group.block !== null;

  const when = (iso: string | null): string =>
    iso
      ? new Date(iso).toLocaleString(locale, {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

  const requestAgain = (): void => {
    join.mutate(
      { id: group.id },
      {
        onSuccess: (result) => {
          setReasonOpen(false);
          toast.success(
            result.joined ? t('Đã vào nhóm') : t('Đã gửi lại yêu cầu, chờ trưởng nhóm duyệt'),
          );
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const againButton = (
    <Button
      size="sm"
      icon={RotateCcw}
      loading={join.isPending}
      disabled={blocked}
      onClick={requestAgain}
    >
      {t('Yêu cầu lại')}
    </Button>
  );

  return (
    <>
      <GroupCard
        group={group}
        status={
          rejected ? (
            <Badge tone="red" icon={XCircle}>
              {t('Bị từ chối')}
            </Badge>
          ) : (
            <Badge tone="amber" icon={Clock}>
              {t('Đang chờ duyệt')}
            </Badge>
          )
        }
        note={
          rejected
            ? t('Bị từ chối lúc {time}', { time: when(request.decidedAt) })
            : t('Đã gửi lúc {time}', { time: when(request.requestedAt) })
        }
        footer={
          rejected ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                onClick={() => setReasonOpen(true)}
              >
                {t('Xem lý do')}
              </Button>
              {againButton}
              {blocked && (
                <span className="text-xs text-content-muted">{t('Nhóm đang bị chặn')}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-content-muted">
              {t('Bạn sẽ nhận thông báo khi trưởng nhóm duyệt hoặc từ chối.')}
            </span>
          )
        }
      />

      <Modal
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title={t('Lý do từ chối')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReasonOpen(false)}>
              {t('Đóng')}
            </Button>
            {againButton}
          </>
        }
      >
        <p className="text-sm text-content-soft">
          {t('Yêu cầu vào nhóm "{name}" bị từ chối lúc {time}.', {
            name: group.name,
            time: when(request.decidedAt),
          })}
        </p>

        {/* Lý do do trưởng nhóm viết — dữ liệu động, không đưa qua t(). Yêu cầu bị từ
            chối trước khi lý do thành bắt buộc thì không có gì để hiện: nói thẳng là
            không có, đừng để một khung trống khiến người đọc tưởng tải lỗi. */}
        <div className="mt-3 rounded-lg border border-line bg-sunken px-3 py-2.5 text-sm">
          {request.rejectReason ? (
            <p className="whitespace-pre-wrap text-content">{request.rejectReason}</p>
          ) : (
            <p className="italic text-content-muted">{t('Trưởng nhóm không để lại lý do.')}</p>
          )}
        </div>

        {request.message && (
          <p className="mt-3 text-xs text-content-muted">
            {t('Lời nhắn bạn đã gửi: "{message}"', { message: request.message })}
          </p>
        )}
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Vào nhóm bằng mã
// ---------------------------------------------------------------------------

/** Bàn phím số: hàng cuối chừa ô trống bên trái để 0 nằm giữa, xoá nằm phải — đúng
 *  cách bố trí bàn số quen thuộc (điện thoại, ATM...). */
const KEYPAD_ROWS: (string | 'backspace' | null)[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [null, '0', 'backspace'],
];

/** Hộp thoại tra nhóm bằng mã 8 số — cách duy nhất tìm ra nhóm riêng tư. */
function JoinByCodeModal({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element {
  const t = useT();
  const [input, setInput] = useState('');
  const [code, setCode] = useState<string | null>(null);

  const found = useGroupByCode(code);

  // Xoá cả ô nhập lẫn kết quả khi đóng: mở lại mà còn nhóm tra lần trước thì người dùng
  // tưởng đó là kết quả của mã mình sắp gõ.
  const close = (): void => {
    setInput('');
    setCode(null);
    onClose();
  };

  const appendDigit = (digit: string): void => {
    setInput((prev) => (prev.length >= GROUP_CODE_LENGTH ? prev : prev + digit));
  };

  return (
    <Modal open={open} onClose={close} title={t('Nhập mã nhóm')} size="md">
      {/*
        Toàn khối căn giữa trong một cột hẹp: modal "lg" cũ để hàng ô-nhập + nút "Tìm" nằm
        lệch trái giữa một hộp thoại rộng, thừa hẳn một mảng trống bên phải.

        Dòng 8 ô chữ số rộng bằng cả cột (`max-w-xs`) để mỗi ô đủ to đọc được; bàn số và
        nút "Tìm" thì hẹp lại còn 220px cho vừa tay bấm — hai khối không dùng chung một
        bề ngang, cùng `items-center` của cột cha sẽ tự canh giữa cho cả hai.
      */}
      <form
        noValidate
        className="mx-auto flex max-w-xs flex-col items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.length === GROUP_CODE_LENGTH) setCode(input);
        }}
      >
        {/* Ô nhập thật — ẩn khỏi mắt nhưng vẫn giữ bàn phím vật lý dùng được, không chỉ
            bấm bằng bàn số ảo bên dưới mới gõ được. */}
        <label className="sr-only" htmlFor="group-code-input">
          {t('Mã nhóm')}
        </label>
        <input
          id="group-code-input"
          value={input}
          inputMode="numeric"
          maxLength={GROUP_CODE_LENGTH}
          autoFocus
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, GROUP_CODE_LENGTH))}
          className="sr-only"
        />

        {/*
          Từng chữ số đã gõ, một ô riêng — để biết đang gõ tới số thứ mấy trong 8 số.
          Lưới `grid-cols-8` thay vì flex: flex co 8 ô cố định bề ngang vào vừa cột hẹp
          của bàn số bên dưới làm chúng bị bóp mỏng dính; lưới chia đều theo bề ngang
          THẬT của dòng này nên mỗi ô luôn đủ rộng, không phụ thuộc bàn số bên dưới.
        */}
        <div className="grid w-full grid-cols-8 gap-1.5" aria-hidden>
          {Array.from({ length: GROUP_CODE_LENGTH }, (_, i) => (
            <div
              key={i}
              className={`flex h-12 items-center justify-center rounded-lg border text-lg font-semibold tabular-nums ${
                i < input.length
                  ? 'border-brand bg-brand-soft text-brand-strong'
                  : 'border-line text-content-muted'
              }`}
            >
              {input[i] ?? ''}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-content-muted">
          {t('Gồm {n} chữ số', { n: GROUP_CODE_LENGTH })}
        </p>

        <div className="mt-4 flex w-[220px] flex-col gap-2">
          {KEYPAD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((key, keyIndex) => {
                if (key === null) return <div key={keyIndex} className="flex-1" />;

                if (key === 'backspace') {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setInput((prev) => prev.slice(0, -1))}
                      disabled={input.length === 0}
                      aria-label={t('Xoá một chữ số')}
                      className="flex flex-1 items-center justify-center rounded-xl border border-line-control bg-surface py-2.5 text-content-soft transition-colors hover:border-brand hover:bg-sunken disabled:opacity-40"
                    >
                      <Delete className="h-4 w-4" aria-hidden />
                    </button>
                  );
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => appendDigit(key)}
                    className="flex-1 rounded-xl border border-line-control bg-surface py-2.5 text-lg font-medium text-content transition-colors hover:border-brand hover:bg-sunken"
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <Button type="submit" icon={Search} disabled={input.length !== GROUP_CODE_LENGTH} className="mt-4 w-[220px]">
          {t('Tìm')}
        </Button>
      </form>

      {found.isFetching && <div className="mt-4"><SkeletonList rows={1} /></div>}
      {found.isError && (
        <p className="mt-3 text-center text-sm text-danger">{t('Không tìm thấy nhóm nào có mã này')}</p>
      )}
      {found.data && !found.isFetching && (
        <div className="mt-4">
          <GroupCard group={found.data} />
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Tạo nhóm
// ---------------------------------------------------------------------------

/** Ô tạo nhóm. Trạng thái công khai/riêng tư và phê duyệt đều là công tắc bật/tắt. */
function CreateGroupForm({ onDone }: { onDone: () => void }): JSX.Element {
  const t = useT();
  const createGroup = useCreateGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [error, setError] = useState('');
  // Mã 8 số vừa sinh ra là chìa khoá DUY NHẤT vào nhóm riêng tư — hiện trong hộp
  // thoại phải tự tay đóng thay vì toast tự biến mất sau 3.5s, nếu không người tạo
  // nhóm không kịp chép lại là mất luôn cách duy nhất mời người khác vào.
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setError('');

    const parsed = createGroupSchema.safeParse({
      name,
      description: description.trim() || undefined,
      visibility: isPublic ? GroupVisibility.PUBLIC : GroupVisibility.PRIVATE,
      requireApproval,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createGroup.mutate(parsed.data, {
      onSuccess: (group) => setCreatedCode(group.code),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <Card className="mb-6">
      {createdCode && (
        <GroupCreatedModal
          code={createdCode}
          onClose={() => {
            setCreatedCode(null);
            onDone();
          }}
        />
      )}

      <form noValidate onSubmit={submit} className="space-y-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Field label={t('Tên nhóm')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Ví dụ: Lớp tiếng Anh K65')}
            maxLength={120}
            autoFocus
          />
        </Field>

        <label className="block">
          <span className="text-sm font-medium text-content-soft">{t('Mô tả nhóm')}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t('Không bắt buộc — vài dòng để người khác biết nhóm này làm gì')}
            className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>

        <Toggle
          checked={isPublic}
          onChange={setIsPublic}
          label={t('Nhóm công khai')}
          hint={
            isPublic
              ? t('Ai cũng tìm thấy nhóm này khi tìm theo tên.')
              : t('Nhóm riêng tư: chỉ vào được nếu biết mã 8 số của nhóm.')
          }
        />

        <Toggle
          checked={requireApproval}
          onChange={setRequireApproval}
          label={t('Phê duyệt thành viên')}
          hint={
            requireApproval
              ? t('Người xin vào phải chờ trưởng nhóm duyệt.')
              : t('Ai có mã hoặc tìm thấy nhóm đều vào được ngay.')
          }
        />

        <div className="flex gap-2 border-t border-line pt-4">
          <Button type="submit" loading={createGroup.isPending}>
            {t('Tạo nhóm')}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t('Huỷ')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * Hộp thoại xác nhận ngay sau khi tạo nhóm — hiện mã 8 số và bắt đóng tay, không bấm
 * ra ngoài được (`closeOnBackdrop={false}`). Đây là LẦN DUY NHẤT mã hiện to trên màn
 * hình mà không phải tự tìm lại trong huy hiệu của nhóm; trước đây chỉ có một dòng
 * toast tự biến mất sau 3.5 giây, không kịp chép cho ai chưa quen thao tác nhanh.
 */
function GroupCreatedModal({ code, onClose }: { code: string; onClose: () => void }): JSX.Element {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard (vd tab không được cấp quyền) — mã vẫn đọc được
      // bằng mắt, chỉ mất mỗi nút chép nhanh.
    }
  };

  return (
    <Modal open onClose={onClose} closeOnBackdrop={false} title={t('Đã tạo nhóm')}>
      <p>
        {t(
          'Đây là mã 8 số duy nhất để mời người khác vào nhóm riêng tư này — chép lại trước khi đóng, màn hình sau sẽ không hiện lại mã này.',
        )}
      </p>

      <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
        {code.split('').map((digit, i) => (
          <div
            key={i}
            className="flex h-12 w-9 items-center justify-center rounded-lg border border-brand bg-brand-soft text-lg font-semibold tabular-nums text-brand-strong"
          >
            {digit}
          </div>
        ))}
      </div>
      <p className="sr-only" role="status">
        {t('Mã nhóm: {code}', { code })}
      </p>

      <Button
        type="button"
        variant="secondary"
        icon={copied ? Check : Copy}
        onClick={() => void copy()}
        className="mt-4 w-full justify-center"
      >
        {copied ? t('Đã chép') : t('Chép mã')}
      </Button>

      <Button type="button" onClick={onClose} className="mt-2 w-full justify-center">
        {t('Đã lưu mã, đóng')}
      </Button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Thẻ nhóm
// ---------------------------------------------------------------------------

/**
 * Một thẻ nhóm — dùng chung cho cả ba tab và hộp thoại nhập mã.
 *
 * Bố cục cố định ba tầng, từ trên xuống: tên / hàng nhãn / mô tả và số liệu, rồi hàng
 * nút DÍNH ĐÁY thẻ (`mt-auto`). Nhờ vậy hai thẻ đứng cạnh nhau trong lưới luôn có nút
 * thẳng một đường dù mô tả dài ngắn khác nhau. Trước đây tên và nhãn nằm chung một dòng
 * còn nhãn "chờ duyệt" trôi riêng bên phải: tên dài là nhãn bị bẻ thành hai dòng và mỗi
 * thẻ một kiểu lệch.
 *
 * KHÔNG hiện mã nhóm ở đây. Mã là chìa khoá vào nhóm riêng tư, nên nó chỉ hiện bên trong
 * trang nhóm — nơi chỉ thành viên mở được.
 *
 * `status`, `note` và `footer` để tab "Chờ duyệt" gắn trạng thái yêu cầu vào CÙNG một
 * khung thẻ, không dựng một kiểu thẻ thứ hai trông gần giống.
 */
function GroupCard({
  group,
  status,
  note,
  footer,
}: {
  group: GroupSummary;
  /** Nhãn trạng thái thêm vào cuối hàng nhãn. */
  status?: ReactNode;
  /** Một dòng chữ nhỏ dưới số liệu, vd "Đã gửi lúc …". */
  note?: string;
  /** Thay hàng nút mặc định (Xem nhóm / Yêu cầu vào). */
  footer?: ReactNode;
}): JSX.Element {
  const t = useT();

  return (
    <Card className="flex h-full flex-col">
      <h3 className="truncate font-semibold text-content" title={group.name}>
        {group.name}
      </h3>

      {/* `whitespace-nowrap` giữ chữ TRONG mỗi nhãn trên một dòng; hàng vẫn xuống dòng
          GIỮA các nhãn nhờ `flex-wrap`. Thiếu nó thì "2 chờ duyệt" bị bẻ đôi khi hẹp. */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 whitespace-nowrap">
        {group.visibility === GroupVisibility.PRIVATE ? (
          <Badge icon={Lock}>{t('Riêng tư')}</Badge>
        ) : (
          <Badge icon={Globe} tone="green">
            {t('Công khai')}
          </Badge>
        )}
        {group.viewerState === GroupViewerState.LEADER && (
          <Badge tone="brand">{t('Trưởng nhóm')}</Badge>
        )}
        {group.pendingCount > 0 && (
          <Badge tone="amber" icon={Clock}>
            {t('{n} chờ duyệt', { n: group.pendingCount })}
          </Badge>
        )}
        {status}
      </div>

      {group.description && (
        <p className="mt-3 line-clamp-2 text-sm text-content-soft">{group.description}</p>
      )}

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {t('{n} thành viên', { n: group.memberCount })}
        </span>
        <span>{t('{n} bài đăng', { n: group.postCount })}</span>
      </p>

      {note && <p className="mt-1 text-xs text-content-muted">{note}</p>}

      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {footer ?? <GroupCardActions group={group} />}
        </div>
      </div>
    </Card>
  );
}

/** Hàng nút mặc định của thẻ nhóm — đổi theo quan hệ của người xem với nhóm. */
function GroupCardActions({ group }: { group: GroupSummary }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const join = useJoinGroup();

  const isMember =
    group.viewerState === GroupViewerState.MEMBER || group.viewerState === GroupViewerState.LEADER;

  if (isMember) {
    return (
      <Button
        variant="secondary"
        size="sm"
        icon={ArrowRight}
        onClick={() => navigate(`/groups/${group.id}`)}
      >
        {t('Xem nhóm')}
      </Button>
    );
  }

  if (group.viewerState === GroupViewerState.PENDING) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-content-muted">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {t('Đang chờ trưởng nhóm duyệt')}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      icon={UserPlus}
      loading={join.isPending && join.variables?.id === group.id}
      onClick={() =>
        join.mutate(
          { id: group.id },
          {
            onSuccess: (result) =>
              toast.success(
                result.joined ? t('Đã vào nhóm') : t('Đã gửi yêu cầu, xem ở tab Chờ duyệt'),
              ),
            onError: (err) => toast.error(getErrorMessage(err)),
          },
        )
      }
    >
      {t('Yêu cầu vào')}
    </Button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}): JSX.Element {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
      />
      <span>
        <span className="block text-sm font-medium text-content">{label}</span>
        <span className="block text-xs text-content-muted">{hint}</span>
      </span>
    </label>
  );
}
