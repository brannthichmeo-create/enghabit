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
  '/learn': [{ label: 'Học' }],
  '/vocabulary': [{ label: 'Từ vựng' }],
  '/flashcards': [{ label: 'Ôn tập' }],
  '/quizzes': [{ label: 'Quiz' }],
  '/habits': [{ label: 'Thói quen' }],
  '/goals': [{ label: 'Mục tiêu' }],
  '/profile': [{ label: 'Trang cá nhân' }],
  '/notifications': [{ label: 'Thông báo' }],

  '/admin': [],
  '/admin/users': [{ label: 'Tài khoản' }],
  '/admin/access': [{ label: 'Lượt truy cập' }],
  '/admin/content': [{ label: 'Nội dung học tập' }],
  '/admin/announcements': [{ label: 'Gửi thông báo' }],
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
  const trail = TRAILS[path] ?? [];

  return [root, ...trail];
}
