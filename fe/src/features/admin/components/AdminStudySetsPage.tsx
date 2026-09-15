import { useState, type FormEvent } from 'react';
import { Ban, CircleCheck, Flag, Globe, Lock, ShieldCheck, X } from 'lucide-react';
import {
  StudySetReportStatus,
  StudySetVisibility,
  blockStudySetSchema,
  type AdminStudySetReportRow,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  Select,
  SkeletonList,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useLocale, useT } from '../../../shared/i18n/language';
import {
  useAdminStudySet,
  useBlockStudySet,
  useDismissStudySetReport,
  useStudySetReports,
  useUnblockStudySet,
} from '../admin.hooks';

const STATUS_LABELS: Record<StudySetReportStatus, string> = {
  [StudySetReportStatus.PENDING]: 'Chờ xử lý',
  [StudySetReportStatus.RESOLVED]: 'Đã chặn bộ thẻ',
  [StudySetReportStatus.DISMISSED]: 'Đã bỏ qua',
};

/**
 * Kiểm duyệt bộ thẻ công khai do người học tạo.
 *
 * Cùng tinh thần quản lý nhóm lớp: chỉ xem, bỏ qua báo cáo, chặn/mở chặn. Không có xoá bộ
 * thẻ — chặn đảo ngược được, xoá thì mất tiến độ học của mọi người đang học bộ đó.
 */
