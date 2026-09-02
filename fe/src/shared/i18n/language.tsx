import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN } from './en';

/**
 * Chuyển đổi ngôn ngữ giao diện: Tiếng Việt (mặc định) và English.
 *
 * Khoá dịch CHÍNH LÀ câu tiếng Việt, không phải mã dạng `common.logout`:
 * - đọc code vẫn thấy ngay câu hiện trên màn hình, không phải tra bảng
 * - quên dịch một câu thì câu đó hiện tiếng Việt chứ không hiện mã vỡ giao diện
 * - tiếng Việt là ngôn ngữ gốc của dự án nên bản `vi` không cần từ điển nào cả
 *
 * Chèn số/biến bằng chỗ trống `{tên}`: `t('Còn {n} XP nữa', { n: 20 })`. Không nối
 * chuỗi bằng `+` hay template literal, vì trật tự từ hai ngôn ngữ khác nhau —
 * câu ghép sẵn sẽ không dịch được.
 *
 * Lựa chọn lưu ở localStorage, không lưu theo tài khoản: đây là thiết lập hiển thị
 * của từng thiết bị. Muốn theo tài khoản thì phải thêm cột `User.language` ở BE.
 */

export const LANGUAGES = {
  vi: 'Tiếng Việt',
  en: 'English',
} as const;

export type Language = keyof typeof LANGUAGES;

/**
 * Locale dùng cho `toLocaleDateString`/`toLocaleString`.
 * Đổi ngôn ngữ mà quên đổi locale thì ngày tháng và dấu phân cách số vẫn ở dạng
 * tiếng Việt giữa một giao diện tiếng Anh.
 */
export const LOCALES: Record<Language, string> = {
  vi: 'vi-VN',
  en: 'en-US',
};

const STORAGE_KEY = 'enghabit-language';

/** Giá trị thay vào chỗ trống `{tên}` của câu. */
export type TranslateParams = Record<string, string | number>;

/**
 * Bản dịch của một câu. Dạng `{ one, other }` dùng cho câu có số đếm, vì tiếng Anh
 * đổi dạng số nhiều còn tiếng Việt thì không ("1 day" / "2 days" ↔ "1 ngày" / "2 ngày").
 */
export type Translation = string | { one: string; other: string };

export type Dictionary = Record<string, Translation>;

export type TranslateFn = (text: string, params?: TranslateParams) => string;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStored(): Language {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'vi' || value === 'en') return value;
  } catch {
    /* trình duyệt chặn đọc — dùng mặc định trong phiên này */
  }
  return 'vi';
}

/** Thay các chỗ trống `{tên}` trong câu bằng giá trị tương ứng. */
function fill(text: string, params?: TranslateParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function translate(
  dictionary: Dictionary | null,
  text: string,
  params?: TranslateParams,
): string {
  if (!dictionary) return fill(text, params);

  const entry = dictionary[text];
  if (entry === undefined) {
    // Thiếu bản dịch thì hiện nguyên câu tiếng Việt — người dùng vẫn đọc được,
    // còn lập trình viên thấy cảnh báo để bổ sung.
    if (import.meta.env.DEV) console.warn(`[i18n] thiếu bản dịch: "${text}"`);
    return fill(text, params);
  }

  if (typeof entry === 'string') return fill(entry, params);

  const count = Number(params?.n ?? params?.count ?? 0);
  return fill(count === 1 ? entry.one : entry.other, params);
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguageState] = useState<Language>(readStored);

  useEffect(() => {
    // Thuộc tính lang của trang: trình đọc màn hình và tính năng dịch của trình duyệt
    // dựa vào đây, không dựa vào chữ đang hiện.
    document.documentElement.lang = language;

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* trình duyệt chặn lưu — vẫn đổi được trong phiên này */
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);

  const t = useCallback<TranslateFn>(
    (text, params) => translate(language === 'vi' ? null : EN, text, params),
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage phải được dùng bên trong LanguageProvider');
  return context;
}

/** Hàm dịch dùng trong component: `const t = useT();` rồi `t('Đăng xuất')`. */
export function useT(): TranslateFn {
  return useLanguage().t;
}

/** Locale để định dạng ngày/số theo ngôn ngữ đang chọn. */
export function useLocale(): string {
  return LOCALES[useLanguage().language];
}
