import { Navigate, Route, Routes } from 'react-router-dom';
import { FeatureKey, UserRole } from '@enghabit/shared';
import { useAuthStore } from '../features/auth/auth.store';
import { useFeatureFlagsQuery } from '../features/feature-flags/feature-flag.hooks';
import { LoginPage } from '../features/auth/components/LoginPage';
import { RegisterPage } from '../features/auth/components/RegisterPage';
import { DashboardPage } from '../features/statistics/components/DashboardPage';
import { ReportPage } from '../features/statistics/components/ReportPage';
import { HabitsPage } from '../features/habits/components/HabitsPage';
import { GoalsPage } from '../features/goals/components/GoalsPage';
import { TodosPage } from '../features/todos/components/TodosPage';
import { LibraryPage } from '../features/library/components/LibraryPage';
import { StudySetDetailPage } from '../features/library/components/StudySetDetailPage';
import { LearnPage } from '../features/study/components/LearnPage';
import { ReviewPage } from '../features/study/components/ReviewPage';
import { LeaderboardPage } from '../features/leaderboard/components/LeaderboardPage';
import { ShopPage } from '../features/shop/components/ShopPage';
import { WalletPage } from '../features/shop/components/WalletPage';
import { InventoryPage } from '../features/shop/components/InventoryPage';
import { ProfilePage } from '../features/profile/components/ProfilePage';
import { AdminOverviewPage } from '../features/admin/components/AdminOverviewPage';
import { AdminUsersPage } from '../features/admin/components/AdminUsersPage';
import { AdminAccessPage } from '../features/admin/components/AdminAccessPage';
import { AdminGroupsPage } from '../features/admin/components/AdminGroupsPage';
import { AdminContentPage } from '../features/admin/components/AdminContentPage';
import { AdminRequestsPage } from '../features/admin/components/AdminRequestsPage';
import { AdminStudySetsPage } from '../features/admin/components/AdminStudySetsPage';
import { AdminShopPage } from '../features/admin/components/AdminShopPage';
import { AdminFeaturesPage } from '../features/feature-flags/components/AdminFeaturesPage';
import { ForgotPasswordPage } from '../features/auth/components/ForgotPasswordPage';
import { GroupsPage } from '../features/groups/components/GroupsPage';
import { GroupDetailPage } from '../features/groups/components/GroupDetailPage';
import { CommunityPage } from '../features/community/components/CommunityPage';
import { NotificationsPage } from '../features/notifications/components/NotificationsPage';
import { AnnouncementPage } from '../features/notifications/components/AnnouncementPage';
import { FeatureErrorBoundary } from '../shared/components/FeatureErrorBoundary';
import { AppLayout } from '../shared/components/AppLayout';
import { NotFoundPage } from '../shared/components/NotFoundPage';

/**
 * Định tuyến + guard theo vai trò.
 *
 * Hai không gian tách biệt: người học dùng các trang học tập, quản trị viên dùng
 * khu /admin để vận hành hệ thống. Không trộn lẫn — quản trị viên vào "/" sẽ được
 * đưa thẳng sang bảng điều khiển hệ thống chứ không thấy màn hình học của cá nhân.
 *
 * Mỗi feature được bọc FeatureErrorBoundary riêng: lỗi ở một feature (vd flashcards)
 * chỉ làm hỏng đúng phần đó, các phần còn lại vẫn dùng được.
 */
