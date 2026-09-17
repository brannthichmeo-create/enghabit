import { describe, expect, it } from 'vitest';
import {
  ITEM_SLUG_PATTERN,
  SHOP_IMAGE_MAX_BYTES,
  isKnownItemSlug,
  parseShopImageDataUrl,
  shopItemDedupeKey,
} from './shop.js';
import { shopItemQuerySchema, walletQuerySchema } from '../schemas/shop.schema.js';

describe('shopItemDedupeKey', () => {
  it('sinh khoá ổn định theo id — mua lần hai phải đụng đúng khoá cũ', () => {
    expect(shopItemDedupeKey(7)).toBe('SHOP_ITEM:7');
    expect(shopItemDedupeKey(7)).toBe(shopItemDedupeKey(7));
  });

  it('hai vật phẩm khác nhau không dùng chung khoá', () => {
    expect(shopItemDedupeKey(7)).not.toBe(shopItemDedupeKey(8));
  });
});

describe('parseShopImageDataUrl', () => {
  const pngPixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('nhận ảnh PNG hợp lệ', () => {
    const result = parseShopImageDataUrl(pngPixel);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mimeType).toBe('image/png');
  });

  it('từ chối SVG — SVG chạy được script nên là đường vào XSS', () => {
    const result = parseShopImageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
    expect(result.ok).toBe(false);
  });

  it('từ chối chuỗi không phải data URL', () => {
    expect(parseShopImageDataUrl('https://example.com/a.png').ok).toBe(false);
  });

  it('từ chối ảnh vượt ngưỡng', () => {
    // 4 ký tự base64 = 3 byte, nên cần dư một chút so với ngưỡng byte.
    const huge = `data:image/png;base64,${'A'.repeat(SHOP_IMAGE_MAX_BYTES * 2)}`;
    const result = parseShopImageDataUrl(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('quá lớn');
  });
});

describe('ITEM_SLUG_PATTERN', () => {
  it('chấp nhận chữ hoa, số và gạch dưới', () => {
    expect(ITEM_SLUG_PATTERN.test('MASCOT')).toBe(true);
    expect(ITEM_SLUG_PATTERN.test('AVATAR_FRAME2')).toBe(true);
  });

  it('từ chối chữ thường và khoảng trắng', () => {
    expect(ITEM_SLUG_PATTERN.test('mascot')).toBe(false);
    expect(ITEM_SLUG_PATTERN.test('AVATAR FRAME')).toBe(false);
    expect(ITEM_SLUG_PATTERN.test('2FRAME')).toBe(false);
  });
});

describe('isKnownItemSlug', () => {
  it('MASCOT đã có chỗ hiển thị', () => {
    expect(isKnownItemSlug('MASCOT')).toBe(true);
  });

  it('loại lạ chỉ là chưa có chỗ hiển thị, không phải lỗi', () => {
    expect(isKnownItemSlug('WALLPAPER')).toBe(false);
  });
});

describe('bộ lọc dạng boolean của query', () => {
  /*
    Đây là lý do không dùng z.coerce.boolean(): query string luôn là chuỗi và
    Boolean('false') === true, nên mọi request sẽ thành "chỉ yêu thích" và tab
    Tất cả mất sạch vật phẩm.
  */
  it("'false' phải ra false", () => {
    const parsed = shopItemQuerySchema.parse({ favorite: 'false', owned: 'false' });
    expect(parsed.favorite).toBe(false);
    expect(parsed.owned).toBe(false);
  });

  it("'true' và '1' ra true", () => {
    expect(shopItemQuerySchema.parse({ favorite: 'true' }).favorite).toBe(true);
    expect(shopItemQuerySchema.parse({ owned: '1' }).owned).toBe(true);
  });

  it('bỏ trống thì mặc định tắt bộ lọc', () => {
    const parsed = shopItemQuerySchema.parse({});
    expect(parsed.favorite).toBe(false);
    expect(parsed.owned).toBe(false);
    expect(parsed.page).toBe(1);
  });
});

describe('walletQuerySchema', () => {
  it('nhận chiều Thu/Chi', () => {
    expect(walletQuerySchema.parse({ direction: 'IN' }).direction).toBe('IN');
    expect(walletQuerySchema.parse({}).direction).toBeUndefined();
  });

  it('từ chối chiều lạ', () => {
    expect(walletQuerySchema.safeParse({ direction: 'SIDEWAYS' }).success).toBe(false);
  });
});
