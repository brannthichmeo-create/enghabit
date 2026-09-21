import { useId, useState } from 'react';
import { Check, ChevronDown, Coins, ShoppingCart, Snowflake, Target } from 'lucide-react';
import type { MissionState, RewardsSummary } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { StatusRow } from '../../../shared/components/StatusRow';
import { useToast } from '../../../shared/components/Toast';
import { useBuyStreakFreeze, useCheckIn, useClaimMission, useRewards } from '../rewards.hooks';
import { useT } from '../../../shared/i18n/language';

/**
 * Phần thưởng trên trang Tổng quan, tách làm hai mảnh đặt ở hai chỗ khác nhau:
 *
 *  - `DailyRewardRows`: điểm danh và nhiệm vụ ngày — hai dòng trong danh sách "Việc hôm
 *    nay", cạnh ôn tập và thói quen. Cùng trả lời "hôm nay còn gì để làm", nên nằm chung
 *    một danh sách thay vì một dải nút riêng.
 *  - `StreakFreezeStrip`: vật phẩm giữ chuỗi — nằm dưới đáy thẻ chuỗi ngày, vì nó chỉ có
 *    nghĩa với chuỗi ngày.
 *
 * Hai mảnh đọc chung một truy vấn `useRewards`, nên vẫn chỉ tốn một request.
 */

/**
 * Hai dòng điểm danh và nhiệm vụ. Trả về các `<li>` để nằm thẳng trong danh sách của
 * chỗ gọi — bọc thêm một `<ul>` thì đường kẻ giữa các dòng bị đứt đúng chỗ nối.
 */
export function DailyRewardRows(): JSX.Element | null {
  const rewards = useRewards();

  if (rewards.isLoading) {
    return (
      <li className="py-2.5">
        <Skeleton className="h-9 w-full" />
      </li>
    );
  }
  // Lỗi ở khu phần thưởng không được che mất phần học tập — im lặng bỏ qua là đúng.
  if (!rewards.data) return null;

  return (
    <>
      <li>
        <CheckInRow claimed={rewards.data.checkIn.claimedToday} reward={rewards.data.checkIn.reward} />
      </li>
      <li>
        <MissionsRow missions={rewards.data.missions} />
      </li>
    </>
  );
}

function CheckInRow({ claimed, reward }: { claimed: boolean; reward: number }): JSX.Element {
  const t = useT();
  const checkIn = useCheckIn();
  const toast = useToast();

  if (claimed) {
    return <StatusRow icon={Coins} title={t('Điểm danh')} status={t('Đã nhận xu hôm nay')} tone="done" />;
  }

  return (
    <>
      {/*
        Nút vàng `accent`, KHÔNG dùng `bg-brand`: điểm danh không ghi `ActivityLog`, không
        phải hoạt động học, nên không được mặc đồng phục của nút Học. Vàng là màu phần
        thưởng theo DESIGN.md — đủ nổi mà không tranh nhấn mạnh với việc học.
      */}
      <StatusRow
        icon={Coins}
        title={t('Điểm danh')}
        status={t('Chưa nhận {n} xu hôm nay', { n: reward })}
        tone="reward"
        action={
          <button
            type="button"
            onClick={() =>
              checkIn.mutate(undefined, {
                onSuccess: (result) => toast.success(t('Đã nhận {n} xu', { n: result.delta })),
                onError: (error) => toast.error(getErrorMessage(error)),
              })
            }
            disabled={checkIn.isPending}
            className="rounded-lg border border-accent bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink transition-colors hover:brightness-95 disabled:opacity-60"
          >
            {t('Nhận xu')}
          </button>
        }
      />
      {/*
        Nói thẳng xu và chuỗi là hai thứ khác nhau — người dùng đã từng tưởng bấm nhận xu
        là giữ được chuỗi. Chỉ cần nói lúc còn nút để bấm; nhận rồi thì câu này thành thừa.
      */}
      <p className="-mt-1 pb-2.5 pl-12 text-xs text-content-muted">
        {t('Xu không tính vào chuỗi ngày. Muốn giữ chuỗi, hãy học một bài, ôn thẻ, làm kiểm tra hoặc check-in một thói quen.')}
      </p>
    </>
  );
}

/**
 * Nhiệm vụ ngày. Danh sách mặc định đóng: phần lớn lượt vào chỉ để liếc xem còn nhiệm vụ
 * nào chờ nhận thưởng — con số trên dòng đã trả lời câu đó.
 */
function MissionsRow({ missions }: { missions: MissionState[] }): JSX.Element {
  const t = useT();
  const listId = useId();
  const [open, setOpen] = useState(false);

  const claimed = missions.filter((mission) => mission.isClaimed).length;
  const claimable = missions.some((mission) => mission.isCompleted && !mission.isClaimed);
  const allClaimed = claimed === missions.length;

  return (
    <>
      <StatusRow
        icon={Target}
        title={t('Nhiệm vụ ngày')}
        status={
          claimable
            ? t('Có nhiệm vụ chờ nhận thưởng')
            : t('Đã nhận thưởng {done}/{total}', { done: claimed, total: missions.length })
        }
        tone={claimable ? 'reward' : allClaimed ? 'done' : 'neutral'}
        action={
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={listId}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-content-soft transition-colors hover:bg-sunken"
          >
            {open ? t('Thu gọn') : t('Xem')}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        }
      />

      {open && (
        <ul id={listId} className="animate-slide-up space-y-3 pb-3 pl-12">
          {missions.map((mission) => (
            <li key={mission.id}>
              <MissionRow mission={mission} />
            </li>
          ))}
        </ul>
      )}
    </>
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
            label={mission.label}
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

/**
 * Dải vật phẩm giữ chuỗi ở đáy thẻ chuỗi ngày. Tự vẽ cả đường kẻ và nền chìm của mình:
 * chưa tải được thì cả dải biến mất, không để lại một dải trống dưới thẻ.
 *
 * Nút mua bị khoá thì luôn kèm lý do trong `title` — nút xám không giải thích là kiểu
 * giao diện khiến người dùng bấm đi bấm lại rồi tưởng hỏng.
 */
export function StreakFreezeStrip(): JSX.Element | null {
  const t = useT();
  const rewards = useRewards();
  const buy = useBuyStreakFreeze();
  const toast = useToast();

  if (!rewards.data) return null;

  const freeze: RewardsSummary['freeze'] = rewards.data.freeze;
  const coins = rewards.data.coins;
  const isFull = freeze.available >= freeze.max;
  const isBroke = coins < freeze.price;
  const reason = isFull
    ? t('Kho tối đa {n} vật phẩm', { n: freeze.max })
    : isBroke
      ? t('Cần {price} xu, bạn có {coins}', { price: freeze.price, coins })
      : t('Mua 1 vật phẩm với {price} xu', { price: freeze.price });

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-sunken px-5 py-3 sm:px-6">
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-content-soft">
        <Snowflake className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        <span className="tabular-nums">{t('Vật phẩm giữ chuỗi: {n}', { n: freeze.available })}</span>
        <span className="text-xs text-content-muted">{t('Tự dùng khi bạn lỡ một ngày.')}</span>
      </p>

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
        {t('Mua · {price} xu', { price: freeze.price })}
      </Button>
    </div>
  );
}
