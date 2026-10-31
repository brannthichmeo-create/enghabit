import {
  CalendarRecurrence,
  CalendarScope,
  generateCalendarOccurrences,
  type CalendarOccurrence,
  type CalendarQueryInput,
  type CalendarRow,
  type CreateCalendarInput,
  type DeleteCalendarInput,
  type UpdateCalendarInput,
  type CalendarDetailInput,
  type LocalDate,
} from '@enghabit/shared';
import type { PersonalCalendar, PersonalCalendarException, CalendarRecurrence as PrismaCalendarRecurrence } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error.js';
import { fromDbDate, toDbDate } from '../../common/utils/db-date.js';

function row(calendar: PersonalCalendar): CalendarRow {
  return {
    id: calendar.id,
    title: calendar.title,
    notes: calendar.notes,
    startsAt: calendar.startsAt.toISOString(),
    endsAt: calendar.endsAt.toISOString(),
    recurrence: calendar.recurrence as CalendarRecurrence,
    recurrenceEndsAt: calendar.recurrenceEndsAt ? fromDbDate(calendar.recurrenceEndsAt) : null,
    createdAt: calendar.createdAt.toISOString(),
    updatedAt: calendar.updatedAt.toISOString(),
  };
}

export async function listCalendars(userId: number, timezone: string, query: CalendarQueryInput): Promise<CalendarOccurrence[]> {
  const calendars = await prisma.personalCalendar.findMany({
    where: { userId },
    include: { exceptions: true },
  });

  const fromMs = Date.parse(query.from);
  const toMs = Date.parse(query.to);
  const occurrences: CalendarOccurrence[] = [];
  for (const calendar of calendars) {
    const generated = generateCalendarOccurrences(toOccurrenceSource(calendar), { from: query.from, to: query.to, timeZone: timezone });
    for (const occurrence of generated) {
      const exception = calendar.exceptions.find((item) => item.occurrenceKey === occurrence.occurrenceKey);
      if (exception?.isDeleted) continue;
      const startsAt = exception?.overriddenStart?.toISOString() ?? occurrence.startsAt;
      const endsAt = exception?.overriddenEnd?.toISOString() ?? occurrence.endsAt;
      const startsMs = Date.parse(startsAt);
      const endsMs = Date.parse(endsAt);
      if (startsMs < toMs && endsMs > fromMs) {
        occurrences.push({
          ...occurrence,
          title: exception?.title ?? occurrence.title,
          notes: exception?.notes ?? occurrence.notes,
          startsAt,
          endsAt,
        });
      }
    }
  }
  return occurrences.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export async function createCalendar(userId: number, input: CreateCalendarInput): Promise<CalendarRow> {
  const created = await prisma.personalCalendar.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      recurrence: input.recurrence as PrismaCalendarRecurrence,
      recurrenceEndsAt: input.recurrenceEndsAt ? toDbDate(input.recurrenceEndsAt as LocalDate) : null,
    },
  });
  return row(created);
}

export async function getCalendar(userId: number, timezone: string, id: number, query: CalendarDetailInput): Promise<CalendarOccurrence | CalendarRow> {
  const calendar = await prisma.personalCalendar.findFirst({ where: { id, userId }, include: { exceptions: true } });
  if (!calendar) throw new NotFoundError('Không tìm thấy lịch cá nhân');

  const key = query.occurrenceKey;
  if (!key) return row(calendar);
  const original = generateCalendarOccurrences(toOccurrenceSource(calendar), occurrenceProbeRange(calendar, key, timezone));
  const occurrence = original.find((item) => item.occurrenceKey === key);
  if (!occurrence) throw new NotFoundError('Không tìm thấy lần xuất hiện của lịch');
  const exception = calendar.exceptions.find((item) => item.occurrenceKey === key);
  if (exception?.isDeleted) throw new NotFoundError('Không tìm thấy lần xuất hiện của lịch');
  return {
    ...occurrence,
    title: exception?.title ?? occurrence.title,
    notes: exception?.notes ?? occurrence.notes,
    startsAt: exception?.overriddenStart?.toISOString() ?? occurrence.startsAt,
    endsAt: exception?.overriddenEnd?.toISOString() ?? occurrence.endsAt,
  };
}

export async function updateCalendar(userId: number, timezone: string, id: number, input: UpdateCalendarInput): Promise<CalendarRow | CalendarOccurrence> {
  const calendar = await prisma.personalCalendar.findFirst({ where: { id, userId }, include: { exceptions: true } });
  if (!calendar) throw new NotFoundError('Không tìm thấy lịch cá nhân');

  if (input.scope === CalendarScope.THIS) {
    return updateThis(calendar, timezone, input);
  }

  if (calendar.recurrence !== CalendarRecurrence.NONE && input.occurrenceKey) {
    return updateFuture(userId, timezone, calendar, input);
  }
  const recurrence = input.recurrence ?? calendar.recurrence;
  validateRecurringUpdate(recurrence, input.recurrenceEndsAt ?? (calendar.recurrenceEndsAt ? fromDbDate(calendar.recurrenceEndsAt) : null), input.startsAt ?? calendar.startsAt.toISOString(), timezone);
  const updated = await prisma.personalCalendar.update({ where: { id }, data: calendarUpdateData(calendar, input, recurrence) });
  return row(updated);
}

