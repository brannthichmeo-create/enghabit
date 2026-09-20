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
  ErrorState,
  Field,
  Input,
  ProgressBar,
  Skeleton,
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

/** Nút "+ Thêm mục tiêu" khai `aria-controls` trỏ tới khối form nó mở ra. */
const GOAL_FORM_ID = 'goal-form';

/** Tiến độ là truy vấn riêng: chưa biết, hỏi hỏng, hay đã có số — ba chuyện khác nhau. */
type ProgressState = 'loading' | 'error' | 'ready';

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
        action={
          <Button
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            aria-controls={GOAL_FORM_ID}
          >
            {showForm ? t('Đóng') : t('+ Thêm mục tiêu')}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6" id={GOAL_FORM_ID}>
          <GoalForm today={today} onCreated={() => setShowForm(false)} />
        </div>
      )}

      {goals.isLoading && <SkeletonList rows={3} />}
      {goals.isError && (
        <ErrorState message={getErrorMessage(goals.error)} onRetry={() => void goals.refetch()} />
      )}

      {goals.data?.length === 0 && (
        <EmptyState
          title={t('Chưa có mục tiêu nào')}
          description={t('Ví dụ: học 20 từ vựng mỗi ngày')}
          action={<Button onClick={() => setShowForm(true)}>{t('+ Thêm mục tiêu')}</Button>}
        />
      )}

      <ul className="space-y-3">
        {goals.data?.map((goal) => (
          <li key={goal.id}>
            <GoalCard
              goal={goal}
              timeline={goalTimeline(
                toLocalDate(goal.startDate),
                goal.endDate ? toLocalDate(goal.endDate) : null,
                today,
              )}
              progress={progressByGoal.get(goal.id)}
              progressState={
                progress.isPending ? 'loading' : progress.isError ? 'error' : 'ready'
              }
              onEditDeadline={() => setEditing(goal)}
            />
          </li>
        ))}
      </ul>

      <DeadlineModal goal={editing} today={today} onClose={() => setEditing(null)} />
    </div>
  );
}

