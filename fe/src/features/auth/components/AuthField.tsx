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
      <span className="mb-1.5 block text-sm font-medium text-content-soft">{label}</span>

      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
          aria-hidden
        />
        <input
          {...props}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border bg-surface py-2.5 pl-9 pr-3 text-sm text-content outline-none transition-colors placeholder:text-content-muted ${
            error
              ? 'border-danger/60 focus:border-danger focus:ring-4 focus:ring-danger/10'
              : 'border-line-control focus:border-brand focus:ring-4 focus:ring-brand/10'
          }`}
        />
      </div>

      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-content-muted">{hint}</span>
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
      <span className="mb-1.5 block text-sm font-medium text-content-soft">{label}</span>

      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
          aria-hidden
        />
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border bg-surface py-2.5 pl-9 pr-10 text-sm text-content outline-none transition-colors placeholder:text-content-muted ${
            error
              ? 'border-danger/60 focus:border-danger focus:ring-4 focus:ring-danger/10'
              : 'border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-content-muted transition-colors hover:text-content-soft"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-content-muted">{hint}</span>
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
    { label: 'Quá yếu', color: 'bg-danger', text: 'text-danger' },
    { label: 'Yếu', color: 'bg-series-flashcard', text: 'text-accent-ink' },
    { label: 'Khá', color: 'bg-accent', text: 'text-accent-ink' },
    { label: 'Tốt', color: 'bg-success', text: 'text-success' },
  ];
  const level = levels[Math.max(0, score - 1)] ?? levels[0];

  return (
    <div className="mt-2 animate-fade-in">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? level?.color : 'bg-line'
            }`}
          />
        ))}
      </div>
      <span className={`mt-1 block text-xs ${level?.text}`}>Độ mạnh: {level?.label}</span>
    </div>
  );
}
