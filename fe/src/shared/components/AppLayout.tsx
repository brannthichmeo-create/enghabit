import { Coins, Flame, Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FeatureKey, UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLevel, useStreak } from '../../features/statistics/statistics.hooks';
import { useRewards } from '../../features/rewards/rewards.hooks';
import { useFeatureQueryEnabled } from '../../features/feature-flags/feature-flag.hooks';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
import { TodoPopover } from '../../features/todos/components/TodoPopover';
import { useT } from '../i18n/language';
import { useBodyScrollLock, useDialogFocus } from '../lib/focus-trap';
import { Breadcrumb, BreadcrumbProvider } from './Breadcrumb';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ScrollToTopButton } from './ScrollToTopButton';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

/**
 * Khung chung sau khi đăng nhập: thanh điều hướng dọc bên trái, nội dung bên phải.
 *
 * Màn hình rộng thì sidebar luôn hiện và thu gọn được. Màn hình hẹp thì nó ẩn đi,
 * mở ra dạng ngăn kéo phủ lên — nhồi sidebar cố định vào màn hình điện thoại sẽ
 * chiếm mất nửa chỗ đọc nội dung.
 */

const COLLAPSE_KEY = 'enghabit-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AppLayout(): JSX.Element {
  // Provider bọc ngoài khung app: màn hình phụ bên trong `Outlet` cần nối thêm cấp
  // cuối cho breadcrumb (xem `useBreadcrumbTail`).
  return (
    <BreadcrumbProvider>
      <AppShell />
    </BreadcrumbProvider>
  );
}

function AppShell(): JSX.Element {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const t = useT();

  /*
    Ngăn kéo là một hộp thoại thật, không chỉ là một lớp phủ được vẽ ra: đưa focus vào
    lúc mở, trả về nút đã mở lúc đóng, giữ Tab quẩn bên trong và khoá cuộn nền. Thiếu
    những thứ này thì người dùng bàn phím mở menu xong vẫn đứng ở nút Menu PHÍA SAU lớp
    phủ, và Tab đi thẳng vào trang nền đang bị che.
  */
  const onDrawerKeyDown = useDialogFocus(drawerOpen, drawerRef);
  useBodyScrollLock(drawerOpen);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* trình duyệt chặn lưu — vẫn dùng được trong phiên này */
    }
  }, [collapsed]);

  // Đổi trang thì đóng ngăn kéo, nếu không nó che mất trang vừa mở
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      {/*
        Lối tắt bỏ qua thanh điều hướng, là phần tử focus được ĐẦU TIÊN của trang.

        Sidebar lặp lại y hệt trên mọi màn hình, nên không có nó thì người dùng bàn phím
        phải Tab qua 8–11 mục nav cộng bốn control thanh trên cùng trước khi chạm nội
        dung — mỗi lần chuyển trang. Ẩn với chuột, chỉ hiện khi được focus.
      */}
      <a
        href={`#${MAIN_CONTENT_ID}`}
        /*
          MỌI thuộc tính hình thức đều nằm sau `focus:`. Để `px-4 py-2 border` ở trạng
          thái nghỉ thì chúng chồng lên phần `padding: 0` của `sr-only` — link "ẩn" trở
          thành một vệt vài điểm ảnh nhìn thấy được ở góc trên trái mọi trang.
        */
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content focus:shadow-lg"
      >
        {t('Bỏ qua tới nội dung')}
      </a>

      {/*
        Sidebar cố định trên màn hình rộng.

        Cố ý KHÔNG có hoạt ảnh cho lần thu gọn: `width` và `padding` là thuộc tính layout
        nên 200ms hoạt ảnh là 200ms tính lại bố cục của cả cột nav lẫn toàn bộ nội dung
        trang. Đây lại là trạng thái người dùng đặt một lần rồi nhớ trong localStorage —
        đổi tức thì vừa đúng vừa rẻ hơn hẳn.

        Là `div` chứ không phải `aside`: bên trong đã có landmark `nav` của Sidebar, bọc
        thêm `aside` chỉ thêm một landmark "complementary" không ai cần.
      */}
      <div
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-line-page lg:block ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </div>

      {/* Ngăn kéo trên màn hình hẹp */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('Thanh điều hướng')}
            tabIndex={-1}
            onKeyDown={onDrawerKeyDown}
            className="fixed inset-y-0 left-0 z-50 w-60 border-r border-line-page shadow-xl outline-none lg:hidden"
          >
            {/* `p-3` + biểu tượng 20px = đích chạm 44px, ngưỡng của ngón tay */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-1 top-1.5 z-10 rounded-lg p-3 text-on-page-muted hover:bg-hover hover:text-on-page"
              aria-label={t('Đóng menu')}
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => undefined}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </>
      )}

      <div className={collapsed ? 'lg:pl-[68px]' : 'lg:pl-60'}>
        {/*
          Thanh trên cùng phải VỪA màn hình hẹp nhất, không phải co lại cho gần vừa.

          Tính theo bề ngang thật: nút Menu 40 + ba ô chỉ số ~152 + bốn nút 32/32/54/32 +
          các khe = 434px chỉ riêng phần cố định — đã tràn iPhone SE (375) và iPhone 14
          (390) trước khi breadcrumb nhận một điểm ảnh nào. Các nút `h-8 w-8` khi đó tự
          co lại dưới 32px và biểu tượng bị bóp méo.

          Nên xếp lại theo mức độ cần trong lúc đang học, không phải bỏ bớt cho gọn:
            - luôn còn: Menu, breadcrumb, chuỗi ngày, Việc cần làm, chuông;
            - từ `sm`: thêm xu và cấp độ — đó là số để liếc, không phải nút để bấm;
            - từ `lg`: thêm ngôn ngữ và giao diện. Dưới đó chúng nằm trong ngăn kéo, nơi
              người dùng vốn đã mở ra để đi chỗ khác. Đây là cài đặt đặt một lần, không
              đáng giữ chỗ cố định trên mọi màn hình điện thoại.
        */}
        <header className="sticky top-0 z-20 border-b border-line-page bg-page/90 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-2 sm:gap-3 sm:py-2.5">
            {/* Chỉ tồn tại ở cỡ cảm ứng nên lấy luôn đích chạm rộng, không cần bản hẹp */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="shrink-0 rounded-lg p-2.5 text-on-page-muted transition-colors hover:bg-hover hover:text-on-page lg:hidden"
              aria-label={t('Mở menu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb chiếm khoảng trống bên trái thanh trên cùng — vị trí này luôn
                cố định nên người dùng biết chỗ tìm, và trang không mất thêm một hàng. */}
            <div className="min-w-0 flex-1">
              <Breadcrumb />
            </div>

            {/* `shrink-0`: cả cụm bên phải là nút bấm, thà để breadcrumb cắt chữ còn hơn
                để các đích chạm teo lại dưới cỡ ngón tay. */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <QuickStats />
              {/* Việc cần làm đứng TRƯỚC chuông: nó là việc của chính người dùng, mở ra
                  để bấm tích chứ không rời màn hình đang mở. Tự ẩn với quản trị viên và
                  khi tính năng đã tắt. */}
              <TodoPopover />
              <NotificationBell />
              <div className="hidden lg:block">
                <LanguageSwitcher />
              </div>
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* `tabIndex={-1}` để nút "Lên đầu trang" chuyển focus về đây được; không ai
            Tab tới vùng này vì -1 nằm ngoài thứ tự Tab. */}
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-5xl px-4 py-6 outline-none">
          <Outlet />
        </main>
      </div>

      <ScrollToTopButton focusTargetId={MAIN_CONTENT_ID} />
    </div>
  );
}

