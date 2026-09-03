import { Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginPage } from '../features/auth/components/LoginPage';
import { RegisterPage } from '../features/auth/components/RegisterPage';
import { DashboardPage } from '../features/statistics/components/DashboardPage';
import { HabitsPage } from '../features/habits/components/HabitsPage';
import { GoalsPage } from '../features/goals/components/GoalsPage';
import { PathPage } from '../features/lessons/components/PathPage';
import { VocabularyPage } from '../features/vocabulary/components/VocabularyPage';
import { FlashcardPage } from '../features/flashcards/components/FlashcardPage';
import { QuizzesPage } from '../features/quizzes/components/QuizzesPage';
import { LeaderboardPage } from '../features/leaderboard/components/LeaderboardPage';
import { ProfilePage } from '../features/profile/components/ProfilePage';
import { AdminOverviewPage } from '../features/admin/components/AdminOverviewPage';
import { AdminUsersPage } from '../features/admin/components/AdminUsersPage';
import { AdminAccessPage } from '../features/admin/components/AdminAccessPage';
import { AdminContentPage } from '../features/admin/components/AdminContentPage';
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

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        {/* --- Khu người học --- */}
        <Route path="/" element={<Learner name="Thống kê"><DashboardPage /></Learner>} />
        <Route path="/learn" element={<Learner name="Bài học"><PathPage /></Learner>} />
        <Route path="/habits" element={<Learner name="Thói quen"><HabitsPage /></Learner>} />
        <Route path="/goals" element={<Learner name="Mục tiêu"><GoalsPage /></Learner>} />
        <Route path="/vocabulary" element={<Learner name="Từ vựng"><VocabularyPage /></Learner>} />
        <Route path="/flashcards" element={<Learner name="Flashcard"><FlashcardPage /></Learner>} />
        <Route path="/quizzes" element={<Learner name="Quiz"><QuizzesPage /></Learner>} />
        <Route path="/leaderboard" element={<Learner name="Bảng xếp hạng"><LeaderboardPage /></Learner>} />

        {/* Trang cá nhân và thông báo dùng chung cho cả hai vai trò */}
        <Route path="/profile" element={<Feature name="Trang cá nhân"><ProfilePage /></Feature>} />
        <Route path="/notifications" element={<Feature name="Thông báo"><NotificationsPage /></Feature>} />

        {/* --- Khu quản trị --- */}
        <Route path="/admin" element={<Admin name="Tổng quan hệ thống"><AdminOverviewPage /></Admin>} />
        <Route path="/admin/users" element={<Admin name="Quản lý tài khoản"><AdminUsersPage /></Admin>} />
        <Route path="/admin/access" element={<Admin name="Lượt truy cập"><AdminAccessPage /></Admin>} />
        <Route path="/admin/content" element={<Admin name="Nội dung học tập"><AdminContentPage /></Admin>} />
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
