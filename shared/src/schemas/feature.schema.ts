import { z } from 'zod';
import { FeatureKey, type FeatureFlagMap } from '../constants/features.js';

/**
 * Schema & type cho module quản lý tính năng.
 *
 * Danh mục tính năng (nhãn, mô tả, phụ thuộc) nằm ở constants/features.ts — ở đây
 * chỉ có phần đi qua đường truyền.
 */

export const updateFeatureFlagSchema = z.object({
  isEnabled: z.boolean(),
});
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;

export const featureKeyParamSchema = z.object({
  key: z.nativeEnum(FeatureKey),
});

/** Một dòng trên màn hình quản trị. */
export interface AdminFeatureRow {
  key: FeatureKey;
  isEnabled: boolean;
  /** Ai bật/tắt lần gần nhất. Null = chưa ai đụng tới. */
  updatedByName: string | null;
  updatedAt: string | null;
  /**
   * Các tính năng phải bật trước thì mới bật được cái này. Rỗng nghĩa là bật được ngay.
   * BE tính sẵn để FE không phải lặp lại luật phụ thuộc lần thứ hai.
   */
  blockedBy: FeatureKey[];
  /** Số người học có hoạt động liên quan trong 7 ngày qua — hiện ở hộp xác nhận tắt. */
  recentUsers: number;
}

/** Kết quả một lần bật/tắt. */
export interface UpdateFeatureFlagResult {
  /** Trạng thái đầy đủ sau khi đổi — FE ghi đè thẳng, không đoán. */
  flags: FeatureFlagMap;
  /** Các tính năng bị tắt lây theo vì phụ thuộc cái vừa tắt. */
  alsoDisabled: FeatureKey[];
}
