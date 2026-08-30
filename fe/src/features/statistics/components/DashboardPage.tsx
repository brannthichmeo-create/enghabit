import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarCheck, ChevronRight, Flame, Layers, Target } from 'lucide-react';
import type { StatsRangeInput, StreakSummary } from '@enghabit/shared';
import { ActivityChart } from '../../../shared/components/ActivityChart';
import { Card, SectionTitle, ProgressBar, Skeleton } from '../../../shared/components/ui';
import { GOAL_TYPE_LABELS } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useGoalProgress } from '../../goals/goal.hooks';
import { useDueCount } from '../../flashcards/flashcard.hooks';
import { useStatsSummary, useStreak } from '../statistics.hooks';

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

  const totalActivities = summary.data
    ? Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Xin chào, {user?.name ?? 'bạn'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Cùng xem tiến độ học tập của bạn hôm nay</p>
      </div>

      {dueCount.data !== undefined && dueCount.data > 0 && <ReviewPrompt count={dueCount.data} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StreakCard streak={streak.data} loading={streak.isLoading} />
        <StatCard
          icon={Award}
          label="Kỷ lục"
          value={streak.data ? `${streak.data.longestStreak}` : null}
          unit="ngày"
        />
        <StatCard
          icon={CalendarCheck}
          label="Tỷ lệ ngày có học"
          value={summary.data ? `${summary.data.activeDayRate}` : null}
          unit="%"
        />
        <StatCard icon={Layers} label="Tổng hoạt động" value={totalActivities?.toString() ?? null} />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Hoạt động theo ngày</h2>

          <div
            className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5"
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
                  range === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        {summary.isLoading && <Skeleton className="h-[248px] w-full" />}
        {summary.isError && <p className="py-8 text-center text-sm text-red-600">Không tải được thống kê</p>}
        {summary.data && <ActivityChart data={summary.data.daily} />}
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
                    <span className="flex items-center gap-1.5 truncate text-sm text-slate-700">
                      <Target className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      {GOAL_TYPE_LABELS[goal.type]}
                    </span>
                    <span
                      className={`shrink-0 text-sm tabular-nums ${
                        goal.isCompleted ? 'font-medium text-emerald-600' : 'text-slate-500'
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

/** Nhắc việc cần làm hôm nay — đưa user vào hành động thay vì chỉ đọc số liệu. */
function ReviewPrompt({ count }: { count: number }): JSX.Element {
  return (
    <Link
      to="/flashcards"
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <Layers className="h-4 w-4 text-amber-700" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-amber-900">Bạn có {count} từ cần ôn hôm nay</p>
        <p className="text-sm text-amber-700">Ôn ngay để giữ chuỗi ngày học</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
    </Link>
  );
}

/**
 * Thẻ chuỗi ngày — nhấn mạnh hơn các thẻ khác vì đây là chỉ số cốt lõi của app.
 * Khi chuỗi đã đứt thì đổi sang tông xám kèm lời nhắc, không tô màu rực rỡ cho số 0.
 */
function StreakCard({ streak, loading }: { streak?: StreakSummary; loading: boolean }): JSX.Element {
  if (loading) return <Skeleton className="h-[104px] w-full" />;

  const alive = streak?.isAlive ?? false;

  return (
    <div
      className={`rounded-xl p-5 shadow-card ${
        alive ? 'bg-gradient-to-br from-brand to-brand-strong text-white' : 'border border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Flame className={`h-4 w-4 ${alive ? 'text-white/80' : 'text-slate-400'}`} aria-hidden />
        <span className={`text-sm ${alive ? 'text-white/80' : 'text-slate-500'}`}>Chuỗi hiện tại</span>
      </div>

      <p className={`mt-1 text-2xl font-bold tabular-nums ${alive ? 'text-white' : 'text-slate-900'}`}>
        {streak?.currentStreak ?? 0} <span className="text-base font-medium">ngày</span>
      </p>

      {!alive && <p className="mt-0.5 text-xs text-slate-400">Học hôm nay để bắt đầu chuỗi mới</p>}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Award;
  label: string;
  value: string | null;
  unit?: string;
}): JSX.Element {
  if (value === null) return <Skeleton className="h-[104px] w-full" />;

  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden />
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
        {value}
        {unit && <span className="text-base font-medium text-slate-500"> {unit}</span>}
      </p>
    </Card>
  );
}
