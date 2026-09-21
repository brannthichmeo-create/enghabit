import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Layers, ListChecks, Target } from 'lucide-react';
import {
  FeatureKey,
  HabitFrequency,
  isHabitPeriodDone,
  isScheduledDay,
  todayLocalDate,
  type GoalProgress,
  type StatsRangeInput,
} from '@enghabit/shared';
import { ActivityChart } from '../../../shared/components/ActivityChart';
import { HeroCard } from './HeroCard';
import { DailyRewardRows, StreakFreezeStrip } from '../../rewards/components/DailyRewards';
import { ActivityCalendarChart } from '../../../shared/components/ActivityCalendar';
import { StatusRow } from '../../../shared/components/StatusRow';
import { Card, ErrorState, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { goalName } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useGoalProgress } from '../../goals/goal.hooks';
import { useHabits } from '../../habits/habit.hooks';
import { useDueCount } from '../../study/study.hooks';
import { useFeatureFlags, useFeatureQueryEnabled } from '../../feature-flags/feature-flag.hooks';
import { useActivityCalendar, useLevel, useStatsSummary, useStreak } from '../statistics.hooks';
import { useT } from '../../../shared/i18n/language';

/**
 * Trang tổng quan của người học.
 *
 * Đọc từ trên xuống theo đúng câu người học mang tới trang này:
 *
 *  1. **Chuỗi của mình còn không?** — dải chuỗi ngày trên cùng, số lớn nhất trang.
 *  2. **Hôm nay còn phải làm gì?** — "Việc hôm nay" gom ôn tập, thói quen, điểm danh và
 *     nhiệm vụ vào MỘT danh sách, đứng cạnh tiến độ mục tiêu. Trước đây bốn việc này nằm
 *     rải ở ba chỗ (thẻ chuỗi ngày, một thẻ chỉ có đúng dòng ôn tập, và thói quen thì
 *     không có mặt), người dùng phải quét cả trang mới biết mình còn sót gì.
 *  3. **Dạo này học ra sao?** — biểu đồ và lịch học, tách xuống nhóm dưới bằng khoảng
 *     cách rộng hơn hẳn, vì đó là phần xem lại chứ không phải phần phải làm.
 *
 * Hai thẻ đứng cạnh nhau cao bằng nhau, và phần ruột của thẻ thấp hơn tự giãn đều để lấp
 * chỗ. Bản trước kéo thẻ "Việc hôm nay" (một dòng) cao bằng thẻ chuỗi ngày mà ruột không
 * giãn theo, thành một khoảng trống lớn dồn xuống đáy; còn để mỗi thẻ cao theo nội dung
 * thì hai đáy lệch nhau.
 */

const RANGE_LABELS: Record<StatsRangeInput['range'], string> = {
  day: '7 ngày',
  week: 'Tuần này',
  month: 'Tháng này',
};

/**
 * Lịch dùng ô vuông trải hết bề ngang thẻ, nên khoảng ngắn nhất là 6 tháng (26 cột tuần,
 * ô khoảng 32px). 90 ngày chỉ có 14 cột: phủ kín thẻ thì mỗi ô rộng hơn 60px và cả lưới
 * cao gần 450px. Mặc định 6 tháng vì phần người học quan tâm gần như luôn là quãng gần đây.
 */
