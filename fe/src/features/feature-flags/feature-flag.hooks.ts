import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  allFeaturesEnabled,
  type AdminFeatureRow,
  type FeatureFlagMap,
  type FeatureKey,
  type UpdateFeatureFlagResult,
} from '@enghabit/shared';
import { useAuthStore } from '../auth/auth.store';
import * as api from './feature-flag.api';

export const featureFlagKeys = {
  flags: () => ['feature-flags'] as const,
  admin: () => ['feature-flags', 'admin'] as const,
};

/**
 * Trạng thái bật/tắt mọi tính năng.
 *
 * `refetchOnWindowFocus` để người học đang mở app lúc quản trị viên tắt tính năng thấy
 * mục biến mất ngay lần quay lại tab kế tiếp, không phải tải lại trang.
 */
export function useFeatureFlagsQuery(): UseQueryResult<FeatureFlagMap> {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: featureFlagKeys.flags(),
    queryFn: api.getFlags,
    enabled: Boolean(accessToken),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Bản đồ trạng thái để đọc trong lúc render.
 *
 * Chưa có dữ liệu thì coi MỌI tính năng là BẬT. Mặc định tắt sẽ làm cả sidebar hiện
 * thiếu mục rồi mới đủ — trông như lỗi. Còn nếu tính năng thật sự đang tắt thì người
 * dùng bấm vào cũng chỉ nhận 404 từ API, không lọt được vào đâu cả.
 */
export function useFeatureFlags(): FeatureFlagMap {
  return useFeatureFlagsQuery().data ?? allFeaturesEnabled();
}

/** Một tính năng có đang bật không. Dùng để HIỂN THỊ. */
export function useFeature(key: FeatureKey): boolean {
  return useFeatureFlags()[key];
}

/**
 * Có nên GỌI API của tính năng này không.
 *
 * Khác `useFeature` ở lúc chưa biết trạng thái: hiển thị thì mặc định bật (đỡ nháy
 * giao diện), còn request thì phải CHỜ biết chắc. Gọi lạc quan rồi tính năng hoá ra
 * đang tắt là một lỗi 404 đỏ trong console mỗi lần mở app — thứ khiến người sau đi
 * truy một lỗi không có thật.
 */
export function useFeatureQueryEnabled(key: FeatureKey): boolean {
  const query = useFeatureFlagsQuery();
  return query.data ? query.data[key] : false;
}

/** Danh sách đầy đủ cho màn hình quản trị. */
export function useAdminFeatures(): UseQueryResult<AdminFeatureRow[]> {
  return useQuery({ queryKey: featureFlagKeys.admin(), queryFn: api.listForAdmin });
}

export function useSetFeatureEnabled() {
  const queryClient = useQueryClient();

  return useMutation<UpdateFeatureFlagResult, Error, { key: FeatureKey; isEnabled: boolean }>({
    mutationFn: ({ key, isEnabled }) => api.setEnabled(key, isEnabled),
    onSuccess: (result) => {
      // BE trả về trạng thái đầy đủ sau khi đổi (kèm các tính năng bị tắt lây), nên ghi
      // đè thẳng thay vì đoán — FE không lặp lại luật phụ thuộc lần thứ hai.
      queryClient.setQueryData(featureFlagKeys.flags(), result.flags);
      void queryClient.invalidateQueries({ queryKey: featureFlagKeys.admin() });
    },
  });
}