export async function deleteCalendar(userId: number, timezone: string, id: number, input: DeleteCalendarInput): Promise<void> {
  const calendar = await prisma.personalCalendar.findFirst({ where: { id, userId }, include: { exceptions: true } });
  if (!calendar) throw new NotFoundError('Không tìm thấy lịch cá nhân');

  if (input.scope === CalendarScope.THIS) {
    const key = input.occurrenceKey as string;
    if (calendar.recurrence === CalendarRecurrence.NONE) {
      if (key !== calendar.startsAt.toISOString()) throw new NotFoundError('Không tìm thấy lần xuất hiện của lịch');
    } else if (!occurrenceForKey(calendar, timezone, key)) {
      throw new NotFoundError('Không tìm thấy lần xuất hiện của lịch');
    }
    await prisma.personalCalendarException.upsert({
      where: { calendarId_occurrenceKey: { calendarId: id, occurrenceKey: key } },
      create: { calendarId: id, occurrenceKey: key, isDeleted: true },
      update: { isDeleted: true },
    });
    return;
  }

  if (calendar.recurrence === CalendarRecurrence.NONE || !input.occurrenceKey) {
    await prisma.personalCalendar.delete({ where: { id } });
    return;
  }

  const previous = previousOccurrence(calendar, input.occurrenceKey, timezone);
  if (!previous) {
    await prisma.personalCalendar.delete({ where: { id } });
  } else {
    await prisma.personalCalendar.update({ where: { id }, data: { recurrenceEndsAt: toDbDate(toLocalDateString(previous.startsAt, timezone) as LocalDate) } });
    await prisma.personalCalendarException.deleteMany({ where: { calendarId: id, occurrenceKey: { gt: input.occurrenceKey } } });
  }
}

async function updateThis(calendar: PersonalCalendar & { exceptions: PersonalCalendarException[] }, timezone: string, input: UpdateCalendarInput): Promise<CalendarOccurrence> {
  const key = input.occurrenceKey as string;
  const original = generateCalendarOccurrences(toOccurrenceSource(calendar), {
    from: new Date(Date.parse(key) - 1).toISOString(),
    to: new Date(Date.parse(key) + 1).toISOString(),
    timeZone: timezone,
  }).find((item) => item.occurrenceKey === key);
  if (!original) throw new NotFoundError('Không tìm thấy lần xuất hiện của lịch');

  await prisma.personalCalendarException.upsert({
    where: { calendarId_occurrenceKey: { calendarId: calendar.id, occurrenceKey: key } },
    create: {
      calendarId: calendar.id,
      occurrenceKey: key,
      title: input.title ?? null,
      notes: input.notes ?? null,
      overriddenStart: input.startsAt ? new Date(input.startsAt) : null,
      overriddenEnd: input.endsAt ? new Date(input.endsAt) : null,
    },
    update: {
      title: input.title ?? null,
      notes: input.notes ?? null,
      overriddenStart: input.startsAt ? new Date(input.startsAt) : null,
      overriddenEnd: input.endsAt ? new Date(input.endsAt) : null,
      isDeleted: false,
    },
  });
  return {
    ...original,
    title: input.title ?? original.title,
    notes: input.notes ?? original.notes,
    startsAt: input.startsAt ?? original.startsAt,
    endsAt: input.endsAt ?? original.endsAt,
  };
}

