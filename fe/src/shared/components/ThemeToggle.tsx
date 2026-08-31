import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Chọn chế độ giao diện: Sáng / Tối / Theo hệ thống.
 *
 * Ba trạng thái chứ không phải hai: "theo hệ thống" là mặc định và KHÔNG đặt
 * thuộc tính nào lên thẻ <html>, để CSS media query tự quyết. Chọn tay mới ghi
 * data-theme, và selector trong index.css cho lựa chọn tay thắng cài đặt hệ thống.
 */

type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'enghabit-theme';

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Sáng' },
  { value: 'dark', icon: Moon, label: 'Tối' },
  { value: 'system', icon: Monitor, label: 'Theo hệ thống' },
];

function readStored(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    // Trình duyệt chặn lưu (chế độ ẩn danh) — cứ theo hệ thống
    return 'system';
  }
}

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

export function ThemeToggle(): JSX.Element {
  const [choice, setChoice] = useState<ThemeChoice>(readStored);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(choice);
    try {
      if (choice === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* không lưu được thì vẫn áp dụng cho phiên hiện tại */
    }
  }, [choice]);

  // Bấm ra ngoài hoặc nhấn Esc thì đóng menu
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = OPTIONS.find((o) => o.value === choice) ?? OPTIONS[2]!;
  const CurrentIcon = current.icon;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-sunken hover:text-content"
        aria-label="Chọn chế độ giao diện"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <CurrentIcon className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-48 animate-slide-up overflow-hidden rounded-xl border border-line bg-surface-raised py-1 shadow-lg"
        >
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.value === choice;

            return (
              <button
                key={option.value}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setChoice(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-sunken ${
                  selected ? 'text-brand-strong' : 'text-content-soft'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1 text-left">{option.label}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Áp chế độ đã lưu NGAY khi app khởi động.
 *
 * Gọi trước khi React render để tránh nháy sáng một nhịp rồi mới đổi sang tối.
 */
export function initTheme(): void {
  applyTheme(readStored());
}
