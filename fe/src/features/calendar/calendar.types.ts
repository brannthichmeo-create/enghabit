import type {
  CalendarOccurrence,
  CalendarRecurrence,
  CalendarRow,
  CalendarScope,
  CreateCalendarInput,
  UpdateCalendarInput,
} from '@enghabit/shared';

export type { CalendarOccurrence, CalendarRecurrence, CalendarRow, CalendarScope };
export type CalendarPayload = CreateCalendarInput;
export type CalendarUpdatePayload = UpdateCalendarInput;

export interface CalendarQueryParams {
  from: string;
  to: string;
  view: 'month' | 'week';
}

export interface CalendarDeletePayload {
  scope: CalendarScope;
  occurrenceKey?: string;
}
