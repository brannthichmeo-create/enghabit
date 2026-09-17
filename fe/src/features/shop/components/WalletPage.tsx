import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Coins, Store, Wallet } from 'lucide-react';
import { CoinDirection, CoinReason, type WalletEntry } from '@enghabit/shared';
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useWallet } from '../shop.hooks';

/**
 * Ví cá nhân: số dư và lịch sử biến động xu.
 *
 * KHÔNG có bảng ví dưới DB — số dư là SUM(amount) của sổ cái `coin_transactions` và
 * lịch sử chính là các dòng của sổ cái đó. Màn này chỉ đọc, không có thao tác nào.
 */

/**
 * Nhãn từng lý do biến động.
 *
 * Giữ tiếng Việt TẠI CHỖ KHAI BÁO và dịch ở chỗ hiển thị bằng `t(...)`, đúng quy ước
 * cho nhãn nằm trong bảng dữ liệu (xem CLAUDE.md). Thêm lý do mới thì phải tự thêm bản
 * dịch vào `en.ts` — script kiểm tra không quét được nhóm này.
 */
const REASON_LABELS: Record<CoinReason, string> = {
  [CoinReason.DAILY_CHECKIN]: 'Điểm danh hằng ngày',
  [CoinReason.MISSION_CLAIM]: 'Thưởng nhiệm vụ ngày',
  [CoinReason.STREAK_FREEZE_PURCHASE]: 'Mua vật phẩm giữ chuỗi',
  [CoinReason.SHOP_PURCHASE]: 'Mua vật phẩm trong cửa hàng',
};

const PAGE_SIZE = 20;

export function WalletPage(): JSX.Element {
  const t = useT();
  const [direction, setDirection] = useState<CoinDirection | undefined>(undefined);
  const [page, setPage] = useState(1);

  const wallet = useWallet({ direction, page, pageSize: PAGE_SIZE });
  const totalPages = wallet.data ? Math.max(1, Math.ceil(wallet.data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title={t('Ví của tôi')}
        description={t('Số xu hiện có và toàn bộ lịch sử thu chi của bạn')}
        action={
          <Link to="/shop">
            <Button variant="secondary" icon={Store}>
              {t('Cửa hàng')}
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <p className="text-sm text-content-muted">{t('Số dư hiện tại')}</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-bold tabular-nums text-content">
            <Coins className="h-7 w-7 text-accent-ink" aria-hidden />
            {wallet.isLoading ? <Skeleton className="h-8 w-20" /> : (wallet.data?.balance ?? 0)}
          </p>
        </Card>

        <SummaryCard
          label={t('Tổng đã nhận')}
          value={wallet.data?.totalIn ?? 0}
          loading={wallet.isLoading}
          tone="in"
        />
        <SummaryCard
          label={t('Tổng đã tiêu')}
          value={wallet.data?.totalOut ?? 0}
          loading={wallet.isLoading}
          tone="out"
        />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FilterTab active={direction === undefined} onClick={() => filterBy(undefined)}>
            {t('Tất cả')}
          </FilterTab>
          <FilterTab active={direction === CoinDirection.IN} onClick={() => filterBy(CoinDirection.IN)}>
            {t('Thu')}
          </FilterTab>
          <FilterTab active={direction === CoinDirection.OUT} onClick={() => filterBy(CoinDirection.OUT)}>
            {t('Chi')}
          </FilterTab>
        </div>

        {wallet.isLoading && <Skeleton className="h-64 w-full" />}

        {wallet.isError && (
          <ErrorState message={getErrorMessage(wallet.error)} onRetry={() => void wallet.refetch()} />
        )}

        {wallet.data && wallet.data.entries.length === 0 && (
          <EmptyState
            icon={Wallet}
            title={t('Chưa có biến động nào')}
            description={t('Điểm danh mỗi ngày và hoàn thành nhiệm vụ để nhận xu.')}
          />
        )}

        {wallet.data && wallet.data.entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
                  <th className="pb-2 pr-3 font-semibold">{t('Thời gian')}</th>
                  <th className="pb-2 pr-3 font-semibold">{t('Diễn giải')}</th>
                  <th className="pb-2 pr-3 font-semibold">{t('Loại')}</th>
                  <th className="pb-2 text-right font-semibold">{t('Số xu')}</th>
                </tr>
              </thead>
              <tbody>
                {wallet.data.entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              {t('Trang trước')}
            </Button>
            <span className="text-sm tabular-nums text-content-muted">
              {t('Trang {page}/{total}', { page, total: totalPages })}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('Trang sau')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  function filterBy(next: CoinDirection | undefined): void {
    setDirection(next);
    setPage(1);
  }
}

function EntryRow({ entry }: { entry: WalletEntry }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const isIn = entry.direction === CoinDirection.IN;

  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-2.5 pr-3 tabular-nums text-content-muted">
        {/* Định dạng theo ngôn ngữ đang chọn, KHÔNG hardcode 'vi-VN' — nếu không thì
            giao diện tiếng Anh vẫn hiện ngày kiểu Việt. */}
        {new Date(entry.createdAt).toLocaleString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className="py-2.5 pr-3 text-content">
        {t(REASON_LABELS[entry.reason])}
        {/* Tên vật phẩm là dữ liệu động do quản trị viên nhập — không đưa qua t(). */}
        {entry.itemName && <span className="text-content-muted"> — {entry.itemName}</span>}
      </td>
      <td className="py-2.5 pr-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isIn ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent-ink'
          }`}
        >
          {isIn ? (
            <ArrowDownLeft className="h-3 w-3" aria-hidden />
          ) : (
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          )}
          {isIn ? t('Thu') : t('Chi')}
        </span>
      </td>
      <td
        className={`py-2.5 text-right font-semibold tabular-nums ${isIn ? 'text-success' : 'text-content'}`}
      >
        {isIn ? '+' : ''}
        {entry.amount}
      </td>
    </tr>
  );
}

function SummaryCard({
  label,
  value,
  loading,
  tone,
}: {
  label: string;
  value: number;
  loading: boolean;
  tone: 'in' | 'out';
}): JSX.Element {
  const Icon = tone === 'in' ? ArrowDownLeft : ArrowUpRight;

  return (
    <Card>
      <p className="text-sm text-content-muted">{label}</p>
      <p
        className={`mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums ${
          tone === 'in' ? 'text-success' : 'text-content'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {loading ? <Skeleton className="h-7 w-16" /> : value}
      </p>
    </Card>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-soft text-brand-strong' : 'text-content-muted hover:bg-hover hover:text-content'
      }`}
    >
      {children}
    </button>
  );
}
