import { NavLink, Outlet } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLogout } from '../../features/auth/auth.hooks';
import { useDueCount } from '../../features/flashcards/flashcard.hooks';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan' },
  { to: '/habits', label: 'Thói quen' },
  { to: '/goals', label: 'Mục tiêu' },
  { to: '/vocabulary', label: 'Từ vựng' },
  { to: '/flashcards', label: 'Ôn tập' },
  { to: '/quizzes', label: 'Quiz' },
];

/** Khung chung cho các trang sau khi đăng nhập. */
export function AppLayout(): JSX.Element {
  const user = useCurrentUser();
  const logout = useLogout();
  const dueCount = useDueCount();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between py-3">
            <span className="text-lg font-bold text-indigo-600">Enghabit</span>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
              <button onClick={() => logout.mutate()} className="text-sm text-slate-600 hover:text-slate-900">
                Đăng xuất
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-2">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                // Hiện số từ tới hạn ôn để user biết còn việc cần làm hôm nay.
                badge={item.to === '/flashcards' ? dueCount.data : undefined}
              />
            ))}
            {user?.role === UserRole.ADMIN && <NavItem to="/admin" label="Quản trị" />}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label, badge }: { to: string; label: string; badge?: number }): JSX.Element {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
          isActive ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
