import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { registerSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { Button } from '../../../shared/components/ui';
import { useRegister } from '../auth.hooks';
import { AuthField, PasswordField, PasswordStrength } from './AuthField';
import { AuthLayout } from './AuthLayout';

export function RegisterPage(): JSX.Element {
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      ...form,
      // Lấy timezone thật của trình duyệt để streak tính đúng theo giờ người dùng.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])),
      );
      return;
    }

    register.mutate(parsed.data);
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-enter-up">
          <h1 className="text-2xl font-bold tracking-tight text-content">Tạo tài khoản</h1>
          <p className="mt-1.5 text-sm text-content-muted">Bắt đầu xây dựng thói quen học mỗi ngày</p>
        </div>

        {register.isError && (
          <div
            role="alert"
            className="flex animate-slide-up items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
            <span className="text-sm text-danger">{getErrorMessage(register.error)}</span>
          </div>
        )}

        <div className="animate-enter-up [animation-delay:60ms]">
          <AuthField
            label="Họ tên"
            icon={User}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={fieldErrors.name}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            autoFocus
          />
        </div>

        <div className="animate-enter-up [animation-delay:120ms]">
          <AuthField
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fieldErrors.email}
            placeholder="ban@example.com"
            autoComplete="email"
          />
        </div>

        <div className="animate-enter-up [animation-delay:180ms]">
          <PasswordField
            label="Mật khẩu"
            icon={Lock}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={fieldErrors.password}
            hint="Ít nhất 8 ký tự, gồm cả chữ và số"
            placeholder="Tạo mật khẩu"
            autoComplete="new-password"
          />
          <PasswordStrength password={form.password} />
        </div>

        <div className="animate-enter-up [animation-delay:240ms]">
          <Button type="submit" loading={register.isPending} className="w-full" icon={ArrowRight}>
            {register.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </Button>
        </div>

        <p className="animate-enter-up text-center text-sm text-content-muted [animation-delay:300ms]">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-brand-strong underline-offset-2 transition-colors hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
