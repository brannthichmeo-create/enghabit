import { useState, type FormEvent } from 'react';
import { CalendarClock } from 'lucide-react';
import {
  GoalPeriod,
  GoalStatus,
  GoalTimelineState,
  GoalType,
  createGoalSchema,
  goalTimeline,
  todayLocalDate,
  type GoalProgress,
  type GoalTimeline,
  type LocalDate,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  SkeletonList,
  PageHeader,
  Select,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { GOAL_TYPE_LABELS } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useCreateGoal, useDeleteGoal, useGoalProgress, useGoals, useUpdateGoal } from '../goal.hooks';
import type { Goal } from '../goal.api';
import { useLocale, useT } from '../../../shared/i18n/language';

/** API trả cột DATE dạng `2026-09-30T00:00:00.000Z`; phần ngày chính là ngày theo lịch. */
function toLocalDate(value: string): LocalDate {
  return value.slice(0, 10);
}

/**
 * Hiện ngày theo ngôn ngữ đang chọn. Ép `timeZone: 'UTC'` vì chuỗi ngày không mang giờ:
 * để trình duyệt tự đổi sang giờ máy thì người ở múi giờ âm thấy lùi một ngày.
 */
function formatDay(date: LocalDate, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function GoalsPage(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const goals = useGoals();
  const progress = useGoalProgress();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const today = todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh');
  const progressByGoal = new Map(progress.data?.map((p) => [p.goalId, p]) ?? []);

  return (
    <div>
      <PageHeader
        title={t('Mục tiêu học tập')}
        description={t('Đặt mục tiêu cụ thể để theo dõi tiến độ mỗi ngày')}
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('Đóng') : t('+ Thêm mục tiêu')}</Button>}
      />

      {showForm && (
        <div className="mb-6">
          <GoalForm today={today} onCreated={() => setShowForm(false)} />
        </div>
      )}

      {goals.isLoading && <SkeletonList rows={3} />}
      {goals.isError && <ErrorMessage>{getErrorMessage(goals.error)}</ErrorMessage>}

      {goals.data?.length === 0 && (
        <EmptyState title={t('Chưa có mục tiêu nào')} description={t('Ví dụ: học 20 từ vựng mỗi ngày')} />
      )}

      <div className="space-y-3">
        {goals.data?.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            timeline={goalTimeline(
              toLocalDate(goal.startDate),
              goal.endDate ? toLocalDate(goal.endDate) : null,
              today,
            )}
            progress={progressByGoal.get(goal.id)}
            onEditDeadline={() => setEditing(goal)}
          />
        ))}
      </div>

      <DeadlineModal goal={editing} today={today} onClose={() => setEditing(null)} />
    </div>
  );
}

