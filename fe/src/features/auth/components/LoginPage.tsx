import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, UserRound } from 'lucide-react';
import { loginSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button } from '../../../shared/components/ui';
import { useLogin } from '../auth.hooks';
import { AuthField, PasswordField } from './AuthField';
import { AuthLayout } from './AuthLayout';
import { useT } from '../../../shared/i18n/language';

export function LoginPage(): JSX.Element {
  const t = useT();
  const login = useLogin();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setFieldErrors({});

    // Validate bằng đúng schema backend dùng — không có chuyện FE và BE lệch rule.
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])),
      );
      return;
    }

    login.mutate(parsed.data);
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-enter-up">
          <h1 className="text-2xl font-bold tracking-tight text-content">{t('Chào mừng trở lại')}</h1>
          <p className="mt-1.5 text-sm text-content-muted">{t('Tiếp tục hành trình học tiếng Anh của bạn')}</p>
        </div>

        {/* Lỗi từ server (sai mật khẩu, mất mạng) hiển thị riêng, không lẫn với lỗi từng ô */}
        {login.isError && (
          <div
            role="alert"
            className="flex animate-slide-up items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
            <span className="text-sm text-danger">{getErrorMessage(login.error)}</span>
          </div>
        )}

        {/* Một ô cho cả email lẫn tên tài khoản: người dùng gõ thứ họ nhớ, backend tự
            phân biệt. `type="text"` chứ không phải `type="email"` — để email thì trình
            duyệt sẽ báo "thiếu @" khi người ta gõ tên tài khoản. */}
        <div className="animate-enter-up [animation-delay:60ms]">
          <AuthField
            label={t('Email hoặc tên tài khoản')}
            icon={UserRound}
            type="text"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            error={fieldErrors.identifier}
            placeholder={t('ban@example.com hoặc tentaikhoan')}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="animate-enter-up [animation-delay:120ms]">
          <PasswordField
            label={t('Mật khẩu')}
            icon={Lock}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={fieldErrors.password}
            placeholder={t('Nhập mật khẩu')}
            autoComplete="current-password"
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-strong underline-offset-2 transition-colors hover:underline"
            >
              {t('Quên mật khẩu?')}
            </Link>
          </div>
        </div>

        <div className="animate-enter-up [animation-delay:180ms]">
          <Button type="submit" loading={login.isPending} className="w-full" icon={ArrowRight}>
            {login.isPending ? t('Đang đăng nhập...') : t('Đăng nhập')}
          </Button>
        </div>

        <p className="animate-enter-up text-center text-sm text-content-muted [animation-delay:240ms]">
          {t('Chưa có tài khoản?')}{' '}
          <Link to="/register" className="font-medium text-brand-strong underline-offset-2 transition-colors hover:underline">
            {t('Đăng ký miễn phí')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
