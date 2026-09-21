import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ChevronRight, Layers, Target } from 'lucide-react';
import { FeatureKey, type GoalProgress, type StatsRangeInput } from '@enghabit/shared';
import { ActivityChart } from '../../../shared/components/ActivityChart';
import { HeroCard } from './HeroCard';
import { RewardsBar } from '../../rewards/components/RewardsBar';
import { ActivityCalendarChart } from '../../../shared/components/ActivityCalendar';
import { Card, ErrorState, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { goalName } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useGoalProgress } from '../../goals/goal.hooks';
import { useDueCount } from '../../study/study.hooks';
import { useFeatureFlags, useFeatureQueryEnabled } from '../../feature-flags/feature-flag.hooks';
import { useActivityCalendar, useLevel, useStatsSummary, useStreak } from '../statistics.hooks';
import { useT } from '../../../shared/i18n/language';

/**
 * Trang tổng quan của người học.
 *
 * Bố cục theo lưới 3 cột thay vì xếp dọc sáu thẻ như trước. Bản cũ khiến mọi thứ đòi
 * chú ý ngang nhau và phải cuộn rất dài; ba thay đổi chính:
 *
 *  1. **Một điểm nhìn duy nhất.** Chuỗi ngày là số lớn nhất trang, mọi thứ khác nhỏ hơn hẳn.
 *  2. **Bỏ trùng lặp.** Trước đây có hai bộ nút cùng dẫn tới /learn và /flashcards nằm
 *     chồng nhau. Nay thẻ mở đầu giữ một nút chính, còn hai lối vào ôn tập nằm ở thẻ
 *     "Việc hôm nay" kèm số việc còn tồn — chúng chỉ đáng bấm khi thật sự còn việc.
 *  3. **Số liệu nằm cạnh thứ nó mô tả.** Tỷ lệ ngày học và tổng hoạt động chuyển vào
 *     đầu thẻ biểu đồ, vì cả ba đều tính từ đúng khoảng thời gian đang chọn.
 */

const RANGE_LABELS: Record<StatsRangeInput['range'], string> = {
  day: '7 ngày',
  week: 'Tuần này',
  month: 'Tháng này',
};

/**
 * Mặc định 3 tháng chứ không phải cả năm: dải một năm phải cuộn ngang mới xem hết,
 * mà phần người học quan tâm gần như luôn là quãng gần đây.
 */
const CALENDAR_RANGES = [
  { months: 3, label: '90 ngày' },
  { months: 12, label: '12 tháng' },
] as const;

