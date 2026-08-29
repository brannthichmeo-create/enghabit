import { NavLink, Outlet } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLogout } from '../../features/auth/auth.hooks';

/** Khung chung cho các trang sau khi đăng nhập. */
export function AppLayout(): JSX.Element {
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-indigo-600">Enghabit</span>
            <nav className="flex gap-1">
              <NavItem to="/" label="Tổng quan" />
              {user?.role === UserRole.ADMIN && <NavItem to="/admin" label="Quản trị" />}
            </nav>
          </div>

          <button
            onClick={() => logout.mutate()}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }): JSX.Element {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-sm transition ${
          isActive ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {label}
    </NavLink>
  );
}
