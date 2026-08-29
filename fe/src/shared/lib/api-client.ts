import axios, { AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '../../features/auth/auth.store';

/**
 * HTTP client dùng chung cho mọi feature.
 *
 * Tự động gắn access token và tự refresh khi token hết hạn — mỗi feature chỉ việc gọi API,
 * không lặp lại logic xử lý token ở từng nơi.
 */

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // để cookie refreshToken (httpOnly) được gửi kèm
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Gom các request 401 xảy ra đồng thời vào một lần refresh duy nhất. */
let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes('/auth/');

    if (!shouldRefresh) return Promise.reject(error);

    original._retried = true;
    refreshPromise ??= useAuthStore
      .getState()
      .refresh()
      .finally(() => {
        refreshPromise = null;
      });

    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  },
);

/** Lấy thông báo lỗi tiếng Việt từ response của backend để hiển thị cho user. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as { error?: { message?: string } } | undefined;
    return body?.error?.message ?? 'Không kết nối được máy chủ';
  }
  return 'Có lỗi không xác định xảy ra';
}
