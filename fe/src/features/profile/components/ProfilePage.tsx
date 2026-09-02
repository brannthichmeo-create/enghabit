import { useState, type FormEvent } from 'react';
import { Award, CalendarDays, Flame, KeyRound, Layers, Save, Sparkles } from 'lucide-react';
import { changePasswordSchema, updateProfileSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  ProgressBar,
  SectionTitle,
  Skeleton,
} from '../../../shared/components/ui';
import { Avatar } from '../../../shared/components/Sidebar';
import { useToast } from '../../../shared/components/Toast';
import { useCurrentUser } from '../../auth/auth.store';
import { useChangePassword, useUpdateProfile } from '../profile.hooks';
import { useLevel, useStatsSummary, useStreak } from '../../statistics/statistics.hooks';
import { useLocale, useT } from '../../../shared/i18n/language';

/**
 * Trang cá nhân: thông tin tài khoản, tiến độ học và cài đặt bảo mật.
 *
 * Gom vào một trang thay vì tách nhiều màn hình, vì người dùng vào đây không
 * thường xuyên và mỗi lần vào thường chỉ sửa một thứ.
 */
export function ProfilePage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const user = useCurrentUser();
  const level = useLevel();
  const streak = useStreak();
  const summary = useStatsSummary('month');

  return (
    <div>
      <PageHeader title={t('Trang cá nhân')} description={t('Thông tin tài khoản và tiến độ học tập')} />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user?.name ?? '?'} level={level.data?.level} size="lg" />

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-content">{user?.name}</h2>
            <p className="text-sm text-content-muted">{user?.email}</p>
            {user?.createdAt && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-content-muted">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {t('Tham gia từ {date}', { date: new Date(user.createdAt).toLocaleDateString(locale) })}
              </p>
            )}
          </div>
        </div>

        {level.data && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-content-soft">
                <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
                {t('Cấp {from} → {to}', { from: level.data.level, to: level.data.level + 1 })}
              </span>
              <span className="tabular-nums text-content-muted">
                {t('còn {n} XP', { n: level.data.xpToNextLevel })}
              </span>
            </div>
            <ProgressBar percent={level.data.progressPercent} />
          </div>
        )}
      </Card>

      <SectionTitle>{t('Tiến độ học tập')}</SectionTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Sparkles}
          label={t('Tổng điểm')}
          value={level.data ? `${level.data.xp}` : null}
          unit="XP"
        />
        <Stat
          icon={Flame}
          label={t('Chuỗi hiện tại')}
          value={streak.data ? `${streak.data.currentStreak}` : null}
          unit={t('ngày')}
        />
        <Stat
          icon={Award}
          label={t('Kỷ lục')}
          value={streak.data ? `${streak.data.longestStreak}` : null}
          unit={t('ngày')}
        />
        <Stat
          icon={Layers}
          label={t('Hoạt động tháng này')}
          value={
            summary.data
              ? String(Object.values(summary.data.totals).reduce((sum, n) => sum + n, 0))
              : null
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Flame;
  label: string;
  value: string | null;
  unit?: string;
}): JSX.Element {
  if (value === null) return <Skeleton className="h-[88px] w-full" />;

  return (
    <Card>
      <span className="flex items-center gap-1.5 text-sm text-content-muted">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </span>
      <p className="mt-1 text-2xl font-bold tabular-nums text-content">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-content-muted">{unit}</span>}
      </p>
    </Card>
  );
}

/**
 * Hai tên múi giờ có trỏ về cùng một nơi không.
 *
 * So sánh chuỗi là không đủ: "Asia/Saigon" và "Asia/Ho_Chi_Minh" là cùng một
 * múi giờ, chỉ khác tên cũ/mới. So chuỗi sẽ báo lệch giả và khiến người dùng đi
 * "sửa" thứ vốn không hỏng. So bằng độ lệch giờ thực tế mới đúng.
 */
function sameZone(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    const now = new Date();
    const format = (tz: string): string =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
    return format(a) === format(b);
  } catch {
    // Tên múi giờ không hợp lệ thì coi như khác nhau để người dùng còn sửa được
    return false;
  }
}

/** Sửa tên hiển thị và múi giờ. */
function ProfileForm(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const toast = useToast();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneMismatch = user?.timezone ? !sameZone(user.timezone, browserTimezone) : false;

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setError(null);

    const parsed = updateProfileSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    update.mutate(parsed.data, {
      onSuccess: () => toast.success(t('Đã lưu thông tin')),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-content">{t('Thông tin cá nhân')}</h3>

      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <Field label={t('Họ tên')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Email" hint={t('Không đổi được email sau khi đăng ký')}>
          <Input value={user?.email ?? ''} disabled />
        </Field>

        <Field
          label={t('Múi giờ')}
          hint={t('Quyết định mốc kết thúc một ngày học, ảnh hưởng tới chuỗi ngày và thống kê')}
        >
          <Input value={user?.timezone ?? ''} disabled />
        </Field>

        {/* Đi du lịch hay chuyển chỗ ở thì múi giờ lệch, mà lệch thì streak tính sai ngày */}
        {timezoneMismatch && (
          <div className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-2.5 text-sm text-accent-ink">
            {t('Trình duyệt đang ở múi giờ')}<strong>{browserTimezone}</strong>{t(', khác với cài đặt tài khoản.')}
            <button
              type="button"
              onClick={() =>
                update.mutate(
                  { timezone: browserTimezone },
                  {
                    onSuccess: () => toast.success(t('Đã cập nhật múi giờ')),
                    onError: (e) => toast.error(getErrorMessage(e)),
                  },
                )
              }
              className="ml-1 font-semibold underline"
            >
              {t('Cập nhật theo trình duyệt')}
            </button>
          </div>
        )}

        <Button type="submit" icon={Save} loading={update.isPending}>
          {t('Lưu thay đổi')}
        </Button>
      </form>
    </Card>
  );
}

function PasswordForm(): JSX.Element {
  const t = useT();
  const toast = useToast();
  const change = useChangePassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirm) {
      setError(t('Mật khẩu mới nhập lại không khớp'));
      return;
    }

    const parsed = changePasswordSchema.safeParse({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('Dữ liệu không hợp lệ'));
      return;
    }

    change.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('Đã đổi mật khẩu'));
        setForm({ currentPassword: '', newPassword: '', confirm: '' });
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-content">{t('Đổi mật khẩu')}</h3>

      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <Field label={t('Mật khẩu hiện tại')}>
          <Input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            autoComplete="current-password"
          />
        </Field>

        <Field label={t('Mật khẩu mới')} hint={t('Ít nhất 8 ký tự, gồm cả chữ và số')}>
          <Input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            autoComplete="new-password"
          />
        </Field>

        <Field label={t('Nhập lại mật khẩu mới')}>
          <Input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            autoComplete="new-password"
          />
        </Field>

        <p className="text-xs text-content-muted">
          {t('Đổi mật khẩu sẽ đăng xuất tài khoản này khỏi mọi thiết bị khác.')}
        </p>

        <Button type="submit" icon={KeyRound} loading={change.isPending}>
          {t('Đổi mật khẩu')}
        </Button>
      </form>
    </Card>
  );
}
