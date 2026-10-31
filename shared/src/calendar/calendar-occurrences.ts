import { CalendarRecurrence } from '../constants/enums.js';
import { addDays, toLocalDate, type LocalDate } from '../date/local-date.js';

export interface CalendarOccurrenceSource {
  id: string | number;
  title: string;
  notes?: string | null;
  startsAt: string;
  endsAt: string;
  recurrence: CalendarRecurrence;
  recurrenceEndsAt?: string | null;
}

export interface CalendarOccurrenceRange {
  from: string;
  to: string;
  timeZone: string;
}

export interface CalendarOccurrenceResult {
  calendarId: string | number;
  occurrenceKey: string;
  title: string;
  notes: string;
  startsAt: string;
  endsAt: string;
  recurrence: CalendarRecurrence;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function localParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])) as Record<string, string>;
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function partsAsUtcMs(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** Quy đối một ngày/giờ local sang UTC theo timezone IANA của người dùng. */
export function zonedDateTimeToUtc(parts: DateParts, timeZone: string): Date | null {
  let guess = partsAsUtcMs(parts);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = partsAsUtcMs(localParts(new Date(guess), timeZone));
    const adjustment = partsAsUtcMs(parts) - observed;
    guess += adjustment;
    if (adjustment === 0) break;
  }
  const result = new Date(guess);
  const actual = localParts(result, timeZone);
  if (actual.year !== parts.year || actual.month !== parts.month || actual.day !== parts.day || actual.hour !== parts.hour || actual.minute !== parts.minute) return null;
  return result;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function candidateDateLocal(originalLocalDate: LocalDate, recurrence: CalendarRecurrence, step: number): LocalDate | null {
  const [year, month, day] = originalLocalDate.split('-').map(Number) as [number, number, number];
  if (recurrence === CalendarRecurrence.DAILY) return addDays(originalLocalDate, step);
  if (recurrence === CalendarRecurrence.WEEKLY) return addDays(originalLocalDate, step * 7);
  if (recurrence === CalendarRecurrence.MONTHLY) {
    const total = year * 12 + (month - 1) + step;
    const candidateYear = Math.floor(total / 12);
    const candidateMonth = total % 12 + 1;
    if (day > daysInMonth(candidateYear, candidateMonth)) return null;
    return `${candidateYear}-${String(candidateMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (recurrence === CalendarRecurrence.YEARLY) {
    const candidateYear = year + step;
    if (day > daysInMonth(candidateYear, month)) return null;
    return `${candidateYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return originalLocalDate;
}

/** Sinh occurrence giao với khoảng xem. Không lưu từng occurrence xuống cơ sở dữ liệu. */
export function generateCalendarOccurrences(
  source: CalendarOccurrenceSource,
  range: CalendarOccurrenceRange,
): CalendarOccurrenceResult[] {
  const start = new Date(source.startsAt);
  const end = new Date(source.endsAt);
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || !Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || end < start || from >= to) return [];

  const duration = end.getTime() - start.getTime();
  const firstLocalDate = toLocalDate(start, range.timeZone);
  const startWall = localParts(start, range.timeZone);
  const recurrenceEnd = source.recurrenceEndsAt ?? null;
  const results: CalendarOccurrenceResult[] = [];

  if (source.recurrence === CalendarRecurrence.NONE) {
    if (end.getTime() > from.getTime() && start.getTime() < to.getTime()) {
      results.push(createOccurrence(source, start, start.getTime() + duration));
    }
    return results;
  }

  let step = 0;
  while (step < 3700) {
    const localDate = candidateDateLocal(firstLocalDate, source.recurrence, step);
    step += 1;
    if (localDate === null) continue;
    if (recurrenceEnd && localDate > recurrenceEnd) break;

    const [year, month, day] = localDate.split('-').map(Number) as [number, number, number];
    const candidate = zonedDateTimeToUtc({ year, month, day, hour: startWall.hour, minute: startWall.minute, second: startWall.second }, range.timeZone);
    if (!candidate) continue;
    if (candidate.getTime() + duration <= from.getTime()) continue;
    if (candidate.getTime() >= to.getTime()) break;

    results.push(createOccurrence(source, candidate, candidate.getTime() + duration));
  }
  return results;
}

function createOccurrence(source: CalendarOccurrenceSource, startsAt: Date, endsAtMs: number): CalendarOccurrenceResult {
  return {
    calendarId: source.id,
    occurrenceKey: startsAt.toISOString(),
    title: source.title,
    notes: source.notes ?? '',
    startsAt: startsAt.toISOString(),
    endsAt: new Date(endsAtMs).toISOString(),
    recurrence: source.recurrence,
  };
}
