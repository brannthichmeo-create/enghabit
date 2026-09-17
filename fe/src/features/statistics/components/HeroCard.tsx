import { Flame, Sparkles, Target, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LevelSummary, StreakSummary } from '@enghabit/shared';
import { ErrorState, Skeleton } from '../../../shared/components/ui';
import { EquippedMascot } from '../../shop/components/EquippedMascot';
import { useT } from '../../../shared/i18n/language';

/**
 * Thẻ mở đầu trang tổng quan: chuỗi ngày là điểm nhìn chính, kèm cấp độ và một lối
 * vào việc học.
 *
 * Trước đây thẻ này gánh năm việc cùng lúc (chuỗi, cấp độ, ba ô số liệu, dải phần
 * thưởng, hai nút hành động) nên không có gì nổi lên. Nay rút còn ba:
 *
 *  - Hai ô số liệu theo khoảng ("ngày có học", "tổng hoạt động") đã chuyển sang thẻ
 *    biểu đồ, vì chúng được tính từ đúng khoảng mà biểu đồ đang vẽ. Để ở đây thì phải
 *    lặp lại nhãn khoảng thời gian, mà người đọc vẫn dễ tưởng là số của cả hành trình.
 *  - Chỉ còn MỘT nút chính. Hai lối vào ôn tập chuyển sang thẻ "Việc hôm nay", nơi
 *    chúng đi kèm số việc còn tồn — trước đây hai bộ nút cùng dẫn tới hai trang đó
 *    nằm chồng lên nhau trên cùng màn hình.
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
  /** Dải phần thưởng (điểm danh, nhiệm vụ, vật phẩm giữ chuỗi). */
  children?: ReactNode;
}): JSX.Element {
  const t = useT();

  if (loading) return <Skeleton className="h-[268px] w-full" />;

  /*
    Hỏng thì nói hỏng, KHÔNG để nguyên khung xám.

    Trước đây mọi trường hợp thiếu dữ liệu đều trả `Skeleton`, nên khi API chuỗi/cấp độ
    lỗi thì thẻ này nhấp nháy vĩnh viễn — và vì dải phần thưởng là `children` của nó,
    cả phần điểm danh cũng biến mất theo dù API phần thưởng vẫn chạy tốt.

    Nay dải thưởng vẫn được vẽ: một API hỏng không được kéo theo phần còn lại.
  */
  if (errorMessage || !streak || !level) {
    return (
      <section className="flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <ErrorState message={errorMessage ?? t('Không tải được chuỗi ngày và cấp độ')} onRetry={onRetry} />
        {children}
      </section>
    );
  }

  const alive = streak.isAlive;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        {/* Chuỗi ngày — điểm nhìn chính, cỡ chữ lớn hẳn so với mọi số khác trên trang */}
        <div className="flex items-center gap-4">
          <span
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 ${
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
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-content-muted">
              <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('Kỷ lục {n} ngày', { n: streak.longestStreak })}
            </p>

            {/*
              Nói rõ hôm nay đã tính hay chưa. Chỉ hiện con số chuỗi thì người dùng
              không biết mình còn phải làm gì hôm nay — và dễ tưởng nút nhận xu bên
              dưới đã lo phần đó.
            */}
            <p className={`mt-1 text-xs font-medium ${alive ? 'text-success' : 'text-accent-ink'}`}>
              {alive
                ? t('Hôm nay đã được tính')
                : t('Hôm nay chưa được tính — học một bài để giữ chuỗi')}
            </p>
          </div>

          {/*
            Linh vật người học đang chọn dùng. Tự trả null khi chưa chọn, chưa tải xong
            hoặc tính năng Cửa hàng đang tắt — thẻ này phải nguyên vẹn trong cả ba
            trường hợp đó, nên không chừa sẵn khoảng trống cho nó.
          */}
          <EquippedMascot size="lg" />
        </div>

        {/* Cấp độ — thông tin phụ nên nằm dưới, không tranh chỗ với chuỗi ngày */}
        <div className="border-t border-line pt-4">
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
        </div>

        <Link
          to="/learn"
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong hover:text-on-fill"
        >
          <Target className="h-4 w-4" aria-hidden />
          {alive ? t('HỌC ĐỂ GIỮ CHUỖI') : t('HỌC NGAY HÔM NAY')}
        </Link>
      </div>

      {/* Dải phần thưởng đặt trên nền chìm để tách khỏi phần số liệu phía trên */}
      {children && <div className="border-t border-line bg-sunken p-4">{children}</div>}
    </section>
  );
}
