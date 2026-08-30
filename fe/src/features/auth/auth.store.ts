import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, PublicUser } from '@enghabit/shared';
import { API_BASE_URL } from '../../shared/lib/config';

/**
 * Trạng thái đăng nhập.
 *
 * Chỉ accessToken được lưu ở localStorage; refreshToken nằm trong cookie httpOnly
 * nên JavaScript không đọc được — giảm rủi ro bị đánh cắp qua XSS.
 *
 * Store này gọi axios trực tiếp (không qua apiClient) để tránh phụ thuộc vòng:
 * apiClient cần store để lấy token, store lại cần gọi API refresh.
 */

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  setSession: (response: AuthResponse) => void;
  clearSession: () => void;
  refresh: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setSession: (response) => set({ user: response.user, accessToken: response.accessToken }),

      clearSession: () => set({ user: null, accessToken: null }),

      refresh: async () => {
        try {
          const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          set({ user: data.user, accessToken: data.accessToken });
          return data.accessToken;
        } catch {
          get().clearSession();
          return null;
        }
      },
    }),
    {
      name: 'enghabit-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
);

export const useCurrentUser = (): PublicUser | null => useAuthStore((s) => s.user);
export const useIsAuthenticated = (): boolean => useAuthStore((s) => s.accessToken !== null);
