import type {
  CalendarOccurrence,
  CalendarRow,
  CreateCalendarInput,
  UpdateCalendarInput,
} from '@enghabit/shared';
import { apiClient } from '../../shared/lib/api-client';
import type { CalendarDeletePayload, CalendarQueryParams } from './calendar.types';

export async function listCalendars(params: CalendarQueryParams): Promise<CalendarOccurrence[]> {
  const { data } = await apiClient.get<CalendarOccurrence[]>('/calendar', { params });
  return data;
}

export async function createCalendar(input: CreateCalendarInput): Promise<CalendarRow> {
  const { data } = await apiClient.post<CalendarRow>('/calendar', input);
  return data;
}

export async function getCalendar(id: number, occurrenceKey?: string): Promise<CalendarOccurrence | CalendarRow> {
  const { data } = await apiClient.get<CalendarOccurrence | CalendarRow>(`/calendar/${id}`, {
    params: occurrenceKey ? { occurrenceKey } : undefined,
  });
  return data;
}

export async function updateCalendar(id: number, input: UpdateCalendarInput): Promise<CalendarRow | CalendarOccurrence> {
  const { data } = await apiClient.patch<CalendarRow | CalendarOccurrence>(`/calendar/${id}`, input);
  return data;
}

export async function deleteCalendar(id: number, input: CalendarDeletePayload): Promise<void> {
  await apiClient.delete(`/calendar/${id}`, { data: input });
}
