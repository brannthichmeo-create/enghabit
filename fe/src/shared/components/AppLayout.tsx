import { BookOpen, GraduationCap, LayoutDashboard, ListChecks, LogOut, Layers, Shield, Target } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLogout } from '../../features/auth/auth.hooks';
import { useDueCount } from '../../features/flashcards/flashcard.hooks';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/learn', label: 'Học', icon: GraduationCap },
  { to: '/habits', label: 'Thói quen', icon: ListChecks },
  { to: '/goals', label: 'Mục tiêu', icon: Target },
  { to: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
  { to: '/flashcards', label: 'Ôn tập', icon: Layers },
  { to: '/quizzes', label: 'Quiz', icon: Shield },
];

/** Khung chung cho các trang sau khi đăng nhập. */
export function AppLayout(): JSX.Element {
  const user = useCurrentUser();
  const logout = useLogout();
  const dueCount = useDueCount();

  return (
    <div className="min-h-screen">
      {/* sticky để thanh điều hướng luôn trong tầm với khi cuộn danh sách dài */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between py-3">
            <Logo size="sm" />

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-content-soft sm:inline">{user?.name}</span>
              <ThemeToggle />
              <button
                onClick={() => logout.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-content-muted transition-colors hover:bg-sunken hover:text-content"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>

          <nav className="-mx-1 flex gap-0.5 overflow-x-auto px-1 pb-2 no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                // Số từ tới hạn ôn hiện ngay trên nav để user biết còn việc cần làm
                badge={item.to === '/flashcards' ? dueCount.data : undefined}
              />
            ))}
            {user?.role === UserRole.ADMIN && <NavItem to="/admin" label="Quản trị" icon={Shield} />}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}): JSX.Element {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-soft text-brand-strong' : 'text-content-muted hover:bg-sunken hover:text-content'
        }`
      }
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-on-brand">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
