import { Check, Coins, Heart, ImageOff, ShoppingCart, Sparkles } from 'lucide-react';
import { KnownItemSlug, type ShopItemView } from '@enghabit/shared';
import { Button } from '../../../shared/components/ui';
import { Avatar } from '../../../shared/components/Sidebar';
import { useCurrentUser } from '../../auth/auth.store';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useT } from '../../../shared/i18n/language';
import { useBuyItem, useEquipItem, useSetFavorite, useUnequipItem } from '../shop.hooks';

/**
 * Thẻ một vật phẩm — dùng ở CẢ cửa hàng lẫn tab Yêu thích của kho.
 *
 * Một component duy nhất là lý do hai màn hình không bao giờ nói khác nhau về cùng một
 * vật phẩm: nút mua, trạng thái sở hữu và nút chọn dùng chỉ có một bản triển khai, và
 * cả hai màn cùng đọc một khoá cache. Viết hai thẻ riêng thì "đồng bộ trạng thái mua"
 * trở thành việc phải nhớ làm bằng tay ở hai chỗ.
 *
 * Nút chính đổi theo trạng thái, đúng một hành động mỗi lúc:
 *   chưa mua  → "Mua"
 *   đã mua    → "Dùng" (chọn để hiển thị)
 *   đang dùng → "Đang dùng" (bấm lần nữa để bỏ dùng)
 */
export function ShopItemCard({ item, coins }: { item: ShopItemView; coins: number }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();

  const buy = useBuyItem();
  const favorite = useSetFavorite();
  const equip = useEquipItem();
  const unequip = useUnequipItem();

  const missing = item.price - coins;
  const canAfford = missing <= 0;

  async function handleBuy(): Promise<void> {
    /*
      Hỏi xác nhận vì tiêu xu là thao tác KHÔNG hoàn lại được — không có bán lại.
      Dùng useConfirm chứ không phải confirm() của trình duyệt: hộp thoại gốc không theo
      bảng màu, khoá cứng cả tab và bị chặn trên vài trình duyệt di động (xem CLAUDE.md).
    */
    const ok = await confirm({
      title: t('Mua {name}?', { name: item.name }),
      message: t('Bạn sẽ tiêu {price} xu. Số dư còn lại {rest} xu.', {
        price: item.price,
        rest: coins - item.price,
      }),
      confirmLabel: t('Mua'),
    });
    if (!ok) return;

    buy.mutate(item.id, {
      // Nói rõ món vừa mua đi đâu: cửa hàng ẩn đồ đã sở hữu, nên thẻ biến mất ngay khi
      // mua xong — không có câu này người dùng tưởng mua hụt.
      onSuccess: () => toast.success(t('Đã mua {name}. Vật phẩm nằm trong Kho vật phẩm.', { name: item.name })),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative">
        {item.typeSlug === KnownItemSlug.AVATAR_FRAME ? (
          <FramePreview frameUrl={item.imageUrl} />
        ) : (
          <ItemImage src={item.imageUrl} alt={item.name} />
        )}

        <button
          type="button"
          onClick={() =>
            favorite.mutate(
              { itemId: item.id, favorite: !item.isFavorite },
              { onError: (error) => toast.error(getErrorMessage(error)) },
            )
          }
          disabled={favorite.isPending}
          aria-pressed={item.isFavorite}
          aria-label={item.isFavorite ? t('Bỏ yêu thích') : t('Yêu thích')}
          title={item.isFavorite ? t('Bỏ yêu thích') : t('Yêu thích')}
          className="absolute right-2 top-2 rounded-full border border-line bg-surface/90 p-1.5 backdrop-blur transition-colors hover:bg-hover disabled:opacity-60"
        >
          <Heart
            className={`h-4 w-4 ${item.isFavorite ? 'fill-danger text-danger' : 'text-content-muted'}`}
            aria-hidden
          />
        </button>

        {item.isEquipped && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t('Đang dùng')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate font-medium text-content" title={item.name}>
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-content-muted">{item.typeLabel}</p>

        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-content-soft">{item.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 pt-0.5">
          {item.isOwned ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t('Đã sở hữu')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-accent-ink">
              <Coins className="h-4 w-4 text-accent-ink" aria-hidden />
              {item.price}
            </span>
          )}

          {item.isOwned ? (
            <Button
              size="sm"
              variant={item.isEquipped ? 'secondary' : 'primary'}
              loading={equip.isPending || unequip.isPending}
              onClick={() =>
                item.isEquipped
                  ? unequip.mutate(item.typeId, {
                      onError: (error) => toast.error(getErrorMessage(error)),
                    })
                  : equip.mutate(
                      { typeId: item.typeId, itemId: item.id },
                      {
                        onSuccess: () => toast.success(t('Đang dùng {name}', { name: item.name })),
                        onError: (error) => toast.error(getErrorMessage(error)),
                      },
                    )
              }
            >
              {item.isEquipped ? t('Bỏ dùng') : t('Dùng')}
            </Button>
          ) : (
            <Button
              size="sm"
              icon={ShoppingCart}
              disabled={!canAfford}
              loading={buy.isPending}
              /* Nút xám luôn phải kèm lý do: nút không giải thích là kiểu giao diện
                 khiến người dùng bấm đi bấm lại rồi tưởng hệ thống hỏng. */
              title={canAfford ? t('Mua với {price} xu', { price: item.price }) : t('Còn thiếu {n} xu', { n: missing })}
              onClick={() => void handleBuy()}
            >
              {t('Mua')}
            </Button>
          )}
        </div>

        {!item.isOwned && !canAfford && (
          <p className="mt-1.5 text-xs text-content-muted">{t('Còn thiếu {n} xu', { n: missing })}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Ảnh vật phẩm.
 *
 * Chưa có ảnh thì vẽ ô giữ chỗ chứ không để `img` hỏng: ảnh vỡ trông như lỗi hệ thống,
 * trong khi "quản trị viên chưa tải ảnh" là trạng thái bình thường.
 *
 * Ảnh tải bằng thẻ `img` thẳng từ `/api/v1/shop/items/:id/image` — endpoint đó cố ý công
 * khai vì thẻ img không gửi được token, và ảnh là tranh minh hoạ chứ không phải dữ liệu
 * người dùng (xem be/src/modules/shop/shop.routes.ts).
 */
function ItemImage({ src, alt }: { src: string | null; alt: string }): JSX.Element {
  const t = useT();

  if (!src) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-sunken">
        <ImageOff className="h-8 w-8 text-content-muted" aria-hidden />
        <span className="sr-only">{t('Chưa có ảnh')}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="aspect-square w-full bg-sunken object-contain"
    />
  );
}

/**
 * Xem thử khung viền quanh ảnh đại diện của CHÍNH người đang xem.
 *
 * Một vòng viền trống trơn đứng một mình rất khó hình dung khi đeo lên sẽ ra sao; đặt nó
 * quanh đúng mặt mình thì người dùng quyết định mua nhanh hơn. Dùng lại `Avatar` — đúng
 * component vẽ khung ở mọi màn khác — nên xem thử ở đây giống hệt những gì người khác sẽ
 * thấy trên bài đăng hay bảng xếp hạng.
 */
function FramePreview({ frameUrl }: { frameUrl: string | null }): JSX.Element {
  const user = useCurrentUser();

  return (
    <div className="flex aspect-square w-full items-center justify-center bg-sunken">
      <Avatar name={user?.name ?? '?'} src={user?.avatarDataUrl} frameUrl={frameUrl} size="xl" />
    </div>
  );
}