const CALENDAR_RANGES = [
  { months: 6, label: '6 tháng' },
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
  const goalsEnabled = flags[FeatureKey.GOALS];
  const rewardsEnabled = flags[FeatureKey.REWARDS];
  const todayEnabled = flags[FeatureKey.FLASHCARDS] || flags[FeatureKey.HABITS] || rewardsEnabled;

  // Hiển thị dùng cờ lạc quan ở trên; REQUEST thì chờ biết chắc, nếu không mỗi lần mở
  // trang chủ sẽ có một 404 cho tính năng đang tắt.
  const goalProgress = useGoalProgress(useFeatureQueryEnabled(FeatureKey.GOALS));
  const calendar = useActivityCalendar(calendarMonths);

  const totalActivities = summary.data
    ? Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0)
    : null;

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-on-page">
          {t('Xin chào, {name}', { name: user?.name ?? t('bạn') })}
        </h1>
        <p className="mt-1 text-sm text-on-page-muted">{t('Cùng xem tiến độ học tập của bạn hôm nay')}</p>
      </header>

      {/* Nhóm 1 — hôm nay: chuỗi ngày, việc cần làm, mục tiêu */}
      <div className="space-y-4">
        <HeroCard
          streak={streak.data}
          level={level.data}
          loading={streak.isLoading || level.isLoading}
          errorMessage={
            streak.isError || level.isError ? getErrorMessage(streak.error ?? level.error) : undefined
          }
          onRetry={() => {
            void streak.refetch();
            void level.refetch();
          }}
        >
          {rewardsEnabled && <StreakFreezeStrip />}
        </HeroCard>

        {/*
          Hai thẻ cao BẰNG NHAU: đứng cạnh nhau mà lệch đáy thì hàng trông như chưa
          xếp xong. Phần nội dung bên trong mỗi thẻ tự giãn để lấp chiều cao (xem
          `GoalCard`), không để một khoảng trống dồn cả xuống đáy.

          Tắt một trong hai tính năng thì thẻ còn lại chiếm trọn hàng: một ô trống cạnh
          nó chỉ làm trang trông như đang hỏng.
        */}
        {(todayEnabled || goalsEnabled) && (
          <div className={`grid gap-4 ${todayEnabled && goalsEnabled ? 'lg:grid-cols-2' : ''}`}>
            {todayEnabled && <TodayCard />}
            {goalsEnabled && (
              <GoalCard
                goals={goalProgress.data}
                loading={goalProgress.isLoading}
                errorMessage={goalProgress.isError ? getErrorMessage(goalProgress.error) : undefined}
                onRetry={() => void goalProgress.refetch()}
              />
            )}
          </div>
        )}
      </div>

      {/* Nhóm 2 — xem lại: cách nhóm trên rộng hơn hẳn khoảng cách giữa các thẻ trong nhóm */}
      <div className="mt-8 space-y-4">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-content">{t('Hoạt động theo ngày')}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-content-muted">
                {summary.data ? (
                  <>
                    <span>{t('{n}% ngày có học', { n: summary.data.activeDayRate })}</span>
                    <span aria-hidden>·</span>
                    <span>{t('{n} hoạt động', { n: totalActivities ?? 0 })}</span>
                  </>
                ) : (
                  <span>{t('Đang tải…')}</span>
                )}
              </p>
            </div>

            <div className="flex gap-0.5 rounded-lg bg-sunken p-0.5" role="tablist" aria-label={t('Khoảng thời gian')}>
              {(Object.keys(RANGE_LABELS) as StatsRangeInput['range'][]).map((key) => (
                <RangeTab key={key} label={t(RANGE_LABELS[key])} active={range === key} onClick={() => setRange(key)} />
              ))}
            </div>
          </div>

          {summary.isLoading && <Skeleton className="h-[248px] w-full" />}
          {summary.isError && (
            <ErrorState message={getErrorMessage(summary.error)} onRetry={() => void summary.refetch()} />
          )}
          {summary.data && <ActivityChart data={summary.data.daily} />}
        </Card>

        {/* Lịch học trải hết chiều ngang vì nó là một dải dài theo thời gian */}
        <Card>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-content">
                {calendarMonths === 6 ? t('6 tháng gần đây') : t('Lịch học cả năm')}
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
 * Việc hôm nay: một danh sách, mỗi dòng một việc kèm tình trạng bằng chữ.
 *
 * Mỗi dòng luôn còn đó khi việc đã xong — chỉ chuyển sang trạng thái đã xong. Biến mất
 * thì người dùng tưởng mình bỏ sót mục nào đó. Dòng của tính năng đang tắt thì không vẽ.
 */
