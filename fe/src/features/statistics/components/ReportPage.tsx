import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarRange,
  Flame,
  Layers,
  ListChecks,
  Minus,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  ActivityType,
  EffectivenessLevel,
  addDays,
  isCumulativeGoal,
  startOfMonth,
  todayLocalDate,
  type LearningReport,
  type ReportGoalProgress,
  type ReportRangeInput,
  type ReportTotals,
} from '@enghabit/shared';
import { ActivityChart } from '../../../shared/components/ActivityChart';
import { Card, EmptyState, Field, Input, PageHeader, ProgressBar, Skeleton } from '../../../shared/components/ui';
import {
  EFFECTIVENESS_LABELS,
  EFFECTIVENESS_NOTES,
  GOAL_TYPE_LABELS,
} from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useLearningReport } from '../statistics.hooks';
import { useLocale, useT } from '../../../shared/i18n/language';

/**
 * Báo cáo học tập theo khoảng ngày tự chọn.
 *
 * Khác trang Tổng quan ở mục đích: Tổng quan trả lời "hôm nay cần làm gì", còn trang
 * này trả lời "quãng vừa rồi tôi học ra sao" — nên mọi thứ ở đây đều nhìn lại phía
 * sau: đối chiếu với mục tiêu đã đặt và với chính kỳ liền trước.
 */

/** Các khoảng chọn nhanh. Đặt cạnh ô ngày để người dùng không phải tự bấm lịch. */
const PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
] as const;

export function ReportPage(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();

  // Ngày hôm nay phải tính theo timezone của người dùng, không phải giờ máy —
  // cùng quy ước với toàn bộ phần thống kê (xem CLAUDE.md > Quy ước thời gian).
  const today = useMemo(() => todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh'), [user?.timezone]);

  const [range, setRange] = useState<ReportRangeInput>(() => ({
    from: addDays(today, -29),
    to: today,
  }));

  const report = useLearningReport(range);
  const invalid = range.from > range.to;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Báo cáo học tập')}
        description={t('Chọn một khoảng thời gian để xem bạn đã học được gì và đạt bao nhiêu so với mục tiêu.')}
      />

      <RangePicker range={range} today={today} onChange={setRange} />

      {invalid && (
        <Card>
          <p className="text-sm text-danger">{t('Ngày bắt đầu phải trước hoặc trùng ngày kết thúc')}</p>
        </Card>
      )}

      {!invalid && report.isLoading && <ReportSkeleton />}

      {!invalid && report.isError && (
        <Card>
          <p className="py-6 text-center text-sm text-danger">{t('Không tải được báo cáo')}</p>
        </Card>
      )}

      {!invalid && report.data && <ReportBody report={report.data} stale={report.isPlaceholderData} />}
    </div>
  );
}

function ReportBody({ report, stale }: { report: LearningReport; stale: boolean }): JSX.Element {
  const t = useT();

  if (report.days === 0 || report.current.totalActivities === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title={t('Khoảng này chưa có hoạt động nào')}
        description={t('Hãy chọn một khoảng khác, hoặc bắt đầu học hôm nay để lần sau báo cáo có số liệu.')}
      />
    );
  }

  return (
    // Làm mờ nhẹ khi đang tải khoảng mới: số cũ vẫn đọc được nên trang không nháy trắng.
    <div className={`space-y-6 transition-opacity ${stale ? 'opacity-60' : ''}`}>
      <EffectivenessCard report={report} />
      <ActivitySection report={report} />
      <GoalSection report={report} />
    </div>
  );
}

