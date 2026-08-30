import { useState } from 'react';
import { Bell, Check, ListChecks, Plus, Trash2, X } from 'lucide-react';
import { HabitFrequency, addDays, todayLocalDate } from '@enghabit/shared';
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
import { useToast } from '../../../shared/components/Toast';
import { HABIT_FREQUENCY_LABELS, WEEKDAY_LABELS, formatWeekdays } from '../../../shared/lib/labels';
import { useCurrentUser } from '../../auth/auth.store';
import { useCheckInHabit, useDeleteHabit, useHabits } from '../habit.hooks';
import type { Habit } from '../habit.api';
import { HabitForm } from './HabitForm';

export function HabitsPage(): JSX.Element {
  const habits = useHabits();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="Thói quen học tập"
        description="Check-in mỗi ngày để giữ chuỗi và hình thành thói quen bền vững"
        action={
          <Button icon={showForm ? X : Plus} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Đóng' : 'Thêm thói quen'}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6 animate-slide-up">
          <HabitForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      {habits.isLoading && <SkeletonList rows={3} />}
      {habits.isError && <ErrorMessage>{getErrorMessage(habits.error)}</ErrorMessage>}

      {habits.data?.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="Chưa có thói quen nào"
          description="Bắt đầu với một thói quen nhỏ và cụ thể, ví dụ: học 10 từ vựng mỗi ngày."
          action={
            !showForm && (
              <Button icon={Plus} onClick={() => setShowForm(true)}>
                Tạo thói quen đầu tiên
              </Button>
            )
          }
        />
      )}

      <div className="space-y-3">
        {habits.data?.map((habit) => <HabitCard key={habit.id} habit={habit} />)}
      </div>
    </div>
  );
}

function HabitCard({ habit }: { habit: Habit }): JSX.Element {
  const toast = useToast();
  const checkIn = useCheckInHabit();
  const deleteHabit = useDeleteHabit();

  // Kết hợp trạng thái từ server với kết quả vừa bấm để nút đổi ngay, không chờ refetch.
  const checkedInToday = habit.checkedInToday || checkIn.isSuccess;

  const handleCheckIn = (): void => {
    checkIn.mutate(
      { id: habit.id },
      {
        onSuccess: () => toast.success(`Đã check-in "${habit.name}"`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  const handleDelete = (): void => {
    if (!confirm(`Xoá thói quen "${habit.name}"? Lịch sử check-in cũng sẽ mất.`)) return;
    deleteHabit.mutate(habit.id, {
      onSuccess: () => toast.success('Đã xoá thói quen'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <Card interactive>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{habit.name}</h3>
            <Badge tone={habit.frequency === HabitFrequency.DAILY ? 'brand' : 'slate'}>
              {HABIT_FREQUENCY_LABELS[habit.frequency]}
            </Badge>
            {!habit.isActive && <Badge>Tạm dừng</Badge>}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {habit.frequency === HabitFrequency.CUSTOM && habit.customDays && (
              <span>Các ngày: {formatWeekdays(habit.customDays)}</span>
            )}
            {habit.reminderTime && (
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3 w-3" aria-hidden />
                {habit.reminderTime}
              </span>
            )}
          </div>

          <WeekStrip checkedDates={habit.recentCheckIns} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            onClick={handleCheckIn}
            loading={checkIn.isPending}
            disabled={checkedInToday}
            variant={checkedInToday ? 'secondary' : 'primary'}
            icon={checkedInToday ? Check : undefined}
          >
            {checkedInToday ? 'Đã xong' : 'Check-in'}
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2} onClick={handleDelete} aria-label="Xoá thói quen" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Dải 7 ngày gần nhất — ô đặc là ngày đã check-in.
 *
 * Đây là thông tin quan trọng nhất của một app thói quen nhưng trước đây không hiển thị:
 * user chỉ thấy nút bấm mà không biết mình có đang duy trì đều hay không.
 */
function WeekStrip({ checkedDates }: { checkedDates: string[] }): JSX.Element {
  const user = useCurrentUser();
  const today = todayLocalDate(user?.timezone ?? 'Asia/Ho_Chi_Minh');
  const done = new Set(checkedDates);

  // 7 ngày gần nhất, cũ nhất bên trái để đọc theo chiều thời gian tự nhiên.
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));

  return (
    <div className="mt-3 flex items-center gap-1.5">
      {days.map((date) => {
        const isDone = done.has(date);
        const isToday = date === today;
        // getUTCDay(): 0 = Chủ nhật → đổi sang chỉ số mảng bắt đầu từ Thứ Hai
        const weekday = WEEKDAY_LABELS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7];

        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <div
              title={`${date}${isDone ? ' — đã check-in' : ''}`}
              className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-medium ${
                isDone ? 'bg-brand text-white' : 'bg-slate-100 text-transparent'
              } ${isToday ? 'ring-2 ring-brand/30 ring-offset-1' : ''}`}
            >
              {isDone && <Check className="h-3 w-3" aria-hidden />}
            </div>
            <span className={`text-[9px] ${isToday ? 'font-medium text-slate-600' : 'text-slate-400'}`}>
              {weekday}
            </span>
          </div>
        );
      })}

      <span className="ml-2 text-xs text-slate-400">
        {done.size}/7 ngày
      </span>
    </div>
  );
}
