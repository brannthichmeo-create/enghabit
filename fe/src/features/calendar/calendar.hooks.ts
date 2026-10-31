import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCalendarInput, UpdateCalendarInput } from '@enghabit/shared';
import * as calendarApi from './calendar.api';
import type { CalendarDeletePayload, CalendarQueryParams } from './calendar.types';

export const calendarKeys = {
  all: ['calendar'] as const,
  list: (params: CalendarQueryParams) => ['calendar', params.from, params.to, params.view] as const,
};

export function useCalendars(params: CalendarQueryParams, enabled = true) {
  return useQuery({
    queryKey: calendarKeys.list(params),
    queryFn: () => calendarApi.listCalendars(params),
    enabled,
  });
}

export function useCreateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCalendarInput) => calendarApi.createCalendar(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  });
}

export function useUpdateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCalendarInput }) => calendarApi.updateCalendar(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  });
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CalendarDeletePayload }) => calendarApi.deleteCalendar(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  });
}
