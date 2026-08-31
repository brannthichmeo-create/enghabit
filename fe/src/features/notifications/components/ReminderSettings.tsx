import { useEffect, useState } from 'react';
import { WEEKDAY_LABELS } from '../../../shared/lib/labels';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button, Card, ErrorMessage, Field, Input, SectionTitle, SkeletonList } from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { useNotificationSetting, useUpdateNotificationSetting } from '../notification.hooks';

/**
 * Cài đặt nhắc nhở: bật/tắt, giờ nhắc, thứ trong tuần và các loại cảnh báo.
 *
 * Giờ nhắc tính theo timezone trong hồ sơ cá nhân, không theo giờ máy chủ — nói rõ
 * điều này ngay dưới ô nhập, vì đây là chỗ người dùng dễ hiểu nhầm nhất.
 */
export function ReminderSettings(): JSX.Element {
  const setting = useNotificationSetting();
  const update = useUpdateNotificationSetting();
  const toast = useToast();

  const [isEnabled, setIsEnabled] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState('20:00');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [remindStreakAtRisk, setRemindStreakAtRisk] = useState(true);
  const [remindReviewDue, setRemindReviewDue] = useState(true);

  // Nạp giá trị đang lưu một lần khi dữ liệu về.
  useEffect(() => {
    if (!setting.data) return;
    setIsEnabled(setting.data.isEnabled);
    setTimeOfDay(setting.data.timeOfDay);
    setDays(setting.data.daysOfWeek);
    setRemindStreakAtRisk(setting.data.remindStreakAtRisk);
    setRemindReviewDue(setting.data.remindReviewDue);
  }, [setting.data]);

  if (setting.isLoading) return <SkeletonList rows={2} />;
  if (setting.isError) return <ErrorMessage>{getErrorMessage(setting.error)}</ErrorMessage>;

  const toggleDay = (day: number): void => {
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b),
    );
  };

  const save = (): void => {
    if (days.length === 0) return;
    update.mutate(
      { isEnabled, timeOfDay, daysOfWeek: days, remindStreakAtRisk, remindReviewDue },
      { onSuccess: () => toast.success('Đã lưu cài đặt nhắc nhở') },
    );
  };

  return (
    <section>
      <SectionTitle>Cài đặt nhắc nhở</SectionTitle>
      <Card>
        {update.isError && <ErrorMessage>{getErrorMessage(update.error)}</ErrorMessage>}

        <Toggle
          checked={isEnabled}
          onChange={setIsEnabled}
          label="Bật nhắc nhở học tập"
          hint="Tắt thì không nhận bất kỳ nhắc nhở tự động nào."
        />

        <div className={isEnabled ? '' : 'pointer-events-none opacity-50'}>
          <div className="mt-4 max-w-[200px]">
            <Field label="Giờ nhắc" hint="Theo múi giờ trong trang cá nhân của bạn.">
              <Input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                disabled={!isEnabled}
              />
            </Field>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-content-soft">Ngày trong tuần</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, index) => {
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
                        : 'border-line-control text-content-soft hover:bg-sunken'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {days.length === 0 && (
              <p className="mt-1.5 text-xs text-danger">Chọn ít nhất một ngày, hoặc tắt hẳn nhắc nhở.</p>
            )}
          </div>

          <div className="mt-5 space-y-3 border-t border-line pt-4">
            <Toggle
              checked={remindStreakAtRisk}
              onChange={setRemindStreakAtRisk}
              label="Cảnh báo chuỗi sắp đứt"
              hint="Gửi lúc 21:30 nếu hôm đó bạn chưa học và đang có chuỗi."
            />
            <Toggle
              checked={remindReviewDue}
              onChange={setRemindReviewDue}
              label="Nhắc thẻ tới hạn ôn"
              hint="Lời nhắc hằng ngày sẽ kèm số thẻ flashcard cần ôn."
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <Button onClick={save} loading={update.isPending} disabled={isEnabled && days.length === 0}>
            Lưu cài đặt
          </Button>
          <p className="text-xs text-content-muted">
            Nhắc nhở chỉ gửi khi hôm đó bạn chưa học — học rồi thì hệ thống im lặng.
          </p>
        </div>
      </Card>
    </section>
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
