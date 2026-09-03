import { describe, expect, it } from 'vitest';
import { AVATAR_MAX_BYTES, base64ByteLength, parseImageDataUrl } from './avatar.js';

/** Data URL hợp lệ với `bytes` byte dữ liệu (nội dung không cần là ảnh thật). */
function dataUrl(mimeType: string, bytes: number): string {
  const base64 = Buffer.alloc(bytes, 1).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

describe('base64ByteLength', () => {
  it('tính đúng số byte kể cả khi có ký tự đệm', () => {
    expect(base64ByteLength(Buffer.alloc(1).toString('base64'))).toBe(1);
    expect(base64ByteLength(Buffer.alloc(2).toString('base64'))).toBe(2);
    expect(base64ByteLength(Buffer.alloc(3).toString('base64'))).toBe(3);
    expect(base64ByteLength(Buffer.alloc(300).toString('base64'))).toBe(300);
  });
});

describe('parseImageDataUrl', () => {
  it('nhận ảnh JPG, PNG và WebP trong ngưỡng', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
      const result = parseImageDataUrl(dataUrl(mime, 1000));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.mimeType).toBe(mime);
    }
  });

  it('từ chối SVG — SVG chạy được script nên là lỗ hổng XSS', () => {
    expect(parseImageDataUrl(dataUrl('image/svg+xml', 100)).ok).toBe(false);
  });

  it('từ chối định dạng không phải ảnh', () => {
    expect(parseImageDataUrl(dataUrl('application/pdf', 100)).ok).toBe(false);
    expect(parseImageDataUrl(dataUrl('text/html', 100)).ok).toBe(false);
  });

  it('từ chối chuỗi không phải data URL', () => {
    expect(parseImageDataUrl('https://example.com/a.png').ok).toBe(false);
    expect(parseImageDataUrl('').ok).toBe(false);
    expect(parseImageDataUrl('data:image/png;base64,@@@').ok).toBe(false);
  });

  it('từ chối ảnh vượt ngưỡng, nhận ảnh ngay sát ngưỡng', () => {
    expect(parseImageDataUrl(dataUrl('image/png', AVATAR_MAX_BYTES + 1)).ok).toBe(false);
    expect(parseImageDataUrl(dataUrl('image/png', AVATAR_MAX_BYTES)).ok).toBe(true);
  });

  it('từ chối ảnh rỗng', () => {
    expect(parseImageDataUrl('data:image/png;base64,').ok).toBe(false);
  });
});
