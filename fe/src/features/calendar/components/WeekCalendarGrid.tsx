import { formatTime } from '../../../shared/lib/date-time';
import type { CalendarOccurrence } from '../calendar.types';
import { addDays, durationMinutes, mondayStart, overlapsDay } from '../calendar.utils';

const HOUR_HEIGHT = 64;

export function WeekCalendarGrid({ week, events, onCreate, onOpen }: { week: Date; events: CalendarOccurrence[]; onCreate: (date: Date) => void; onOpen: (event: CalendarOccurrence) => void }) {
  const start = mondayStart(week);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return <div className="overflow-auto rounded-xl border border-line bg-surface">
    <div className="min-w-[760px]">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-line sticky top-0 z-10 bg-surface"><div /><div />{days.map((day) => <button key={day.toISOString()} onClick={() => onCreate(day)} className="border-l border-line px-1 py-2 text-center text-xs text-content-soft hover:bg-sunken"><span className="block text-content-muted">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span><span className="font-semibold">{day.getDate()}</span></button>)}</div>
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        <div style={{ height: HOUR_HEIGHT * 24 }} className="relative border-r border-line">{Array.from({ length: 24 }, (_, hour) => <div key={hour} style={{ top: hour * HOUR_HEIGHT }} className="absolute right-2 text-[10px] text-content-muted">{hour}:00</div>)}</div>
        {days.map((day) => {
          const dayEvents = events.filter((event) => overlapsDay(event.startsAt, event.endsAt, day) && Date.parse(event.endsAt) - Date.parse(event.startsAt) < 23 * 3600000);
          return <div key={day.toISOString()} onClick={() => onCreate(day)} role="button" tabIndex={0} className="relative border-r border-line" style={{ height: HOUR_HEIGHT * 24 }}>
            {Array.from({ length: 24 }, (_, hour) => <div key={hour} style={{ top: hour * HOUR_HEIGHT }} className="absolute inset-x-0 border-t border-line" />)}
            {dayEvents.map((event) => {
              const eventStart = new Date(event.startsAt);
              const minutes = eventStart.getHours() * 60 + eventStart.getMinutes();
              const top = (minutes / 60) * HOUR_HEIGHT;
              const height = Math.max(28, (durationMinutes(event.startsAt, event.endsAt) / 60) * HOUR_HEIGHT);
              return <button key={`${event.calendarId}-${event.occurrenceKey}`} onClick={(e) => { e.stopPropagation(); onOpen(event); }} style={{ top, height, left: 3, right: 3 }} className="absolute overflow-hidden rounded-md border-l-2 border-brand bg-brand/15 px-1.5 py-1 text-left hover:bg-brand/25"><span className="block truncate text-[10px] text-content-muted">{formatTime(event.startsAt)}–{formatTime(event.endsAt)}</span><span className="block truncate text-xs font-medium text-content">{event.title}</span>{height > 40 && event.notes && <span className="block truncate text-[10px] text-content-soft">{event.notes}</span>}</button>;
            })}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
