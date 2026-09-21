import { Flame, Sparkles, Target, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LevelSummary, StreakSummary } from '@enghabit/shared';
import { ErrorState, Skeleton } from '../../../shared/components/ui';
import { EquippedMascot } from '../../shop/components/EquippedMascot';
import { useT } from '../../../shared/i18n/language';

/**
 * Thẻ mở đầu trang tổng quan: một DẢI ngang — chuỗi ngày bên trái, cấp độ và nút học
 * bên phải, vật phẩm giữ chuỗi ở đáy.
 *
 * Trước đây thẻ này xếp dọc và gánh cả dải phần thưởng (điểm danh, nhiệm vụ, câu giải
 * thích), cao gần 400px, và thẻ bên cạnh phải kéo giãn theo cho bằng — thành một khoảng
 * trống lớn. Nay:
 *
 *  - Điểm danh và nhiệm vụ chuyển sang danh sách "Việc hôm nay", cạnh ôn tập và thói
 *    quen — cùng là "hôm nay còn gì để làm".
 *  - Chỉ vật phẩm giữ chuỗi ở lại (`children`), vì nó chỉ có nghĩa với chuỗi ngày.
 *  - Chuỗi ngày vẫn là số lớn nhất trang và là thứ duy nhất ở cỡ đó (DESIGN.md: The One
 *    Big Thing Rule); cấp độ đứng cạnh nhưng nhỏ hơn hẳn.
 */
export function HeroCard({
  streak,
  level,
  loading,
  errorMessage,
  onRetry,
  children,
}: {
  streak?: StreakSummary;
  level?: LevelSummary;
  loading: boolean;
  /** Lời giải thích khi không tải được chuỗi/cấp độ. Có giá trị nghĩa là đã hỏng. */
  errorMessage?: string;
  onRetry?: () => void;
  /** Dải đáy thẻ — vật phẩm giữ chuỗi. Tự vẽ đường kẻ và nền của mình. */
  children?: ReactNode;
}): JSX.Element {
  const t = useT();

  if (loading) return <Skeleton className="h-[184px] w-full rounded-2xl" />;

  /*
    Hỏng thì nói hỏng, KHÔNG để nguyên khung xám — và dải đáy vẫn được vẽ: một API hỏng
    không được kéo theo phần còn lại.
  */
  if (errorMessage || !streak || !level) {
    return (
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="p-5 sm:p-6">
          <ErrorState message={errorMessage ?? t('Không tải được chuỗi ngày và cấp độ')} onRetry={onRetry} />
        </div>
        {children}
      </section>
    );
  }

  const alive = streak.isAlive;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-8">
        {/* Chuỗi ngày — điểm nhìn chính, cỡ chữ lớn hẳn so với mọi số khác trên trang */}
        <div className="flex items-center gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 ${
              alive ? 'border-accent bg-accent/15' : 'border-line bg-sunken'
            }`}
          >
            <Flame
              className={`h-7 w-7 ${alive ? 'animate-pulse-soft text-accent' : 'text-content-muted'}`}
              aria-hidden
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-content-muted">{t('Chuỗi hiện tại')}</p>
            <p className="text-4xl font-bold leading-none tabular-nums text-content">
              {streak.currentStreak}
              <span className="ml-2 text-base font-medium text-content-muted">{t('ngày')}</span>
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1 text-content-muted">
                <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('Kỷ lục {n} ngày', { n: streak.longestStreak })}
              </span>
              {/*
                Nói rõ hôm nay đã tính hay chưa. Chỉ hiện con số chuỗi thì người dùng
                không biết mình còn phải làm gì hôm nay.
              */}
              <span className={`font-medium ${alive ? 'text-success' : 'text-accent-ink'}`}>
                {alive
                  ? t('Hôm nay đã được tính')
                  : t('Hôm nay chưa được tính — học một bài để giữ chuỗi')}
              </span>
            </p>
          </div>

          {/*
            Linh vật người học đang chọn dùng. Tự trả null khi chưa chọn, chưa tải xong
            hoặc tính năng Cửa hàng đang tắt — dải này nguyên vẹn trong cả ba trường hợp
            đó, nên không chừa sẵn khoảng trống cho nó.
          */}
          <EquippedMascot size="md" />
        </div>

        {/*
          Cấp độ và nút học. Trên màn hẹp xếp xuống dưới chuỗi, ngăn bằng đường kẻ ngang;
          màn rộng thì đứng bên phải, ngăn bằng đường kẻ dọc.
        */}
        <div className="border-t border-line pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm text-content-soft">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-strong" aria-hidden />
              {t('Cấp {n}', { n: level.level })}
            </p>
            <span className="text-sm font-semibold tabular-nums text-content-muted">
              {t('{n} XP', { n: level.xp })}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs text-content-muted">
            {t('Còn {n} XP nữa để lên cấp {level}', {
              n: level.xpToNextLevel,
              level: level.level + 1,
            })}
          </p>

          <Link
            to="/learn"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong hover:text-on-fill"
          >
            <Target className="h-4 w-4" aria-hidden />
            {alive ? t('HỌC ĐỂ GIỮ CHUỖI') : t('HỌC NGAY HÔM NAY')}
          </Link>
        </div>
      </div>

      {children}
    </section>
  );
}
