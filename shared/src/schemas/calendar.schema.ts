import { z } from 'zod';
import { CalendarRecurrence, CalendarScope } from '../constants/enums.js';
import { localDateSchema } from './common.schema.js';

export const CALENDAR_TITLE_MAX = 100;
export const CALENDAR_NOTES_MAX = 200;
export const CALENDAR_MAX_QUERY_DAYS = 366;

const isoDateTimeSchema = z.string().datetime({ offset: true });
const calendarScopeSchema = z.nativeEnum(CalendarScope);

const calendarFields = {
  title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(CALENDAR_TITLE_MAX),
  notes: z.string().trim().max(CALENDAR_NOTES_MAX).optional().default(''),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  recurrence: z.nativeEnum(CalendarRecurrence).default(CalendarRecurrence.NONE),
  recurrenceEndsAt: localDateSchema.nullable().optional(),
};

function calendarRules(data: {
  startsAt: string;
  endsAt: string;
  recurrence: CalendarRecurrence;
  recurrenceEndsAt?: string | null;
}, ctx: z.RefinementCtx): void {
  if (Date.parse(data.endsAt) < Date.parse(data.startsAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Thời gian kết thúc phải sau thời gian bắt đầu', path: ['endsAt'] });
  }
  if (data.recurrence !== CalendarRecurrence.NONE) {
    if (!data.recurrenceEndsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc chuỗi không được để trống', path: ['recurrenceEndsAt'] });
      return;
    }
    if (data.recurrenceEndsAt < data.startsAt.slice(0, 10)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc chuỗi không được trước ngày bắt đầu', path: ['recurrenceEndsAt'] });
    }
  }
}

export const createCalendarSchema = z.object(calendarFields).superRefine(calendarRules);
export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

const occurrenceKeySchema = z.string().datetime({ offset: true });

export const updateCalendarSchema = z
  .object({
    title: calendarFields.title.optional(),
    notes: z.string().trim().max(CALENDAR_NOTES_MAX).optional(),
    startsAt: isoDateTimeSchema.optional(),
    endsAt: isoDateTimeSchema.optional(),
    recurrence: z.nativeEnum(CalendarRecurrence).optional(),
    recurrenceEndsAt: localDateSchema.nullable().optional(),
    scope: calendarScopeSchema.optional(),
    occurrenceKey: occurrenceKeySchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === CalendarScope.THIS && !data.occurrenceKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Thiếu occurrenceKey cho phạm vi này', path: ['occurrenceKey'] });
    }
    if (data.startsAt && data.endsAt && Date.parse(data.endsAt) < Date.parse(data.startsAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Thời gian kết thúc phải sau thời gian bắt đầu', path: ['endsAt'] });
    }
    if (data.recurrence && data.recurrence !== CalendarRecurrence.NONE && !data.recurrenceEndsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc chuỗi không được để trống', path: ['recurrenceEndsAt'] });
    }
  });
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;

export const calendarQuerySchema = z
  .object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    view: z.enum(['month', 'week']),
  })
  .superRefine((data, ctx) => {
    const from = Date.parse(data.from);
    const to = Date.parse(data.to);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    if (from >= to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'from phải trước to', path: ['from'] });
    } else if (to - from > CALENDAR_MAX_QUERY_DAYS * millisecondsPerDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Khoảng truy vấn vượt quá giới hạn cho phép', path: ['to'] });
    }
  });
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;

export const calendarDetailQuerySchema = z.object({ occurrenceKey: occurrenceKeySchema.optional() });
export type CalendarDetailQueryInput = z.infer<typeof calendarDetailQuerySchema>;
export const calendarDetailSchema = calendarDetailQuerySchema;
export type CalendarDetailInput = CalendarDetailQueryInput;

export const deleteCalendarSchema = z.object({
  scope: calendarScopeSchema,
  occurrenceKey: occurrenceKeySchema.optional(),
}).superRefine((data, ctx) => {
  if (data.scope === CalendarScope.THIS && !data.occurrenceKey) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Thiếu occurrenceKey cho phạm vi này', path: ['occurrenceKey'] });
  }
});
export type DeleteCalendarInput = z.infer<typeof deleteCalendarSchema>;

export interface CalendarRow {
  id: string | number;
  title: string;
  notes: string;
  startsAt: string;
  endsAt: string;
  recurrence: CalendarRecurrence;
  recurrenceEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarOccurrence {
  calendarId: string | number;
  occurrenceKey: string;
  title: string;
  notes: string;
  startsAt: string;
  endsAt: string;
  recurrence: CalendarRecurrence;
}
