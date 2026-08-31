import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { ChangePasswordInput, PublicUser, UpdateProfileInput } from '@enghabit/shared';
import * as authApi from '../auth/auth.api';
import { useAuthStore } from '../auth/auth.store';

/**
 * Thao tác trên tài khoản của chính mình.
 *
 * Đặt ở feature riêng thay vì trong auth, vì auth lo việc đăng nhập/đăng xuất
 * còn đây là quản lý hồ sơ — hai mối quan tâm khác nhau.
 */

export function useUpdateProfile(): UseMutationResult<PublicUser, Error, UpdateProfileInput> {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: authApi.updateMe,
    // Cập nhật ngay store để tên hiển thị ở sidebar đổi theo, không phải tải lại trang
    onSuccess: (user) => setUser(user),
  });
}

export function useChangePassword(): UseMutationResult<void, Error, ChangePasswordInput> {
  return useMutation({ mutationFn: authApi.changePassword });
}
