import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ListChecks, Pause, Pencil, Play, Plus, Target, Trash2, X, Zap } from 'lucide-react';
import {
  ActivityType,
  FeatureKey,
  GoalStatus,
  HabitDayLevel,
  HabitFrequency,
  addDays,
  habitPeriodStart,
  isScheduledDay,
  todayLocalDate,
  weeklyQuota,
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
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import {
  HABIT_AUTO_LABELS,
  HABIT_AUTO_UNITS,
  HABIT_FREQUENCY_LABELS,
  WEEKDAY_LABELS,
  goalName,
} from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useFeature } from '../../feature-flags/feature-flag.hooks';
import { useCheckInHabit, useDeleteHabit, useHabits, useUpdateHabit } from '../habit.hooks';
import type { Habit, HabitDay } from '../habit.api';
import { HabitForm } from './HabitForm';
import { useLocale, useT, type TranslateFn } from '../../../shared/i18n/language';

/** Một ô ngày đang mở trong hộp thoại: thói quen nào, ngày nào. */
interface DayTarget {
  habit: Habit;
  date: LocalDate;
}

/** Số ngày của dải lịch sử — khớp với số ngày tối đa backend cho check-in bù. */
const STRIP_DAYS = 7;

/** Đơn vị hiển thị của thói quen: thói quen tự động theo loại hoạt động, tự tích theo người dùng đặt. */
function unitOf(habit: Habit, t: TranslateFn): string {
  return habit.autoActivity ? t(HABIT_AUTO_UNITS[habit.autoActivity]) : (habit.unit ?? '');
}