/** Bộ chọn khoảng: ba nút nhanh, một nút tháng này, và hai ô ngày cho trường hợp còn lại. */
function RangePicker({
  range,
  today,
  onChange,
}: {
  range: ReportRangeInput;
  today: string;
  onChange: (range: ReportRangeInput) => void;
}): JSX.Element {
  const t = useT();

  const presetRange = (days: number): ReportRangeInput => ({ from: addDays(today, -(days - 1)), to: today });
  const monthRange: ReportRangeInput = { from: startOfMonth(today), to: today };

  const isActive = (candidate: ReportRangeInput): boolean =>
    range.from === candidate.from && range.to === candidate.to;

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex flex-wrap gap-0.5 rounded-lg bg-sunken p-0.5" role="group" aria-label={t('Khoảng thời gian')}>
          {PRESETS.map((preset) => (
            <PresetButton
              key={preset.days}
              label={t(preset.label)}
              active={isActive(presetRange(preset.days))}
              onClick={() => onChange(presetRange(preset.days))}
            />
          ))}
          <PresetButton
            label={t('Tháng này')}
            active={isActive(monthRange)}
            onClick={() => onChange(monthRange)}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Field label={t('Từ ngày')}>
              <Input
                type="date"
                value={range.from}
                max={today}
                onChange={(event) => onChange({ ...range, from: event.target.value })}
              />
            </Field>
          </div>
          <div className="w-40">
            <Field label={t('Đến ngày')}>
              <Input
                type="date"
                value={range.to}
                max={today}
                onChange={(event) => onChange({ ...range, to: event.target.value })}
              />
            </Field>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PresetButton({
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
      aria-pressed={active}
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
 * Tổng kết hiệu quả.
 *
 * Điểm số đứng một mình rất dễ bị hiểu sai, nên luôn đi kèm ba thứ: xếp loại bằng
 * chữ, một câu nói rõ nên làm gì tiếp, và cách điểm được tính ra.
 */
function EffectivenessCard({ report }: { report: LearningReport }): JSX.Element {
  const t = useT();
  const level = report.effectiveness;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-content">{t('Tổng kết hiệu quả')}</h2>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-content">{report.effectivenessScore}</span>
            <span className="text-sm text-content-muted">{t('trên 100')}</span>
            <EffectivenessBadge level={level} />
          </div>

          <div className="mt-3 max-w-md">
            <ProgressBar
              percent={report.effectivenessScore}
              done={level === EffectivenessLevel.EXCELLENT}
              label={t('Điểm hiệu quả')}
            />
          </div>

          <p className="mt-3 text-sm text-content-soft">{t(EFFECTIVENESS_NOTES[level])}</p>

          <p className="mt-2 text-xs text-content-muted">
            {report.goalCompletionRate === null
              ? t('Điểm tính theo mức độ đều đặn. Đặt mục tiêu để báo cáo chấm thêm phần hoàn thành mục tiêu.')
              : t('Điểm tính từ mức độ đều đặn ({consistency}%) và tỷ lệ đạt mục tiêu ({goal}%).', {
                  consistency: report.current.activeDayRate,
                  goal: report.goalCompletionRate,
                })}
          </p>
        </div>

        <ComparisonPanel current={report.current} previous={report.previous} />
      </div>
    </Card>
  );
}

function EffectivenessBadge({ level }: { level: EffectivenessLevel }): JSX.Element {
  const t = useT();

  // Bốn mức bốn màu, đi từ xanh lá tới đỏ. Không dùng màu làm dấu hiệu duy nhất —
  // chữ xếp loại luôn nằm ngay trong thẻ.
  const tones: Record<EffectivenessLevel, string> = {
    [EffectivenessLevel.EXCELLENT]: 'bg-success-soft text-success',
    [EffectivenessLevel.GOOD]: 'bg-brand-soft text-brand-strong',
    [EffectivenessLevel.FAIR]: 'bg-accent-soft text-accent-ink',
    [EffectivenessLevel.LOW]: 'bg-danger-soft text-danger',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[level]}`}>
      {t(EFFECTIVENESS_LABELS[level])}
    </span>
  );
}

/** Đối chiếu với kỳ liền trước cùng độ dài. */
function ComparisonPanel({
  current,
  previous,
}: {
  current: ReportTotals;
  previous: ReportTotals;
}): JSX.Element {
  const t = useT();

  return (
    <div className="w-full max-w-xs shrink-0 rounded-xl bg-sunken p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
        {t('So với kỳ trước')}
      </p>
      <p className="mt-0.5 text-xs text-content-muted">
        {t('{from} → {to}', { from: formatShort(previous.from), to: formatShort(previous.to) })}
      </p>

      <div className="mt-3 space-y-2">
        <CompareRow label={t('Số hoạt động')} current={current.totalActivities} previous={previous.totalActivities} />
        <CompareRow label={t('Ngày có học')} current={current.activeDays} previous={previous.activeDays} />
        <CompareRow label={t('Điểm kinh nghiệm')} current={current.xp} previous={previous.xp} />
      </div>
    </div>
  );
}

function CompareRow({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number;
}): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const delta = current - previous;

  // Kỳ trước bằng 0 thì không có phần trăm nào tính được — nói thẳng là mới bắt đầu
  // thay vì hiện một dấu vô nghĩa.
  const percent = previous === 0 ? null : Math.round((delta / previous) * 100);

  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-content-muted';

  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="truncate text-xs text-content-muted">{label}</span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className="text-sm font-medium tabular-nums text-content-soft">
          {current.toLocaleString(locale)}
        </span>
        <span className={`flex items-center gap-0.5 text-xs tabular-nums ${tone}`}>
          <Icon className="h-3 w-3" aria-hidden />
          {percent === null
            ? t('mới')
            : t('{percent}%', { percent: percent > 0 ? `+${percent}` : String(percent) })}
        </span>
      </span>
    </div>
  );
}

/** Khối "đã làm được gì": bốn ô số liệu, vài mốc đáng chú ý, rồi biểu đồ theo ngày. */
function ActivitySection({ report }: { report: LearningReport }): JSX.Element {
  const t = useT();
  const locale = useLocale();

  return (
    <Card>
      <div className="mb-4">
        <h2 className="font-semibold text-content">{t('Đã làm được gì')}</h2>
        <p className="text-sm text-content-muted">
          {t('Từ {from} đến {to}, tổng {days} ngày.', {
            from: formatShort(report.from),
            to: formatShort(report.to),
            days: report.days,
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={BookOpen}
          label={t('Từ vựng')}
          value={report.totals[ActivityType.VOCAB_LEARNED]}
        />
        <StatTile
          icon={Layers}
          label={t('Lượt ôn tập')}
          value={report.totals[ActivityType.FLASHCARD_REVIEWED]}
        />
        <StatTile
          icon={Shield}
          label={t('Bài kiểm tra')}
          value={report.totals[ActivityType.QUIZ_COMPLETED]}
        />
        <StatTile
          icon={ListChecks}
          label={t('Check-in thói quen')}
          value={report.totals[ActivityType.HABIT_CHECKIN]}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Highlight
          icon={CalendarRange}
          label={t('Ngày có học')}
          value={t('{active}/{total} ngày', { active: report.current.activeDays, total: report.days })}
          note={t('{percent}% số ngày', { percent: report.current.activeDayRate })}
        />
        <Highlight
          icon={Flame}
          label={t('Chuỗi dài nhất trong kỳ')}
          value={t('{n} ngày', { n: report.longestStreakInRange })}
        />
        <Highlight
          icon={Award}
          label={t('Ngày học nhiều nhất')}
          value={report.bestDay ? formatShort(report.bestDay.date) : '—'}
          note={
            report.bestDay
              ? t('{n} hoạt động', { n: report.bestDay.count })
              : undefined
          }
        />
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="mb-3 text-sm font-medium text-content-soft">
          {t('Tổng {n} hoạt động, thu được {xp} XP', {
            n: report.current.totalActivities.toLocaleString(locale),
            xp: report.current.xp.toLocaleString(locale),
          })}
        </p>
        <ActivityChart data={report.daily} />
      </div>
    </Card>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}): JSX.Element {
  const locale = useLocale();

  return (
    <div className="rounded-xl bg-sunken p-3">
      <span className="flex items-center gap-1.5 text-xs text-content-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-content">
        {value.toLocaleString(locale)}
      </p>
    </div>
  );
}

function Highlight({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  note?: string;
}): JSX.Element {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
        <Icon className="h-3.5 w-3.5 text-brand-strong" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-content-muted">{label}</span>
        <span className="block text-sm font-medium text-content">{value}</span>
        {note && <span className="block text-xs text-content-muted">{note}</span>}
      </span>
    </div>
  );
}

/** Tiến độ mục tiêu, tính trên đúng khoảng đang xem chứ không phải kỳ hiện tại. */
function GoalSection({ report }: { report: LearningReport }): JSX.Element {
  const t = useT();

  if (report.goals.length === 0) {
    return (
      <Card>
        <h2 className="font-semibold text-content">{t('Tiến độ mục tiêu')}</h2>
        <p className="mt-2 text-sm text-content-muted">
          {t('Bạn chưa đặt mục tiêu nào cho khoảng này. Đặt mục tiêu để báo cáo đối chiếu được kết quả.')}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="font-semibold text-content">{t('Tiến độ mục tiêu')}</h2>
        <p className="text-sm text-content-muted">
          {t('Chỉ tiêu đã quy đổi sang {days} ngày của khoảng đang xem.', { days: report.days })}
        </p>
      </div>

      <div className="space-y-4">
        {report.goals.map((goal) => (
          <GoalRow key={goal.goalId} goal={goal} />
        ))}
      </div>

      <p className="mt-4 border-t border-line pt-4 text-sm text-content-soft">
        {t('Trung bình đạt {percent}% các mục tiêu đã đặt.', { percent: report.goalCompletionRate ?? 0 })}
      </p>
    </Card>
  );
}

function GoalRow({ goal }: { goal: ReportGoalProgress }): JSX.Element {
  const t = useT();
  const locale = useLocale();

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-content-soft">
          <Target className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden />
          <span className="truncate">{t(GOAL_TYPE_LABELS[goal.type])}</span>
        </span>

        <span
          className={`shrink-0 text-sm tabular-nums ${
            goal.isCompleted ? 'font-medium text-success' : 'text-content-muted'
          }`}
        >
          {goal.currentValue.toLocaleString(locale)}/{goal.expectedValue.toLocaleString(locale)}
          {goal.isCompleted && ' ✓'}
        </span>
      </div>

      <ProgressBar
        percent={goal.completionRate}
        done={goal.isCompleted}
        label={t(GOAL_TYPE_LABELS[goal.type])}
      />

      {/*
        Nói rõ chỉ tiêu của khoảng được suy ra từ đâu. Mục tiêu chuỗi ngày không nhân
        lên theo số ngày nên phải giải thích khác, nếu không người dùng sẽ tưởng hệ
        thống quên quy đổi.
      */}
      <p className="mt-1 text-xs text-content-muted">
        {isCumulativeGoal(goal.type)
          ? t('Mục tiêu {target} mỗi kỳ, quy đổi thành {expected} cho khoảng này.', {
              target: goal.targetValue,
              expected: goal.expectedValue,
            })
          : t('So chuỗi dài nhất đạt được với mục tiêu {target} ngày.', { target: goal.targetValue })}
      </p>
    </div>
  );
}

function ReportSkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[184px] w-full" />
      <Skeleton className="h-[420px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

/** Ngày dạng ngắn `dd/mm` — báo cáo nhắc tới ngày rất nhiều, ghi đủ năm sẽ rối. */
function formatShort(date: string): string {
  return `${date.slice(8)}/${date.slice(5, 7)}`;
}
