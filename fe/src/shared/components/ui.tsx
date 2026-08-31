import { Loader2, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

/**
 * Bộ UI cơ bản dùng chung cho mọi feature.
 * Đặt ở shared/ vì dùng ở >= 2 feature — không copy style vào từng feature.
 */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-strong shadow-sm',
  secondary: 'bg-surface text-content-soft border border-line hover:bg-sunken',
  danger: 'bg-danger text-on-fill hover:bg-danger/85',
  ghost: 'text-content-muted hover:bg-sunken hover:text-content',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** Hiện spinner và khoá nút — dùng khi mutation đang chạy. */
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      )}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}): JSX.Element {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-5 shadow-card ${
        interactive ? 'transition-shadow hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-page">{title}</h1>
        {description && <p className="mt-1 text-sm text-on-page-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }): JSX.Element {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-on-page-muted">{children}</h2>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <label className="block">
      <span className="text-sm font-medium text-content-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-content-muted">{hint}</span>}
    </label>
  );
}

const CONTROL_CLASS =
  'mt-1.5 w-full rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-content outline-none transition-colors placeholder:text-content-muted focus:border-brand focus:ring-4 focus:ring-brand/10';

export function Input(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return <input {...props} className={`${CONTROL_CLASS} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return <select {...props} className={`${CONTROL_CLASS} ${props.className ?? ''}`} />;
}

export function ErrorMessage({ children }: { children: ReactNode }): JSX.Element | null {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-sunken">
          <Icon className="h-5 w-5 text-content-muted" aria-hidden />
        </div>
      )}
      <p className="font-medium text-content-soft">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Khung xám thay cho chữ "Đang tải...".
 * Giữ đúng chỗ nội dung sắp hiện nên trang không bị nhảy layout khi dữ liệu về.
 */
export function Skeleton({ className = '' }: { className?: string }): JSX.Element {
  return <div className={`animate-pulse rounded-lg bg-sunken ${className}`} />;
}

export function SkeletonList({ rows = 3 }: { rows?: number }): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-[86px] w-full" />
      ))}
    </div>
  );
}

type BadgeTone = 'slate' | 'green' | 'brand' | 'amber';

const BADGE_TONES: Record<BadgeTone, string> = {
  slate: 'bg-sunken text-content-soft',
  green: 'bg-success-soft text-success',
  brand: 'bg-brand-soft text-brand-strong',
  amber: 'bg-accent-soft text-accent-ink',
};

export function Badge({
  children,
  tone = 'slate',
  icon: Icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: LucideIcon;
}): JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}

/** Thanh tiến độ dùng chung cho mục tiêu và tỷ lệ hoàn thành. */
export function ProgressBar({ percent, done = false }: { percent: number; done?: boolean }): JSX.Element {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-sunken">
      <div
        className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-success' : 'bg-brand'}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
