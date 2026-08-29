import { Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useAuthStore } from '../features/auth/auth.store';
import { LoginPage } from '../features/auth/components/LoginPage';
import { RegisterPage } from '../features/auth/components/RegisterPage';
import { DashboardPage } from '../features/statistics/components/DashboardPage';
import { FeatureErrorBoundary } from '../shared/components/FeatureErrorBoundary';
import { AppLayout } from '../shared/components/AppLayout';

/**
 * Định tuyến + guard theo vai trò.
 * Mỗi feature được bọc trong FeatureErrorBoundary riêng để lỗi không lan ra toàn app.
 */
export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route
          path="/"
          element={
            <FeatureErrorBoundary feature="Thống kê">
              <DashboardPage />
            </FeatureErrorBoundary>
          }
        />
        {/* Các feature còn lại (habits, goals, flashcards, quizzes, admin) thêm route tại đây
            theo đúng mẫu: bọc FeatureErrorBoundary + trỏ tới components của feature. */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: JSX.Element }): JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? <Navigate to="/" replace /> : children;
}

/** Guard cho trang quản trị — dùng khi thêm route /admin. */
export function RequireAdmin({ children }: { children: JSX.Element }): JSX.Element {
  const user = useAuthStore((s) => s.user);
  return user?.role === UserRole.ADMIN ? children : <Navigate to="/" replace />;
}