export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      {/* Quên mật khẩu nằm trong PublicOnly như hai màn trên: người đang đăng nhập
          được thì không cần tới đây, họ đổi mật khẩu ở trang cá nhân. */}
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        {/* --- Khu người học --- */}
        <Route path="/" element={<Learner name="Tổng quan"><DashboardPage /></Learner>} />
        <Route path="/report" element={<Gated flag={FeatureKey.REPORT} name="Báo cáo"><ReportPage /></Gated>} />
        <Route path="/habits" element={<Gated flag={FeatureKey.HABITS} name="Thói quen"><HabitsPage /></Gated>} />
        <Route path="/goals" element={<Gated flag={FeatureKey.GOALS} name="Mục tiêu"><GoalsPage /></Gated>} />
        <Route path="/todos" element={<Gated flag={FeatureKey.TODO} name="Việc cần làm"><TodosPage /></Gated>} />
        <Route path="/library" element={<Gated flag={FeatureKey.VOCABULARY} name="Thư viện"><LibraryPage /></Gated>} />
        <Route
          path="/library/:id"
          element={<Gated flag={FeatureKey.VOCABULARY} name="Thư viện"><StudySetDetailPage /></Gated>}
        />
        <Route path="/learn" element={<Gated flag={FeatureKey.LEARN} name="Học"><LearnPage /></Gated>} />
        <Route path="/review" element={<Gated flag={FeatureKey.FLASHCARDS} name="Ôn tập"><ReviewPage /></Gated>} />
        <Route
          path="/leaderboard"
          element={<Gated flag={FeatureKey.LEADERBOARD} name="Bảng xếp hạng"><LeaderboardPage /></Gated>}
        />

        {/* Cửa hàng, Ví và Kho vật phẩm dùng CHUNG một cờ: không có xu thì ví và kho
            đều vô nghĩa (xem shared/constants/features.ts). */}
        <Route path="/shop" element={<Gated flag={FeatureKey.SHOP} name="Cửa hàng"><ShopPage /></Gated>} />
        <Route path="/wallet" element={<Gated flag={FeatureKey.SHOP} name="Ví của tôi"><WalletPage /></Gated>} />
        <Route
          path="/inventory"
          element={<Gated flag={FeatureKey.SHOP} name="Kho vật phẩm"><InventoryPage /></Gated>}
        />

        {/* Trang cá nhân, thông báo và diễn đàn dùng chung cho cả hai vai trò */}
        {/* Diễn đàn: tắt Cộng đồng thì người học mất lối vào, nhưng quản trị viên vẫn
            vào được để kiểm duyệt — khoá cả người dọn là bỏ lại đúng đống bài cần dọn
            mà không ai vào dọn được (API cũng cho admin đi qua, xem app.ts). */}
        <Route
          path="/community"
          element={<Gated flag={FeatureKey.COMMUNITY} adminBypass name="Cộng đồng"><CommunityPage /></Gated>}
        />
        <Route path="/groups" element={<Gated flag={FeatureKey.GROUPS} name="Nhóm lớp"><GroupsPage /></Gated>} />
        <Route
          path="/groups/:id"
          element={<Gated flag={FeatureKey.GROUPS} name="Nhóm lớp"><GroupDetailPage /></Gated>}
        />
        <Route path="/profile" element={<Feature name="Trang cá nhân"><ProfilePage /></Feature>} />
        <Route path="/notifications" element={<Feature name="Thông báo"><NotificationsPage /></Feature>} />

        {/* --- Khu quản trị --- */}
        <Route path="/admin" element={<Admin name="Tổng quan hệ thống"><AdminOverviewPage /></Admin>} />
        <Route path="/admin/users" element={<Admin name="Tài khoản"><AdminUsersPage /></Admin>} />
        <Route path="/admin/access" element={<Admin name="Lượt truy cập"><AdminAccessPage /></Admin>} />
        <Route path="/admin/content" element={<Admin name="Nội dung học tập"><AdminContentPage /></Admin>} />
        <Route path="/admin/groups" element={<Admin name="Quản lý nhóm"><AdminGroupsPage /></Admin>} />
        <Route path="/admin/study-sets" element={<Admin name="Kiểm duyệt bộ thẻ"><AdminStudySetsPage /></Admin>} />
        <Route path="/admin/shop" element={<Admin name="Quản lý cửa hàng"><AdminShopPage /></Admin>} />
        <Route path="/admin/requests" element={<Admin name="Quản lý yêu cầu"><AdminRequestsPage /></Admin>} />
        <Route path="/admin/features" element={<Admin name="Quản lý tính năng"><AdminFeaturesPage /></Admin>} />
        <Route
          path="/admin/announcements"
          element={<Admin name="Gửi thông báo"><AnnouncementPage /></Admin>}
        />

        {/*
          Địa chỉ lạ hiện trang 404 trong khung app. Người chưa đăng nhập vẫn bị
          RequireAuth đẩy sang /login trước, nên không lộ khung app cho khách.
        */}
        <Route path="*" element={<Feature name="Không tìm thấy trang"><NotFoundPage /></Feature>} />
      </Route>
    </Routes>
  );
}

function Feature({ name, children }: { name: string; children: JSX.Element }): JSX.Element {
  return <FeatureErrorBoundary feature={name}>{children}</FeatureErrorBoundary>;
}

/**
 * Trang thuộc một tính năng bật/tắt được từ /admin/features.
 *
 * Tắt thì hiện ĐÚNG trang 404 sẵn có, không `Navigate` về "/": đẩy lặng lẽ về trang chủ
 * khiến người dùng tưởng mình bấm hụt. Cũng không dựng một màn "tính năng đã tắt" riêng
 * — vừa đỡ một màn hình phải dịch, vừa không nói cho người dùng biết hệ thống có tính
 * năng đó nhưng đang tắt, thông tin chỉ khiến họ đi hỏi tại sao.
 *
 * Bọc NGOÀI `Learner` nên quản trị viên vào các trang học vẫn bị đưa về /admin như cũ,
 * bất kể cờ bật hay tắt.
 */
function Gated({
  flag,
  name,
  adminBypass = false,
  children,
}: {
  flag: FeatureKey;
  name: string;
  /** Trang dùng chung hai vai trò mà quản trị viên vẫn phải vào được khi đã tắt. */
  adminBypass?: boolean;
  children: JSX.Element;
}): JSX.Element | null {
  const user = useAuthStore((s) => s.user);
  const flags = useFeatureFlagsQuery();

  if (adminBypass && user?.role === UserRole.ADMIN) return <Feature name={name}>{children}</Feature>;

  /*
    Chưa biết trạng thái thì chưa vẽ gì.

    Khác với sidebar (mặc định coi là bật để mục không nháy): ở đây vẽ lạc quan nghĩa là
    dựng hẳn màn hình của tính năng đang tắt, nó kịp gọi API và nhận về 404, rồi mới bị
    thay bằng trang 404 — người dùng thấy trang chớp một cái, còn console có một lỗi đỏ
    không phải lỗi thật.
  */
  if (!flags.data) return null;

  if (!flags.data[flag]) {
    return (
      <Feature name="Không tìm thấy trang">
        <NotFoundPage />
      </Feature>
    );
  }
  return <Learner name={name}>{children}</Learner>;
}

/** Trang học tập — quản trị viên bị đưa về khu quản trị của họ. */
function Learner({ name, children }: { name: string; children: JSX.Element }): JSX.Element {
  const user = useAuthStore((s) => s.user);
  if (user?.role === UserRole.ADMIN) return <Navigate to="/admin" replace />;
  return <Feature name={name}>{children}</Feature>;
}

function Admin({ name, children }: { name: string; children: JSX.Element }): JSX.Element {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== UserRole.ADMIN) return <Navigate to="/" replace />;
  return <Feature name={name}>{children}</Feature>;
}

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: JSX.Element }): JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  if (!accessToken) return children;
  return <Navigate to={user?.role === UserRole.ADMIN ? '/admin' : '/'} replace />;
}
