import { Compass, Home, RotateCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '@enghabit/shared';
import { useCurrentUser } from '../../features/auth/auth.store';
import { Button, Card } from './ui';
import { useBreadcrumbTail } from './Breadcrumb';

/**
 * Trang 404 của hệ thống.
 *
 * Nằm TRONG khung app (sidebar + thanh trên cùng) chứ không phải một màn hình trắng
 * riêng: người dùng gõ nhầm địa chỉ vẫn còn đủ lối đi tiếp, không phải bấm nút lùi
 * của trình duyệt.
 *
 * Trước đây địa chỉ lạ bị đẩy thẳng về "/" — im lặng như vậy khiến người dùng tưởng
 * mình bấm hụt, và lỗi gõ sai đường dẫn trong code cũng lặng lẽ trôi qua.
 */
export function NotFoundPage(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Route này không có đường dẫn cố định nên breadcrumb phải tự nối cấp cuối.
  useBreadcrumbTail('Không tìm thấy trang');

  const home = user?.role === UserRole.ADMIN ? '/admin' : '/';

  return (
    <Card className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sunken">
        <Compass className="h-7 w-7 text-content-muted" aria-hidden />
      </div>

      <p className="text-4xl font-bold tabular-nums tracking-tight text-content">404</p>
      <h1 className="mt-1 text-lg font-semibold text-content">Không tìm thấy trang này</h1>

      <p className="mt-2 text-sm text-content-muted">
        Đường dẫn <span className="break-all font-medium text-content-soft">{location.pathname}</span>{' '}
        không tồn tại, hoặc đã được đổi sang chỗ khác.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {/*
          Tải lại thật (không phải điều hướng lại trong app): 404 hay xảy ra khi bản
          web đang mở đã cũ hơn bản vừa deploy — lúc đó chỉ tải lại mới lấy được
          bảng route mới, còn chuyển trang trong app vẫn dùng bản cũ và vẫn 404.
        */}
        <Button icon={RotateCw} onClick={() => window.location.reload()}>
          Làm mới
        </Button>

        {/* Điều hướng bằng hook thay vì bọc Button trong Link: <button> nằm trong <a>
            là HTML không hợp lệ và trình đọc màn hình đọc thành hai phần tử bấm được. */}
        <Button variant="secondary" icon={Home} onClick={() => navigate(home)}>
          Về trang chủ
        </Button>
      </div>
    </Card>
  );
}
