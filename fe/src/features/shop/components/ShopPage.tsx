import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, PackageOpen, Search, Store, Wallet } from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, PageHeader, Skeleton } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useT } from '../../../shared/i18n/language';
import { useRewards } from '../../rewards/rewards.hooks';
import { useShopItems, useShopTypes } from '../shop.hooks';
import { ShopItemCard } from './ShopItemCard';

/**
 * Cửa hàng: mua vật phẩm bằng xu.
 *
 * Danh mục chia theo LOẠI, mà loại thì do quản trị viên tự thêm ở /admin/shop — nên dải
 * tab dựng từ dữ liệu, không phải từ một mảng hằng trong code. Loại mới xuất hiện ở đây
 * ngay sau khi quản trị viên tạo, không cần deploy lại.
 */
export function ShopPage(): JSX.Element {
  const t = useT();
  const [typeId, setTypeId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const types = useShopTypes();
  const rewards = useRewards();

  const query = { typeId, q: search.trim() || undefined, page, pageSize: 24 };
  const items = useShopItems(query);

  const coins = rewards.data?.coins ?? 0;
  const totalPages = items.data ? Math.max(1, Math.ceil(items.data.total / items.data.pageSize)) : 1;

  return (
    <div>
      <PageHeader
        title={t('Cửa hàng')}
        description={t('Dùng xu tích được để mua vật phẩm trang trí cho tài khoản của bạn')}
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold tabular-nums text-accent-ink">
              <Coins className="h-4 w-4" aria-hidden />
              {coins}
            </span>
            <Link to="/wallet">
              <Button variant="secondary" icon={Wallet}>
                {t('Ví của tôi')}
              </Button>
            </Link>
            <Link to="/inventory">
              <Button variant="secondary" icon={PackageOpen}>
                {t('Kho vật phẩm')}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TypeTab active={typeId === undefined} onClick={() => resetTo(undefined)}>
          {t('Tất cả')}
        </TypeTab>
        {types.data?.map((type) => (
          <TypeTab key={type.id} active={typeId === type.id} onClick={() => resetTo(type.id)}>
            {/* Nhãn loại do quản trị viên nhập — dữ liệu động, KHÔNG đưa qua t(). */}
            {type.label}
          </TypeTab>
        ))}

        <span className="relative ml-auto">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t('Tìm vật phẩm')}
            aria-label={t('Tìm vật phẩm')}
            className="!mt-0 w-56 pl-9"
          />
        </span>
      </div>

      {items.isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-[260px] w-full" />
          ))}
        </div>
      )}

      {items.isError && (
        <ErrorState message={getErrorMessage(items.error)} onRetry={() => void items.refetch()} />
      )}

      {items.data && items.data.items.length === 0 && (
        <EmptyState
          icon={Store}
          title={search ? t('Không tìm thấy vật phẩm nào') : t('Cửa hàng chưa có vật phẩm')}
          description={
            search
              ? t('Thử từ khoá khác hoặc chọn một loại khác')
              : t('Quản trị viên chưa thêm vật phẩm nào. Quay lại sau nhé.')
          }
        />
      )}

      {items.data && items.data.items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.data.items.map((item) => (
              <ShopItemCard key={item.id} item={item} coins={coins} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                {t('Trang trước')}
              </Button>
              <span className="text-sm tabular-nums text-on-page-muted">
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
        </>
      )}
    </div>
  );

  /** Đổi loại luôn quay về trang 1 — giữ nguyên số trang cũ dễ rơi vào trang trống. */
  function resetTo(next: number | undefined): void {
    setTypeId(next);
    setPage(1);
  }
}

function TypeTab({
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
        active
          ? 'bg-brand-soft text-brand-strong'
          : 'text-on-page-soft hover:bg-hover hover:text-on-page'
      }`}
    >
      {children}
    </button>
  );
}