export function AdminStudySetsPage(): JSX.Element {
  const t = useT();
  const [status, setStatus] = useState<'' | StudySetReportStatus>(StudySetReportStatus.PENDING);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AdminStudySetReportRow | null>(null);

  const reports = useStudySetReports({ page, ...(status ? { status } : {}) });
  const totalPages = reports.data ? Math.max(1, Math.ceil(reports.data.total / reports.data.pageSize)) : 1;

  return (
    <div>
      <PageHeader
        title={t('Kiểm duyệt bộ thẻ')}
        description={t('Xử lý báo cáo vi phạm về bộ thẻ công khai do người học tạo')}
      />

      <div className="mb-4 w-56">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | StudySetReportStatus);
            setPage(1);
          }}
          aria-label={t('Lọc theo trạng thái')}
        >
          <option value="">{t('Tất cả')}</option>
          {Object.values(StudySetReportStatus).map((value) => (
            <option key={value} value={value}>
              {t(STATUS_LABELS[value])}
            </option>
          ))}
        </Select>
      </div>

      {reports.isLoading && <SkeletonList rows={3} />}
      {reports.isError && <ErrorMessage>{getErrorMessage(reports.error)}</ErrorMessage>}

      {reports.data && reports.data.items.length === 0 && (
        <EmptyState icon={Flag} title={t('Không có báo cáo nào')} />
      )}

      {reports.data && reports.data.items.length > 0 && (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-content-muted">
                  <th className="pb-2 font-medium">{t('Bộ thẻ')}</th>
                  <th className="pb-2 font-medium">{t('Người báo cáo')}</th>
                  <th className="pb-2 font-medium">{t('Lý do')}</th>
                  <th className="pb-2 font-medium">{t('Trạng thái')}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reports.data.items.map((report) => (
                  <ReportRow key={report.id} report={report} onOpen={() => setOpen(report)} />
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
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t('Sau')}
              </Button>
            </div>
          )}
        </>
      )}

      {open && <StudySetModal report={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ReportRow({ report, onOpen }: { report: AdminStudySetReportRow; onOpen: () => void }): JSX.Element {
  const t = useT();
  const locale = useLocale();

  return (
    <tr>
      <td className="py-2.5">
        <button onClick={onOpen} className="text-left hover:underline">
          <span className="flex items-center gap-2 font-medium text-content">
            {report.studySet.name}
            {report.studySet.visibility === StudySetVisibility.PRIVATE ? (
              <Lock className="h-3.5 w-3.5 text-content-muted" aria-label={t('Riêng tư')} />
            ) : (
              <Globe className="h-3.5 w-3.5 text-content-muted" aria-label={t('Công khai')} />
            )}
          </span>
          <span className="block text-xs text-content-muted">
            {report.studySet.owner ? `@${report.studySet.owner.username}` : t('Hệ thống')}
          </span>
        </button>
      </td>
      <td className="py-2.5 text-content-soft">
        <span className="block">{report.reporter.name}</span>
        <span className="block text-xs text-content-muted">{new Date(report.createdAt).toLocaleString(locale)}</span>
      </td>
      <td className="max-w-xs py-2.5 text-content-soft">
        <span className="line-clamp-2">{report.reason}</span>
      </td>
      <td className="py-2.5">
        <Badge
          tone={
            report.status === StudySetReportStatus.PENDING
              ? 'amber'
              : report.status === StudySetReportStatus.RESOLVED
                ? 'red'
                : 'slate'
          }
        >
          {t(STATUS_LABELS[report.status])}
        </Badge>
      </td>
      <td className="py-2.5 text-right">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          {t('Xem')}
        </Button>
      </td>
    </tr>
  );
}

function StudySetModal({ report, onClose }: { report: AdminStudySetReportRow; onClose: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const set = useAdminStudySet(report.studySet.id);
  const dismiss = useDismissStudySetReport();
  const unblock = useUnblockStudySet();
  const [blocking, setBlocking] = useState(false);

  const isPending = report.status === StudySetReportStatus.PENDING;

  return (
    <Modal open onClose={onClose} title={report.studySet.name} size="lg" closeOnBackdrop={false}>
      {set.isLoading && <SkeletonList rows={2} />}
      {set.isError && <ErrorMessage>{getErrorMessage(set.error)}</ErrorMessage>}

      {set.data && (
        <div className="space-y-4">
          <div className="rounded-lg bg-sunken px-3 py-2">
            <p className="text-xs text-content-muted">{t('Lý do báo cáo của {name}', { name: report.reporter.name })}</p>
            <p className="mt-0.5 text-content">{report.reason}</p>
          </div>

          <p className="text-sm">
            {t('Chủ bộ thẻ: {owner}', {
              owner: set.data.owner ? `${set.data.owner.name} (@${set.data.owner.username})` : t('Hệ thống'),
            })}
          </p>

          {set.data.block && (
            <div className="rounded-lg border border-danger/40 px-3 py-2">
              <p className="flex items-center gap-2 font-medium text-danger">
                <Ban className="h-4 w-4" aria-hidden />
                {t('Đang bị chặn')}
              </p>
              <p className="mt-1 text-sm text-content-soft">{set.data.block.reason}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-content">{t('Thẻ trong bộ ({n})', { n: set.data.cardCount })}</p>
            <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-lg border border-line">
              {set.data.cards.map((card) => (
                <li key={card.id} className="px-3 py-2">
                  <span className="font-medium text-content">{card.word}</span>
                  <span className="ml-2 text-content-soft">{card.meaning}</span>
                  {card.example && <span className="block text-xs italic text-content-muted">"{card.example}"</span>}
                </li>
              ))}
            </ul>
          </div>

          {blocking ? (
            <BlockForm setId={set.data.id} onDone={() => setBlocking(false)} />
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {set.data.block ? (
                <Button
                  icon={ShieldCheck}
                  loading={unblock.isPending}
                  onClick={() =>
                    unblock.mutate(set.data.id, {
                      onSuccess: () => toast.success(t('Đã mở chặn bộ thẻ')),
                      onError: (err) => toast.error(getErrorMessage(err)),
                    })
                  }
                >
                  {t('Mở chặn bộ thẻ')}
                </Button>
              ) : (
                set.data.owner && (
                  <Button variant="danger" icon={Ban} onClick={() => setBlocking(true)}>
                    {t('Chặn bộ thẻ')}
                  </Button>
                )
              )}
              {isPending && !set.data.block && (
                <Button
                  variant="secondary"
                  icon={CircleCheck}
                  loading={dismiss.isPending}
                  onClick={() =>
                    dismiss.mutate(report.id, {
                      onSuccess: () => {
                        toast.success(t('Đã bỏ qua báo cáo'));
                        onClose();
                      },
                      onError: (err) => toast.error(getErrorMessage(err)),
                    })
                  }
                >
                  {t('Không vi phạm, bỏ qua')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Chặn bộ thẻ — bắt buộc nhập lý do, vì chủ bộ thẻ sẽ đọc đúng câu này. */
function BlockForm({ setId, onDone }: { setId: number; onDone: () => void }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const block = useBlockStudySet();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const parsed = blockStudySetSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }
    block.mutate(
      { setId, reason: parsed.data.reason },
      {
        onSuccess: () => {
          toast.success(t('Đã chặn bộ thẻ'));
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
        <span className="text-sm font-medium text-content-soft">{t('Lý do chặn bộ thẻ')}</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          autoFocus
          placeholder={t('Ví dụ: Bộ thẻ chứa nội dung phản cảm, vi phạm nội quy học tập.')}
          className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <span className="mt-1 block text-xs text-content-muted">
          {t('Chủ bộ thẻ sẽ đọc đúng câu này, nên viết cho họ hiểu cần sửa gì.')}
        </span>
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="danger" icon={Ban} loading={block.isPending}>
          {t('Chặn bộ thẻ')}
        </Button>
        <Button type="button" variant="ghost" icon={X} onClick={onDone}>
          {t('Huỷ')}
        </Button>
      </div>
    </form>
  );
}
