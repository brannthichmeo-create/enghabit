import { describe, expect, it } from 'vitest';
import { translate, type Dictionary } from './language';

const EN: Dictionary = {
  'Đăng xuất': 'Log out',
  'Còn {n} XP nữa': '{n} XP to go',
  '{n} ngày': { one: '{n} day', other: '{n} days' },
};

describe('translate', () => {
  it('tiếng Việt không cần từ điển — trả về đúng câu gốc', () => {
    expect(translate(null, 'Đăng xuất')).toBe('Đăng xuất');
  });

  it('có từ điển thì trả về bản dịch', () => {
    expect(translate(EN, 'Đăng xuất')).toBe('Log out');
  });

  it('thiếu bản dịch thì hiện lại câu tiếng Việt, không hiện khoá rỗng', () => {
    expect(translate(EN, 'Chưa dịch câu này')).toBe('Chưa dịch câu này');
  });

  it('thay giá trị vào chỗ trống ở cả hai ngôn ngữ', () => {
    expect(translate(EN, 'Còn {n} XP nữa', { n: 20 })).toBe('20 XP to go');
    expect(translate(null, 'Còn {n} XP nữa', { n: 20 })).toBe('Còn 20 XP nữa');
  });

  it('chỗ trống không có giá trị thì giữ nguyên, không in "undefined"', () => {
    expect(translate(EN, 'Còn {n} XP nữa')).toBe('{n} XP to go');
  });

  it('chọn dạng số ít / số nhiều theo n — tiếng Việt không đổi dạng', () => {
    expect(translate(EN, '{n} ngày', { n: 1 })).toBe('1 day');
    expect(translate(EN, '{n} ngày', { n: 5 })).toBe('5 days');
    expect(translate(null, '{n} ngày', { n: 1 })).toBe('1 ngày');
  });

  it('câu thiếu bản dịch vẫn thay được chỗ trống', () => {
    expect(translate(EN, 'Còn {n} bài', { n: 3 })).toBe('Còn 3 bài');
  });
});