export function DashboardPage(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const [range, setRange] = useState<StatsRangeInput['range']>('week');
  const [calendarMonths, setCalendarMonths] = useState<number>(CALENDAR_RANGES[0].months);

  const summary = useStatsSummary(range);
  const streak = useStreak();
  /*
    Cấp độ lấy từ endpoint RIÊNG chứ không từ `summary`, dù `summary` cũng từng trả nó.

    Khoá cache của `useStatsSummary` có chứa `range`, nên mỗi lần người dùng đổi bộ lọc
    thời gian là `summary.data` về undefined trong lúc tải lại — cấp độ sẽ chớp tắt theo
    bộ lọc dù con số không hề đổi. `useLevel` không có `range` trong khoá nên đứng yên.

    Không tốn thêm request: sidebar đã gọi `useLevel` ở mọi trang nên dữ liệu có sẵn
    trong cache của TanStack Query.
  */
  const level = useLevel();

  /*
    Quản trị viên tắt được từng tính năng (xem /admin/features). Ở đây phải lọc theo cờ
    chứ không chỉ ẩn khối: gọi API của tính năng đã tắt chỉ nhận về 404, vừa tốn request
    vừa làm khối đó hiện ra thông báo lỗi đỏ giữa trang chủ.
  */
  const flags = useFeatureFlags();
  const reviewEnabled = flags[FeatureKey.FLASHCARDS];
  const goalsEnabled = flags[FeatureKey.GOALS];
  const rewardsEnabled = flags[FeatureKey.REWARDS];

  // Hiển thị dùng cờ lạc quan ở trên; REQUEST thì chờ biết chắc, nếu không mỗi lần mở
  // trang chủ sẽ có một 404 cho tính năng đang tắt.
  const goalProgress = useGoalProgress(useFeatureQueryEnabled(FeatureKey.GOALS));
  const dueCount = useDueCount(useFeatureQueryEnabled(FeatureKey.FLASHCARDS));
  const calendar = useActivityCalendar(calendarMonths);

  const totalActivities = summary.data
    ? Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-page">
          {t('Xin chào, {name}', { name: user?.name ?? t('bạn') })}
        </h1>
        <p className="mt-1 text-sm text-on-page-muted">{t('Cùng xem tiến độ học tập của bạn hôm nay')}</p>
      </div>

      {/*
        Hàng 1 — thẻ mở đầu chiếm 2/3, việc cần làm 1/3.

        Tắt Ôn tập thì thẻ "Việc hôm nay" biến mất và thẻ mở đầu chiếm trọn hàng: một ô
        trống cạnh nó chỉ làm trang trông như đang hỏng.
      */}
      <div className={`grid gap-4 ${reviewEnabled ? 'lg:grid-cols-3' : ''}`}>
        <div className={reviewEnabled ? 'lg:col-span-2' : ''}>
          <HeroCard
            streak={streak.data}
            level={level.data}
            loading={streak.isLoading || level.isLoading}
            errorMessage={
              streak.isError || level.isError
                ? getErrorMessage(streak.error ?? level.error)
                : undefined
            }
            onRetry={() => {
              void streak.refetch();
              void level.refetch();
            }}
          >
            {rewardsEnabled && <RewardsBar />}
          </HeroCard>
        </div>

        {reviewEnabled && (
          <TodayCard
            dueCount={dueCount.data}
            loading={dueCount.isLoading}
            errorMessage={dueCount.isError ? getErrorMessage(dueCount.error) : undefined}
            onRetry={() => {
              void dueCount.refetch();
            }}
          />
        )}
      </div>

      {/* Hàng 2 — biểu đồ chiếm 2/3, mục tiêu 1/3. Tắt Mục tiêu thì biểu đồ chiếm cả hàng. */}
      <div className={`grid gap-4 ${goalsEnabled ? 'lg:grid-cols-3' : ''}`}>
        <div className={goalsEnabled ? 'lg:col-span-2' : ''}>
          <Card className="h-full">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-content">{t('Hoạt động theo ngày')}</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-content-muted">
                  {summary.data ? (
                    <>
                      <span>
                        {t('{n}% ngày có học', { n: summary.data.activeDayRate })}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{t('{n} hoạt động', { n: totalActivities ?? 0 })}</span>
                    </>
                  ) : (
                    <span>{t('Đang tải…')}</span>
                  )}
                </p>
              </div>

              <div
                className="flex gap-0.5 rounded-lg bg-sunken p-0.5"
                role="tablist"
                aria-label={t('Khoảng thời gian')}
              >
                {(Object.keys(RANGE_LABELS) as StatsRangeInput['range'][]).map((key) => (
                  <RangeTab
                    key={key}
                    label={t(RANGE_LABELS[key])}
                    active={range === key}
                    onClick={() => setRange(key)}
                  />
                ))}
              </div>
            </div>

            {summary.isLoading && <Skeleton className="h-[248px] w-full" />}
            {summary.isError && (
              <ErrorState message={getErrorMessage(summary.error)} onRetry={() => void summary.refetch()} />
            )}
            {summary.data && <ActivityChart data={summary.data.daily} />}
          </Card>
        </div>

        {goalsEnabled && (
          <GoalCard
            goals={goalProgress.data}
            loading={goalProgress.isLoading}
            errorMessage={goalProgress.isError ? getErrorMessage(goalProgress.error) : undefined}
            onRetry={() => void goalProgress.refetch()}
          />
        )}
      </div>

      {/* Hàng 3 — lịch học trải hết chiều ngang vì nó là một dải dài theo thời gian */}
      <Card>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-content">
              {calendarMonths === 3 ? t('90 ngày gần đây') : t('Lịch học cả năm')}
            </h2>
            <p className="text-sm text-content-muted">
              {t('Bấm vào một ngày để xem hôm đó bạn đã học gì. Ô càng đậm là học càng nhiều.')}
            </p>
          </div>

          <div className="flex gap-0.5 rounded-lg bg-sunken p-0.5" role="tablist" aria-label={t('Phạm vi lịch')}>
            {CALENDAR_RANGES.map((option) => (
              <RangeTab
                key={option.months}
                label={t(option.label)}
                active={calendarMonths === option.months}
                onClick={() => setCalendarMonths(option.months)}
              />
            ))}
          </div>
        </div>

        {calendar.isLoading && <Skeleton className="h-[150px] w-full" />}
        {calendar.isError && (
          <ErrorState message={getErrorMessage(calendar.error)} onRetry={() => void calendar.refetch()} />
        )}
        {calendar.data && <ActivityCalendarChart data={calendar.data} />}
      </Card>
    </div>
  );
}

function RangeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-surface text-content shadow-sm' : 'text-content-muted hover:text-content-soft'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Việc còn tồn hôm nay.
 *
 * Xếp dọc chứ không nằm ngang như bản cũ: cột này hẹp, mà quan trọng hơn là mỗi dòng
 * luôn kèm SỐ việc còn lại. Hết việc thì dòng đó chuyển sang trạng thái đã xong thay
 * vì biến mất — biến mất khiến người dùng tưởng mình bỏ sót mục nào đó.
 */
