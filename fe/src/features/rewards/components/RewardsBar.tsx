import { useState } from 'react';
import { Check, Coins, ShoppingCart, Snowflake, Target } from 'lucide-react';
import type { MissionState, RewardsSummary } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useBuyStreakFreeze, useCheckIn, useClaimMission, useRewards } from '../rewards.hooks';

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
          className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
            claimable
              ? 'border-accent bg-accent-soft text-accent-ink'
              : 'border-line text-content-soft hover:bg-hover'
          }`}
        >
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          NHIỆM VỤ
          <span className="tabular-nums">
            {claimedCount}/{missions.length}
          </span>
        </button>

        <FreezeControl freeze={freeze} coins={rewards.data.coins} />
      </div>

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
  const checkIn = useCheckIn();
  const toast = useToast();

  if (claimed) {
    return (
      <span className="flex items-center gap-2 rounded-xl border-2 border-success/40 bg-success-soft px-4 py-3 text-sm font-semibold text-success">
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        ĐÃ ĐIỂM DANH HÔM NAY
      </span>
    );
  }

  return (
    <button
      onClick={() =>
        checkIn.mutate(undefined, {
          onSuccess: (result) => toast.success(`Đã nhận ${result.delta} xu`),
          onError: (error) => toast.error(getErrorMessage(error)),
        })
      }
      disabled={checkIn.isPending}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong disabled:opacity-60"
    >
      <Coins className="h-4 w-4 shrink-0" aria-hidden />
      ĐIỂM DANH · NHẬN {reward} XU
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
  const buy = useBuyStreakFreeze();
  const toast = useToast();

  const isFull = freeze.available >= freeze.max;
  const isBroke = coins < freeze.price;
  const reason = isFull
    ? `Kho tối đa ${freeze.max} vật phẩm`
    : isBroke
      ? `Cần ${freeze.price} xu, bạn có ${coins}`
      : `Mua 1 vật phẩm với ${freeze.price} xu`;

  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-line px-4 py-2">
      <span className="flex items-center gap-2">
        <Snowflake className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        <span>
          <span className="block text-[11px] leading-tight text-content-muted">Giữ chuỗi</span>
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
            onSuccess: () => toast.success('Đã mua 1 vật phẩm giữ chuỗi'),
            onError: (error) => toast.error(getErrorMessage(error)),
          })
        }
      >
        MUA
      </Button>
    </div>
  );
}

function MissionRow({ mission }: { mission: MissionState }): JSX.Element {
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
          Đã nhận
        </span>
      ) : (
        <span className="w-[86px] shrink-0">
          <Button
            size="sm"
            className="w-full"
            disabled={!mission.isCompleted}
            loading={claim.isPending && claim.variables?.missionId === mission.id}
            title={mission.isCompleted ? `Nhận ${mission.reward} xu` : 'Hoàn thành nhiệm vụ để nhận thưởng'}
            onClick={() =>
              claim.mutate(
                { missionId: mission.id },
                {
                  onSuccess: (result) => toast.success(`Đã nhận ${result.delta} xu`),
                  onError: (error) => toast.error(getErrorMessage(error)),
                },
              )
            }
          >
            +{mission.reward} xu
          </Button>
        </span>
      )}
    </div>
  );
}
