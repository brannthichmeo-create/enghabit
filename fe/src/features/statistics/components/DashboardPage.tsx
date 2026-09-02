import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, ChevronRight, Layers, Target } from 'lucide-react';
import type { StatsRangeInput } from '@enghabit/shared';
import { ActivityChart } from '../../../shared/components/ActivityChart';
import { HeroCard } from './HeroCard';
import { RewardsBar } from '../../rewards/components/RewardsBar';
import { useMistakeCount } from '../../lessons/lesson.hooks';
import { ActivityCalendarChart } from '../../../shared/components/ActivityCalendar';
import { Card, SectionTitle, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { GOAL_TYPE_LABELS } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useGoalProgress } from '../../goals/goal.hooks';
import { useDueCount } from '../../flashcards/flashcard.hooks';
import { useActivityCalendar, useStatsSummary, useStreak } from '../statistics.hooks';
import { useT } from '../../../shared/i18n/language';

const RANGE_LABELS: Record<StatsRangeInput['range'], string> = {
  day: '7 ngày',
  week: 'Tuần này',
  month: 'Tháng này',
};

/**
 * Mặc định 3 tháng chứ không phải cả năm: dải một năm phải cuộn ngang mới xem hết,
 * mà phần người học quan tâm gần như luôn là quãng gần đây. Ai cần nhìn toàn cảnh
 * thì đổi sang 12 tháng.
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
  const goalProgress = useGoalProgress();
  const dueCount = useDueCount();
  const calendar = useActivityCalendar(calendarMonths);
  const mistakeCount = useMistakeCount();

  const totalActivities = summary.data
    ? Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-page">
          {t('Xin chào, {name}', { name: user?.name ?? t('bạn') })}
        </h1>
        <p className="mt-1 text-sm text-on-page-muted">{t('Cùng xem tiến độ học tập của bạn hôm nay')}</p>
      </div>

      <HeroCard
        streak={streak.data}
        level={summary.data?.level}
        dueCount={dueCount.data}
        activeDayRate={summary.data?.activeDayRate}
        totalActivities={totalActivities}
        rangeLabel={t(RANGE_LABELS[range])}
        loading={streak.isLoading || summary.isLoading}
      >
        <RewardsBar />
      </HeroCard>

      <QuickReviewCard dueCount={dueCount.data} mistakeCount={mistakeCount.data} />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-content">{t('Hoạt động theo ngày')}</h2>

          <div
            className="flex gap-0.5 rounded-lg bg-sunken p-0.5"
            role="tablist"
            aria-label={t('Khoảng thời gian')}
          >
            {(Object.keys(RANGE_LABELS) as StatsRangeInput['range'][]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={range === key}
                onClick={() => setRange(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === key ? 'bg-surface text-content shadow-sm' : 'text-content-muted hover:text-content-soft'
                }`}
              >
                {t(RANGE_LABELS[key])}
              </button>
            ))}
          </div>
        </div>

        {summary.isLoading && <Skeleton className="h-[248px] w-full" />}
        {summary.isError && <p className="py-8 text-center text-sm text-danger">{t('Không tải được thống kê')}</p>}
        {summary.data && <ActivityChart data={summary.data.daily} />}
      </Card>

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
              <button
                key={option.months}
                role="tab"
                aria-selected={calendarMonths === option.months}
                onClick={() => setCalendarMonths(option.months)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  calendarMonths === option.months
                    ? 'bg-surface text-content shadow-sm'
                    : 'text-content-muted hover:text-content-soft'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        {calendar.isLoading && <Skeleton className="h-[150px] w-full" />}
        {calendar.isError && <p className="py-6 text-center text-sm text-danger">{t('Không tải được lịch học')}</p>}
        {calendar.data && <ActivityCalendarChart data={calendar.data} />}
      </Card>

      {goalProgress.data && goalProgress.data.length > 0 && (
        <section>
          <SectionTitle
            action={
              <Link
                to="/goals"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-on-page-link hover:underline"
              >
                {t('Quản lý')}<ChevronRight className="h-3 w-3" />
              </Link>
            }
          >
            {t('Tiến độ mục tiêu')}
          </SectionTitle>

          <Card>
            <div className="space-y-4">
              {goalProgress.data.map((goal) => (
                <div key={goal.goalId}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-1.5 truncate text-sm text-content-soft">
                      <Target className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden />
                      {GOAL_TYPE_LABELS[goal.type]}
                    </span>
                    <span
                      className={`shrink-0 text-sm tabular-nums ${
                        goal.isCompleted ? 'font-medium text-success' : 'text-content-muted'
                      }`}
                    >
                      {goal.currentValue}/{goal.targetValue}
                      {goal.isCompleted && ' ✓'}
                    </span>
                  </div>
                  <ProgressBar percent={goal.completionRate} done={goal.isCompleted} />
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

/**
 * Thẻ "Ôn nhanh" — hai lối vào lớn dẫn thẳng tới việc học.
 *
 * Đặt ngay dưới thẻ tổng hợp vì đây là thứ người học cần bấm, còn biểu đồ phía
 * dưới chỉ để xem lại. Mỗi ô LUÔN nói rõ trạng thái, kể cả khi hết việc ("đã xong
 * hôm nay") — ô không có chữ phụ khiến người dùng phải bấm vào mới biết còn gì không.
 */
function QuickReviewCard({
  dueCount,
  mistakeCount,
}: {
  dueCount?: number;
  mistakeCount?: number;
}): JSX.Element {
  const t = useT();
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />
        <div>
          <h2 className="font-semibold leading-tight text-content">{t('Ôn nhanh')}</h2>
          <p className="text-sm text-content-muted">{t('Làm tiếp từ chỗ đang dở')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <QuickReviewTile
          to="/learn"
          icon={BookOpen}
          title={t('HỌC BÀI')}
          note={mistakeCount ? t('{n} từ cần ôn lại', { n: mistakeCount }) : t('Đã xong phần cần ôn')}
          tone="brand"
        />
        <QuickReviewTile
          to="/flashcards"
          icon={Layers}
          title={t('ÔN FLASHCARD')}
          note={dueCount ? t('{n} từ tới hạn hôm nay', { n: dueCount }) : t('Đã ôn hết hôm nay')}
          tone="accent"
        />
      </div>
    </Card>
  );
}

/** Nút trải ngang: tên việc ở trên, trạng thái ở dưới, mũi tên ở cuối. */
function QuickReviewTile({
  to,
  icon: Icon,
  title,
  note,
  tone,
}: {
  to: string;
  icon: typeof Layers;
  title: string;
  note: string;
  tone: 'brand' | 'accent';
}): JSX.Element {
  // Hai nút cùng cỡ, phân biệt bằng màu nền đặc — đây là hai lối đi ngang hàng nhau,
  // không cái nào là hành động phụ.
  const styles =
    tone === 'brand'
      ? 'bg-brand text-on-brand hover:bg-brand-strong'
      : 'bg-accent text-ink hover:bg-accent/85';

  return (
    <Link
      to={to}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${styles}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/15">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight">{title}</span>
        <span className="block text-xs opacity-80">{note}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
    </Link>
  );
}