export function HabitsPage(): JSX.Element {
  const t = useT();
  const toast = useToast();
  const user = useCurrentUser();
  const habits = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [openDay, setOpenDay] = useState<DayTarget | null>(null);

  const today = todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh');

  return (
    <div>
      <PageHeader
        title={t('Thói quen học tập')}
        description={t('Check-in mỗi ngày để giữ chuỗi và hình thành thói quen bền vững')}
        action={
          <Button icon={showForm ? X : Plus} onClick={() => setShowForm((v) => !v)}>
            {showForm ? t('Đóng') : t('Thêm thói quen')}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 animate-slide-up">
          <HabitForm onDone={() => setShowForm(false)} />
        </Card>
      )}

      {habits.isLoading && <SkeletonList rows={3} />}
      {habits.isError && <ErrorMessage>{getErrorMessage(habits.error)}</ErrorMessage>}

      {habits.data?.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={t('Chưa có thói quen nào')}
          description={t('Bắt đầu với một thói quen nhỏ và cụ thể, ví dụ: học 10 từ vựng mỗi ngày.')}
          action={
            !showForm && (
              <Button icon={Plus} onClick={() => setShowForm(true)}>
                {t('Tạo thói quen đầu tiên')}
              </Button>
            )
          }
        />
      )}

      <div className="space-y-3">
        {habits.data?.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            today={today}
            onEdit={() => setEditing(habit)}
            onOpenDay={(date) => setOpenDay({ habit, date })}
          />
        ))}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t('Sửa thói quen')}
        size="lg"
        closeOnBackdrop={false}
      >
        {editing && (
          <HabitForm
            key={editing.id}
            habit={editing}
            onDone={() => {
              setEditing(null);
              toast.success(t('Đã lưu thói quen'));
            }}
          />
        )}
      </Modal>

      {/* `key` theo từng ô để ghi chú gõ dở ở ô này không sang ô khác. */}
      {openDay && (
        <HabitDayModal
          key={`${openDay.habit.id}:${openDay.date}`}
          target={openDay}
          today={today}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}

function HabitCard({
  habit,
  today,
  onEdit,
  onOpenDay,
}: {
  habit: Habit;
  today: LocalDate;
  onEdit: () => void;
  onOpenDay: (date: LocalDate) => void;
}): JSX.Element {
  const t = useT();
  const confirm = useConfirm();
  const toast = useToast();
  const checkIn = useCheckInHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const name = habit.name;
  const isWeeklyMany = habit.frequency === HabitFrequency.WEEKLY && weeklyQuota(habit.timesPerWeek) > 1;

  // Kết hợp trạng thái từ server với kết quả vừa bấm để nút đổi ngay, không chờ refetch.
  const checkedInToday = habit.checkedInToday || checkIn.isSuccess;

  const handleCheckIn = (): void => {
    checkIn.mutate(
      { id: habit.id },
      {
        onSuccess: () => toast.success(t('Đã check-in "{name}"', { name })),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  // Tạm dừng không hỏi xác nhận: bấm "Tiếp tục" là trở lại y nguyên, không mất gì.
  const setActive = (isActive: boolean): void => {
    updateHabit.mutate(
      { id: habit.id, input: { isActive } },
      {
        onSuccess: () =>
          toast.success(
            isActive ? t('Đã tiếp tục theo dõi "{name}"', { name }) : t('Đã tạm dừng "{name}"', { name }),
          ),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  const handleDelete = async (): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá thói quen "{name}"?', { name }),
      message: t('Lịch sử check-in của thói quen này cũng mất theo và không khôi phục được.'),
      confirmLabel: t('Xoá thói quen'),
      tone: 'danger',
    });
    if (!ok) return;
    deleteHabit.mutate(habit.id, {
      onSuccess: () => toast.success(t('Đã xoá thói quen')),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const editLabel = t('Sửa thói quen {name}', { name });
  const pauseLabel = t('Tạm dừng thói quen {name}', { name });
  const deleteLabel = t('Xoá thói quen {name}', { name });

  return (
    <Card interactive>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-content">{name}</h2>
            <Badge tone={habit.isActive && habit.frequency === HabitFrequency.DAILY ? 'brand' : 'slate'}>
              {isWeeklyMany
                ? t('{n} lần/tuần', { n: weeklyQuota(habit.timesPerWeek) })
                : t(HABIT_FREQUENCY_LABELS[habit.frequency])}
            </Badge>
            {habit.autoActivity && (
              <Badge tone="slate" icon={Zap}>
                {t('Tự động')}
              </Badge>
            )}
            {!habit.isActive && <Badge>{t('Tạm dừng')}</Badge>}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
            {habit.autoActivity && <span>{t(HABIT_AUTO_LABELS[habit.autoActivity])}</span>}
            {habit.frequency === HabitFrequency.CUSTOM && habit.customDays && (
              <span>
                {t('Các ngày: {days}', {
                  days: habit.customDays.map((day) => t(WEEKDAY_LABELS[day - 1] ?? '?')).join(', '),
                })}
              </span>
            )}
            {habit.reminderTime && habit.isActive && (
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3 w-3" aria-hidden />
                {habit.reminderTime}
              </span>
            )}
            {habit.goal && habit.goal.status === GoalStatus.ACTIVE && (
              <span className="inline-flex items-center gap-1">
                <Target className="h-3 w-3" aria-hidden />
                {t('Mục tiêu: {name}', { name: t(goalName(habit.goal.type, habit.goal.period)) })}
              </span>
            )}
          </div>

          {habit.isActive ? (
            <>
              <AmountLine habit={habit} />
              <WeekStrip habit={habit} today={today} onOpenDay={onOpenDay} />
            </>
          ) : (
            <p className="mt-3 text-sm text-content-muted">
              {t('Đang tạm dừng: không nhắc và không check-in. Lịch sử vẫn được giữ nguyên.')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {!habit.isActive ? (
            <Button variant="secondary" icon={Play} loading={updateHabit.isPending} onClick={() => setActive(true)}>
              {t('Tiếp tục')}
            </Button>
          ) : habit.autoActivity ? (
            <AutoHabitAction habit={habit} today={today} />
          ) : (
            <Button
              onClick={handleCheckIn}
              loading={checkIn.isPending}
              disabled={checkedInToday}
              variant={checkedInToday ? 'secondary' : 'primary'}
              icon={checkedInToday ? Check : undefined}
            >
              {checkedInToday ? t('Đã xong') : t('Check-in')}
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={Pencil} onClick={onEdit} aria-label={editLabel} title={editLabel} />
          {habit.isActive && (
            <Button
              variant="ghost"
              size="sm"
              icon={Pause}
              loading={updateHabit.isPending}
              onClick={() => setActive(false)}
              aria-label={pauseLabel}
              title={pauseLabel}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleDelete}
            aria-label={deleteLabel}
            title={deleteLabel}
          />
        </div>
      </div>
    </Card>
  );
}

/**
 * Chỗ của nút Check-in trên thẻ thói quen tự động: không có gì để bấm — hoạt động học
 * tự đánh dấu. Xong rồi thì báo xong; chưa thì dẫn thẳng tới chỗ học để làm ngay.
 */
function AutoHabitAction({ habit, today }: { habit: Habit; today: LocalDate }): JSX.Element | null {
  const t = useT();
  const reviewEnabled = useFeature(FeatureKey.FLASHCARDS);
  const learnEnabled = useFeature(FeatureKey.LEARN);
  const todayLevel = habit.recentDays.find((day) => day.date === today)?.level;

  if (habit.checkedInToday) {
    return (
      <Badge tone="green" icon={Check}>
        {todayLevel === HabitDayLevel.MINIMUM ? t('Đạt mức tối thiểu') : t('Đã xong')}
      </Badge>
    );
  }

  const isReview = habit.autoActivity === ActivityType.FLASHCARD_REVIEWED;
  // Tính năng đã tắt thì không dẫn tới — bấm vào ra trang 404 còn tệ hơn không có nút.
  if (isReview ? !reviewEnabled : !learnEnabled) return null;

  return (
    <Link
      to={isReview ? '/review' : '/learn'}
      className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand shadow-sm transition-colors hover:bg-brand-strong"
    >
      {isReview ? t('Ôn ngay') : t('Học ngay')}
    </Link>
  );
}

/** Lượng hôm nay so với lượng mỗi lần, và mức tối thiểu nếu có. */
function AmountLine({ habit }: { habit: Habit }): JSX.Element | null {
  const t = useT();
  if (habit.targetAmount === null) return null;

  return (
    <p className="mt-2 text-xs text-content-soft">
      <span className="tabular-nums">
        {t('Hôm nay: {done}/{target} {unit}', {
          done: habit.todayAmount ?? 0,
          target: habit.targetAmount,
          unit: unitOf(habit, t),
        })}
      </span>
      {habit.minAmount !== null && (
        <span className="ml-2 text-content-muted">
          {t('· tối thiểu {min}', { min: habit.minAmount })}
        </span>
      )}
    </p>
  );
}

/** Ngày dạng ngắn "21/09" theo ngôn ngữ đang chọn. Ép UTC vì chuỗi ngày không mang giờ. */
function formatShortDay(date: LocalDate, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Dải 7 ngày gần nhất. Mỗi ô bấm được: ngày chưa làm thì check-in bù kèm lượng và ghi
 * chú, ngày đã làm thì đọc lại.
 *
 * Ngày chỉ đạt mức tối thiểu vẽ bằng VIỀN thay vì tô kín — khác nhau ở hình chứ không chỉ
 * ở màu, để người không phân biệt được màu vẫn đọc ra.
 *
 * Con số bên cạnh đếm theo NGÀY ĐẾN HẠN chứ không theo 7 ngày: thói quen T2-T4-T6 làm
 * đủ ba buổi mà hiện "3/7" thì trông như đang trượt, dù người dùng không sai buổi nào.
 */
function WeekStrip({
  habit,
  today,
  onOpenDay,
}: {
  habit: Habit;
  today: LocalDate;
  onOpenDay: (date: LocalDate) => void;
}): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const byDate = new Map(habit.recentDays.map((day) => [day.date, day]));
  const schedule = { frequency: habit.frequency, customDays: habit.customDays };

  // 7 ngày gần nhất, cũ nhất bên trái để đọc theo chiều thời gian tự nhiên.
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, -(STRIP_DAYS - 1 - i)));

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {days.map((date) => {
        const level = byDate.get(date)?.level ?? null;
        const isToday = date === today;
        const scheduled = isScheduledDay(schedule, date);
        // getUTCDay(): 0 = Chủ nhật → đổi sang chỉ số mảng bắt đầu từ Thứ Hai
        const weekday = t(WEEKDAY_LABELS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7] ?? '?');
        const shortDate = formatShortDay(date, locale);
        const label =
          level === HabitDayLevel.FULL
            ? t('{date} — đã xong', { date: shortDate })
            : level === HabitDayLevel.MINIMUM
              ? t('{date} — đạt mức tối thiểu', { date: shortDate })
              : scheduled
                ? t('{date} — chưa xong', { date: shortDate })
                : t('{date} — không phải ngày đến hạn', { date: shortDate });

        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenDay(date)}
              aria-label={label}
              title={label}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                level === HabitDayLevel.FULL
                  ? 'bg-brand text-on-brand hover:bg-brand-strong'
                  : level === HabitDayLevel.MINIMUM
                    ? 'border-2 border-brand text-brand-strong hover:bg-brand/10'
                    : scheduled
                      ? 'bg-sunken hover:bg-line'
                      : 'border border-dashed border-line hover:bg-sunken'
              } ${isToday ? 'ring-2 ring-brand/30 ring-offset-1' : ''}`}
            >
              {level && <Check className="h-3.5 w-3.5" aria-hidden />}
            </button>
            <span className={`text-[10px] ${isToday ? 'font-medium text-content-soft' : 'text-content-muted'}`}>
              {weekday}
            </span>
          </div>
        );
      })}

      <span className="ml-2 text-xs text-content-muted">
        <StripSummary habit={habit} days={days} byDate={byDate} today={today} />
      </span>
    </div>
  );
}

function StripSummary({
  habit,
  days,
  byDate,
  today,
}: {
  habit: Habit;
  days: LocalDate[];
  byDate: Map<LocalDate, HabitDay>;
  today: LocalDate;
}): JSX.Element {
  const t = useT();
  const isDone = (date: LocalDate): boolean => Boolean(byDate.get(date)?.level);

  if (habit.frequency === HabitFrequency.WEEKLY) {
    const weekStart = habitPeriodStart(habit.frequency, today);
    const doneThisWeek = days.filter((date) => date >= weekStart && isDone(date)).length;
    return (
      <>{t('Tuần này: {done}/{quota} lần', { done: doneThisWeek, quota: weeklyQuota(habit.timesPerWeek) })}</>
    );
  }

  if (habit.frequency === HabitFrequency.CUSTOM) {
    const schedule = { frequency: habit.frequency, customDays: habit.customDays };
    const due = days.filter((date) => isScheduledDay(schedule, date));
    return <>{t('{done}/{due} ngày đến hạn', { done: due.filter(isDone).length, due: due.length })}</>;
  }

  return <>{t('{n}/7 ngày', { n: days.filter(isDone).length })}</>;
}

/**
 * Hộp thoại của một ô ngày.
 *
 * - Thói quen tự động: chỉ để xem ngày đó làm được bao nhiêu — không có gì để bấm.
 * - Thói quen tự tích đã làm: đọc lại lượng và ghi chú.
 * - Thói quen tự tích chưa làm: check-in (kể cả bù) kèm lượng và ghi chú.
 *
 * Nút Check-in lớn trên thẻ vẫn là một chạm, không hỏi gì: đó là thao tác hằng ngày và
 * phải nhanh. Ai muốn ghi lượng khác hay ghi chú thì bấm vào ô ngày.
 */
function HabitDayModal({
  target,
  today,
  onClose,
}: {
  target: DayTarget;
  today: LocalDate;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const { habit, date } = target;
  const entry = habit.recentDays.find((day) => day.date === date);
  const longDate = new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  if (habit.autoActivity || entry) {
    return (
      <Modal
        open
        onClose={onClose}
        title={longDate}
        footer={
          <Button variant="secondary" onClick={onClose}>
            {t('Đóng')}
          </Button>
        }
      >
        <DayDetails habit={habit} entry={entry} />
      </Modal>
    );
  }

  return <CheckInForm habit={habit} date={date} longDate={longDate} isToday={date === today} onClose={onClose} />;
}

function DayDetails({ habit, entry }: { habit: Habit; entry: HabitDay | undefined }): JSX.Element {
  const t = useT();
  const unit = unitOf(habit, t);
  const levelText =
    entry?.level === HabitDayLevel.FULL
      ? t('Đã xong.')
      : entry?.level === HabitDayLevel.MINIMUM
        ? t('Đạt mức tối thiểu — vẫn tính là đã làm.')
        : habit.autoActivity && (entry?.amount ?? 0) > 0
          ? t('Chưa đạt mức tối thiểu.')
          : t('Chưa có hoạt động nào.');

  return (
    <div className="space-y-3">
      <p>
        {habit.name}: {levelText}
      </p>
      {habit.targetAmount !== null && entry?.amount !== null && entry?.amount !== undefined && (
        <p className="tabular-nums text-content">
          {t('Đã làm {done}/{target} {unit}', { done: entry.amount, target: habit.targetAmount, unit })}
        </p>
      )}
      {!habit.autoActivity &&
        (entry?.note ? (
          <p className="whitespace-pre-line rounded-lg bg-sunken p-3 text-content">{entry.note}</p>
        ) : (
          <p className="text-content-muted">{t('Không có ghi chú.')}</p>
        ))}
    </div>
  );
}

function CheckInForm({
  habit,
  date,
  longDate,
  isToday,
  onClose,
}: {
  habit: Habit;
  date: LocalDate;
  longDate: string;
  isToday: boolean;
  onClose: () => void;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const checkIn = useCheckInHabit();
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState(habit.targetAmount?.toString() ?? '');
  const unit = unitOf(habit, t);

  const submit = (): void => {
    checkIn.mutate(
      {
        id: habit.id,
        input: {
          date,
          note: note.trim() || undefined,
          amount: habit.targetAmount !== null && amount.trim() !== '' ? Number(amount) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('Đã check-in "{name}"', { name: habit.name }));
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isToday ? t('Check-in hôm nay') : t('Check-in bù')}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Huỷ')}
          </Button>
          <Button loading={checkIn.isPending} onClick={submit}>
            {t('Check-in')}
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-3"
      >
        <ErrorMessage>{checkIn.error ? getErrorMessage(checkIn.error) : null}</ErrorMessage>
        <p>{t('Đánh dấu đã làm "{name}" vào {date}.', { name: habit.name, date: longDate })}</p>

        {habit.targetAmount !== null && (
          <Field
            label={unit ? t('Đã làm bao nhiêu ({unit})', { unit }) : t('Đã làm bao nhiêu')}
            hint={
              habit.minAmount !== null
                ? t('Đủ là {target}, tối thiểu {min} vẫn được tính.', {
                    target: habit.targetAmount,
                    min: habit.minAmount,
                  })
                : t('Đủ là {target}.', { target: habit.targetAmount })
            }
          >
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
        )}

        <label className="block">
          <span className="text-sm font-medium text-content-soft">{t('Ghi chú (không bắt buộc)')}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t('Ví dụ: hôm nay khó vì...')}
            className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </form>
    </Modal>
  );
}
