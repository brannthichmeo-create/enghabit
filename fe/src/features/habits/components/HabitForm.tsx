import { useState, type FormEvent } from 'react';
import { HabitFrequency, createHabitSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, ErrorMessage, Field, Input, Select } from '../../../shared/components/ui';
import { useCreateHabit } from '../habit.hooks';
import { useT } from '../../../shared/i18n/language';

const WEEKDAYS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 7, label: 'CN' },
];

export function HabitForm({ onCreated }: { onCreated: () => void }): JSX.Element {
  const t = useT();
  const createHabit = useCreateHabit();
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>(HabitFrequency.DAILY);
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    // Validate bằng đúng schema backend dùng — rule chỉ định nghĩa một lần ở shared/.
    const parsed = createHabitSchema.safeParse({
      name,
      frequency,
      customDays: frequency === HabitFrequency.CUSTOM ? customDays : undefined,
      reminderTime: reminderTime || undefined,
      isActive: true,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    createHabit.mutate(parsed.data, {
      onSuccess: () => {
        setName('');
        setCustomDays([]);
        setReminderTime('');
        onCreated();
      },
    });
  };

  const toggleDay = (day: number): void => {
    setCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const errorMessage = validationError ?? (createHabit.error ? getErrorMessage(createHabit.error) : null);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage>{errorMessage}</ErrorMessage>

        <Field label={t('Tên thói quen')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Ví dụ: Học 20 từ vựng')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Tần suất')}>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as HabitFrequency)}>
              <option value={HabitFrequency.DAILY}>{t('Hằng ngày')}</option>
              <option value={HabitFrequency.WEEKLY}>{t('Hằng tuần')}</option>
              <option value={HabitFrequency.CUSTOM}>{t('Tuỳ chọn theo thứ')}</option>
            </Select>
          </Field>

          <Field label={t('Giờ nhắc (tuỳ chọn)')} hint={t('Theo múi giờ của bạn')}>
            <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
          </Field>
        </div>

        {frequency === HabitFrequency.CUSTOM && (
          <Field label={t('Chọn các ngày trong tuần')}>
            <div className="mt-1 flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`h-9 w-11 rounded-lg text-sm font-medium transition ${
                    customDays.includes(day.value)
                      ? 'bg-brand text-on-brand'
                      : 'bg-sunken text-content-soft hover:bg-line'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Button type="submit" disabled={createHabit.isPending}>
          {createHabit.isPending ? t('Đang tạo...') : t('Tạo thói quen')}
        </Button>
      </form>
    </Card>
  );
}
