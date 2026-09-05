import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useT } from '../i18n/language';

/**
 * Hộp thoại nổi giữa màn hình.
 *
 * Đặt ở `shared` vì đang dùng ở hai chỗ khác feature nhau: popup "đợi quản trị viên
 * xác nhận" của luồng quên mật khẩu, và form nhập lý do từ chối ở khu quản trị.
 *
 * Cố ý KHÔNG dùng thẻ `<dialog>` của trình duyệt: `showModal()` đưa phần tử lên
 * top-layer nằm ngoài cây DOM thường, nên nền mờ và bo góc theo token màu của app
 * phải viết lại bằng `::backdrop` — một bộ quy tắc riêng nằm ngoài Tailwind, dễ lệch
 * với phần còn lại của giao diện.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}): JSX.Element | null {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);

  // Đóng bằng phím Esc. Gắn ở `document` chứ không ở panel: người dùng có thể chưa
  // bấm vào đâu trong hộp thoại nên focus vẫn còn nằm ngoài nó.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Khoá cuộn nền, nếu không thì cuộn chuột sẽ trôi trang phía sau hộp thoại.
    const scrollCu = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Đưa focus vào hộp thoại để người dùng bàn phím không bị bỏ lại ở nền.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollCu;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-xl outline-none"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-content">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded text-content-muted transition-colors hover:text-content"
              aria-label={t('Đóng')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm text-content-soft">{children}</div>

          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </>
  );
}
