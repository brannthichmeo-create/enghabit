import { useEffect, useState } from 'react';
import { Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MAX_REMINDERS_PER_USER, type Reminder } from '@enghabit/shared';
import { WEEKDAY_LABELS, formatWeekdays } from '../../../shared/lib/labels';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  SectionTitle,
  SkeletonList,
} from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import {
  useCreateReminder,
  useDeleteReminder,
  useNotificationSetting,
  useReminders,
  useUpdateNotificationSetting,
  useUpdateReminder,
} from '../notification.hooks';
import { useT } from '../../../shared/i18n/language';

/**
 * Cài đặt nhắc nhở: công tắc chung + danh sách các lời nhắc trong ngày.
 *
 * Nhiều lời nhắc chứ không phải một, vì thói quen học của mỗi người rơi vào những khung
 * giờ khác nhau (sáng trước khi đi làm, tối trước khi ngủ) — ép về một giờ duy nhất thì
 * người dùng phải chọn bỏ một trong hai.
 *
 * Giờ nhắc tính theo timezone trong hồ sơ cá nhân, không theo giờ máy chủ — nói rõ
 * điều này ngay dưới ô nhập, vì đây là chỗ người dùng dễ hiểu nhầm nhất.
 */
export function ReminderSettings(): JSX.Element {
  const t = useT();
  const setting = useNotificationSetting();
  const reminders = useReminders();
  const update = useUpdateNotificationSetting();
  const toast = useToast();

  const [isEnabled, setIsEnabled] = useState(true);
  const [remindStreakAtRisk, setRemindStreakAtRisk] = useState(true);
  const [remindReviewDue, setRemindReviewDue] = useState(true);

  // Nạp giá trị đang lưu một lần khi dữ liệu về.
  useEffect(() => {
    if (!setting.data) return;
    setIsEnabled(setting.data.isEnabled);
    setRemindStreakAtRisk(setting.data.remindStreakAtRisk);
    setRemindReviewDue(setting.data.remindReviewDue);
  }, [setting.data]);

  if (setting.isLoading) return <SkeletonList rows={2} />;
  if (setting.isError) return <ErrorMessage>{getErrorMessage(setting.error)}</ErrorMessage>;

  const save = (): void => {
    update.mutate(
      { isEnabled, remindStreakAtRisk, remindReviewDue },
      { onSuccess: () => toast.success(t('Đã lưu cài đặt nhắc nhở')) },
    );
  };

  return (
    // id để trang thông báo trỏ thẳng tới đây bằng /profile#nhac-nho
    <section id="nhac-nho" className="scroll-mt-20">
      <SectionTitle>{t('Cài đặt nhắc nhở')}</SectionTitle>

      <Card>
        {update.isError && <ErrorMessage>{getErrorMessage(update.error)}</ErrorMessage>}

        <Toggle
          checked={isEnabled}
          onChange={setIsEnabled}
          label={t('Bật nhắc nhở học tập')}
          hint={t('Tắt thì không nhận bất kỳ nhắc nhở tự động nào.')}
        />

        <div className={`mt-5 space-y-3 border-t border-line pt-4 ${isEnabled ? '' : 'pointer-events-none opacity-50'}`}>
          <Toggle
            checked={remindStreakAtRisk}
            onChange={setRemindStreakAtRisk}
            label={t('Cảnh báo chuỗi sắp đứt')}
            hint={t('Gửi lúc 21:30 nếu hôm đó bạn chưa học và đang có chuỗi.')}
          />
          <Toggle
            checked={remindReviewDue}
            onChange={setRemindReviewDue}
            label={t('Nhắc thẻ tới hạn ôn')}
            hint={t('Lời nhắc hằng ngày sẽ kèm số thẻ flashcard cần ôn.')}
          />
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <Button onClick={save} loading={update.isPending}>
            {t('Lưu cài đặt')}
          </Button>
          <p className="text-xs text-content-muted">
            {t('Nhắc nhở chỉ gửi khi hôm đó bạn chưa học — học rồi thì hệ thống im lặng.')}
          </p>
        </div>
      </Card>

      <div className={`mt-4 ${isEnabled ? '' : 'opacity-60'}`}>
        <ReminderList reminders={reminders} />
      </div>
    </section>
  );
}

/**
 * Danh sách lời nhắc đã đặt.
 *
 * `editing` giữ cả ba trạng thái của khu vực form: `null` là đóng, `'new'` là đang thêm,
 * còn một `Reminder` là đang sửa đúng lời nhắc đó. Gộp vào một biến thay vì hai cờ
 * riêng để không bao giờ rơi vào cảnh vừa mở form thêm vừa mở form sửa.
 */
