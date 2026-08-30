import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { loginSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button } from '../../../shared/components/ui';
import { useLogin } from '../auth.hooks';
import { AuthField, PasswordField } from './AuthField';
import { AuthLayout } from './AuthLayout';

export function LoginPage(): JSX.Element {
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chào mừng trở lại</h1>
          <p className="mt-1.5 text-sm text-slate-500">Tiếp tục hành trình học tiếng Anh của bạn</p>
        </div>

        {/* Lỗi từ server (sai mật khẩu, mất mạng) hiển thị riêng, không lẫn với lỗi từng ô */}
        {login.isError && (
          <div
            role="alert"
            className="flex animate-slide-up items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
            <span className="text-sm text-red-700">{getErrorMessage(login.error)}</span>
          </div>
        )}

        <div className="animate-enter-up [animation-delay:60ms]">
          <AuthField
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fieldErrors.email}
            placeholder="ban@example.com"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="animate-enter-up [animation-delay:120ms]">
          <PasswordField
            label="Mật khẩu"
            icon={Lock}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={fieldErrors.password}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
          />
        </div>

        <div className="animate-enter-up [animation-delay:180ms]">
          <Button type="submit" loading={login.isPending} className="w-full" icon={ArrowRight}>
            {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </div>

        <p className="animate-enter-up text-center text-sm text-slate-500 [animation-delay:240ms]">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-brand transition-colors hover:text-brand-strong">
            Đăng ký miễn phí
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
