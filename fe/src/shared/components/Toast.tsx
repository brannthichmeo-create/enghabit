import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Thông báo nổi cho các thao tác đã thực hiện.
 *
 * Trước đây mọi thao tác thành công đều im lặng — user bấm Check-in xong không
 * biết đã ăn hay chưa. Toast cho phản hồi tức thì mà không chiếm chỗ trong layout.
 */

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Toast['tone']) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live để trình đọc màn hình đọc được thông báo mà không cần focus */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-slide-up items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-white text-slate-800'
                : 'border-red-200 bg-white text-slate-800'
            }`}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
            )}
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded text-slate-400 hover:text-slate-600"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast phải được dùng bên trong ToastProvider');
  return context;
}
