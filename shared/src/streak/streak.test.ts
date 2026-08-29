import { describe, expect, it } from 'vitest';
import { applyActivity, computeStreak, displayStreak, EMPTY_STREAK, streakDeadline } from './streak.js';

describe('applyActivity', () => {
  it('bắt đầu streak từ trạng thái rỗng', () => {
    expect(applyActivity(EMPTY_STREAK, '2026-03-01')).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: '2026-03-01',
    });
  });

  it('tăng streak khi học ngày kế tiếp', () => {
    const state = { currentStreak: 3, longestStreak: 5, lastActiveDate: '2026-03-01' };
    expect(applyActivity(state, '2026-03-02').currentStreak).toBe(4);
  });

  it('không đổi khi học nhiều lần trong cùng một ngày', () => {
    const state = { currentStreak: 3, longestStreak: 5, lastActiveDate: '2026-03-01' };
    expect(applyActivity(state, '2026-03-01')).toEqual(state);
  });

  it('reset về 1 khi bỏ cách quãng', () => {
    const state = { currentStreak: 7, longestStreak: 7, lastActiveDate: '2026-03-01' };
    const next = applyActivity(state, '2026-03-05');
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(7);
  });

  it('cập nhật longestStreak khi vượt kỷ lục cũ', () => {
    const state = { currentStreak: 5, longestStreak: 5, lastActiveDate: '2026-03-01' };
    expect(applyActivity(state, '2026-03-02').longestStreak).toBe(6);
  });
});

describe('computeStreak', () => {
  it('tính lại đúng từ danh sách ngày lộn xộn và trùng lặp', () => {
    const dates = ['2026-03-03', '2026-03-01', '2026-03-02', '2026-03-02', '2026-03-06'];
    expect(computeStreak(dates)).toEqual({
      currentStreak: 1,
      longestStreak: 3,
      lastActiveDate: '2026-03-06',
    });
  });

  it('trả về trạng thái rỗng khi không có hoạt động nào', () => {
    expect(computeStreak([])).toEqual(EMPTY_STREAK);
  });

  it('xử lý được mốc chuyển tháng', () => {
    expect(computeStreak(['2026-02-27', '2026-02-28', '2026-03-01']).currentStreak).toBe(3);
  });
});

describe('displayStreak', () => {
  const state = { currentStreak: 4, longestStreak: 9, lastActiveDate: '2026-03-10' };

  it('giữ nguyên khi đã học hôm nay', () => {
    expect(displayStreak(state, '2026-03-10')).toBe(4);
  });

  it('giữ nguyên khi học hôm qua (vẫn còn cơ hội nối tiếp)', () => {
    expect(displayStreak(state, '2026-03-11')).toBe(4);
  });

  it('về 0 khi đã đứt chuỗi', () => {
    expect(displayStreak(state, '2026-03-12')).toBe(0);
  });
});

describe('streakDeadline', () => {
  it('trả về ngày cuối cùng phải học để giữ streak', () => {
    expect(streakDeadline({ currentStreak: 2, longestStreak: 2, lastActiveDate: '2026-03-10' })).toBe(
      '2026-03-11',
    );
  });

  it('trả về null khi chưa có hoạt động nào', () => {
    expect(streakDeadline(EMPTY_STREAK)).toBeNull();
  });
});
