import type {
  AdminFeatureRow,
  FeatureFlagMap,
  FeatureKey,
  UpdateFeatureFlagResult,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';

/** Trạng thái bật/tắt cho người đang đăng nhập. Chỉ khoá và bật/tắt, không có nhãn. */
export async function getFlags(): Promise<FeatureFlagMap> {
  const { data } = await apiClient.get<FeatureFlagMap>('/features');
  return data;
}

/** Danh sách đầy đủ cho màn hình quản trị. */
export async function listForAdmin(): Promise<AdminFeatureRow[]> {
  const { data } = await apiClient.get<AdminFeatureRow[]>('/admin/features');
  return data;
}

export async function setEnabled(
  key: FeatureKey,
  isEnabled: boolean,
): Promise<UpdateFeatureFlagResult> {
  const { data } = await apiClient.patch<UpdateFeatureFlagResult>(`/admin/features/${key}`, {
    isEnabled,
  });
  return data;
}