function GoalCard({
  goal,
  timeline,
  progress,
  onEditDeadline,
}: {
  goal: Goal;
  timeline: GoalTimeline;
  progress?: GoalProgress;
  onEditDeadline: () => void;
}): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const deleteGoal = useDeleteGoal();
  const expired = timeline.state === GoalTimelineState.EXPIRED;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-content">{t(GOAL_TYPE_LABELS[goal.type])}</h3>
            <Badge tone={goal.status === GoalStatus.ACTIVE && !expired ? 'brand' : 'slate'}>
              {goal.period === GoalPeriod.DAILY ? t('Mỗi ngày') : t('Mỗi tuần')}
            </Badge>
            {expired && <Badge tone="red">{t('Đã hết hạn')}</Badge>}
          </div>

          <DeadlineLine goal={goal} timeline={timeline} />

          {/* Mục tiêu quá hạn không còn được đo — hiện thanh 0% đứng im sẽ trông như
              người dùng không học gì, trong khi thật ra hệ thống đã thôi đếm. */}
          {expired ? (
            <p className="mt-3 text-sm text-content-muted">
              {t('Đã qua hạn nên không còn theo dõi tiến độ. Gia hạn để tiếp tục.')}
            </p>
          ) : (
            <ProgressBar target={goal.targetValue} progress={progress} />
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
          <Button variant="ghost" icon={CalendarClock} onClick={onEditDeadline}>
            {expired ? t('Gia hạn') : goal.endDate ? t('Đổi hạn') : t('Đặt hạn')}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              const ok = await confirm({
                title: t('Xoá mục tiêu này?'),
                message: t('Tiến độ đã đạt của mục tiêu sẽ không còn được theo dõi.'),
                confirmLabel: t('Xoá mục tiêu'),
                tone: 'danger',
              });
              if (ok) deleteGoal.mutate(goal.id);
            }}
          >
            {t('Xoá')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Dòng mô tả hạn. Còn 3 ngày trở xuống thì tô màu nhắc chú ý. */
function DeadlineLine({ goal, timeline }: { goal: Goal; timeline: GoalTimeline }): JSX.Element {
  const t = useT();
  const locale = useLocale();

  if (timeline.state === GoalTimelineState.UPCOMING) {
    return (
      <p className="mt-1 text-xs text-content-muted">
        {t('Bắt đầu từ {date}', { date: formatDay(toLocalDate(goal.startDate), locale) })}
      </p>
    );
  }

  if (!goal.endDate) {
    return <p className="mt-1 text-xs text-content-muted">{t('Không có hạn')}</p>;
  }

  const date = formatDay(toLocalDate(goal.endDate), locale);

  if (timeline.state === GoalTimelineState.EXPIRED) {
    return <p className="mt-1 text-xs text-danger">{t('Hết hạn ngày {date}', { date })}</p>;
  }

  const daysLeft = timeline.daysLeft ?? 0;
  const urgent = daysLeft <= 3;

  return (
    <p className={`mt-1 text-xs ${urgent ? 'font-medium text-accent-ink' : 'text-content-muted'}`}>
      {daysLeft === 0
        ? t('Hạn {date} — hôm nay là ngày cuối', { date })
        : t('Hạn {date} — còn {n} ngày', { date, n: daysLeft })}
    </p>
  );
}

function ProgressBar({ target, progress }: { target: number; progress?: GoalProgress }): JSX.Element {
  const t = useT();
  const current = progress?.currentValue ?? 0;
  const rate = progress?.completionRate ?? 0;

  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-content-soft">
          {current} / {target}
        </span>
        <span className={progress?.isCompleted ? 'font-medium text-success' : 'text-content-muted'}>
          {progress?.isCompleted ? t('✓ Hoàn thành') : `${rate}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sunken">
        <div
          className={`h-full rounded-full transition-all ${progress?.isCompleted ? 'bg-success' : 'bg-brand'}`}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

function GoalForm({ today, onCreated }: { today: LocalDate; onCreated: () => void }): JSX.Element {
  const t = useT();
  const createGoal = useCreateGoal();
  const [type, setType] = useState<GoalType>(GoalType.VOCAB_PER_DAY);
  const [targetValue, setTargetValue] = useState('20');
  const [period, setPeriod] = useState<GoalPeriod>(GoalPeriod.DAILY);
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);
    setEndDateError(null);

    const parsed = createGoalSchema.safeParse({
      type,
      targetValue: Number(targetValue),
      period,
      startDate: today,
      endDate: endDate || undefined,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === 'endDate') setEndDateError(issue.message);
      else setValidationError(issue?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createGoal.mutate(parsed.data, { onSuccess: onCreated });
  };

  const errorMessage = validationError ?? (createGoal.error ? getErrorMessage(createGoal.error) : null);

  return (
    <Card>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage>{errorMessage}</ErrorMessage>

        <Field label={t('Loại mục tiêu')}>
          <Select value={type} onChange={(e) => setType(e.target.value as GoalType)}>
            {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('Chỉ tiêu')}>
            <Input
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </Field>

          <Field label={t('Chu kỳ')}>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)}>
              <option value={GoalPeriod.DAILY}>{t('Mỗi ngày')}</option>
              <option value={GoalPeriod.WEEKLY}>{t('Mỗi tuần')}</option>
            </Select>
          </Field>

          <Field
            label={t('Hạn hoàn thành')}
            hint={t('Không bắt buộc. Bỏ trống là mục tiêu không có hạn.')}
            error={endDateError ?? undefined}
          >
            <Input type="date" min={today} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>

        <Button type="submit" disabled={createGoal.isPending}>
          {createGoal.isPending ? t('Đang tạo...') : t('Tạo mục tiêu')}
        </Button>
      </form>
    </Card>
  );
}

/**
 * Đặt, đổi hoặc bỏ hạn của một mục tiêu có sẵn.
 *
 * Gia hạn thay vì bắt tạo lại: xoá rồi tạo mục tiêu mới là mất ngày bắt đầu, và trang
 * Báo cáo sẽ không còn đối chiếu được mục tiêu cho khoảng thời gian trước đó.
 */
function DeadlineModal({
  goal,
  today,
  onClose,
}: {
  goal: Goal | null;
  today: LocalDate;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const updateGoal = useUpdateGoal();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openedFor, setOpenedFor] = useState<number | null>(null);

  // Nạp hạn hiện tại mỗi lần mở cho một mục tiêu khác. Làm ngay trong lúc render thay
  // vì useEffect để ô nhập không nháy giá trị cũ ở khung hình đầu.
  if (goal && goal.id !== openedFor) {
    setOpenedFor(goal.id);
    setValue(goal.endDate ? toLocalDate(goal.endDate) : '');
    setError(null);
  }

  const close = (): void => {
    setOpenedFor(null);
    onClose();
  };

  const save = (endDate: LocalDate | null): void => {
    if (!goal) return;
    setError(null);

    if (endDate !== null && endDate < today) {
      setError(t('Hạn phải từ hôm nay trở đi'));
      return;
    }

    updateGoal.mutate(
      { id: goal.id, input: { endDate } },
      {
        onSuccess: () => {
          toast.success(endDate ? t('Đã lưu hạn mục tiêu') : t('Đã bỏ hạn mục tiêu'));
          close();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal
      open={goal !== null}
      onClose={close}
      title={goal?.endDate ? t('Đổi hạn mục tiêu') : t('Đặt hạn mục tiêu')}
      footer={
        <>
          {goal?.endDate && (
            <Button variant="ghost" disabled={updateGoal.isPending} onClick={() => save(null)}>
              {t('Bỏ hạn')}
            </Button>
          )}
          <Button variant="secondary" onClick={close}>
            {t('Huỷ')}
          </Button>
          <Button
            loading={updateGoal.isPending}
            disabled={value === ''}
            onClick={() => save(value)}
          >
            {t('Lưu')}
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (value) save(value);
        }}
      >
        <Field
          label={t('Hạn hoàn thành')}
          hint={t('Mục tiêu được theo dõi tới hết ngày này.')}
          error={error ?? undefined}
        >
          <Input type="date" min={today} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </Field>
      </form>
    </Modal>
  );
}
