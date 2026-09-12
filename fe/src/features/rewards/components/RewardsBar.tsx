import { useState } from 'react';
import { Check, Coins, ShoppingCart, Snowflake, Target } from 'lucide-react';
import type { MissionState, RewardsSummary } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useBuyStreakFreeze, useCheckIn, useClaimMission, useRewards } from '../rewards.hooks';
import { useT } from '../../../shared/i18n/language';

/**
 * Hàng phần thưởng trong thẻ tổng hợp: điểm danh, nhiệm vụ ngày, vật phẩm giữ chuỗi.
 *
 * Ba thứ này đứng cạnh nhau vì cùng trả lời "hôm nay có gì để nhận" — tách ra ba khối
 * riêng thì người dùng phải quét cả trang mới biết mình còn sót thứ gì.
 *
 * Danh sách nhiệm vụ mặc định đóng: mở sẵn thì thẻ tổng hợp dài gấp đôi, trong khi
 * phần lớn lượt vào chỉ để liếc xem còn nhiệm vụ nào chưa xong.
 */
export function RewardsBar(): JSX.Element | null {
  const t = useT();
  const rewards = useRewards();
  const [showMissions, setShowMissions] = useState(false);

  if (rewards.isLoading) return <Skeleton className="h-[46px] w-full" />;
  // Lỗi ở khu phần thưởng không được che mất phần học tập — im lặng bỏ qua là đúng.
  if (!rewards.data) return null;

  const { checkIn, missions, freeze } = rewards.data;
  const claimedCount = missions.filter((mission) => mission.isClaimed).length;
  const claimable = missions.some((mission) => mission.isCompleted && !mission.isClaimed);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-stretch gap-2">
        <CheckInButton claimed={checkIn.claimedToday} reward={checkIn.reward} />

        <button
          onClick={() => setShowMissions((open) => !open)}
          aria-expanded={showMissions}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            claimable
              ? 'border-accent bg-accent-soft text-accent-ink'
              : 'border-line text-content-soft hover:bg-hover'
          }`}
        >
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          {t('Nhiệm vụ')}
          <span className="tabular-nums">
            {claimedCount}/{missions.length}
          </span>
        </button>

        <FreezeControl freeze={freeze} coins={rewards.data.coins} />
      </div>

      {/*
        Nói thẳng xu và chuỗi là hai thứ khác nhau.

        Nút nhận xu nằm ngay dưới ô "Chuỗi hiện tại" nên rất dễ bị hiểu là bấm vào thì
        chuỗi tăng — người dùng đã hiểu nhầm đúng như vậy. Chuỗi chỉ tính ngày CÓ HỌC
        (xem CLAUDE.md), một cú bấm nút không phải là học.
      */}
      <p className="text-xs text-content-muted">
        {t('Xu không tính vào chuỗi ngày. Muốn giữ chuỗi, hãy học một bài, ôn thẻ, làm kiểm tra hoặc check-in một thói quen.')}
      </p>

      {showMissions && (
        <ul className="animate-slide-up space-y-2 rounded-xl border border-line bg-surface p-3">
          {missions.map((mission) => (
            <li key={mission.id}>
              <MissionRow mission={mission} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CheckInButton({ claimed, reward }: { claimed: boolean; reward: number }): JSX.Element {
  const t = useT();
  const checkIn = useCheckIn();
  const toast = useToast();

  if (claimed) {
    return (
      <span className="flex items-center gap-2 rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm font-medium text-success">
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        {t('Đã nhận xu hôm nay')}
      </span>
    );
  }

  /*
    KHÔNG dùng `bg-brand` ở đây. Nút "Học" trong `HeroCard` cách nút này 16px trong cùng
    một thẻ; cho cả hai cùng nền thương hiệu, cùng chữ hoa, cùng bề rộng thì hai việc
    hoàn toàn khác nhau trông y hệt nhau — và người dùng đã hiểu nhầm đúng như vậy
    (xem đoạn giải thích ngay dưới dải này). Điểm danh nhận xu KHÔNG ghi `ActivityLog`,
    không phải hoạt động học, nên nó không được tranh nhấn mạnh với nút học.

    Vàng `accent` mới là màu phần thưởng theo DESIGN.md; để nó mang trạng thái
    "có thể nhận" là đủ nổi mà không cần hét.
  */
  return (
    <button
      onClick={() =>
        checkIn.mutate(undefined, {
          onSuccess: (result) => toast.success(t('Đã nhận {n} xu', { n: result.delta })),
          onError: (error) => toast.error(getErrorMessage(error)),
        })
      }
      disabled={checkIn.isPending}
      className="flex items-center gap-2 rounded-lg border border-accent bg-accent-soft px-3 py-2 text-sm font-medium text-accent-ink transition-colors hover:brightness-95 disabled:opacity-60"
    >
      <Coins className="h-4 w-4 shrink-0" aria-hidden />
      {t('Nhận {n} xu hôm nay', { n: reward })}
    </button>
  );
}

/**
 * Kho vật phẩm giữ chuỗi và nút mua.
 *
 * Nút mua bị khoá thì luôn kèm lý do trong `title` — nút xám không giải thích là kiểu
 * giao diện khiến người dùng bấm đi bấm lại rồi tưởng hỏng.
 */
function FreezeControl({
  freeze,
  coins,
}: {
  freeze: RewardsSummary['freeze'];
  coins: number;
}): JSX.Element {
  const t = useT();
  const buy = useBuyStreakFreeze();
  const toast = useToast();

  const isFull = freeze.available >= freeze.max;
  const isBroke = coins < freeze.price;
  const reason = isFull
    ? t('Kho tối đa {n} vật phẩm', { n: freeze.max })
    : isBroke
      ? t('Cần {price} xu, bạn có {coins}', { price: freeze.price, coins })
      : t('Mua 1 vật phẩm với {price} xu', { price: freeze.price });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-1.5">
      <span className="flex items-center gap-2">
        <Snowflake className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        <span>
          <span className="block text-xs leading-tight text-content-muted">{t('Giữ chuỗi')}</span>
          <span className="block text-sm font-bold tabular-nums leading-tight text-content">
            {freeze.available}
          </span>
        </span>
      </span>

      <Button
        size="sm"
        variant="secondary"
        icon={ShoppingCart}
        title={reason}
        disabled={isFull || isBroke}
        loading={buy.isPending}
        onClick={() =>
          buy.mutate(undefined, {
            onSuccess: () => toast.success(t('Đã mua 1 vật phẩm giữ chuỗi')),
            onError: (error) => toast.error(getErrorMessage(error)),
          })
        }
      >
        {t('Mua')}
      </Button>
    </div>
  );
}

function MissionRow({ mission }: { mission: MissionState }): JSX.Element {
  const t = useT();
  const claim = useClaimMission();
  const toast = useToast();

  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm text-content-soft">{mission.label}</span>
          <span className="shrink-0 text-xs tabular-nums text-content-muted">
            {mission.progress}/{mission.target}
          </span>
        </span>
        <span className="mt-1 block">
          <ProgressBar
            percent={(mission.progress / mission.target) * 100}
            done={mission.isCompleted}
          />
        </span>
      </span>

      {mission.isClaimed ? (
        <span className="flex w-[86px] shrink-0 items-center justify-center gap-1 text-xs font-medium text-success">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t('Đã nhận')}
        </span>
      ) : (
        <span className="w-[86px] shrink-0">
          <Button
            size="sm"
            className="w-full"
            disabled={!mission.isCompleted}
            loading={claim.isPending && claim.variables?.missionId === mission.id}
            title={
              mission.isCompleted
                ? t('Nhận {n} xu', { n: mission.reward })
                : t('Hoàn thành nhiệm vụ để nhận thưởng')
            }
            onClick={() =>
              claim.mutate(
                { missionId: mission.id },
                {
                  onSuccess: (result) => toast.success(t('Đã nhận {n} xu', { n: result.delta })),
                  onError: (error) => toast.error(getErrorMessage(error)),
                },
              )
            }
          >
            {t('+{n} xu', { n: mission.reward })}
          </Button>
        </span>
      )}
    </div>
  );
}