function GoalCard({
  goal,
  timeline,
  progress,
  progressState,
  onEditDeadline,
}: {
  goal: Goal;
  timeline: GoalTimeline;
  progress?: GoalProgress;
  /** Trạng thái của truy vấn tiến độ — nó về sau danh sách mục tiêu, xem `GoalProgressLine`. */
  progressState: ProgressState;
  onEditDeadline: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const deleteGoal = useDeleteGoal();
  const expired = timeline.state === GoalTimelineState.EXPIRED;
  const name = t(GOAL_TYPE_LABELS[goal.type]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-content">{name}</h2>
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
            <GoalProgressLine
              name={name}
              target={goal.targetValue}
              progress={progress}
              state={progressState}
            />
          )}
        </div>

        {/*
          Nhãn của hai nút mang theo TÊN mục tiêu. Danh sách năm mục tiêu thì trình đọc
          màn hình chỉ nghe năm lần "Xoá" giống hệt nhau, không cách nào biết nút nào
          thuộc thẻ nào. Chữ hiện ra vẫn ngắn như cũ vì nền thẻ đã nói rõ ngữ cảnh.
        */}
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            icon={CalendarClock}
            onClick={onEditDeadline}
            aria-label={
              expired
                ? t('Gia hạn mục tiêu {name}', { name })
                : goal.endDate
                  ? t('Đổi hạn mục tiêu {name}', { name })
                  : t('Đặt hạn mục tiêu {name}', { name })
            }
          >
            {expired ? t('Gia hạn') : goal.endDate ? t('Đổi hạn') : t('Đặt hạn')}
          </Button>
          <Button
            variant="ghost"
            loading={deleteGoal.isPending}
            aria-label={t('Xoá mục tiêu {name}', { name })}
            onClick={async () => {
              const ok = await confirm({
                title: t('Xoá mục tiêu này?'),
                message: t('Tiến độ đã đạt của mục tiêu sẽ không còn được theo dõi.'),
                confirmLabel: t('Xoá mục tiêu'),
                tone: 'danger',
              });
              if (!ok) return;

              deleteGoal.mutate(goal.id, {
                onSuccess: () => toast.success(t('Đã xoá mục tiêu')),
                onError: (error) => toast.error(getErrorMessage(error)),
              });
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

/**
 * Số đã đạt và thanh tiến độ của một mục tiêu.
 *
 * Tiến độ là truy vấn RIÊNG, về sau danh sách mục tiêu — nên phải phân biệt được ba
 * chuyện: chưa biết, hỏi không được, và đúng là chưa làm gì. Vẽ thẳng 0% cho cả ba là
 * nói với người vừa học xong rằng họ chưa học gì, đúng ở màn hình mà cả sản phẩm dựa
 * vào để giữ động lực.
 */
function GoalProgressLine({
  name,
  target,
  progress,
  state,
}: {
  name: string;
  target: number;
  progress?: GoalProgress;
  state: ProgressState;
}): JSX.Element {
  const t = useT();

  if (state === 'loading') {
    return (
      <div className="mt-3">
        <Skeleton className="mb-1 h-5 w-28" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (state === 'error') {
    return <p className="mt-3 text-sm text-content-muted">{t('Chưa tải được tiến độ của mục tiêu này.')}</p>;
  }

  const current = progress?.currentValue ?? 0;
  const rate = progress?.completionRate ?? 0;

  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="tabular-nums text-content-soft">
          {current} / {target}
        </span>
        <span className={progress?.isCompleted ? 'font-medium text-success' : 'tabular-nums text-content-muted'}>
          {progress?.isCompleted ? t('✓ Hoàn thành') : `${rate}%`}
        </span>
      </div>
      <ProgressBar percent={rate} done={progress?.isCompleted} label={name} />
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
  /*
    Lỗi của TỪNG ô, hiện ngay dưới ô đó.

    Trước đây mọi lỗi trừ `endDate` đều dồn lên dải đỏ đầu biểu mẫu: nhập chỉ tiêu 0 thì
    câu báo lỗi nằm cách ô sai ba hàng, và người dùng bàn phím không có gì dẫn về chỗ cần
    sửa. Giữ dải đỏ cho thứ không thuộc ô nào — lỗi máy chủ trả về.
  */
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'targetValue' | 'endDate', string>>>({});

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);
    setFieldErrors({});

    const parsed = createGoalSchema.safeParse({
      type,
      targetValue: Number(targetValue),
      period,
      startDate: today,
      endDate: endDate || undefined,
    });

    if (!parsed.success) {
      const next: Partial<Record<'targetValue' | 'endDate', string>> = {};
      let rest: string | null = null;

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'targetValue' || field === 'endDate') next[field] ??= issue.message;
        else rest ??= issue.message;
      }

      setFieldErrors(next);
      // Chỉ nói "dữ liệu không hợp lệ" khi thật sự không gắn được lỗi nào vào ô nào.
      if (rest || Object.keys(next).length === 0) setValidationError(rest ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createGoal.mutate(parsed.data, {
      onSuccess: onCreated,
      // Lỗi máy chủ (vd trùng mục tiêu) đi vào dải đỏ, và ô nhập giữ nguyên thứ đã gõ.
      onError: () => setFieldErrors({}),
    });
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
          <Field label={t('Chỉ tiêu')} error={fieldErrors.targetValue}>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={targetValue}
              aria-invalid={fieldErrors.targetValue !== undefined}
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
            error={fieldErrors.endDate}
          >
            <Input
              type="date"
              min={today}
              value={endDate}
              aria-invalid={fieldErrors.endDate !== undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
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

    if (endDate === '') {
      setError(t('Chọn ngày hạn trước khi lưu'));
      return;
    }

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
          {/*
            Cố ý KHÔNG khoá nút khi chưa chọn ngày: nút mờ đi mà không nói vì sao là câu
            đố. Bấm thì `save` nói thẳng "Chọn ngày hạn trước khi lưu" ngay dưới ô nhập.
          */}
          <Button loading={updateGoal.isPending} onClick={() => save(value)}>
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
