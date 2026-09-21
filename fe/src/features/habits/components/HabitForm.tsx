import { useState, type FormEvent } from 'react';
import {
  FeatureKey,
  GoalStatus,
  HABIT_AUTO_ACTIVITIES,
  HabitFrequency,
  createHabitSchema,
  updateHabitSchema,
  type HabitAutoActivity,
} from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, ErrorMessage, Field, Input, Select } from '../../../shared/components/ui';
import { HABIT_AUTO_LABELS, HABIT_AUTO_UNITS, WEEKDAY_LABELS, goalName } from '../../../shared/lib/labels';
import { useFeature, useFeatureQueryEnabled } from '../../feature-flags/feature-flag.hooks';
import { useGoals } from '../../goals/goal.hooks';
import { useCreateHabit, useUpdateHabit } from '../habit.hooks';
import type { Habit } from '../habit.api';
import { useT } from '../../../shared/i18n/language';

/** Ô số để trống nghĩa là "không đặt". */
function toNumberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

/**
 * Biểu mẫu tạo và sửa thói quen. Có `habit` là sửa, không có là tạo mới.
 *
 * Một biểu mẫu cho cả hai việc: tách đôi thì mỗi lần thêm một ô lại phải nhớ thêm ở hai
 * nơi, và sớm muộn hai bản sẽ validate khác nhau.
 *
 * Không tự bọc `Card` — chỗ gọi quyết định khung: trang dùng thẻ, sửa thì dùng hộp thoại.
 */
export function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }): JSX.Element {
  const t = useT();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const goalsEnabled = useFeature(FeatureKey.GOALS);
  const goals = useGoals(useFeatureQueryEnabled(FeatureKey.GOALS));

  const [name, setName] = useState(habit?.name ?? '');
  const [autoActivity, setAutoActivity] = useState<HabitAutoActivity | ''>(habit?.autoActivity ?? '');
  const [targetAmount, setTargetAmount] = useState(habit?.targetAmount?.toString() ?? '');
  const [minAmount, setMinAmount] = useState(habit?.minAmount?.toString() ?? '');
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? HabitFrequency.DAILY);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.timesPerWeek?.toString() ?? '1');
  const [customDays, setCustomDays] = useState<number[]>(habit?.customDays ?? []);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '');
  const [goalId, setGoalId] = useState(habit?.goalId?.toString() ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = habit ? updateHabit : createHabit;
  const isAuto = autoActivity !== '';
  const unitLabel = isAuto ? t(HABIT_AUTO_UNITS[autoActivity]) : unit.trim();

  // Mục tiêu đang gắn vẫn phải có trong danh sách dù đã kết thúc, không thì ô chọn nhảy
  // về "Không gắn" và bấm Lưu là âm thầm gỡ liên kết.
  const goalOptions =
    goals.data?.filter((goal) => goal.status === GoalStatus.ACTIVE || goal.id === habit?.goalId) ?? [];

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    const target = toNumberOrNull(targetAmount);
    const values = {
      name,
      frequency,
      customDays: frequency === HabitFrequency.CUSTOM ? customDays : undefined,
      autoActivity: isAuto ? autoActivity : null,
      // Thói quen tự động luôn có lượng: bỏ trống là "ít nhất một lần".
      targetAmount: isAuto ? (target ?? 1) : target,
      minAmount: toNumberOrNull(minAmount),
      unit: isAuto ? null : unit.trim() || null,
      timesPerWeek: frequency === HabitFrequency.WEEKLY ? (toNumberOrNull(timesPerWeek) ?? 1) : null,
      goalId: goalId ? Number(goalId) : null,
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
        setTargetAmount('');
        setMinAmount('');
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

      <Field
        label={t('Cách đánh dấu')}
        hint={
          isAuto
            ? t('Tự đánh dấu xong khi bạn học trong ứng dụng, không cần bấm check-in.')
            : t('Bạn tự bấm check-in. Mỗi ngày chỉ một lượt tự tích được tính vào chuỗi và XP.')
        }
      >
        <Select value={autoActivity} onChange={(e) => setAutoActivity(e.target.value as HabitAutoActivity | '')}>
          <option value="">{t('Tự tích (việc làm ngoài ứng dụng)')}</option>
          {HABIT_AUTO_ACTIVITIES.map((activity) => (
            <option key={activity} value={activity}>
              {t(HABIT_AUTO_LABELS[activity])}
            </option>
          ))}
        </Select>
      </Field>

      <div className={`grid gap-4 ${isAuto ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        <Field
          label={isAuto ? t('Số {unit} mỗi lần', { unit: unitLabel }) : t('Lượng mỗi lần (tuỳ chọn)')}
          hint={isAuto ? undefined : t('Bỏ trống nếu chỉ cần đánh dấu đã làm.')}
        >
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={targetAmount}
            placeholder={isAuto ? '1' : undefined}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </Field>

        {!isAuto && (
          <Field label={t('Đơn vị')} hint={t('Ví dụ: phút, trang, bài')}>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={20} />
          </Field>
        )}

        <Field
          label={t('Mức tối thiểu (tuỳ chọn)')}
          hint={t('Ngày bận làm được mức này vẫn tính là đã làm.')}
        >
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Tần suất')}>
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as HabitFrequency)}>
            <option value={HabitFrequency.DAILY}>{t('Hằng ngày')}</option>
            <option value={HabitFrequency.WEEKLY}>{t('Hằng tuần')}</option>
            <option value={HabitFrequency.CUSTOM}>{t('Tuỳ chọn theo thứ')}</option>
          </Select>
        </Field>

        {frequency === HabitFrequency.WEEKLY && (
          <Field label={t('Số lần mỗi tuần')} hint={t('Làm hôm nào trong tuần cũng được.')}>
            <Input
              type="number"
              min={1}
              max={7}
              inputMode="numeric"
              value={timesPerWeek}
              onChange={(e) => setTimesPerWeek(e.target.value)}
            />
          </Field>
        )}
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

      <Field
        label={t('Giờ nhắc (tuỳ chọn)')}
        hint={
          frequency === HabitFrequency.WEEKLY
            ? t('Nhắc mỗi ngày tới khi làm đủ số lần của tuần.')
            : t('Theo múi giờ của bạn. Đã làm xong thì không nhắc nữa.')
        }
      >
        <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
      </Field>

      {goalsEnabled && (
        <Field label={t('Phục vụ mục tiêu (tuỳ chọn)')}>
          <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">{t('Không gắn mục tiêu')}</option>
            {goalOptions.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {t('{name}: {target}', { name: t(goalName(goal.type, goal.period)), target: goal.targetValue })}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Button type="submit" loading={mutation.isPending}>
        {habit ? t('Lưu thay đổi') : t('Tạo thói quen')}
      </Button>
    </form>
  );
}
