import { Check, Languages } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, useLanguage, useT, type Language } from '../i18n/language';

/**
 * Chọn ngôn ngữ giao diện trên thanh trên cùng.
 *
 * Dùng đúng khuôn menu của ThemeToggle (bấm ra ngoài / Esc để đóng, `menuitemradio`)
 * — hai nút nằm cạnh nhau nên hành vi phải giống hệt, khác nhau một chút là thấy ngay.
 *
 * Nhãn ngôn ngữ KHÔNG dịch: người đang xem giao diện tiếng Anh mà muốn đổi về tiếng
 * Việt cần nhìn thấy đúng chữ "Tiếng Việt", chứ không phải "Vietnamese".
 */
export function LanguageSwitcher(): JSX.Element {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const codes = Object.keys(LANGUAGES) as Language[];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-on-page-muted transition-colors hover:bg-hover hover:text-on-page"
        aria-label={t('Chọn ngôn ngữ')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Languages className="h-4 w-4" aria-hidden />
        <span className="text-xs font-semibold uppercase">{language}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-44 animate-slide-up overflow-hidden rounded-xl border border-line bg-surface-raised py-1 shadow-lg"
        >
          {codes.map((code) => {
            const selected = code === language;

            return (
              <button
                key={code}
                role="menuitemradio"
                aria-checked={selected}
                lang={code}
                onClick={() => {
                  setLanguage(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-sunken ${
                  selected ? 'text-brand-strong' : 'text-content-soft'
                }`}
              >
                <span className="w-6 shrink-0 text-xs font-semibold uppercase">{code}</span>
                <span className="flex-1 text-left">{LANGUAGES[code]}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
