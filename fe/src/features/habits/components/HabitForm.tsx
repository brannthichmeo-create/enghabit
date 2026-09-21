import { useState, type FormEvent } from 'react';
import { HabitFrequency, createHabitSchema, updateHabitSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ErrorMessage, Field, Input, Select } from '../../../shared/components/ui';
import { WEEKDAY_LABELS } from '../../../shared/lib/labels';
import { useCreateHabit, useUpdateHabit } from '../habit.hooks';
import type { Habit } from '../habit.api';
import { useT } from '../../../shared/i18n/language';

/**
 * Biểu mẫu tạo và sửa thói quen. Có `habit` là sửa, không có là tạo mới.
 *
 * Một biểu mẫu cho cả hai việc: tách đôi thì mỗi lần thêm một ô (vd số lượng) lại phải
 * nhớ thêm ở hai nơi, và sớm muộn hai bản sẽ validate khác nhau.
 *
 * Không tự bọc `Card` — chỗ gọi quyết định khung: trang dùng thẻ, sửa thì dùng hộp thoại.
 */
export function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }): JSX.Element {
  const t = useT();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const [name, setName] = useState(habit?.name ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? HabitFrequency.DAILY);
  const [customDays, setCustomDays] = useState<number[]>(habit?.customDays ?? []);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = habit ? updateHabit : createHabit;

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    const values = {
      name,
      frequency,
      customDays: frequency === HabitFrequency.CUSTOM ? customDays : undefined,
    };

    if (habit) {
      // Sửa thì gửi `null` để XOÁ giờ nhắc; bỏ trống mà gửi `undefined` thì máy chủ
      // hiểu là "không đổi" và giờ nhắc cũ vẫn còn đó.
      const parsed = updateHabitSchema.safeParse({ ...values, reminderTime: reminderTime || null });
      if (!parsed.success) {
        setValidationError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
        return;
      }
      updateHabit.mutate({ id: habit.id, input: parsed.data }, { onSuccess: onDone });
      return;
    }

    // Validate bằng đúng schema backend dùng — rule chỉ định nghĩa một lần ở shared/.
    const parsed = createHabitSchema.safeParse({
      ...values,
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
        onDone();
      },
    });
  };

  const toggleDay = (day: number): void => {
    setCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const errorMessage = validationError ?? (mutation.error ? getErrorMessage(mutation.error) : null);

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage>{errorMessage}</ErrorMessage>

      <Field label={t('Tên thói quen')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('Ví dụ: Học 20 từ vựng')}
          maxLength={120}
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

        <Field
          label={t('Giờ nhắc (tuỳ chọn)')}
          hint={t('Theo múi giờ của bạn. Đã check-in thì không nhắc nữa.')}
        >
          <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
        </Field>
      </div>

      {frequency === HabitFrequency.CUSTOM && (
        <Field label={t('Chọn các ngày trong tuần')}>
          <div className="mt-1 flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, index) => {
              const day = index + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={customDays.includes(day)}
                  className={`h-9 w-11 rounded-lg text-sm font-medium transition ${
                    customDays.includes(day)
                      ? 'bg-brand text-on-brand'
                      : 'bg-sunken text-content-soft hover:bg-line'
                  }`}
                >
                  {t(label)}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <Button type="submit" loading={mutation.isPending}>
        {habit ? t('Lưu thay đổi') : t('Tạo thói quen')}
      </Button>
    </form>
  );
}
