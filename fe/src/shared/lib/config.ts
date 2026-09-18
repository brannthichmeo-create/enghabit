/**
 * Cấu hình đọc từ biến môi trường lúc build.
 *
 * Để ở module riêng vì cả `api-client` lẫn `auth.store` đều cần — mà hai file đó
 * phụ thuộc lẫn nhau (api-client lấy token từ store, store gọi API refresh).
 * Đặt hằng số ở một trong hai sẽ tạo phụ thuộc vòng.
 */

/**
 * Địa chỉ gốc của API.
 *
 * Dev để trống -> dùng đường dẫn tương đối, Vite proxy sang localhost:4000.
 * Khi deploy phải đặt VITE_API_URL trỏ tới backend thật, vì frontend và backend
 * lúc đó nằm ở hai tên miền khác nhau.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

/**
 * Biến một đường dẫn dưới gốc API (`/shop/items/1/image`) thành URL dùng được làm `src`.
 *
 * Cần cho mọi tài nguyên tải bằng THẺ HTML (`img`, `a href`) chứ không qua `apiClient`:
 * axios tự ghép `baseURL`, còn trình duyệt ghép đường tương đối với tên miền của TRANG.
 * Local không thấy khác biệt vì Vite proxy `/api` sang backend; trên production trang ở
 * Vercel còn API ở Render, nên thiếu bước ghép này là ảnh gọi nhầm vào Vercel và vỡ.
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