function TodayCard(): JSX.Element {
  const t = useT();
  const flags = useFeatureFlags();

  return (
    <Card className="h-full">
      <h2 className="flex items-center gap-2 font-semibold text-content">
        <CalendarCheck className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        {t('Việc hôm nay')}
      </h2>

      <ul className="mt-2 divide-y divide-line">
        {flags[FeatureKey.FLASHCARDS] && (
          <li>
            <ReviewRow />
          </li>
        )}
        {flags[FeatureKey.HABITS] && (
          <li>
            <HabitsRow />
          </li>
        )}
        {flags[FeatureKey.REWARDS] && <DailyRewardRows />}
      </ul>
    </Card>
  );
}

/**
 * Số thẻ cần ôn hôm nay: tới hạn cộng quá hạn, trên mọi bộ người học còn truy cập được.
 *
 * "Đã ôn hết" chỉ được nói khi số đã về thật và bằng 0 — lúc đang tải hay lúc API hỏng mà
 * tuyên bố "xong hết" là nói với người học rằng họ không còn gì để học trong khi hệ thống
 * không hề biết. Với một app xây thói quen, đó là lỗi nặng hơn cả việc im lặng.
 */
function ReviewRow(): JSX.Element {
  const t = useT();
  const dueCount = useDueCount(useFeatureQueryEnabled(FeatureKey.FLASHCARDS));
  const count = dueCount.data;

  const [status, tone] =
    count === undefined
      ? [dueCount.isError ? t('Chưa tải được số thẻ cần ôn') : t('Đang tải…'), 'neutral' as const]
      : count > 0
        ? [t('{n} thẻ cần ôn', { n: count }), 'pending' as const]
        : [t('Đã ôn hết hôm nay'), 'done' as const];

  return <StatusRow icon={Layers} title={t('Ôn tập')} status={status} tone={tone} to="/review" />;
}

/**
 * Thói quen hôm nay: bao nhiêu thói quen đến hạn đã xong.
 *
 * "Đến hạn hôm nay" và "đã xong" dùng đúng hai hàm của `shared/habit` mà trang Thói quen
 * và job nhắc nhở dùng — ba chỗ không được đếm lệch nhau. Thói quen hằng tuần luôn tính là
 * đến hạn cho tới khi làm đủ số lần của tuần.
 */
function HabitsRow(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const habits = useHabits(useFeatureQueryEnabled(FeatureKey.HABITS));
  const today = todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh');

  if (!habits.data) {
    return (
      <StatusRow
        icon={ListChecks}
        title={t('Thói quen')}
        status={habits.isError ? t('Chưa tải được thói quen') : t('Đang tải…')}
        to="/habits"
      />
    );
  }

  const active = habits.data.filter((habit) => habit.isActive);
  const due = active.filter((habit) =>
    habit.frequency === HabitFrequency.WEEKLY
      ? true
      : isScheduledDay({ frequency: habit.frequency, customDays: habit.customDays }, today),
  );
  const done = due.filter((habit) =>
    isHabitPeriodDone(
      { frequency: habit.frequency, customDays: habit.customDays, timesPerWeek: habit.timesPerWeek },
      habit.recentDays.filter((day) => day.level !== null).map((day) => day.date),
      today,
    ),
  ).length;

  const [status, tone] =
    active.length === 0
      ? [t('Chưa có thói quen nào'), 'neutral' as const]
      : due.length === 0
        ? [t('Hôm nay không có thói quen đến hạn'), 'neutral' as const]
        : done < due.length
          ? [t('Đã xong {done}/{total} thói quen', { done, total: due.length }), 'pending' as const]
          : [t('Đã xong cả {n} thói quen', { n: due.length }), 'done' as const];

  return <StatusRow icon={ListChecks} title={t('Thói quen')} status={status} tone={tone} to="/habits" />;
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
          <Link to="/goals" className="mt-1 inline-block text-xs font-medium text-brand-strong hover:underline">
            {t('Đặt mục tiêu đầu tiên')}
          </Link>
        </div>
      )}

      {/*
        Danh sách giãn đều theo chiều cao thẻ khi thẻ bên cạnh cao hơn — các mục tiêu
        chia đều khoảng trống thay vì dồn lên trên và bỏ lại một mảng trống dưới đáy.
      */}
      {goals && goals.length > 0 && (
        <ul className="mt-4 flex flex-1 flex-col justify-between gap-3.5">
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
