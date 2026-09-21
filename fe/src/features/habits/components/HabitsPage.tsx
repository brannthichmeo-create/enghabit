import { useState } from 'react';
import { Bell, Check, ListChecks, Pause, Pencil, Play, Plus, Trash2, X } from 'lucide-react';
import {
  HabitFrequency,
  addDays,
  habitPeriodStart,
  isScheduledDay,
  todayLocalDate,
  type LocalDate,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  SkeletonList,
  PageHeader,
} from '../../../shared/components/ui';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { HABIT_FREQUENCY_LABELS, WEEKDAY_LABELS } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useCheckInHabit, useDeleteHabit, useHabits, useUpdateHabit } from '../habit.hooks';
import type { Habit } from '../habit.api';
import { HabitForm } from './HabitForm';
import { useLocale, useT } from '../../../shared/i18n/language';

/** Một ô ngày đang mở trong hộp thoại: thói quen nào, ngày nào. */
interface DayTarget {
  habit: Habit;
  date: LocalDate;
}

/** Số ngày của dải lịch sử — khớp với số ngày tối đa backend cho check-in bù. */
const STRIP_DAYS = 7;

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
              {t(HABIT_FREQUENCY_LABELS[habit.frequency])}
            </Badge>
            {!habit.isActive && <Badge>{t('Tạm dừng')}</Badge>}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted">
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
          </div>

          {habit.isActive ? (
            <WeekStrip habit={habit} today={today} onOpenDay={onOpenDay} />
          ) : (
            <p className="mt-3 text-sm text-content-muted">
              {t('Đang tạm dừng: không nhắc và không check-in. Lịch sử vẫn được giữ nguyên.')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {habit.isActive ? (
            <Button
              onClick={handleCheckIn}
              loading={checkIn.isPending}
              disabled={checkedInToday}
              variant={checkedInToday ? 'secondary' : 'primary'}
              icon={checkedInToday ? Check : undefined}
            >
              {checkedInToday ? t('Đã xong') : t('Check-in')}
            </Button>
          ) : (
            <Button variant="secondary" icon={Play} loading={updateHabit.isPending} onClick={() => setActive(true)}>
              {t('Tiếp tục')}
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

/** Ngày dạng ngắn "21/09" theo ngôn ngữ đang chọn. Ép UTC vì chuỗi ngày không mang giờ. */
function formatShortDay(date: LocalDate, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Dải 7 ngày gần nhất — ô đặc là ngày đã check-in. Mỗi ô bấm được: ngày chưa làm thì
 * check-in bù kèm ghi chú, ngày đã làm thì đọc lại ghi chú.
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
  const done = new Set(habit.recentCheckIns.map((c) => c.date));
  const schedule = { frequency: habit.frequency, customDays: habit.customDays };

  // 7 ngày gần nhất, cũ nhất bên trái để đọc theo chiều thời gian tự nhiên.
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, -(STRIP_DAYS - 1 - i)));

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {days.map((date) => {
        const isDone = done.has(date);
        const isToday = date === today;
        const scheduled = isScheduledDay(schedule, date);
        // getUTCDay(): 0 = Chủ nhật → đổi sang chỉ số mảng bắt đầu từ Thứ Hai
        const weekday = t(WEEKDAY_LABELS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7] ?? '?');
        const shortDate = formatShortDay(date, locale);
        const label = isDone
          ? t('{date} — đã check-in', { date: shortDate })
          : scheduled
            ? t('{date} — chưa check-in', { date: shortDate })
            : t('{date} — không phải ngày đến hạn', { date: shortDate });

        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenDay(date)}
              aria-label={label}
              title={label}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                isDone
                  ? 'bg-brand text-on-brand hover:bg-brand-strong'
                  : scheduled
                    ? 'bg-sunken hover:bg-line'
                    : 'border border-dashed border-line hover:bg-sunken'
              } ${isToday ? 'ring-2 ring-brand/30 ring-offset-1' : ''}`}
            >
              {isDone && <Check className="h-3.5 w-3.5" aria-hidden />}
            </button>
            <span className={`text-[10px] ${isToday ? 'font-medium text-content-soft' : 'text-content-muted'}`}>
              {weekday}
            </span>
          </div>
        );
      })}

      <span className="ml-2 text-xs text-content-muted">
        <StripSummary habit={habit} days={days} done={done} today={today} />
      </span>
    </div>
  );
}

function StripSummary({
  habit,
  days,
  done,
  today,
}: {
  habit: Habit;
  days: LocalDate[];
  done: Set<LocalDate>;
  today: LocalDate;
}): JSX.Element {
  const t = useT();

  if (habit.frequency === HabitFrequency.WEEKLY) {
    const weekStart = habitPeriodStart(habit.frequency, today);
    const doneThisWeek = [...done].some((date) => date >= weekStart);
    return <>{doneThisWeek ? t('Tuần này: đã xong') : t('Tuần này: chưa làm')}</>;
  }

  if (habit.frequency === HabitFrequency.CUSTOM) {
    const schedule = { frequency: habit.frequency, customDays: habit.customDays };
    const due = days.filter((date) => isScheduledDay(schedule, date));
    const doneOnDue = due.filter((date) => done.has(date)).length;
    return <>{t('{done}/{due} ngày đến hạn', { done: doneOnDue, due: due.length })}</>;
  }

  return <>{t('{n}/7 ngày', { n: days.filter((date) => done.has(date)).length })}</>;
}

/**
 * Hộp thoại của một ô ngày: check-in (kể cả bù) kèm ghi chú, hoặc đọc lại ghi chú.
 *
 * Nút Check-in lớn trên thẻ vẫn là một chạm, không hỏi ghi chú: đó là thao tác hằng
 * ngày và phải nhanh. Ai muốn ghi thì bấm vào ô hôm nay.
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
  const toast = useToast();
  const checkIn = useCheckInHabit();
  const [note, setNote] = useState('');

  const { habit, date } = target;
  const entry = habit.recentCheckIns.find((c) => c.date === date);
  const longDate = new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  if (entry) {
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
        <p>{t('Đã check-in "{name}" ngày này.', { name: habit.name })}</p>
        {entry.note ? (
          <p className="mt-3 whitespace-pre-line rounded-lg bg-sunken p-3 text-content">{entry.note}</p>
        ) : (
          <p className="mt-3 text-content-muted">{t('Không có ghi chú.')}</p>
        )}
      </Modal>
    );
  }

  const submit = (): void => {
    checkIn.mutate(
      { id: habit.id, input: { date, note: note.trim() || undefined } },
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
      title={date === today ? t('Check-in hôm nay') : t('Check-in bù')}
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
        <label className="block">
          <span className="text-sm font-medium text-content-soft">{t('Ghi chú (không bắt buộc)')}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t('Ví dụ: hôm nay khó vì...')}
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </form>
    </Modal>
  );
}
