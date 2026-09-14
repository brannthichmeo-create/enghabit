import { describe, expect, it } from 'vitest';
import { FEATURES, FeatureKey, allFeaturesEnabled, dependentsOf, findFeature } from './features.js';

describe('danh mục tính năng', () => {
  it('không có khoá trùng', () => {
    const keys = FEATURES.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('mọi phụ thuộc đều trỏ tới một tính năng có thật', () => {
    for (const feature of FEATURES) {
      for (const dep of feature.dependsOn ?? []) {
        expect(findFeature(dep)).toBeDefined();
      }
    }
  });

  it('không tính năng nào phụ thuộc chính nó', () => {
    for (const feature of FEATURES) {
      expect(feature.dependsOn ?? []).not.toContain(feature.key);
    }
  });

  /**
   * Tắt được những khoá này là tự khoá cửa nhà mình: không ai đăng nhập được, hoặc mất
   * luôn chính màn hình để bật lại. Test giữ chúng nằm ngoài danh mục.
   */
  it('không bật/tắt được xác thực, khu quản trị, hồ sơ, thông báo và trang Tổng quan', () => {
    const keys: string[] = FEATURES.map((f) => f.key);
    for (const forbidden of ['AUTH', 'ADMIN', 'PROFILE', 'NOTIFICATIONS', 'STATISTICS', 'DASHBOARD']) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('dependentsOf tìm ra tính năng phụ thuộc trực tiếp', () => {
    expect(dependentsOf(FeatureKey.VOCABULARY)).toContain(FeatureKey.FLASHCARDS);
    expect(dependentsOf(FeatureKey.COMMUNITY)).toContain(FeatureKey.GROUPS);
    expect(dependentsOf(FeatureKey.FLASHCARDS)).toEqual([]);
  });

  it('bản đồ mặc định bật mọi tính năng và đủ khoá', () => {
    const flags = allFeaturesEnabled();
    expect(Object.keys(flags).sort()).toEqual(FEATURES.map((f) => f.key).sort());
    expect(Object.values(flags).every(Boolean)).toBe(true);
  });

  it('khoá lạ trả undefined thay vì ném lỗi', () => {
    expect(findFeature('KHONG_CO_TRONG_DANH_MUC')).toBeUndefined();
  });
});
