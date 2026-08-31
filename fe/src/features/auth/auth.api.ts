import type {
  AuthResponse,
  ChangePasswordInput,
  LoginInput,
  PublicUser,
  RegisterInput,
  UpdateProfileInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Tầng gọi API của feature auth. Component không gọi axios trực tiếp. */

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<PublicUser> {
  const { data } = await apiClient.get<PublicUser>('/auth/me');
  return data;
}

export async function updateMe(input: UpdateProfileInput): Promise<PublicUser> {
  const { data } = await apiClient.patch<PublicUser>('/auth/me', input);
  return data;
}

/** Đổi mật khẩu. Backend thu hồi mọi phiên cũ nên các thiết bị khác sẽ bị đăng xuất. */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.post('/auth/me/change-password', input);
}
