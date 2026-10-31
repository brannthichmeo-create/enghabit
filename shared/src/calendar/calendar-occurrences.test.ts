import { describe, expect, it } from 'vitest';
import { CalendarRecurrence } from '../constants/enums.js';
import { generateCalendarOccurrences } from './calendar-occurrences.js';

const source = {
  id: 1,
  title: 'Học tiếng Anh',
  notes: null,
  startsAt: '2026-01-31T09:00:00.000Z',
  endsAt: '2026-01-31T10:00:00.000Z',
  recurrence: CalendarRecurrence.MONTHLY,
  recurrenceEndsAt: '2026-05-31',
};

describe('calendar occurrences', () => {
  it('sinh DAILY và WEEKLY theo khoảng UTC', () => {
    const daily = generateCalendarOccurrences({ ...source, recurrence: CalendarRecurrence.DAILY, recurrenceEndsAt: '2026-02-03' }, {
      from: '2026-02-01T00:00:00.000Z', to: '2026-02-04T00:00:00.000Z', timeZone: 'UTC',
    });
    expect(daily.map((item) => item.startsAt)).toEqual([
      '2026-02-01T09:00:00.000Z', '2026-02-02T09:00:00.000Z', '2026-02-03T09:00:00.000Z',
    ]);

    const weekly = generateCalendarOccurrences({ ...source, recurrence: CalendarRecurrence.WEEKLY, recurrenceEndsAt: '2026-02-14' }, {
      from: '2026-01-01T00:00:00.000Z', to: '2026-02-16T00:00:00.000Z', timeZone: 'UTC',
    });
    expect(weekly).toHaveLength(3);
  });

  it('MONTHLY bỏ ngày không tồn tại và giữ mốc ngày gốc', () => {
    const items = generateCalendarOccurrences(source, {
      from: '2026-01-01T00:00:00.000Z', to: '2026-06-01T00:00:00.000Z', timeZone: 'UTC',
    });
    expect(items.map((item) => item.startsAt.slice(0, 10))).toEqual(['2026-01-31', '2026-03-31', '2026-05-31']);
  });

  it('YEARLY bỏ ngày 29 tháng Hai ở năm không nhuận', () => {
    const items = generateCalendarOccurrences({
      ...source,
      startsAt: '2024-02-29T09:00:00.000Z',
      endsAt: '2024-02-29T10:00:00.000Z',
      recurrence: CalendarRecurrence.YEARLY,
      recurrenceEndsAt: '2028-02-29',
    }, {
      from: '2024-01-01T00:00:00.000Z', to: '2029-01-01T00:00:00.000Z', timeZone: 'UTC',
    });
    expect(items.map((item) => item.startsAt.slice(0, 10))).toEqual(['2024-02-29', '2028-02-29']);
  });

  it('sinh lịch kéo dài nếu occurrence giao với khoảng xem', () => {
    const items = generateCalendarOccurrences({ ...source, recurrence: CalendarRecurrence.NONE, startsAt: '2026-01-31T23:00:00.000Z', endsAt: '2026-02-01T01:00:00.000Z' }, {
      from: '2026-02-01T00:00:00.000Z', to: '2026-02-02T00:00:00.000Z', timeZone: 'UTC',
    });
    expect(items).toHaveLength(1);
  });
});
