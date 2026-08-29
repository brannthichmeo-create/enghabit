import { useState } from 'react';
import type { StatsRangeInput } from '@enghabit/shared';
import { useCurrentUser } from '../../auth/auth.store';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xin chào, {user?.name ?? 'bạn'}</h1>
        <p className="text-sm text-slate-500">Cùng xem tiến độ học tập của bạn hôm nay</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chuỗi hiện tại"
          value={streak.data ? `${streak.data.currentStreak} ngày` : '—'}
          hint={streak.data?.isAlive === false ? 'Chuỗi đã đứt, học hôm nay để bắt đầu lại' : undefined}
          highlight
        />
        <StatCard label="Kỷ lục" value={streak.data ? `${streak.data.longestStreak} ngày` : '—'} />
        <StatCard
          label="Tỷ lệ ngày có học"
          value={summary.data ? `${summary.data.activeDayRate}%` : '—'}
        />
        <StatCard
          label="Tổng hoạt động"
          value={
            summary.data
              ? String(Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0))
              : '—'
          }
        />
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Hoạt động theo ngày</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(Object.keys(RANGE_LABELS) as StatsRangeInput['range'][]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded-md px-3 py-1 text-sm transition ${
                  range === key ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        {summary.isLoading && <p className="text-sm text-slate-400">Đang tải...</p>}
        {summary.isError && <p className="text-sm text-red-600">Không tải được thống kê</p>}

        {summary.data && <ActivityChart data={summary.data.daily} />}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}): JSX.Element {
  return (
    <div className={`rounded-xl p-5 shadow-sm ${highlight ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
      <p className={`text-sm ${highlight ? 'text-indigo-100' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className={`mt-1 text-xs ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  );
}

/** Biểu đồ cột đơn giản bằng CSS — đủ dùng, không cần thêm thư viện chart. */
function ActivityChart({ data }: { data: { date: string; totalActivities: number }[] }): JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.totalActivities));

  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto">
      {data.map((day) => (
        <div key={day.date} className="flex min-w-[24px] flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-indigo-500 transition-all"
            style={{ height: `${(day.totalActivities / max) * 100}%` }}
            title={`${day.date}: ${day.totalActivities} hoạt động`}
          />
          <span className="text-[10px] text-slate-400">{day.date.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}
