import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ChevronRight, Layers, Target } from 'lucide-react';
import type { StatsRangeInput } from '@enghabit/shared';
import { ActivityChart } from '../../../shared/components/ActivityChart';
import { HeroCard } from './HeroCard';
import { useMistakeCount } from '../../lessons/lesson.hooks';
import { ActivityCalendarChart } from '../../../shared/components/ActivityCalendar';
import { Card, SectionTitle, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { GOAL_TYPE_LABELS } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useGoalProgress } from '../../goals/goal.hooks';
import { useDueCount } from '../../flashcards/flashcard.hooks';
import { useActivityCalendar, useStatsSummary, useStreak } from '../statistics.hooks';

const RANGE_LABELS: Record<StatsRangeInput['range'], string> = {
  day: '7 ngày',
  week: 'Tuần này',
  month: 'Tháng này',
};

export function DashboardPage(): JSX.Element {
  const user = useCurrentUser();
  const [range, setRange] = useState<StatsRangeInput['range']>('week');
  const summary = useStatsSummary(range);
  const streak = useStreak();
  const goalProgress = useGoalProgress();
  const dueCount = useDueCount();
  const calendar = useActivityCalendar();
  const mistakeCount = useMistakeCount();

  const totalActivities = summary.data
    ? Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content">
          Xin chào, {user?.name ?? 'bạn'}
        </h1>
        <p className="mt-1 text-sm text-content-muted">Cùng xem tiến độ học tập của bạn hôm nay</p>
      </div>

      <HeroCard
        streak={streak.data}
        level={summary.data?.level}
        dueCount={dueCount.data}
        loading={streak.isLoading || summary.isLoading}
      />

      <ContinueSection dueCount={dueCount.data} mistakeCount={mistakeCount.data} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          label="Tỷ lệ ngày có học"
          value={summary.data ? `${summary.data.activeDayRate}` : null}
          unit="%"
        />
        <StatCard icon={Layers} label="Tổng hoạt động" value={totalActivities?.toString() ?? null} />
        <StatCard
          icon={Target}
          label="Kỷ lục chuỗi"
          value={streak.data ? `${streak.data.longestStreak}` : null}
          unit="ngày"
        />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-content">Hoạt động theo ngày</h2>

          <div
            className="flex gap-0.5 rounded-lg bg-sunken p-0.5"
            role="tablist"
            aria-label="Khoảng thời gian"
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
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        {summary.isLoading && <Skeleton className="h-[248px] w-full" />}
        {summary.isError && <p className="py-8 text-center text-sm text-danger">Không tải được thống kê</p>}
        {summary.data && <ActivityChart data={summary.data.daily} />}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-content">Lịch học cả năm</h2>
        <p className="mb-3 text-sm text-content-muted">
          Nhìn lại toàn bộ hành trình: chuỗi ngày liền mạch và những khoảng bị gián đoạn
        </p>

        {calendar.isLoading && <Skeleton className="h-[150px] w-full" />}
        {calendar.isError && <p className="py-6 text-center text-sm text-danger">Không tải được lịch học</p>}
        {calendar.data && <ActivityCalendarChart data={calendar.data} />}
      </Card>

      {goalProgress.data && goalProgress.data.length > 0 && (
        <section>
          <SectionTitle
            action={
              <Link
                to="/goals"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline"
              >
                Quản lý <ChevronRight className="h-3 w-3" />
              </Link>
            }
          >
            Tiến độ mục tiêu
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
 * Khối "tiếp tục việc đang dở" — hai lối vào lớn dẫn thẳng tới việc học.
 *
 * Đặt ngay dưới thẻ tổng hợp vì đây là thứ người học cần bấm, còn biểu đồ phía
 * dưới chỉ để xem lại. Mỗi ô nói rõ còn bao nhiêu việc thay vì chỉ ghi tên mục.
 */
function ContinueSection({
  dueCount,
  mistakeCount,
}: {
  dueCount?: number;
  mistakeCount?: number;
}): JSX.Element {
  return (
    <section>
      <SectionTitle>Tiếp tục việc đang dở</SectionTitle>

      <div className="grid gap-3 sm:grid-cols-2">
        <ContinueTile
          to="/learn"
          icon={BookOpen}
          title="Bài học"
          note={mistakeCount ? `${mistakeCount} từ cần ôn lại` : 'Tiếp tục lộ trình'}
          tone="brand"
        />
        <ContinueTile
          to="/flashcards"
          icon={Layers}
          title="Ôn tập flashcard"
          note={dueCount ? `${dueCount} từ tới hạn hôm nay` : 'Đã ôn hết hôm nay'}
          tone="accent"
        />
      </div>
    </section>
  );
}

function ContinueTile({
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
  const styles =
    tone === 'brand'
      ? 'border-brand/40 bg-brand-soft hover:border-brand'
      : 'border-accent/40 bg-accent-soft hover:border-accent';
  const iconStyles = tone === 'brand' ? 'bg-brand text-on-brand' : 'bg-accent text-ink';

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 transition-colors ${styles}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyles}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-content">{title}</span>
        <span className="block text-sm text-content-muted">{note}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden />
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Layers;
  label: string;
  value: string | null;
  unit?: string;
}): JSX.Element {
  if (value === null) return <Skeleton className="h-[104px] w-full" />;

  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-content-muted" aria-hidden />
        <span className="text-sm text-content-muted">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-content">
        {value}
        {unit && <span className="text-base font-medium text-content-muted"> {unit}</span>}
      </p>
    </Card>
  );
}
