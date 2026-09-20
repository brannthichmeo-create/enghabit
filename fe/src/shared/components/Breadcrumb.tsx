import { ChevronRight, Home } from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { crumbsForPath, type Crumb } from '../lib/breadcrumbs';
import { useT } from '../i18n/language';

/**
 * Breadcrumb của khung app: cho biết đang ở đâu và bấm được để lùi về cấp trên.
 *
 * Vẽ một lần trong `AppLayout` cho mọi màn hình, dữ liệu lấy từ bản đồ route ở
 * `shared/lib/breadcrumbs.ts` — trang không phải tự dựng breadcrumb của mình.
 *
 * Màn hình phụ nằm TRONG một route (làm kiểm tra, làm bài học) không có URL riêng nên
 * không tra được từ bản đồ; những màn đó gọi `useBreadcrumbTail('Tên màn')` để nối
 * thêm một cấp.
 *
 * Chữ ở đây nằm trên nền hệ thống (nền mận tối) nên dùng bộ token `on-page*`,
 * không dùng `content*` — xem `docs/color-rules.md`.
 */

interface Tail {
  label: string;
  /** Bỏ hết các cấp tra từ đường dẫn, chỉ giữ mục gốc rồi tới cấp này. */
  replaceTrail: boolean;
}

interface TailContextValue {
  tail: Tail | null;
  setTail: (value: Tail | null) => void;
}

const TailContext = createContext<TailContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }): JSX.Element {
  const [tail, setTail] = useState<Tail | null>(null);
  const value = useMemo(() => ({ tail, setTail }), [tail]);

  return <TailContext.Provider value={value}>{children}</TailContext.Provider>;
}

/**
 * Nối thêm một cấp cuối vào breadcrumb, dành cho màn hình phụ không có URL riêng.
 * Truyền `null` hoặc rời màn hình thì cấp đó tự biến mất.
 *
 * `replaceTrail` cho trang 404: đường dẫn vẫn tra ra tên một màn hình (vd /flashcards →
 * "Ôn tập") nhưng màn hình đó chính là thứ KHÔNG tồn tại, nên giữ lại tên nó trên
 * breadcrumb là nói với người dùng rằng họ đang ở trong một trang không có.
 */
export function useBreadcrumbTail(label: string | null, replaceTrail = false): void {
  const ctx = useContext(TailContext);
  const setTail = ctx?.setTail;

  useEffect(() => {
    if (!setTail) return;
    setTail(label === null ? null : { label, replaceTrail });
    return () => setTail(null);
  }, [label, replaceTrail, setTail]);
}

export function Breadcrumb(): JSX.Element | null {
  const t = useT();
  const location = useLocation();
  const user = useCurrentUser();
  const tail = useContext(TailContext)?.tail ?? null;

  // Mục từ bản đồ route dịch được; cấp cuối do màn hình phụ đặt là dữ liệu động nên giữ nguyên.
  const trail = crumbsForPath(location.pathname, user?.role === UserRole.ADMIN);
  const items: (Crumb & { dynamic?: boolean })[] = [
    // `replaceTrail` giữ lại đúng mục gốc (phần tử đầu) rồi nối thẳng cấp cuối.
    ...(tail?.replaceTrail ? trail.slice(0, 1) : trail),
    ...(tail ? [{ label: tail.label, dynamic: true }] : []),
  ];

  // Chỉ có mỗi mục gốc thì breadcrumb không nói thêm điều gì — bỏ hẳn cho gọn.
  if (items.length < 2) return null;

  const lastIndex = items.length - 1;

  return (
    // Nằm trong thanh trên cùng nên không tự đặt lề; khoảng cách do thanh đó quyết định.
    // `min-w-0` + `truncate` ở mục cuối để tên bài dài không đẩy các nút bên phải ra ngoài.
    <nav aria-label={t('Đường dẫn')} className="min-w-0">
      <ol className="flex items-center gap-1 text-xs">
        {items.map((crumb, index) => {
          const isLast = index === lastIndex;

          return (
            /*
              Màn hình hẹp chỉ hiện cấp CUỐI — tức là "đang ở đâu".

              Các cấp trên là `shrink-0`, cố ý, để chúng không bị cắt chữ thành vô nghĩa;
              nhưng hệ quả là trên điện thoại chúng đẩy cả cụm nút bên phải ra ngoài
              màn hình. Đường về vẫn còn nguyên ở ngăn kéo điều hướng và ở nút Quay lại
              của trình duyệt, nên bỏ chúng đi ở cỡ này không mất lối đi nào.
            */
            <li
              key={`${crumb.label}-${index}`}
              className={`items-center gap-1 ${isLast ? 'flex min-w-0' : 'hidden shrink-0 sm:flex'}`}
            >
              {index > 0 && (
                <ChevronRight
                  // Cấp cuối là mục đầu tiên nhìn thấy dưới `sm`, nên dấu mũi tên dẫn
                  // vào nó sẽ treo lơ lửng ở đầu dòng.
                  className={`h-3.5 w-3.5 shrink-0 text-on-page-muted ${isLast ? 'hidden sm:block' : ''}`}
                  aria-hidden
                />
              )}

              {isLast || !crumb.to ? (
                <span className="truncate font-medium text-on-page" aria-current="page">
                  {crumb.dynamic ? crumb.label : t(crumb.label)}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="inline-flex items-center gap-1 rounded text-on-page-muted transition-colors hover:text-on-page-link hover:underline"
                >
                  {index === 0 && <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {t(crumb.label)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
