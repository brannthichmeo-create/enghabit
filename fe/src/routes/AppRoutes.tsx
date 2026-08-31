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
import { ProfilePage } from '../features/profile/components/ProfilePage';
import { AdminPage } from '../features/admin/components/AdminPage';
import { FeatureErrorBoundary } from '../shared/components/FeatureErrorBoundary';
import { AppLayout } from '../shared/components/AppLayout';

/**
 * Định tuyến + guard theo vai trò.
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
        <Route path="/" element={<Feature name="Thống kê"><DashboardPage /></Feature>} />
        <Route path="/learn" element={<Feature name="Bài học"><PathPage /></Feature>} />
        <Route path="/habits" element={<Feature name="Thói quen"><HabitsPage /></Feature>} />
        <Route path="/goals" element={<Feature name="Mục tiêu"><GoalsPage /></Feature>} />
        <Route path="/vocabulary" element={<Feature name="Từ vựng"><VocabularyPage /></Feature>} />
        <Route path="/flashcards" element={<Feature name="Flashcard"><FlashcardPage /></Feature>} />
        <Route path="/quizzes" element={<Feature name="Quiz"><QuizzesPage /></Feature>} />
        <Route path="/profile" element={<Feature name="Trang cá nhân"><ProfilePage /></Feature>} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Feature name="Quản trị">
                <AdminPage />
              </Feature>
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Feature({ name, children }: { name: string; children: JSX.Element }): JSX.Element {
  return <FeatureErrorBoundary feature={name}>{children}</FeatureErrorBoundary>;
}

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: JSX.Element }): JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? <Navigate to="/" replace /> : children;
}

function RequireAdmin({ children }: { children: JSX.Element }): JSX.Element {
  const user = useAuthStore((s) => s.user);
  return user?.role === UserRole.ADMIN ? children : <Navigate to="/" replace />;
}
