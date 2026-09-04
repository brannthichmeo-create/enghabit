import { describe, expect, it } from 'vitest';
import { base64ByteLength } from '../encoding/base64.js';
import {
  ATTACHMENT_MAX_BYTES,
  isImageMime,
  parseAttachmentDataUrl,
  sanitizeFileName,
} from './attachment.js';

/** Data URL hợp lệ với đúng `bytes` byte dữ liệu. */
function dataUrl(mimeType: string, bytes: number): string {
  const base64 = Buffer.alloc(bytes).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

describe('base64ByteLength', () => {
  it('tính đúng số byte kể cả khi có ký tự đệm', () => {
    expect(base64ByteLength(Buffer.alloc(100).toString('base64'))).toBe(100);
    expect(base64ByteLength(Buffer.alloc(101).toString('base64'))).toBe(101);
    expect(base64ByteLength(Buffer.alloc(102).toString('base64'))).toBe(102);
  });
});

describe('isImageMime', () => {
  it('nhận đúng các định dạng ảnh', () => {
    expect(isImageMime('image/png')).toBe(true);
    expect(isImageMime('image/gif')).toBe(true);
  });

  it('tệp tài liệu không phải ảnh', () => {
    expect(isImageMime('application/pdf')).toBe(false);
    expect(isImageMime('text/plain')).toBe(false);
  });

  it('SVG không được coi là ảnh hợp lệ', () => {
    expect(isImageMime('image/svg+xml')).toBe(false);
  });
});

describe('parseAttachmentDataUrl', () => {
  it('nhận ảnh và tệp trong danh sách trắng', () => {
    expect(parseAttachmentDataUrl(dataUrl('image/png', 50)).ok).toBe(true);
    expect(parseAttachmentDataUrl(dataUrl('application/pdf', 50)).ok).toBe(true);
    expect(parseAttachmentDataUrl(dataUrl('text/plain', 50)).ok).toBe(true);
  });

  it('CHẶN SVG — tệp chạy được script không được hiển thị lại cho người khác', () => {
    const parsed = parseAttachmentDataUrl(dataUrl('image/svg+xml', 50));
    expect(parsed.ok).toBe(false);
  });

  it('chặn HTML vì cùng lý do với SVG', () => {
    expect(parseAttachmentDataUrl(dataUrl('text/html', 50)).ok).toBe(false);
  });

  it('chặn tệp thực thi', () => {
    expect(parseAttachmentDataUrl(dataUrl('application/x-msdownload', 50)).ok).toBe(false);
  });

  it('từ chối chuỗi không phải data URL', () => {
    expect(parseAttachmentDataUrl('https://example.com/anh.png').ok).toBe(false);
    expect(parseAttachmentDataUrl('').ok).toBe(false);
  });

  it('từ chối tệp rỗng', () => {
    expect(parseAttachmentDataUrl('data:image/png;base64,').ok).toBe(false);
  });

  it('từ chối tệp vượt quá giới hạn', () => {
    const parsed = parseAttachmentDataUrl(dataUrl('image/png', ATTACHMENT_MAX_BYTES + 1));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toContain('quá lớn');
  });

  it('nhận tệp đúng bằng giới hạn', () => {
    expect(parseAttachmentDataUrl(dataUrl('image/png', ATTACHMENT_MAX_BYTES)).ok).toBe(true);
  });

  it('trả về đúng số byte đã giải mã', () => {
    const parsed = parseAttachmentDataUrl(dataUrl('image/webp', 1234));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.byteLength).toBe(1234);
  });
});

describe('sanitizeFileName', () => {
  it('bỏ đường dẫn, chỉ giữ tên tệp', () => {
    expect(sanitizeFileName('C:\\Users\\Minh\\anh.png')).toBe('anh.png');
    expect(sanitizeFileName('/var/tmp/tai-lieu.pdf')).toBe('tai-lieu.pdf');
  });

  it('bỏ dấu nháy và ký tự xuống dòng — chặn chèn header giả vào phản hồi', () => {
    expect(sanitizeFileName('a"b.png')).toBe('ab.png');
    expect(sanitizeFileName("a'b.png")).toBe('ab.png');
    expect(sanitizeFileName('anh\r\nX-Injected: 1.png')).toBe('anhX-Injected: 1.png');
  });

  it('dấu gạch chéo trong tên bị cắt như đường dẫn, không lọt vào header', () => {
    // Tách đường dẫn chạy trước nên phần sau dấu / cuối cùng là thứ được giữ lại.
    expect(sanitizeFileName('a\r\nContent-Type: text/html.png')).toBe('html.png');
  });

  it('tên rỗng thì có tên thay thế, không trả chuỗi rỗng', () => {
    expect(sanitizeFileName('')).toBe('tep-dinh-kem');
    expect(sanitizeFileName('   ')).toBe('tep-dinh-kem');
  });

  it('cắt tên quá dài về vừa giới hạn cột', () => {
    expect(sanitizeFileName('a'.repeat(400))).toHaveLength(255);
  });
});
