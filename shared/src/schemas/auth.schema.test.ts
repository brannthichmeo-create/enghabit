import { describe, expect, it } from 'vitest';
import { loginSchema, usernameSchema } from './auth.schema.js';

describe('loginSchema', () => {
  it('giữ nguyên tên đăng nhập người dùng gõ — không cắt khoảng trắng, không hạ chữ thường', () => {
    const parsed = loginSchema.parse({ identifier: '  User  ', password: 'x' });
    expect(parsed.identifier).toBe('  User  ');
  });

  it('chỉ toàn khoảng trắng thì coi như chưa nhập', () => {
    expect(loginSchema.safeParse({ identifier: '   ', password: 'x' }).success).toBe(false);
  });
});

describe('usernameSchema', () => {
  it('lúc đăng ký vẫn chuẩn hoá về chữ thường, để tên lưu trong DB luôn là chữ thường', () => {
    expect(usernameSchema.parse('  MinhAnh ')).toBe('minhanh');
  });
});
