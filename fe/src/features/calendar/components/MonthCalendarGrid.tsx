import { formatTime } from '../../../shared/lib/date-time';
import type { CalendarOccurrence } from '../calendar.types';
import { addDays, mondayStart, overlapsDay, sameDay, startOfDay } from '../calendar.utils';

export function MonthCalendarGrid({ month, events, onCreate, onOpen, onMore }: { month: Date; events: CalendarOccurrence[]; onCreate: (date: Date) => void; onOpen: (event: CalendarOccurrence) => void; onMore: (date: Date, events: CalendarOccurrence[]) => void }) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = mondayStart(monthStart);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const today = startOfDay(new Date());
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return <div className="overflow-x-auto">
    <div className="min-w-[700px] rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">{weekdays.map((day) => <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-content-muted">{day}</div>)}</div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) => overlapsDay(event.startsAt, event.endsAt, day));
          const visible = dayEvents.slice(0, 2);
          const hidden = dayEvents.length - visible.length;
          const muted = day.getMonth() !== month.getMonth();
          return <div key={day.toISOString()} role="button" tabIndex={0} onClick={() => onCreate(day)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCreate(day); } }} className="h-32 min-w-0 border-b border-r border-line p-1.5 last:border-r-0 hover:bg-sunken/50">
            <div className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs ${sameDay(day, today) ? 'bg-brand text-on-brand' : muted ? 'text-content-muted' : 'text-content-soft'}`}>{day.getDate()}</div>
            <div className="space-y-1 overflow-hidden">
              {visible.map((event) => <button key={`${event.calendarId}-${event.occurrenceKey}`} onClick={(e) => { e.stopPropagation(); onOpen(event); }} className="block w-full rounded border-l-2 border-brand bg-brand/10 px-1 py-0.5 text-left leading-tight hover:bg-brand/20"><span className="block truncate text-[10px] text-content-muted">{formatTime(event.startsAt)}–{formatTime(event.endsAt)}</span><span className="block truncate text-[11px] font-medium text-content">{event.title}</span>{event.notes && <span className="block truncate text-[10px] text-content-soft">{event.notes}</span>}</button>)}
              {hidden > 0 && <button onClick={(e) => { e.stopPropagation(); onMore(day, dayEvents); }} className="w-full rounded px-1 text-left text-xs font-medium text-on-page-link">+{hidden}</button>}
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}
