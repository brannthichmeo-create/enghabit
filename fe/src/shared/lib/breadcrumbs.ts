/**
 * Bản đồ đường dẫn → nhãn hiển thị trên breadcrumb.
 *
 * Đặt tập trung ở đây (không rải nhãn vào từng trang) để một màn hình chỉ có
 * đúng một tên: tên trên sidebar, tên trên breadcrumb và tên trong route guard
 * không lệch nhau. Thêm route mới thì thêm một dòng ở đây.
 *
 * Trail KHÔNG chứa mục gốc ("Tổng quan" của người học / "Tổng quan hệ thống" của
 * quản trị viên) — mục gốc do component `Breadcrumb` tự chèn theo vai trò, vì hai
 * trang dùng chung (`/profile`, `/notifications`) có gốc khác nhau tuỳ người đăng nhập.
 */

export interface Crumb {
  label: string;
  /** Không có `to` nghĩa là mục hiện tại — hiển thị dạng chữ, không phải liên kết. */
  to?: string;
}

/** Mục gốc của khu người học và khu quản trị. */
export const LEARNER_ROOT: Crumb = { label: 'Tổng quan', to: '/' };
export const ADMIN_ROOT: Crumb = { label: 'Tổng quan hệ thống', to: '/admin' };

/** Đường dẫn → các mục nằm SAU mục gốc. Mảng rỗng nghĩa là chính trang gốc. */
const TRAILS: Record<string, Crumb[]> = {
  '/': [],
  '/report': [{ label: 'Báo cáo' }],
  '/library': [{ label: 'Thư viện' }],
  '/learn': [{ label: 'Học' }],
  '/review': [{ label: 'Ôn tập' }],
  '/leaderboard': [{ label: 'Bảng xếp hạng' }],
  '/shop': [{ label: 'Cửa hàng' }],
  '/wallet': [{ label: 'Ví của tôi' }],
  '/inventory': [{ label: 'Kho vật phẩm' }],
  '/habits': [{ label: 'Thói quen' }],
  '/goals': [{ label: 'Mục tiêu' }],
  '/todos': [{ label: 'Việc cần làm' }],
  '/community': [{ label: 'Cộng đồng' }],
  '/groups': [{ label: 'Nhóm lớp' }],
  '/profile': [{ label: 'Trang cá nhân' }],
  '/notifications': [{ label: 'Thông báo' }],

  '/admin': [],
  '/admin/users': [{ label: 'Tài khoản' }],
  '/admin/access': [{ label: 'Lượt truy cập' }],
  '/admin/content': [{ label: 'Nội dung học tập' }],
  '/admin/announcements': [{ label: 'Gửi thông báo' }],
  '/admin/groups': [{ label: 'Quản lý nhóm' }],
  '/admin/study-sets': [{ label: 'Kiểm duyệt bộ thẻ' }],
  '/admin/shop': [{ label: 'Quản lý cửa hàng' }],
  '/admin/requests': [{ label: 'Quản lý yêu cầu' }],
  '/admin/features': [{ label: 'Quản lý tính năng' }],
};

/**
 * Trả về đường dẫn breadcrumb đầy đủ cho một pathname.
 *
 * Route lạ (chưa khai báo) trả về đúng mục gốc thay vì ném lỗi — breadcrumb là
 * phần phụ trợ, không đáng làm hỏng cả trang.
 */
export function crumbsForPath(pathname: string, isAdmin: boolean): Crumb[] {
  const root = isAdmin ? ADMIN_ROOT : LEARNER_ROOT;
  // Bỏ dấu "/" thừa ở cuối để "/habits/" và "/habits" cùng tra được một dòng
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // `/groups/:id`, `/library/:id` và `/admin/content/:id` có URL riêng nhưng mang id động
  // nên không tra thẳng được từ bản đồ tĩnh. Mới có vài route kiểu này nên liệt kê từng
  // cái thay vì dựng cả cơ chế khớp mẫu. Trang tự nối thêm tên nhóm / tên bộ thẻ bằng
  // `useBreadcrumbTail`.
  for (const parent of ['/groups', '/library', '/admin/content']) {
    if (path !== parent && path.startsWith(`${parent}/`)) {
      return [root, ...(TRAILS[parent] ?? [])];
    }
  }

  const trail = TRAILS[path] ?? [];

  return [root, ...trail];
}