const MAIN_CONTENT_ID = 'main-content';

/**
 * Xu, chuỗi ngày và cấp độ ngay trên thanh trên cùng.
 * Đây là những chỉ số người học liếc nhìn thường xuyên nhất, để ở đây thì không
 * phải quay về trang Tổng quan mới xem được.
 *
 * Quản trị viên không có hai chỉ số này — họ vận hành hệ thống chứ không đi học.
 */
function QuickStats(): JSX.Element | null {
  const t = useT();
  const user = useCurrentUser();
  const isLearner = user?.role !== UserRole.ADMIN;
  const streak = useStreak(isLearner);
  const level = useLevel(isLearner);
  // Tắt Phần thưởng thì không gọi API của nó: request chắc chắn nhận 404. Chờ biết
  // chắc trạng thái rồi mới gọi — chưa biết mà gọi lạc quan là một lỗi 404 trong
  // console mỗi lần mở app.
  const rewardsEnabled = useFeatureQueryEnabled(FeatureKey.REWARDS);
  const rewards = useRewards(isLearner && rewardsEnabled);

  if (!isLearner) return null;

  /*
    Chuỗi ngày ở lại trên MỌI bề ngang, xu và cấp độ chỉ từ `sm`.

    Không phải chọn bừa cho vừa chỗ: cả sản phẩm đặt cược vào việc quay lại học ngày mai,
    nên chuỗi ngày là con số duy nhất đáng chiếm chỗ cố định trên màn hình điện thoại.
    Xu và cấp độ là kết quả của việc đó, xem sau cũng được — và cả hai vẫn nằm nguyên ở
    trang Tổng quan, tức là màn hình người dùng vừa mở lên đã thấy.
  */
  return (
    <div className="flex items-center gap-1.5">
      {rewardsEnabled && (
        <Link
          to="/"
          className={`${PILL} hidden transition-colors hover:border-on-page-muted sm:inline-flex`}
          title={t('Xu — bấm để tới khu phần thưởng')}
        >
          <Coins className="h-3.5 w-3.5 text-accent" aria-hidden />
          {rewards.data?.coins ?? 0}
        </Link>
      )}

      <span
        className={`${PILL} inline-flex`}
        title={streak.data?.isAlive === false ? t('Chuỗi ngày học — đã đứt') : t('Chuỗi ngày học')}
      >
        <Flame
          className={`h-3.5 w-3.5 ${streak.data?.isAlive ? 'text-accent' : 'text-on-page-muted'}`}
          aria-hidden
        />
        {streak.data?.currentStreak ?? 0}
      </span>

      <span
        className={`${PILL} hidden sm:inline-flex`}
        title={t('Cấp {level} · {xp} XP', { level: level.data?.level ?? 1, xp: level.data?.xp ?? 0 })}
      >
        <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
        {level.data?.level ?? 1}
      </span>
    </div>
  );
}

/**
 * Ô chỉ số trên thanh trên cùng: viền rõ, nền trong suốt.
 *
 * Khác với chip trong thẻ (nền `<tone>-soft`) vì nó đứng thẳng trên nền hệ thống chứ
 * không nằm trong thẻ trắng — xem `docs/color-rules.md`. Tách thành hằng số vì ba ô
 * phải giống hệt nhau, và giờ mỗi ô còn mang thêm một quy tắc hiện/ẩn riêng.
 */
const PILL =
  'shrink-0 items-center gap-1 rounded-full border border-line-page px-2 py-1 text-xs font-medium tabular-nums text-on-page-soft';
