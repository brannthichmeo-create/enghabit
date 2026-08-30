import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

/**
 * Ô nhập cho màn hình đăng nhập/đăng ký: có icon và hiện lỗi ngay dưới đúng ô sai.
 *
 * Trước đây mọi lỗi đều dồn lên một dòng ở đầu form nên user phải tự đoán ô nào sai.
 */

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
}

export function AuthField({ label, icon: Icon, error, hint, ...props }: AuthFieldProps): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>

      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          {...props}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10'
          }`}
        />
      </div>

      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
      )}
    </label>
  );
}

/** Ô mật khẩu kèm nút hiện/ẩn — giảm lỗi gõ sai mà không phải nhập lại từ đầu. */
export function PasswordField({
  label,
  icon: Icon,
  error,
  hint,
  ...props
}: AuthFieldProps): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>

      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
      )}
    </label>
  );
}

/**
 * Thanh đánh giá độ mạnh mật khẩu.
 * Đánh giá theo đúng luật của passwordSchema (>= 8 ký tự, có chữ, có số) cộng
 * điểm thưởng cho mật khẩu dài và có ký tự đặc biệt.
 */
export function PasswordStrength({ password }: { password: string }): JSX.Element | null {
  if (password.length === 0) return null;

  const score = [
    password.length >= 8,
    /[a-zA-Z]/.test(password),
    /[0-9]/.test(password),
    password.length >= 12 || /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'Quá yếu', color: 'bg-red-500', text: 'text-red-600' },
    { label: 'Yếu', color: 'bg-orange-500', text: 'text-orange-600' },
    { label: 'Khá', color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Tốt', color: 'bg-emerald-500', text: 'text-emerald-600' },
  ];
  const level = levels[Math.max(0, score - 1)] ?? levels[0];

  return (
    <div className="mt-2 animate-fade-in">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? level?.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <span className={`mt-1 block text-xs ${level?.text}`}>Độ mạnh: {level?.label}</span>
    </div>
  );
}
