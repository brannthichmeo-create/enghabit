import {
  Activity,
  Bell,
  BookOpen,
  ChartColumn,
  ChevronLeft,
  Flag,
  GraduationCap,
  Inbox,
  Layers,
  Library,
  LayoutDashboard,
  Megaphone,
  ListChecks,
  ListTodo,
  PackageOpen,
  Store,
  Wallet,
  LogOut,
  MessagesSquare,
  UsersRound,
  Target,
  ToggleRight,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { AVATAR_FRAME_SCALE, FeatureKey, UserRole, type FeatureFlagMap } from '@enghabit/shared';
import { useFeatureFlags, useFeatureQueryEnabled } from '../../features/feature-flags/feature-flag.hooks';
import { useCurrentUser } from '../../features/auth/auth.store';
import { useLogout } from '../../features/auth/auth.hooks';
import { useDueCount } from '../../features/study/study.hooks';
import { useLevel } from '../../features/statistics/statistics.hooks';
import { useUnreadCount } from '../../features/notifications/notification.hooks';
import { remainingCount, useTodayLocalDate, useTodos } from '../../features/todos/todo.hooks';
import { useMyFrameUrl } from '../../features/shop/shop.hooks';
import { useT } from '../i18n/language';
import { apiUrl } from '../lib/config';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

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
  /** Mục biến mất khi quản trị viên tắt tính năng này. Không có nghĩa là luôn hiện. */
  flag?: FeatureKey;
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
  const reviewEnabled = useFeatureQueryEnabled(FeatureKey.FLASHCARDS);
  const flags = useFeatureFlags();
  // Ôn tập đã tắt thì không hỏi số thẻ tới hạn: một request chắc chắn nhận 404. Chờ
  // biết chắc trạng thái rồi mới gọi, nên dùng useFeatureQueryEnabled chứ không phải
  // bản đồ `flags` (bản đồ mặc định bật khi chưa biết, hợp cho hiển thị chứ không hợp
  // cho request).
  const dueCount = useDueCount(isLearner && reviewEnabled);
  const level = useLevel(isLearner);
  const unread = useUnreadCount();
  const myFrame = useMyFrameUrl(isLearner);

  // Cùng khoá cache với bảng thả xuống trên thanh trên cùng và với trang /todos, nên
  // con số ở ba chỗ không bao giờ lệch nhau và cả ba chỉ tốn MỘT request.
  const todoEnabled = useFeatureQueryEnabled(FeatureKey.TODO);
  const todos = useTodos(useTodayLocalDate(), isLearner && todoEnabled);

  const isAdmin = !isLearner;

  const mainItems: NavItem[] = visibleItems(
    [
      { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/library', label: 'Thư viện', icon: Library, flag: FeatureKey.VOCABULARY },
      { to: '/learn', label: 'Học', icon: GraduationCap, flag: FeatureKey.LEARN },
      { to: '/review', label: 'Ôn tập', icon: Layers, badge: dueCount.data, flag: FeatureKey.FLASHCARDS },
      { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy, flag: FeatureKey.LEADERBOARD },
      { to: '/community', label: 'Cộng đồng', icon: MessagesSquare, flag: FeatureKey.COMMUNITY },
      { to: '/groups', label: 'Nhóm lớp', icon: UsersRound, flag: FeatureKey.GROUPS },
      { to: '/notifications', label: 'Thông báo', icon: Bell, badge: unread.data },
    ],
    flags,
  );

  const habitItems: NavItem[] = visibleItems(
    [
      { to: '/habits', label: 'Thói quen', icon: ListChecks, flag: FeatureKey.HABITS },
      { to: '/goals', label: 'Mục tiêu', icon: Target, flag: FeatureKey.GOALS },
      {
        to: '/todos',
        label: 'Việc cần làm',
        icon: ListTodo,
        badge: remainingCount(todos.data),
        flag: FeatureKey.TODO,
      },
      { to: '/report', label: 'Báo cáo', icon: ChartColumn, flag: FeatureKey.REPORT },
    ],
    flags,
  );

  /*
    Nhóm "Cá nhân" — ba màn nói về TÀI SẢN của người học, không phải việc học.

    Đặt cuối cùng và tách khỏi nhóm trên vì chúng không phải việc cần làm hôm nay: người
    học mở Cửa hàng hay Ví khi đã học xong và muốn tiêu xu, chứ không phải lúc đang tìm
    bài để học. Cùng một cờ SHOP nên tắt cửa hàng là cả nhãn nhóm biến mất theo.
  */
  const personalItems: NavItem[] = visibleItems(
    [
      { to: '/shop', label: 'Cửa hàng', icon: Store, flag: FeatureKey.SHOP },
      { to: '/inventory', label: 'Kho vật phẩm', icon: PackageOpen, flag: FeatureKey.SHOP },
      { to: '/wallet', label: 'Ví của tôi', icon: Wallet, flag: FeatureKey.SHOP },
    ],
    flags,
  );

  /** Quản trị viên vận hành hệ thống, không đi học — nên thấy đúng bộ mục của mình. */
  const adminItems: NavItem[] = [
    { to: '/admin', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Tài khoản', icon: Users },
    { to: '/admin/access', label: 'Lượt truy cập', icon: Activity },
    { to: '/admin/content', label: 'Nội dung học tập', icon: BookOpen },
    { to: '/admin/announcements', label: 'Gửi thông báo', icon: Megaphone },
    // Nhãn phải GIỐNG HỆT `name` của route và nhãn trong TRAILS (xem CLAUDE.md) —
    // một màn hình chỉ có một tên, và chỉ cần một khoá dịch.
    { to: '/admin/requests', label: 'Quản lý yêu cầu', icon: Inbox },
    { to: '/admin/features', label: 'Quản lý tính năng', icon: ToggleRight },
    // Diễn đàn mở cho cả hai vai trò — quản trị viên vào để trả lời và kiểm duyệt.
    { to: '/admin/groups', label: 'Quản lý nhóm', icon: UsersRound },
    { to: '/admin/study-sets', label: 'Kiểm duyệt bộ thẻ', icon: Flag },
    { to: '/admin/shop', label: 'Quản lý cửa hàng', icon: Store },
    { to: '/community', label: 'Cộng đồng', icon: MessagesSquare },
  ];

  return (
    /* Nền hệ thống, không phải nền thẻ — sidebar là một phần của khung app */
    <div className="flex h-full flex-col bg-page">
      <div className={`flex items-center px-4 py-4 ${collapsed ? 'justify-center px-2' : ''}`}>
        {/*
          `aria-label` là BẮT BUỘC, không phải cho đẹp: lúc thu gọn, `Logo` chỉ còn một
          `<img alt="" aria-hidden>` nên link này không còn tên truy cập nào cả — trình
          đọc màn hình đọc đúng chữ "link" rồi thôi.
        */}
        <Link to="/" onClick={onNavigate} aria-label={t('Trang chủ ENG//HABIT')}>
          <Logo size="sm" withText={!collapsed} />
        </Link>
      </div>

      {/*
        Ngôn ngữ và giao diện chỉ xuất hiện ở đây DƯỚI `lg` — trên đó chúng đã ở thanh
        trên cùng, nơi không đủ chỗ cho chúng ở màn hình điện thoại (xem phép tính trong
        `AppLayout`). Ngăn kéo là chỗ hợp lý: người dùng mở nó ra là đang đi tìm chỗ
        khác, còn đây là hai cài đặt đặt một lần rồi thôi.

        Hai ràng buộc ép ra đúng vị trí này, không phải thẩm mỹ:
          - `justify-end` vì bảng thả xuống của chúng neo `right-0`; đặt bên trái ngăn
            kéo rộng 240px thì bảng rộng 176–192px sẽ đổ ra ngoài mép trái màn hình;
          - đặt NGAY DƯỚI logo chứ không ở khối người dùng dưới đáy, vì bảng mở XUỐNG
            (`mt-1.5`) — ở đáy ngăn kéo thì nó rơi khỏi màn hình.
      */}
      <div className="flex items-center justify-end gap-1 px-2.5 pb-1 lg:hidden">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Trang có hai landmark điều hướng (đây và breadcrumb) nên cả hai phải có tên */}
      <nav aria-label={t('Điều hướng chính')} className="flex-1 overflow-y-auto px-2.5 pb-2">
        {isAdmin ? (
          <>
            <GroupLabel collapsed={collapsed}>{'Quản trị'}</GroupLabel>
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

            {/* Tắt cả ba tính năng của nhóm thì ẩn luôn nhãn nhóm — một tiêu đề đứng
                trơ không có mục nào dưới trông như giao diện vỡ. */}
            {habitItems.length > 0 && (
              <>
                <GroupLabel collapsed={collapsed}>{'Duy trì'}</GroupLabel>
                <ul className="space-y-0.5">
                  {habitItems.map((item) => (
                    <li key={item.to}>
                      <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Cùng luật với nhóm trên: tắt tính năng hết mục thì ẩn cả nhãn nhóm. */}
            {personalItems.length > 0 && (
              <>
                <GroupLabel collapsed={collapsed}>{'Cá nhân'}</GroupLabel>
                <ul className="space-y-0.5">
                  {personalItems.map((item) => (
                    <li key={item.to}>
                      <Item item={item} collapsed={collapsed} onNavigate={onNavigate} />
                    </li>
                  ))}
                </ul>
              </>
            )}
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
          <Avatar
            name={user?.name ?? '?'}
            src={user?.avatarDataUrl}
            frameUrl={myFrame}
            level={isAdmin ? undefined : level.data?.level}
          />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-on-page">{user?.name}</span>
              <span className="block text-xs text-on-page-muted">{t('Trang cá nhân')}</span>
            </span>
          )}
        </Link>

        <button
          onClick={() => logout.mutate()}
          className={`mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-3 text-sm text-on-page-muted transition-colors hover:bg-hover hover:text-on-page lg:py-2 ${
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
        aria-expanded={!collapsed}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} aria-hidden />
        {!collapsed && t('Thu gọn')}
      </button>
    </div>
  );
}

/** Bỏ các mục thuộc tính năng đã tắt. Mục không gắn cờ thì luôn giữ. */
function visibleItems(items: NavItem[], flags: FeatureFlagMap): NavItem[] {
  return items.filter((item) => !item.flag || flags[item.flag]);
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

  const count = item.badge !== undefined && item.badge > 0 ? item.badge : undefined;
  const label = t(item.label);
  /*
    Lúc thu gọn, cái tên duy nhất của link là `aria-label` này: chữ đã ẩn và biểu tượng
    thì `aria-hidden`. Con số phải đi kèm vào đây, nếu không thì thu gọn xong người dùng
    trình đọc màn hình mất sạch thông tin "3 thẻ tới hạn" — chấm báo hiệu là thứ trang
    trí, không đọc được.
  */
  const name = count === undefined ? label : t('{label} ({n})', { label, n: count });

  // `end`: mục gốc của mỗi khu ("/" và "/admin") phải khớp chính xác, nếu không nó
  // vẫn sáng khi người dùng đang ở trang con.

  return (
    <NavLink
      to={item.to}
      end={item.to === '/' || item.to === '/admin'}
      onClick={onNavigate}
      title={collapsed ? name : undefined}
      aria-label={collapsed ? name : undefined}
      /*
        `py-3` dưới `lg` cho đích chạm 44px, `lg:py-2` giữ lại mật độ dày của bản dùng
        chuột — đây là điều hướng chính trên cảm ứng và các mục chỉ cách nhau 2px.
        `relative` để chấm báo hiệu bám vào chính mục này (xem bên dưới).
      */
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 rounded-lg px-2.5 py-3 text-sm font-medium transition-colors lg:py-2 ${
          isActive
            ? 'bg-brand-soft text-brand-strong'
            : 'text-on-page-soft hover:bg-hover hover:text-on-page'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <Icon className={`${NAV_ICON} shrink-0`} aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {count !== undefined && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-on-brand">
              {count}
            </span>
          )}
        </>
      )}
      {/*
        Thu gọn thì không còn chỗ cho số, chỉ báo bằng một chấm ở góc trên-phải biểu
        tượng. Số đã nằm trong `aria-label` nên chấm là thuần trang trí.
      */}
      {collapsed && count !== undefined && (
        <span className="absolute right-2.5 top-1.5 h-2 w-2 rounded-full bg-brand" aria-hidden />
      )}
    </NavLink>
  );
}

/**
 * Cỡ biểu tượng của mục điều hướng: một nấc cố ý nằm giữa `h-4` (16px) và `h-5` (20px).
 *
 * 16px chìm mất cạnh chữ `text-sm`, 20px thì nặng hơn nhãn nó đứng cạnh. Đặt thành hằng
 * số thay vì rải giá trị tuỳ ý trong class, để lần sau đổi là đổi đúng một chỗ.
 */
const NAV_ICON = 'h-[18px] w-[18px]';

function GroupLabel({ children, collapsed }: { children: string; collapsed: boolean }): JSX.Element {
  const t = useT();

  if (collapsed) return <div className="my-2 border-t border-line-page" />;

  return (
    <p className="mb-1 mt-4 px-2.5 text-xs font-semibold uppercase tracking-wider text-on-page-muted">
      {t(children)}
    </p>
  );
}

/** Khung phủ: to hơn avatar AVATAR_FRAME_SCALE lần, lệch về trên-trái nửa phần dư. */
const FRAME_OVERLAY_STYLE = {
  width: `${AVATAR_FRAME_SCALE * 100}%`,
  height: `${AVATAR_FRAME_SCALE * 100}%`,
  left: `${((1 - AVATAR_FRAME_SCALE) / 2) * 100}%`,
  top: `${((1 - AVATAR_FRAME_SCALE) / 2) * 100}%`,
} as const;

const AVATAR_BOX = {
  md: 'h-9 w-9 text-xs',
  lg: 'h-16 w-16 text-xl',
  /** Chỉ dùng ở ô xem thử khung viền trong cửa hàng. */
  xl: 'h-24 w-24 text-2xl',
} as const;

/**
 * Viền MẶC ĐỊNH khi chưa dùng khung nào: vòng trắng 2px, ngoài cùng một nét `line` 1px.
 *
 * Nét `line` là bắt buộc chứ không phải trang trí: avatar hay nằm trong thẻ nền trắng
 * (bài đăng, bảng xếp hạng), mà vòng trắng trên nền trắng thì không ai thấy — người dùng
 * sẽ tưởng khung mặc định không tồn tại. Dùng token `--line` nên tự đổi theo chế độ tối.
 */
const DEFAULT_FRAME = 'ring-2 ring-white shadow-[0_0_0_3px_rgb(var(--line))]';

/**
 * Ảnh đại diện, kèm khung viền và huy hiệu cấp độ ở góc.
 *
 * Chưa đặt ảnh thì hiện chữ cái đầu của tên — luôn có gì đó để nhìn, không bao giờ là
 * một ô trống hay ảnh vỡ.
 *
 * Đây là chỗ DUY NHẤT vẽ khung viền, cho cả khung của mình lẫn của người khác. Thêm một
 * màn hình mới hiện người dùng thì chỉ cần truyền `frameUrl` — đừng tự vẽ khung ở đó.
 */
export function Avatar({
  name,
  level,
  src,
  frameUrl,
  size = 'md',
}: {
  name: string;
  level?: number;
  /** Ảnh dạng data URL lấy từ `PublicUser.avatarDataUrl`. */
  src?: string | null;
  /**
   * Ảnh khung viền đang dùng — `avatarFrameUrl` của DTO, hoặc `imageUrl` của vật phẩm.
   * Nhận được cả đường dẫn dưới gốc API lẫn URL đã ghép: `apiUrl` không ghép hai lần.
   * `null`/bỏ trống = khung mặc định viền trắng.
   */
  frameUrl?: string | null;
  size?: keyof typeof AVATAR_BOX;
}): JSX.Element {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const box = AVATAR_BOX[size];
  // Có khung ảnh thì bỏ viền mặc định: hai viền chồng nhau là viền trắng lòi ra ở mép trong.
  const ring = frameUrl ? '' : DEFAULT_FRAME;

  return (
    // inline-flex: bản `relative` trần là phần tử inline nên để thừa một khe dưới chân
    // ảnh (khoảng dành cho phần đuôi chữ), làm khung phủ lên lệch xuống vài điểm ảnh.
    <span className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt=""
          className={`rounded-full object-cover ${ring} ${box}`}
          // Ảnh là avatar của chính người đang xem, không mang thông tin gì thêm ngoài
          // cái tên đã hiện ngay cạnh — để alt rỗng cho trình đọc màn hình bỏ qua.
        />
      ) : (
        <span
          className={`flex items-center justify-center rounded-full bg-brand font-semibold text-on-brand ${ring} ${box}`}
        >
          {initials || '?'}
        </span>
      )}
      {frameUrl && (
        <img
          src={apiUrl(frameUrl)}
          alt=""
          aria-hidden
          // Khung là ảnh vuông to hơn avatar đúng AVATAR_FRAME_SCALE lần, căn giữa. Tỉ lệ
          // lấy từ shared — backend vẽ ảnh khung theo cùng con số, lệch là viền đè lên mặt.
          style={FRAME_OVERLAY_STYLE}
          className="pointer-events-none absolute max-w-none"
        />
      )}
      {level !== undefined && (
        // `aria-hidden`: avatar luôn đứng cạnh tên, và chip này nằm TRONG link trang cá
        // nhân — để nó đọc được thì tên link thành "Minh · Trang cá nhân · 7", một con
        // số trần không có ngữ cảnh. Cấp độ đã có nhãn đầy đủ ở thanh trên cùng.
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface bg-accent px-1 text-[10px] font-bold leading-[14px] text-on-brand"
        >
          {level}
        </span>
      )}
    </span>
  );
}
