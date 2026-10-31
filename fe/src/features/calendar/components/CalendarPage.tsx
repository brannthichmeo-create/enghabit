import { useState } from 'react';
import { CalendarRecurrence, CalendarScope, type CreateCalendarInput, type UpdateCalendarInput } from '@enghabit/shared';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button, ErrorState, PageHeader, SkeletonList } from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useLocale, useT } from '../../../shared/i18n/language';
import { useCalendars, useCreateCalendar, useDeleteCalendar, useUpdateCalendar } from '../calendar.hooks';
import type { CalendarOccurrence, CalendarQueryParams } from '../calendar.types';
import { addDays, localDateKey, mondayStart, startOfDay } from '../calendar.utils';
import { MonthCalendarGrid } from './MonthCalendarGrid';
import { WeekCalendarGrid } from './WeekCalendarGrid';
import { CalendarFormDialog } from './CalendarFormDialog';
import { CalendarDetailDialog } from './CalendarDetailDialog';
import { CalendarScopeDialog } from './CalendarScopeDialog';
import { DayEventsDialog } from './DayEventsDialog';

export function CalendarPage(): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<Date>();
  const [selected, setSelected] = useState<CalendarOccurrence>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [scopeAction, setScopeAction] = useState<'edit' | 'delete'>();
  const [scopeOpen, setScopeOpen] = useState(false);
  const [scope, setScope] = useState<CalendarScope>();
  const [dayOpen, setDayOpen] = useState(false);
  const [dayDate, setDayDate] = useState(new Date());
  const [dayEvents, setDayEvents] = useState<CalendarOccurrence[]>([]);

  const gridStart = view === 'month' ? mondayStart(new Date(anchor.getFullYear(), anchor.getMonth(), 1)) : mondayStart(anchor);
  const gridLength = view === 'month' ? 42 : 7;
  const params: CalendarQueryParams = {
    from: gridStart.toISOString(),
    to: addDays(gridStart, gridLength).toISOString(),
    view,
  };
  const calendars = useCalendars(params);
  const create = useCreateCalendar();
  const update = useUpdateCalendar();
  const remove = useDeleteCalendar();
  const events = calendars.data ?? [];

  const move = (amount: number): void => {
    if (view === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + amount, 1));
    else setAnchor(addDays(anchor, amount * 7));
  };
  const openCreate = (date: Date): void => {
    setSelected(undefined); setScope(undefined); setInitialDate(date); setFormOpen(true);
  };
  const openDetail = (event: CalendarOccurrence): void => { setSelected(event); setDetailOpen(true); };
  const beginScope = (action: 'edit' | 'delete'): void => {
    setScope(undefined); setScopeAction(action); setScopeOpen(true);
  };
  const editEvent = (event: CalendarOccurrence): void => {
    setDetailOpen(false);
    setSelected(event);
    if (event.recurrence !== CalendarRecurrence.NONE) beginScope('edit');
    else { setScope(CalendarScope.THIS); setFormOpen(true); }
  };
  const deleteEvent = (event: CalendarOccurrence): void => {
    setDetailOpen(false);
    setSelected(event);
    if (event.recurrence !== CalendarRecurrence.NONE) beginScope('delete');
    else remove.mutate({ id: Number(event.calendarId), input: { scope: CalendarScope.FUTURE } }, { onSuccess: () => toast.success(t('Đã xoá lịch')), onError: error => toast.error(getErrorMessage(error)) });
  };
  const chooseScope = (chosen: CalendarScope): void => {
    setScope(chosen); setScopeOpen(false);
    if (scopeAction === 'edit') setFormOpen(true);
    else if (selected) {
      remove.mutate({ id: Number(selected.calendarId), input: { scope: chosen, occurrenceKey: selected.occurrenceKey } }, {
        onSuccess: () => { toast.success(t('Đã xoá lịch')); },
        onError: error => toast.error(getErrorMessage(error)),
      });
    }
  };
  const submit = (payload: CreateCalendarInput | UpdateCalendarInput): void => {
    const onError = (error: unknown): void => toast.error(getErrorMessage(error));
    if (!selected) create.mutate(payload as CreateCalendarInput, { onSuccess: () => { setFormOpen(false); toast.success(t('Đã tạo lịch')); }, onError });
    else update.mutate({ id: Number(selected.calendarId), input: { ...payload, scope: scope ?? CalendarScope.THIS, occurrenceKey: selected.occurrenceKey } as UpdateCalendarInput }, { onSuccess: () => { setFormOpen(false); toast.success(t('Đã cập nhật lịch')); }, onError });
  };
  const title = view === 'month'
    ? anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : `${gridStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${addDays(gridStart, 6).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return <div>
    <PageHeader title={t('Lịch')} description={t('Quản lý các lịch cá nhân theo tháng và tuần.')} />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} aria-label={t('Kỳ trước')} onClick={() => move(-1)} />
        <Button variant="secondary" size="sm" onClick={() => setAnchor(startOfDay(new Date()))}>{t('Hôm nay')}</Button>
        <Button variant="secondary" size="sm" icon={ChevronRight} aria-label={t('Kỳ sau')} onClick={() => move(1)} />
        <span className="ml-1 text-sm font-semibold capitalize text-on-page">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-line bg-surface p-1">
          <button className={`rounded-md px-3 py-1 text-sm ${view === 'month' ? 'bg-brand text-on-brand' : 'text-content'}`} onClick={() => setView('month')}>{t('Tháng')}</button>
          <button className={`rounded-md px-3 py-1 text-sm ${view === 'week' ? 'bg-brand text-on-brand' : 'text-content'}`} onClick={() => setView('week')}>{t('Tuần')}</button>
        </div>
        <Button icon={Plus} onClick={() => openCreate(startOfDay(new Date()))}>{t('Tạo lịch')}</Button>
      </div>
    </div>
    {calendars.isLoading && <SkeletonList rows={4} />}
    {calendars.isError && <ErrorState message={getErrorMessage(calendars.error)} onRetry={() => void calendars.refetch()} />}
    {!calendars.isLoading && !calendars.isError && (view === 'month'
      ? <MonthCalendarGrid month={anchor} events={events} onCreate={openCreate} onOpen={openDetail} onMore={(date, items) => { setDayDate(date); setDayEvents(items); setDayOpen(true); }} />
      : <WeekCalendarGrid week={anchor} events={events} onCreate={openCreate} onOpen={openDetail} />)}
    <CalendarFormDialog key={`${selected?.calendarId ?? 'new'}-${selected?.occurrenceKey ?? localDateKey(initialDate ?? new Date())}-${scope ?? ''}`} open={formOpen} onClose={() => setFormOpen(false)} onSubmit={submit} saving={create.isPending || update.isPending} error={create.error ? getErrorMessage(create.error) : update.error ? getErrorMessage(update.error) : undefined} initialDate={initialDate} event={selected} scope={scope} />
    <CalendarDetailDialog open={detailOpen} event={selected} onClose={() => setDetailOpen(false)} onEdit={(event) => { if ('calendarId' in event && 'occurrenceKey' in event) editEvent(event as CalendarOccurrence); }} onDelete={(event) => { if ('calendarId' in event && 'occurrenceKey' in event) deleteEvent(event as CalendarOccurrence); }} />
    <CalendarScopeDialog open={scopeOpen} action={scopeAction ?? 'edit'} onClose={() => setScopeOpen(false)} onChoose={chooseScope} />
    <DayEventsDialog open={dayOpen} date={dayDate} events={dayEvents} onClose={() => setDayOpen(false)} onOpen={(event) => { setDayOpen(false); openDetail(event); }} />
  </div>;
}