function ReminderList({ reminders }: { reminders: ReturnType<typeof useReminders> }): JSX.Element {
  const t = useT();
  const [editing, setEditing] = useState<Reminder | 'new' | null>(null);

  const items = reminders.data ?? [];
  const isFull = items.length >= MAX_REMINDERS_PER_USER;
  const isCreating = editing === 'new';

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-content">
            <Clock className="h-4 w-4 text-brand-strong" aria-hidden />
            {t('Các lời nhắc trong ngày')}
          </h3>
          <p className="text-xs text-content-muted">
            {t('Đã đặt {n}/{max} lời nhắc', { n: items.length, max: MAX_REMINDERS_PER_USER })}
          </p>
        </div>

        <Button
          size="sm"
          variant={isCreating ? 'secondary' : 'primary'}
          icon={isCreating ? X : Plus}
          disabled={!isCreating && isFull}
          title={isFull ? t('Đã đạt số lời nhắc tối đa') : undefined}
          onClick={() => setEditing(isCreating ? null : 'new')}
        >
          {isCreating ? t('Đóng') : t('Thêm lời nhắc')}
        </Button>
      </div>

      {isCreating && <ReminderForm reminder={null} onDone={() => setEditing(null)} />}

      {reminders.isLoading && <SkeletonList rows={2} />}
      {reminders.isError && <ErrorMessage>{getErrorMessage(reminders.error)}</ErrorMessage>}

      {!reminders.isLoading && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-content-muted">
          {t('Chưa có lời nhắc nào. Thêm một lời nhắc để hệ thống nhắc bạn học.')}
        </p>
      )}

      <ul className="divide-y divide-line">
        {items.map((reminder) => {
          const isEditingThis = editing !== 'new' && editing?.id === reminder.id;

          return (
            <li key={reminder.id} className="py-3">
              {isEditingThis ? (
                // `key` theo id để chuyển từ sửa lời nhắc này sang lời nhắc khác thì
                // form dựng lại từ đầu, không giữ giá trị của cái trước.
                <ReminderForm
                  key={reminder.id}
                  reminder={reminder}
                  onDone={() => setEditing(null)}
                />
              ) : (
                <ReminderRow reminder={reminder} onEdit={() => setEditing(reminder)} />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ReminderRow({
  reminder,
  onEdit,
}: {
  reminder: Reminder;
  onEdit: () => void;
}): JSX.Element {
  const t = useT();
  const update = useUpdateReminder();
  const remove = useDeleteReminder();
  const toast = useToast();

  const isToggling = update.isPending && update.variables?.id === reminder.id;

  return (
    // Lời nhắc đang tắt thì mờ đi, nhưng công tắc và các nút vẫn rõ để bật lại được.
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`w-16 shrink-0 text-lg font-bold tabular-nums ${
          reminder.isEnabled ? 'text-content' : 'text-content-muted'
        }`}
      >
        {reminder.timeOfDay}
      </span>

      <span className={`min-w-0 flex-1 ${reminder.isEnabled ? '' : 'opacity-60'}`}>
        <span className="block truncate text-sm font-medium text-content-soft">
          {reminder.label || t('Nhắc học')}
        </span>
        <span className="block text-xs text-content-muted">
          {reminder.daysOfWeek.length === 7
            ? t('Cả tuần')
            : t('Các ngày: {days}', { days: formatWeekdays(reminder.daysOfWeek) })}
        </span>
      </span>

      <Switch
        checked={reminder.isEnabled}
        busy={isToggling}
        label={t('Lời nhắc lúc {time}', { time: reminder.timeOfDay })}
        onChange={(next) =>
          update.mutate(
            { id: reminder.id, input: { isEnabled: next } },
            { onError: (error) => toast.error(getErrorMessage(error)) },
          )
        }
      />

      <Button size="sm" variant="ghost" icon={Pencil} aria-label={t('Sửa lời nhắc')} onClick={onEdit} />

      <Button
        size="sm"
        variant="ghost"
        icon={Trash2}
        aria-label={t('Xoá lời nhắc')}
        loading={remove.isPending && remove.variables === reminder.id}
        onClick={() => {
          if (!confirm(t('Xoá lời nhắc lúc {time}?', { time: reminder.timeOfDay }))) return;
          remove.mutate(reminder.id, {
            onSuccess: () => toast.success(t('Đã xoá lời nhắc')),
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
      />
    </div>
  );
}

/**
 * Form thêm mới hoặc sửa một lời nhắc: giờ, các thứ áp dụng và một nhãn tuỳ chọn.
 *
 * Dùng chung cho cả hai việc vì các trường giống hệt nhau — tách thành hai form thì
 * mỗi lần thêm một trường lại phải nhớ sửa hai chỗ.
 */
function ReminderForm({
  reminder,
  onDone,
}: {
  /** `null` là thêm mới; có giá trị là sửa đúng lời nhắc đó. */
  reminder: Reminder | null;
  onDone: () => void;
}): JSX.Element {
  const t = useT();
  const create = useCreateReminder();
  const update = useUpdateReminder();
  const toast = useToast();

  const isEdit = reminder !== null;

  const [timeOfDay, setTimeOfDay] = useState(reminder?.timeOfDay ?? '20:00');
  const [label, setLabel] = useState(reminder?.label ?? '');
  const [days, setDays] = useState<number[]>(reminder?.daysOfWeek ?? [1, 2, 3, 4, 5, 6, 7]);

  const toggleDay = (day: number): void => {
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b),
    );
  };

  const submit = (): void => {
    if (days.length === 0) return;

    // Luôn gửi `label`, kể cả khi rỗng: có gửi thì backend mới xoá được nhãn cũ khi
    // người dùng cố ý bỏ trống ô này.
    const input = { timeOfDay, daysOfWeek: days, label: label.trim() };

    const handlers = {
      onSuccess: () => {
        toast.success(isEdit ? t('Đã cập nhật lời nhắc') : t('Đã thêm lời nhắc'));
        onDone();
      },
      onError: (error: Error) => toast.error(getErrorMessage(error)),
    };

    if (isEdit) update.mutate({ id: reminder.id, input }, handlers);
    else create.mutate(input, handlers);
  };

  const isPending = isEdit ? update.isPending : create.isPending;

  return (
    <div className="animate-slide-up rounded-xl border border-line bg-sunken p-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-[140px]">
          <Field label={t('Giờ nhắc')} hint={t('Theo múi giờ trong trang cá nhân của bạn.')}>
            <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
          </Field>
        </div>

        <div className="min-w-[200px] flex-1">
          <Field label={t('Tên lời nhắc (tuỳ chọn)')} hint={t('Ví dụ: Trước khi đi làm')}>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
              placeholder={t('Nhắc học')}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-content-soft">{t('Ngày trong tuần')}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((weekday, index) => {
            const day = index + 1;
            const selected = days.includes(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={selected}
                className={`h-9 w-11 rounded-lg border text-sm font-medium transition-colors ${
                  selected
                    ? 'border-brand bg-brand text-on-brand'
                    : 'border-line-control text-content-soft hover:bg-hover'
                }`}
              >
                {weekday}
              </button>
            );
          })}
        </div>
        {days.length === 0 && (
          <p className="mt-1.5 text-xs text-danger">{t('Chọn ít nhất một ngày cho lời nhắc này.')}</p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={submit} loading={isPending} disabled={days.length === 0}>
          {isEdit ? t('Lưu thay đổi') : t('Thêm lời nhắc')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('Huỷ')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Công tắc bật/tắt.
 *
 * Thay cho nút chữ "Bật"/"Tắt" trước đây: nút chữ luôn mơ hồ ở chỗ nó ghi TRẠNG THÁI
 * HIỆN TẠI hay HÀNH ĐỘNG sẽ xảy ra khi bấm — người dùng phải đoán. Công tắc thì vị trí
 * núm nói lên trạng thái, không cần đọc chữ.
 *
 * Để cục bộ trong feature này vì mới dùng một chỗ; đưa lên `shared/components/ui`
 * khi có feature thứ hai cần tới (xem CLAUDE.md > Quy tắc tái sử dụng code).
 */
function Switch({
  checked,
  onChange,
  label,
  busy = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** Đọc cho trình đọc màn hình. Trạng thái bật/tắt đã nằm ở `aria-checked`. */
  label: string;
  busy?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
        checked ? 'bg-brand' : 'bg-line-control'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
        aria-hidden
      />
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}): JSX.Element {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
      />
      <span>
        <span className="block text-sm font-medium text-content">{label}</span>
        <span className="block text-xs text-content-muted">{hint}</span>
      </span>
    </label>
  );
}
