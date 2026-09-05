import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type {
  AuthResponse,
  LoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  PasswordResetState,
  RegisterInput,
} from '@enghabit/shared';
import { useNavigate } from 'react-router-dom';
import * as authApi from './auth.api';
import { useAuthStore } from './auth.store';

/** Hook dùng trong component. Mọi feature theo cùng mẫu: api.ts → hooks.ts → components. */

export function useLogin(): UseMutationResult<AuthResponse, Error, LoginInput> {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data);
      navigate('/');
    },
  });
}

export function useRegister(): UseMutationResult<AuthResponse, Error, RegisterInput> {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession(data);
      navigate('/');
    },
  });
}

/**
 * Tra cứu yêu cầu quên mật khẩu.
 *
 * Không tự điều hướng: kết quả quyết định màn hình con nào hiện ra ngay tại chỗ, nên
 * việc chuyển bước do component giữ. Xem `ForgotPasswordPage`.
 */
export function usePasswordResetRequest(): UseMutationResult<
  PasswordResetState,
  Error,
  PasswordResetRequestInput
> {
  return useMutation({ mutationFn: authApi.requestPasswordReset });
}

export function usePasswordResetConfirm(): UseMutationResult<
  void,
  Error,
  PasswordResetConfirmInput
> {
  return useMutation({ mutationFn: authApi.confirmPasswordReset });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    // Xoá phiên cục bộ kể cả khi API lỗi — không để user mắc kẹt ở trạng thái nửa vời.
    onSettled: () => {
      clearSession();
      navigate('/login');
    },
  });
}
