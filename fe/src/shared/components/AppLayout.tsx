import { Flame, Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLevel, useStreak } from '../../features/statistics/statistics.hooks';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
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
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

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
      {/* Sidebar cố định trên màn hình rộng */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-line-page transition-[width] duration-200 lg:block ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      {/* Ngăn kéo trên màn hình hẹp */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 border-r border-line-page shadow-xl lg:hidden">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-2 top-3 z-10 rounded-lg p-1.5 text-on-page-muted hover:bg-hover hover:text-on-page"
              aria-label="Đóng menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => undefined}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-60'}`}>
        <header className="sticky top-0 z-20 border-b border-line-page bg-page/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-1.5 text-on-page-muted transition-colors hover:bg-hover hover:text-on-page lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            <QuickStats />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Chuỗi ngày và cấp độ ngay trên thanh trên cùng.
 * Đây là hai chỉ số người học liếc nhìn thường xuyên nhất, để ở đây thì không
 * phải quay về trang Tổng quan mới xem được.
 *
 * Quản trị viên không có hai chỉ số này — họ vận hành hệ thống chứ không đi học.
 */
function QuickStats(): JSX.Element | null {
  const user = useCurrentUser();
  const isLearner = user?.role !== UserRole.ADMIN;
  const streak = useStreak(isLearner);
  const level = useLevel(isLearner);

  if (!isLearner) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 rounded-full border border-line-page px-2 py-1 text-xs font-medium tabular-nums text-on-page-soft"
        title={`Chuỗi ngày học${streak.data?.isAlive === false ? ' — đã đứt' : ''}`}
      >
        <Flame
          className={`h-3.5 w-3.5 ${streak.data?.isAlive ? 'text-accent' : 'text-on-page-muted'}`}
          aria-hidden
        />
        {streak.data?.currentStreak ?? 0}
      </span>

      <span
        className="inline-flex items-center gap-1 rounded-full border border-line-page px-2 py-1 text-xs font-medium tabular-nums text-on-page-soft"
        title={`Cấp ${level.data?.level ?? 1} · ${level.data?.xp ?? 0} XP`}
      >
        <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
        {level.data?.level ?? 1}
      </span>
    </div>
  );
}
