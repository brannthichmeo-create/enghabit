import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Shield,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLogout } from '../../features/auth/auth.hooks';
import { useDueCount } from '../../features/flashcards/flashcard.hooks';
import { useMistakeCount } from '../../features/lessons/lesson.hooks';
import { useLevel } from '../../features/statistics/statistics.hooks';
import { Logo } from './Logo';

/**
 * Thanh điều hướng dọc bên trái.
 *
 * Thay cho thanh ngang cũ: danh sách mục đã đủ dài để hàng ngang phải cuộn,
 * mà cuộn ngang thì mục cuối gần như không ai thấy. Cột dọc hiện hết cùng lúc.
 *
 * Thu gọn được về dạng chỉ còn biểu tượng, dành cho người muốn rộng chỗ đọc nội dung.
 */

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Số việc còn tồn, hiện thành nhãn nhỏ bên phải. */
  badge?: number;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Gọi khi chọn một mục — dùng để đóng ngăn kéo trên màn hình hẹp. */
  onNavigate?: () => void;
}): JSX.Element {
  const user = useCurrentUser();
  const logout = useLogout();
  const dueCount = useDueCount();
  const mistakeCount = useMistakeCount();
  const level = useLevel();

  const mainItems: NavItem[] = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/learn', label: 'Học', icon: GraduationCap, badge: mistakeCount.data },
    { to: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
    { to: '/flashcards', label: 'Ôn tập', icon: Layers, badge: dueCount.data },
    { to: '/quizzes', label: 'Quiz', icon: Shield },
  ];

  const habitItems: NavItem[] = [
    { to: '/habits', label: 'Thói quen', icon: ListChecks },
    { to: '/goals', label: 'Mục tiêu', icon: Target },
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className={`flex items-center px-4 py-4 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Link to="/" onClick={onNavigate}>
          <Logo size="sm" withText={!collapsed} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-2">
        <ul className="space-y-0.5">
          {mainItems.map((item) => (
            <li key={item.to}>
              <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        <GroupLabel collapsed={collapsed}>Duy trì</GroupLabel>
        <ul className="space-y-0.5">
          {habitItems.map((item) => (
            <li key={item.to}>
              <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        {user?.role === UserRole.ADMIN && (
          <>
            <GroupLabel collapsed={collapsed}>Hệ thống</GroupLabel>
            <ul>
              <li>
                <Item
                  item={{ to: '/admin', label: 'Quản trị', icon: Shield }}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* Khối người dùng — bấm vào tên để mở trang cá nhân */}
      <div className="border-t border-line p-2.5">
        <Link
          to="/profile"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-sunken ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? user?.name : undefined}
        >
          <Avatar name={user?.name ?? '?'} level={level.data?.level} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-content">{user?.name}</span>
              <span className="block text-xs text-content-muted">Trang cá nhân</span>
            </span>
          )}
        </Link>

        <button
          onClick={() => logout.mutate()}
          className={`mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-content-muted transition-colors hover:bg-sunken hover:text-content ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && 'Đăng xuất'}
        </button>
      </div>

      {/* Nút thu gọn chỉ có nghĩa trên màn hình rộng, nơi sidebar luôn hiện */}
      <button
        onClick={onToggleCollapse}
        className="hidden items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-content-muted transition-colors hover:bg-sunken hover:text-content lg:flex"
        aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} aria-hidden />
        {!collapsed && 'Thu gọn'}
      </button>
    </div>
  );
}

function Item({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}): JSX.Element {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-soft text-brand-strong'
            : 'text-content-soft hover:bg-sunken hover:text-content'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-on-brand">
              {item.badge}
            </span>
          )}
        </>
      )}
      {/* Thu gọn thì không còn chỗ cho số, chỉ báo bằng một chấm */}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute ml-5 mt-[-14px] h-2 w-2 rounded-full bg-brand" aria-hidden />
      )}
    </NavLink>
  );
}

function GroupLabel({ children, collapsed }: { children: string; collapsed: boolean }): JSX.Element {
  if (collapsed) return <div className="my-2 border-t border-line" />;

  return (
    <p className="mb-1 mt-4 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
      {children}
    </p>
  );
}

/** Chữ cái đầu của tên, kèm huy hiệu cấp độ ở góc. */
export function Avatar({
  name,
  level,
  size = 'md',
}: {
  name: string;
  level?: number;
  size?: 'md' | 'lg';
}): JSX.Element {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const box = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-9 w-9 text-xs';

  return (
    <span className="relative shrink-0">
      <span
        className={`flex items-center justify-center rounded-full bg-brand font-semibold text-on-brand ${box}`}
      >
        {initials || '?'}
      </span>
      {level !== undefined && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface bg-accent px-1 text-[9px] font-bold leading-[14px] text-on-brand">
          {level}
        </span>
      )}
    </span>
  );
}