async function updateFuture(userId: number, timezone: string, calendar: PersonalCalendar & { exceptions: PersonalCalendarException[] }, input: UpdateCalendarInput): Promise<CalendarRow> {
  const key = input.occurrenceKey as string;
  const occurrence = previousOccurrence(calendar, key, timezone);
  void occurrence;
  const selected = occurrenceForKey(calendar, timezone, key);
  if (!selected) throw new NotFoundError('Không tìm thấy lần xuất hiện của lịch');
  const prior = previousOccurrence(calendar, key, timezone);
  const recurrence = input.recurrence ?? calendar.recurrence;
  const recurrenceEnd = input.recurrenceEndsAt ?? (calendar.recurrenceEndsAt ? fromDbDate(calendar.recurrenceEndsAt) : null);
  validateRecurringUpdate(recurrence, recurrenceEnd, selected.startsAt, timezone);

  if (prior) {
    await prisma.personalCalendar.update({
      where: { id: calendar.id },
      data: { recurrenceEndsAt: toDbDate(toLocalDateString(prior.startsAt, timezone) as LocalDate) },
    });
    await prisma.personalCalendarException.deleteMany({ where: { calendarId: calendar.id, occurrenceKey: { gt: key } } });
  } else {
    await prisma.personalCalendarException.deleteMany({ where: { calendarId: calendar.id } });
  }

  const originalDuration = Date.parse(selected.endsAt) - Date.parse(selected.startsAt);
  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date(selected.startsAt);
  const endsAt = input.endsAt ? new Date(input.endsAt) : new Date(startsAt.getTime() + originalDuration);
  if (prior) {
    const replacement = await prisma.personalCalendar.create({
      data: {
        userId,
        title: input.title ?? calendar.title,
        notes: input.notes ?? calendar.notes,
        startsAt,
        endsAt,
        recurrence: recurrence as PrismaCalendarRecurrence,
        recurrenceEndsAt: recurrenceEnd ? toDbDate(recurrenceEnd as LocalDate) : null,
      },
    });
    return row(replacement);
  }
  const updated = await prisma.personalCalendar.update({
    where: { id: calendar.id },
    data: {
      title: input.title ?? calendar.title,
      notes: input.notes ?? calendar.notes,
      startsAt,
      endsAt,
      recurrence: recurrence as PrismaCalendarRecurrence,
      recurrenceEndsAt: recurrenceEnd ? toDbDate(recurrenceEnd as LocalDate) : null,
    },
  });
  return row(updated);
}

function calendarUpdateData(calendar: PersonalCalendar, input: UpdateCalendarInput, recurrence: CalendarRecurrence): Record<string, unknown> {
  return {
    title: input.title ?? calendar.title,
    notes: input.notes ?? calendar.notes,
    startsAt: input.startsAt ? new Date(input.startsAt) : calendar.startsAt,
    endsAt: input.endsAt ? new Date(input.endsAt) : calendar.endsAt,
    recurrence: recurrence as PrismaCalendarRecurrence,
    recurrenceEndsAt: recurrence === CalendarRecurrence.NONE
      ? null
      : toDbDate((input.recurrenceEndsAt ?? (calendar.recurrenceEndsAt ? fromDbDate(calendar.recurrenceEndsAt) : null)) as LocalDate),
  };
}

function validateRecurringUpdate(recurrence: CalendarRecurrence, recurrenceEnd: string | null, startsAt?: string, timezone = 'UTC'): void {
  if (recurrence !== CalendarRecurrence.NONE && !recurrenceEnd) {
    throw new BadRequestError('Ngày kết thúc chuỗi không được để trống');
  }
  if (recurrence !== CalendarRecurrence.NONE && recurrenceEnd && startsAt && recurrenceEnd < toLocalDateString(startsAt, timezone)) {
    throw new BadRequestError('Ngày kết thúc chuỗi không được trước ngày bắt đầu');
  }
}

function toOccurrenceSource(calendar: PersonalCalendar) {
  return {
    id: calendar.id,
    title: calendar.title,
    notes: calendar.notes,
    startsAt: calendar.startsAt.toISOString(),
    endsAt: calendar.endsAt.toISOString(),
    recurrence: calendar.recurrence as CalendarRecurrence,
    recurrenceEndsAt: calendar.recurrenceEndsAt ? fromDbDate(calendar.recurrenceEndsAt) : null,
  };
}

function occurrenceProbeRange(calendar: PersonalCalendar, key: string, timezone: string) {
  const keyDate = new Date(key);
  return {
    from: new Date(keyDate.getTime() - 1).toISOString(),
    to: new Date(keyDate.getTime() + 1).toISOString(),
    timeZone: timezone,
  };
}

function occurrenceForKey(calendar: PersonalCalendar, timezone: string, key: string): CalendarOccurrence | null {
  const keyMs = Date.parse(key);
  const occurrences = generateCalendarOccurrences(toOccurrenceSource(calendar), {
    from: new Date(keyMs - 1).toISOString(),
    to: new Date(keyMs + 1).toISOString(),
    timeZone: timezone,
  });
  return occurrences.find((item) => item.occurrenceKey === key) ?? null;
}

function previousOccurrence(calendar: PersonalCalendar, key: string, timezone: string): CalendarOccurrence | null {
  const keyMs = Date.parse(key);
  const occurrences = generateCalendarOccurrences(toOccurrenceSource(calendar), {
    from: calendar.startsAt.toISOString(),
    to: new Date(keyMs + 1).toISOString(),
    timeZone: timezone,
  });
  const prior = occurrences.filter((item) => Date.parse(item.startsAt) < keyMs);
  return prior.length ? (prior[prior.length - 1] ?? null) : null;
}

function toLocalDateString(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])) as Record<string, string>; 
  return `${values.year}-${values.month}-${values.day}`;
}
