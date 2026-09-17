import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ImageOff, PackageOpen, Store } from 'lucide-react';
import type { OwnedItemView } from '@enghabit/shared';
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useToast } from '../../../shared/components/Toast';
import { useRewards } from '../../rewards/rewards.hooks';
import { useEquipItem, useInventory, useShopItems, useUnequipItem } from '../shop.hooks';
import { ShopItemCard } from './ShopItemCard';

/**
 * Kho vật phẩm — hai tab.
 *
 * **Yêu thích** dùng LẠI đúng `ShopItemCard` của cửa hàng, chỉ đổi bộ lọc thành
 * `favorite=true`. Nhờ vậy nút mua, trạng thái sở hữu và nút chọn dùng hành xử y hệt
 * bên cửa hàng mà không phải viết lần thứ hai — và "bấm mua ở đây thì cửa hàng cũng
 * cập nhật" là chuyện đương nhiên, vì cả hai đọc chung một khoá cache.
 *
 * **Của tôi** là bảng dữ liệu: mỗi dòng một vật phẩm đã mua, cột cuối là ô chọn dùng.
 * Mỗi LOẠI chỉ chọn được một vật phẩm nên các ô của cùng một loại cư xử như radio —
 * chọn cái mới thì cái cũ tự bỏ, do backend ghi đè đúng một dòng (user_equipped_items).
 */

type Tab = 'favorites' | 'mine';

export function InventoryPage(): JSX.Element {
  const t = useT();
  const [tab, setTab] = useState<Tab>('favorites');

  return (
    <div>
      <PageHeader
        title={t('Kho vật phẩm')}
        description={t('Vật phẩm bạn đã thích và đã mua. Mỗi loại chọn một vật phẩm để hiển thị.')}
        action={
          <Link to="/shop">
            <Button variant="secondary" icon={Store}>
              {t('Cửa hàng')}
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <TabButton active={tab === 'favorites'} onClick={() => setTab('favorites')}>
          {t('Yêu thích')}
        </TabButton>
        <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
          {t('Của tôi')}
        </TabButton>
      </div>

      {tab === 'favorites' ? <FavoritesTab /> : <MineTab />}
    </div>
  );
}

function FavoritesTab(): JSX.Element {
  const t = useT();

  const query = { favorite: true, page: 1, pageSize: 48 };
  const items = useShopItems(query);
  const rewards = useRewards();
  const coins = rewards.data?.coins ?? 0;

  if (items.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[260px] w-full" />
        ))}
      </div>
    );
  }

  if (items.isError) {
    return <ErrorState message={getErrorMessage(items.error)} onRetry={() => void items.refetch()} />;
  }

  if (!items.data || items.data.items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={t('Chưa có vật phẩm yêu thích')}
        description={t('Bấm biểu tượng trái tim trên một vật phẩm ở cửa hàng để lưu vào đây.')}
        action={
          <Link to="/shop">
            <Button icon={Store}>{t('Tới cửa hàng')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {items.data.items.map((item) => (
        <ShopItemCard key={item.id} item={item} coins={coins} />
      ))}
    </div>
  );
}

function MineTab(): JSX.Element {
  const t = useT();

  const inventory = useInventory();

  if (inventory.isLoading) return <Skeleton className="h-72 w-full" />;

  if (inventory.isError) {
    return (
      <ErrorState
        message={getErrorMessage(inventory.error)}
        onRetry={() => void inventory.refetch()}
      />
    );
  }

  if (!inventory.data || inventory.data.items.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title={t('Kho của bạn còn trống')}
        description={t('Mua vật phẩm đầu tiên ở cửa hàng để bắt đầu trang trí tài khoản.')}
        action={
          <Link to="/shop">
            <Button icon={Store}>{t('Tới cửa hàng')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Card className="!p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
              <th className="px-4 py-3 font-semibold">{t('Vật phẩm')}</th>
              <th className="px-4 py-3 font-semibold">{t('Loại')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('Giá đã trả')}</th>
              <th className="px-4 py-3 font-semibold">{t('Ngày mua')}</th>
              <th className="px-4 py-3 text-center font-semibold">{t('Sử dụng')}</th>
            </tr>
          </thead>
          <tbody>
            {inventory.data.items.map((item) => (
              <OwnedRow
                key={item.id}
                item={item}
                equipped={inventory.data.equipped[item.typeId] === item.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function OwnedRow({ item, equipped }: { item: OwnedItemView; equipped: boolean }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const equip = useEquipItem();
  const unequip = useUnequipItem();

  const busy = equip.isPending || unequip.isPending;

  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="px-4 py-3">
        <span className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-lg bg-sunken object-contain"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken">
              <ImageOff className="h-4 w-4 text-content-muted" aria-hidden />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium text-content">{item.name}</span>
            {item.description && (
              <span className="block truncate text-xs text-content-muted">{item.description}</span>
            )}
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-content-soft">{item.typeLabel}</td>
      <td className="px-4 py-3 text-right tabular-nums text-content-soft">{item.pricePaid}</td>
      <td className="px-4 py-3 tabular-nums text-content-muted">
        {new Date(item.purchasedAt).toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3 text-center">
        {/*
          Ô chọn kiểu radio: mỗi loại chỉ một vật phẩm được dùng. Bấm vào cái đang chọn
          thì bỏ chọn — không cần thêm một nút "bỏ dùng" riêng cho mỗi dòng.
        */}
        <input
          type="radio"
          checked={equipped}
          disabled={busy}
          aria-label={
            equipped
              ? t('Bỏ dùng {name}', { name: item.name })
              : t('Dùng {name}', { name: item.name })
          }
          onChange={() =>
            equip.mutate(
              { typeId: item.typeId, itemId: item.id },
              {
                onSuccess: () => toast.success(t('Đang dùng {name}', { name: item.name })),
                onError: (error) => toast.error(getErrorMessage(error)),
              },
            )
          }
          onClick={() => {
            if (!equipped) return;
            unequip.mutate(item.typeId, {
              onSuccess: () => toast.success(t('Đã bỏ dùng {name}', { name: item.name })),
              onError: (error) => toast.error(getErrorMessage(error)),
            });
          }}
          className="h-4 w-4 cursor-pointer accent-brand disabled:cursor-not-allowed"
        />
      </td>
    </tr>
  );
}

function TabButton({
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
        active ? 'bg-brand-soft text-brand-strong' : 'text-on-page-soft hover:bg-hover hover:text-on-page'
      }`}
    >
      {children}
    </button>
  );
}
