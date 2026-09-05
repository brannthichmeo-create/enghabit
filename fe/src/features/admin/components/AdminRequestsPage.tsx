import { useState } from 'react';
import { Check, ClipboardList, Inbox, ScrollText, X } from 'lucide-react';
import {
  PasswordResetStatus,
  rejectResetRequestSchema,
  type ResetRequestQueryInput,
  type ResetRequestRow,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  SkeletonList,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useApproveResetRequest, useRejectResetRequest, useResetRequests } from '../admin.hooks';
import { formatDateTime } from './AdminUsersPage';

/**
 * Quản lý yêu cầu cấp lại mật khẩu.
 *
 * TÀI LIỆU LUỒNG: `docs/luong-quen-mat-khau.md`.
 *
 * Hai tab đọc CÙNG một bảng, chỉ khác bộ lọc — không có bảng nhật ký riêng. Mọi thứ
 * cần ghi lại (ai duyệt, lúc nào, lý do từ chối) đều đã nằm trên chính dòng yêu cầu.
 */

type Tab = ResetRequestQueryInput['tab'];

const TABS: { key: Tab; label: string; icon: typeof Inbox }[] = [
  { key: 'pending', label: 'Yêu cầu', icon: Inbox },
  { key: 'log', label: 'Nhật ký', icon: ScrollText },
];

export function AdminRequestsPage(): JSX.Element {
  const t = useT();
  const [tab, setTab] = useState<Tab>('pending');
  const list = useResetRequests({ tab, page: 1, pageSize: 50 });
  const rows = list.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title={t('Quản lý yêu cầu')}
        description={t('Xét duyệt yêu cầu cấp lại mật khẩu của người dùng')}
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Loại danh sách')}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm transition ${
              tab === key ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t(label)}
            {key === 'pending' && rows.length > 0 && tab === 'pending' && (
              <span className="ml-0.5 rounded-full bg-brand px-1.5 text-[10px] font-bold text-on-brand">
                {list.data?.total ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {list.isLoading && <SkeletonList rows={4} />}
      {list.isError && <ErrorMessage>{getErrorMessage(list.error)}</ErrorMessage>}

      {list.data && rows.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'pending' ? t('Không có yêu cầu nào đang chờ') : t('Nhật ký còn trống')}
          description={
            tab === 'pending'
              ? t('Khi người dùng gửi yêu cầu cấp lại mật khẩu, yêu cầu sẽ hiện ở đây.')
              : t('Các yêu cầu đã duyệt hoặc từ chối sẽ được ghi lại ở đây.')
          }
        />
      )}

      {/*
        Hai tab trình bày khác nhau vì dùng để làm hai việc khác nhau:

        - "Yêu cầu" là hàng việc phải LÀM. Mỗi dòng có hai nút bấm, và số dòng thường
          ít — danh sách thoáng, nút to, khó bấm nhầm.
        - "Nhật ký" là dữ liệu để TRA. Không có nút nào, nhưng nhiều dòng và mỗi dòng
          có năm mẩu thông tin cùng loại cần so ngang giữa các dòng — đó đúng là việc
          của bảng.
      */}
      {rows.length > 0 &&
        (tab === 'pending' ? (
          <Card>
            <ul className="divide-y divide-line">
              {rows.map((row) => (
                <li key={row.id}>
                  <PendingRow row={row} />
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <LogTable rows={rows} />
        ))}
    </div>
  );
}

function PendingRow({ row }: { row: ResetRequestRow }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const approve = useApproveResetRequest();
  const reject = useRejectResetRequest();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const submitReject = (): void => {
    const parsed = rejectResetRequestSchema.safeParse({ reason });
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? t('Lý do không hợp lệ'));
      return;
    }

    reject.mutate(
      { id: row.id, input: parsed.data },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setReason('');
          toast.success(t('Đã từ chối yêu cầu'));
        },
        onError: (e) => setReasonError(getErrorMessage(e)),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-2 py-3">
      <div className="min-w-0 flex-1">
        <UserLine row={row} />
        <p className="mt-0.5 text-xs text-content-muted">
          {t('Gửi lúc {time}', { time: formatDateTime(row.createdAt, t, locale) })}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          icon={Check}
          loading={approve.isPending}
          onClick={() =>
            approve.mutate(row.id, { onSuccess: () => toast.success(t('Đã duyệt yêu cầu')) })
          }
        >
          {t('Xác nhận')}
        </Button>
        <Button size="sm" variant="danger" icon={X} onClick={() => setRejectOpen(true)}>
          {t('Từ chối')}
        </Button>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={t('Từ chối yêu cầu')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              {t('Huỷ')}
            </Button>
            <Button variant="danger" loading={reject.isPending} onClick={submitReject}>
              {t('Từ chối')}
            </Button>
          </>
        }
      >
        <p className="mb-2">
          {t('Người dùng sẽ đọc được lý do này, nên hãy nói rõ họ cần làm gì tiếp theo.')}
        </p>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError(null);
          }}
          rows={3}
          autoFocus
          placeholder={t('Ví dụ: Không xác minh được danh tính. Vui lòng liên hệ trực tiếp giáo vụ.')}
          className="w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        {reasonError && <p className="mt-1.5 text-sm text-danger">{reasonError}</p>}
      </Modal>
    </div>
  );
}

