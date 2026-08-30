import { useState } from 'react';
import { HabitFrequency } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Badge, Button, Card, EmptyState, ErrorMessage, Loading, PageHeader } from '../../../shared/components/ui';
import { HABIT_FREQUENCY_LABELS, formatWeekdays } from '../../../shared/lib/labels';
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
        description="Tạo thói quen và check-in mỗi ngày để giữ chuỗi"
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Đóng' : '+ Thêm thói quen'}</Button>}
      />

      {showForm && (
        <div className="mb-6">
          <HabitForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      {habits.isLoading && <Loading />}
      {habits.isError && <ErrorMessage>{getErrorMessage(habits.error)}</ErrorMessage>}

      {habits.data?.length === 0 && (
        <EmptyState
          title="Chưa có thói quen nào"
          description="Tạo thói quen đầu tiên, ví dụ: học 20 từ vựng mỗi ngày"
        />
      )}

      <div className="space-y-3">
        {habits.data?.map((habit) => <HabitCard key={habit.id} habit={habit} />)}
      </div>
    </div>
  );
}

function HabitCard({ habit }: { habit: Habit }): JSX.Element {
  const checkIn = useCheckInHabit();
  const deleteHabit = useDeleteHabit();

  // Lấy trạng thái từ backend (đã tính theo timezone user), cộng thêm kết quả vừa bấm
  // để nút đổi ngay lập tức mà không phải chờ refetch.
  const checkedInToday = habit.checkedInToday || checkIn.isSuccess;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{habit.name}</h3>
            <Badge>{HABIT_FREQUENCY_LABELS[habit.frequency]}</Badge>
            {!habit.isActive && <Badge>Tạm dừng</Badge>}
          </div>

          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
            {habit.frequency === HabitFrequency.CUSTOM && habit.customDays && (
              <span>Các ngày: {formatWeekdays(habit.customDays)}</span>
            )}
            {habit.reminderTime && <span>Nhắc lúc {habit.reminderTime}</span>}
          </div>

          {checkIn.isError && (
            <p className="mt-2 text-xs text-red-600">{getErrorMessage(checkIn.error)}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            onClick={() => checkIn.mutate({ id: habit.id })}
            disabled={checkIn.isPending || checkedInToday}
            variant={checkedInToday ? 'secondary' : 'primary'}
          >
            {checkedInToday ? '✓ Đã xong' : 'Check-in'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Xoá thói quen "${habit.name}"?`)) deleteHabit.mutate(habit.id);
            }}
          >
            Xoá
          </Button>
        </div>
      </div>
    </Card>
  );
}
