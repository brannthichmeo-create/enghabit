import { describe, expect, it } from 'vitest';
import { CalendarRecurrence, CalendarScope } from '../constants/enums.js';
import { createCalendarSchema, updateCalendarSchema, calendarQuerySchema, deleteCalendarSchema } from './calendar.schema.js';

describe('calendar schemas', () => {
  it('tạo lịch đơn hoặc chuỗi hợp lệ', () => {
    expect(createCalendarSchema.parse({
      title: '  Họp nhóm  ', notes: 'Lập kế hoạch', startsAt: '2026-10-31T09:00:00.000Z', endsAt: '2026-10-31T10:00:00.000Z', recurrence: CalendarRecurrence.NONE,
    })).toMatchObject({ title: 'Họp nhóm', notes: 'Lập kế hoạch' });

    const recurring = createCalendarSchema.parse({
      title: 'Ôn từ mới', startsAt: '2026-10-31T09:00:00.000Z', endsAt: '2026-10-31T09:30:00.000Z', recurrence: CalendarRecurrence.WEEKLY, recurrenceEndsAt: '2026-12-31',
    });
    expect(recurring.recurrence).toBe(CalendarRecurrence.WEEKLY);
  });

  it('từ chối chuỗi thiếu ngày kết thúc và khoảng thời gian đảo ngược', () => {
    expect(createCalendarSchema.safeParse({
      title: 'Lặp', startsAt: '2026-10-31T09:00:00.000Z', endsAt: '2026-10-31T08:00:00.000Z', recurrence: CalendarRecurrence.DAILY,
    }).success).toBe(false);
  });

  it('khóa THIS phải có occurrenceKey', () => {
    expect(updateCalendarSchema.safeParse({ scope: CalendarScope.THIS, title: 'Đổi tên' }).success).toBe(false);
    expect(deleteCalendarSchema.safeParse({ scope: CalendarScope.THIS }).success).toBe(false);
    expect(deleteCalendarSchema.safeParse({ scope: CalendarScope.THIS, occurrenceKey: '2026-10-31T09:00:00.000Z' }).success).toBe(true);
  });

  it('query yêu cầu khoảng hợp lệ và view hợp lệ', () => {
    expect(calendarQuerySchema.safeParse({ from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z', view: 'month' }).success).toBe(true);
    expect(calendarQuerySchema.safeParse({ from: '2026-10-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z', view: 'month' }).success).toBe(false);
    expect(calendarQuerySchema.safeParse({ from: '2026-01-01T00:00:00.000Z', to: '2027-01-03T00:00:00.000Z', view: 'week' }).success).toBe(false);
  });
});
