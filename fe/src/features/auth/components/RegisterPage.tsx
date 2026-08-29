import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerSchema } from '@enghabit/shared';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useRegister } from '../auth.hooks';

export function RegisterPage(): JSX.Element {
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setValidationError(null);

    const parsed = registerSchema.safeParse({
      ...form,
      // Lấy timezone thật của trình duyệt để streak tính đúng theo giờ người dùng.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
      return;
    }

    register.mutate(parsed.data);
  };

  const errorMessage = validationError ?? (register.error ? getErrorMessage(register.error) : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">Bắt đầu xây dựng thói quen học mỗi ngày</p>
        </div>

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Họ tên</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Mật khẩu</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            autoComplete="new-password"
          />
          <span className="mt-1 block text-xs text-slate-400">Ít nhất 8 ký tự, gồm cả chữ và số</span>
        </label>

        <button
          type="submit"
          disabled={register.isPending}
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {register.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