/** Tên hiển thị kèm định danh đăng nhập. Chỉ tab "Yêu cầu" dùng — bảng nhật ký tự
 *  dựng ô riêng để hai dòng xếp thẳng cột với nhau. */
function UserLine({ row }: { row: ResetRequestRow }): JSX.Element {
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
      <span className="truncate font-medium text-content">{row.user.name}</span>
      <span className="truncate text-xs text-content-muted">
        {row.user.username} · {row.user.email}
      </span>
    </span>
  );
}

/**
 * Nhật ký phê duyệt.
 *
 * `overflow-x-auto` trên Card cộng `min-w` trên bảng: bảng năm cột không ép vừa nổi
 * màn hẹp, nên cho nó cuộn NGANG TRONG THẺ thay vì để cả trang trôi ngang.
 */
function LogTable({ rows }: { rows: ResetRequestRow[] }): JSX.Element {
  const t = useT();

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-content-muted">
            <th className="pb-2 font-medium">{t('Người dùng')}</th>
            <th className="pb-2 font-medium">{t('Kết quả')}</th>
            <th className="pb-2 font-medium">{t('Người thực hiện')}</th>
            <th className="pb-2 font-medium">{t('Thời điểm')}</th>
            <th className="pb-2 font-medium">{t('Lý do từ chối')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <LogRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function LogRow({ row }: { row: ResetRequestRow }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const approved = row.status === PasswordResetStatus.APPROVED;

  return (
    <tr className="align-top">
      <td className="py-2.5 pr-4">
        <span className="block font-medium text-content">{row.user.name}</span>
        <span className="block text-xs text-content-muted">
          {row.user.username} · {row.user.email}
        </span>
      </td>

      <td className="py-2.5 pr-4">
        {/* `green`/`red` là tên tông của Badge, không phải tên trạng thái —
            xem BADGE_TONES trong shared/components/ui.tsx. */}
        <Badge tone={approved ? 'green' : 'red'}>
          {approved ? t('Đã xác nhận') : t('Đã từ chối')}
        </Badge>
        {/* Chỉ có nghĩa với yêu cầu đã duyệt: duyệt rồi mà người dùng chưa quay lại
            đặt mật khẩu thì lượt duyệt vẫn đang mở, quản trị viên nên biết. */}
        {approved && (
          <span className="mt-1 block text-xs text-content-muted">
            {row.usedAt ? t('Đã đổi mật khẩu') : t('Chưa đổi mật khẩu')}
          </span>
        )}
      </td>

      <td className="py-2.5 pr-4 text-content-soft">
        {/* null khi tài khoản quản trị viên đó đã bị xoá — khoá ngoại để SET NULL nên
            dòng nhật ký vẫn còn, chỉ mất thông tin ai làm. */}
        {row.reviewedBy?.name ?? (
          <span className="italic text-content-muted">{t('Quản trị viên đã bị xoá')}</span>
        )}
      </td>

      <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-content-soft">
        {formatDateTime(row.reviewedAt, t, locale)}
      </td>

      <td className="py-2.5 text-content-soft">
        {row.rejectReason ?? <span className="text-content-muted">—</span>}
      </td>
    </tr>
  );
}
