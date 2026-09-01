import { CalendarCheck, Flame, Layers, Snowflake, Sparkles, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LevelSummary, StreakSummary } from '@enghabit/shared';
import { Skeleton } from '../../../shared/components/ui';

/**
 * Thẻ tổng hợp đầu trang: chuỗi ngày, cấp độ, vài con số theo dõi và việc cần làm hôm nay.
 *
 * Gộp hết vào một thẻ thay vì rải thành nhiều ô rời rạc, vì chúng trả lời cùng một câu
 * hỏi: "tôi đang ở đâu và hôm nay phải làm gì". Đặt hành động ngay cạnh số liệu
 * để người học không phải đi tìm nút bắt đầu.
 *
 * Ba con số theo dõi nằm thành một dải mảnh giữa thẻ (trước đây là ba thẻ riêng chiếm
 * trọn một hàng): chúng là số để liếc nhìn, không phải thứ cần nhấn mạnh bằng ba khung.
 */
export function HeroCard({
  streak,
  level,
  dueCount,
  activeDayRate,
  totalActivities,
  rangeLabel,
  loading,
  children,
}: {
  streak?: StreakSummary;
  level?: LevelSummary;
  dueCount?: number;
  /** Tỷ lệ ngày có học trong khoảng đang chọn ở biểu đồ bên dưới (%). */
  activeDayRate?: number;
  totalActivities?: number | null;
  /**
   * Nhãn khoảng thời gian của hai số trên ("7 ngày", "Tuần này"...).
   * Bắt buộc hiển thị: hai số đó đổi theo tab ở biểu đồ phía dưới, không ghi rõ
   * khoảng thì người đọc tưởng là số của cả hành trình.
   */
  rangeLabel?: string;
  loading: boolean;
  /** Hàng phần thưởng (điểm danh, nhiệm vụ, streak freeze) — chèn phía trên hai nút chính. */
  children?: ReactNode;
}): JSX.Element {
  if (loading || !streak || !level) return <Skeleton className="h-[188px] w-full" />;

  const alive = streak.isAlive;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        {/* Chuỗi ngày */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 ${
              alive ? 'border-accent bg-accent/15' : 'border-line bg-sunken'
            }`}
          >
            <Flame
              className={`h-7 w-7 ${alive ? 'animate-pulse-soft text-accent' : 'text-content-muted'}`}
              aria-hidden
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm text-content-muted">Chuỗi hiện tại</p>
            <p className="text-3xl font-bold tabular-nums text-content">
              {streak.currentStreak}
              <span className="ml-1.5 text-base font-medium text-content-muted">ngày</span>
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              {alive ? 'Học hôm nay để giữ chuỗi' : 'Học hôm nay để bắt đầu lại'}
            </p>
          </div>
        </div>

        {/* Cấp độ và XP */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-brand bg-brand-soft">
            <span className="text-2xl font-bold tabular-nums text-brand-strong">{level.level}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm text-content-muted">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Lên cấp {level.level + 1}
              </p>
              <span className="text-sm font-semibold tabular-nums text-content">{level.xp} XP</span>
            </div>

            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${level.progressPercent}%` }}
              />
            </div>

            <p className="mt-1 text-xs text-content-muted">
              Còn {level.xpToNextLevel} XP nữa
            </p>
          </div>
        </div>
      </div>

      {/* Dải ba con số theo dõi — chỉ để liếc, nên mảnh và không có khung riêng */}
      <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
        <MiniStat
          icon={CalendarCheck}
          label="Ngày có học"
          hint={rangeLabel}
          value={activeDayRate === undefined ? null : `${activeDayRate}%`}
        />
        <MiniStat
          icon={Layers}
          label="Tổng hoạt động"
          hint={rangeLabel}
          value={totalActivities === undefined || totalActivities === null ? null : `${totalActivities}`}
        />
        <MiniStat icon={Target} label="Kỷ lục chuỗi" hint="Từ trước tới nay" value={`${streak.longestStreak} ngày`} />
      </div>

      {/* Hàng hành động — đặt trên nền chìm để tách khỏi phần số liệu */}
      <div className="space-y-2 border-t border-line bg-sunken p-4">
        {children}

        <div className="flex flex-wrap gap-2">
          <Link
            to="/learn"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-strong"
          >
            <Target className="h-4 w-4" aria-hidden />
            HỌC NGAY HÔM NAY
          </Link>

          <Link
            to="/flashcards"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-accent/50 px-4 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/10"
          >
            <Snowflake className="h-4 w-4" aria-hidden />
            ÔN TẬP
            {dueCount !== undefined && dueCount > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] leading-none text-on-brand">
                {dueCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Một ô trong dải số liệu. `value === null` nghĩa là đang tải. */
function MiniStat({
  icon: Icon,
  label,
  hint,
  value,
}: {
  icon: typeof Target;
  label: string;
  hint?: string;
  value: string | null;
}): JSX.Element {
  return (
    <div className="px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-content-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      {value === null ? (
        <Skeleton className="mt-1 h-6 w-16" />
      ) : (
        <p className="mt-0.5 text-lg font-bold tabular-nums text-content">{value}</p>
      )}
      {hint && <p className="text-[11px] text-content-muted">{hint}</p>}
    </div>
  );
}