function TodayCard({
  dueCount,
  loading,
  errorMessage,
  onRetry,
}: {
  dueCount?: number;
  loading: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}): JSX.Element {
  const t = useT();

  /*
    "Xong hết" chỉ được nói khi số đã về thật và bằng 0.

    Trước đây `done` tính từ `(count ?? 0) === 0`, nên lúc đang tải và cả lúc API hỏng
    (hai trường hợp `count` là `undefined`) thẻ đều tuyên bố "Bạn đã xong hết phần cần
    ôn" — nói với người dùng rằng họ không còn gì để học trong khi hệ thống không hề
    biết. Với một app xây thói quen thì đó là lỗi nặng hơn cả việc im lặng.

    Số việc là thẻ cần ôn hôm nay: tới hạn cộng quá hạn, trên mọi bộ người học còn
    truy cập được.
  */
  const known = dueCount !== undefined;
  const done = known && dueCount === 0;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        <h2 className="font-semibold text-content">{t('Việc hôm nay')}</h2>
      </div>

      <p className="mt-0.5 text-sm text-content-muted">
        {!known ? t('Đang xem bạn còn việc gì…') : done ? t('Bạn đã xong hết phần cần ôn.') : t('Làm tiếp từ chỗ đang dở.')}
      </p>

      {errorMessage && (
        <div className="mt-4">
          <ErrorState message={errorMessage} onRetry={onRetry} />
        </div>
      )}

      {loading && !errorMessage && (
        <div className="mt-4">
          <Skeleton className="h-[62px] w-full" />
        </div>
      )}

      <div className={`mt-4 space-y-2 ${loading || errorMessage ? 'hidden' : ''}`}>
        <TaskRow
          to="/review"
          icon={Layers}
          title={t('Ôn tập')}
          count={dueCount}
          pending={t('{n} thẻ cần ôn', { n: dueCount ?? 0 })}
          cleared={t('Đã ôn hết hôm nay')}
        />
      </div>
    </Card>
  );
}

/** Một việc cần làm. Còn việc thì nổi bật bằng viền màu nhấn, xong rồi thì lặng đi. */
function TaskRow({
  to,
  icon: Icon,
  title,
  count,
  pending,
  cleared,
}: {
  to: string;
  icon: typeof Layers;
  title: string;
  count?: number;
  pending: string;
  cleared: string;
}): JSX.Element {
  const has = (count ?? 0) > 0;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        has ? 'border-brand/40 bg-brand-soft hover:bg-brand/15' : 'border-line hover:bg-sunken'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          has ? 'bg-brand text-on-brand' : 'bg-sunken text-content-muted'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-content">{title}</span>
        <span className={`block text-xs ${has ? 'text-brand-strong' : 'text-content-muted'}`}>
          {has ? pending : cleared}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden />
    </Link>
  );
}

/** Tiến độ mục tiêu trong kỳ hiện tại. Không có mục tiêu thì mời đặt, không để trống. */
function GoalCard({
  goals,
  loading,
  errorMessage,
  onRetry,
}: {
  goals?: GoalProgress[];
  loading: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}): JSX.Element {
  const t = useT();

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-content">
          <Target className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
          {t('Tiến độ mục tiêu')}
        </h2>
        <Link to="/goals" className="text-xs font-medium text-brand-strong hover:underline">
          {t('Quản lý')}
        </Link>
      </div>

      {loading && <Skeleton className="mt-4 h-24 w-full" />}

      {/* Lỗi đi TRƯỚC trạng thái rỗng: người có 5 mục tiêu mà request rớt thì trước đây
          bị báo "Bạn chưa đặt mục tiêu nào" — sai sự thật, và còn mời họ đặt lại. */}
      {!loading && errorMessage && (
        <div className="mt-4">
          <ErrorState message={errorMessage} onRetry={onRetry} />
        </div>
      )}

      {!loading && !errorMessage && (!goals || goals.length === 0) && (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line px-4 py-6 text-center">
          <p className="text-sm text-content-soft">{t('Bạn chưa đặt mục tiêu nào')}</p>
          <Link to="/goals" className="mt-1 text-xs font-medium text-brand-strong hover:underline">
            {t('Đặt mục tiêu đầu tiên')}
          </Link>
        </div>
      )}

      {goals && goals.length > 0 && (
        <ul className="mt-4 space-y-3.5">
          {goals.map((goal) => (
            <li key={goal.goalId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-content-soft">{t(goalName(goal.type, goal.period))}</span>
                <span
                  className={`shrink-0 text-xs tabular-nums ${
                    goal.isCompleted ? 'font-semibold text-success' : 'text-content-muted'
                  }`}
                >
                  {goal.currentValue}/{goal.targetValue}
                </span>
              </div>
              <ProgressBar
                percent={goal.completionRate}
                done={goal.isCompleted}
                label={t(goalName(goal.type, goal.period))}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
