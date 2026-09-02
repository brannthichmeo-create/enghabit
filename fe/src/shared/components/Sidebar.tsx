import {
  Activity,
  Bell,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Megaphone,
  ListChecks,
  LogOut,
  Shield,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLogout } from '../../features/auth/auth.hooks';
import { useDueCount } from '../../features/flashcards/flashcard.hooks';
import { useMistakeCount } from '../../features/lessons/lesson.hooks';
import { useLevel } from '../../features/statistics/statistics.hooks';
import { useUnreadCount } from '../../features/notifications/notification.hooks';
import { useT } from '../i18n/language';
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
  const t = useT();
  const user = useCurrentUser();
  const logout = useLogout();
  // Quản trị viên không học nên không gọi các API của người học — gọi rồi bỏ đi chỉ
  // tốn request và làm log server nhiễu.
  const isLearner = user?.role !== UserRole.ADMIN;
  const dueCount = useDueCount(isLearner);
  const mistakeCount = useMistakeCount(isLearner);
  const level = useLevel(isLearner);
  const unread = useUnreadCount();

  const isAdmin = !isLearner;

  const mainItems: NavItem[] = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/learn', label: 'Học', icon: GraduationCap, badge: mistakeCount.data },
    { to: '/vocabulary', label: 'Từ vựng', icon: BookOpen },
    { to: '/flashcards', label: 'Ôn tập', icon: Layers, badge: dueCount.data },
    { to: '/quizzes', label: 'Quiz', icon: Shield },
    { to: '/notifications', label: 'Thông báo', icon: Bell, badge: unread.data },
  ];

  const habitItems: NavItem[] = [
    { to: '/habits', label: 'Thói quen', icon: ListChecks },
    { to: '/goals', label: 'Mục tiêu', icon: Target },
  ];

  /** Quản trị viên vận hành hệ thống, không đi học — nên thấy đúng bộ mục của mình. */
  const adminItems: NavItem[] = [
    { to: '/admin', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Tài khoản', icon: Users },
    { to: '/admin/access', label: 'Lượt truy cập', icon: Activity },
    { to: '/admin/content', label: 'Nội dung học tập', icon: BookOpen },
    { to: '/admin/announcements', label: 'Gửi thông báo', icon: Megaphone },
  ];

  return (
    /* Nền hệ thống, không phải nền thẻ — sidebar là một phần của khung app */
    <div className="flex h-full flex-col bg-page">
      <div className={`flex items-center px-4 py-4 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Link to="/" onClick={onNavigate}>
          <Logo size="sm" withText={!collapsed} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-2">
        {isAdmin ? (
          <>
            <GroupLabel collapsed={collapsed}>{t('Quản trị')}</GroupLabel>
            <ul className="space-y-0.5">
              {adminItems.map((item) => (
                <li key={item.to}>
                  <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <ul className="space-y-0.5">
              {mainItems.map((item) => (
                <li key={item.to}>
                  <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>

            <GroupLabel collapsed={collapsed}>{t('Duy trì')}</GroupLabel>
            <ul className="space-y-0.5">
              {habitItems.map((item) => (
                <li key={item.to}>
                  <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Khối người dùng — bấm vào tên để mở trang cá nhân */}
      <div className="border-t border-line-page p-2.5">
        <Link
          to="/profile"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-hover ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? user?.name : undefined}
        >
          <Avatar name={user?.name ?? '?'} level={isAdmin ? undefined : level.data?.level} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-on-page">{user?.name}</span>
              <span className="block text-xs text-on-page-muted">{t('Trang cá nhân')}</span>
            </span>
          )}
        </Link>

        <button
          onClick={() => logout.mutate()}
          className={`mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-on-page-muted transition-colors hover:bg-hover hover:text-on-page ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? t('Đăng xuất') : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && t('Đăng xuất')}
        </button>
      </div>

      {/* Nút thu gọn chỉ có nghĩa trên màn hình rộng, nơi sidebar luôn hiện */}
      <button
        onClick={onToggleCollapse}
        className="hidden items-center gap-2 border-t border-line-page px-4 py-2.5 text-xs text-on-page-muted transition-colors hover:bg-hover hover:text-on-page lg:flex"
        aria-label={collapsed ? t('Mở rộng thanh điều hướng') : t('Thu gọn thanh điều hướng')}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} aria-hidden />
        {!collapsed && t('Thu gọn')}
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
  const t = useT();
  const Icon = item.icon;

  // `end`: mục gốc của mỗi khu ("/" và "/admin") phải khớp chính xác, nếu không nó
  // vẫn sáng khi người dùng đang ở trang con.

  return (
    <NavLink
      to={item.to}
      end={item.to === '/' || item.to === '/admin'}
      onClick={onNavigate}
      title={collapsed ? t(item.label) : undefined}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-soft text-brand-strong'
            : 'text-on-page-soft hover:bg-hover hover:text-on-page'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{t(item.label)}</span>
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
  const t = useT();

  if (collapsed) return <div className="my-2 border-t border-line-page" />;

  return (
    <p className="mb-1 mt-4 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-on-page-muted">
      {t(children)}
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
