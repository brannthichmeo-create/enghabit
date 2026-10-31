import { formatTime } from '../../../shared/lib/date-time';
import type { CalendarOccurrence } from '../calendar.types';
import { addDays, mondayStart, overlapsDay, sameDay, startOfDay } from '../calendar.utils';

const HOUR_HEIGHT = 64;

function layoutEvents(events: Array<{ event: CalendarOccurrence; segmentStart: number; segmentEnd: number }>) {
  const lanes: number[] = [];
  const laidOut = events.map((item) => {
    let lane = lanes.findIndex((laneEnd) => laneEnd <= item.segmentStart);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = item.segmentEnd;
    return { ...item, lane };
  });
  return { events: laidOut, lanes: Math.max(1, lanes.length) };
}

export function WeekCalendarGrid({ week, events, onCreate, onOpen }: { week: Date; events: CalendarOccurrence[]; onCreate: (date: Date) => void; onOpen: (event: CalendarOccurrence) => void }) {
  const start = mondayStart(week);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const today = startOfDay(new Date());
  return <div className="overflow-auto rounded-xl border border-line bg-surface">
    <div className="min-w-[760px]">
      <div className="sticky top-0 z-10 grid grid-cols-[64px_repeat(7,1fr)] border-b border-line bg-surface"><div />{days.map((day) => <button key={day.toISOString()} onClick={() => onCreate(day)} className="border-l border-line px-1 py-2 text-center text-xs text-content-soft hover:bg-sunken"><span className="block text-content-muted">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-semibold ${sameDay(day, today) ? 'bg-brand text-on-brand' : ''}`}>{day.getDate()}</span></button>)}</div>
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        <div style={{ height: HOUR_HEIGHT * 24 }} className="relative border-r border-line">{Array.from({ length: 24 }, (_, hour) => <div key={hour} style={{ top: hour * HOUR_HEIGHT }} className="absolute right-2 text-[10px] text-content-muted">{String(hour).padStart(2, '0')}:00</div>)}</div>
        {days.map((day) => {
          const dayStart = startOfDay(day).getTime();
          const dayEnd = addDays(day, 1).getTime();
          const dayEvents = layoutEvents(events.filter((event) => overlapsDay(event.startsAt, event.endsAt, day)).map((event) => ({
            event,
            segmentStart: Math.max(Date.parse(event.startsAt), dayStart),
            segmentEnd: Math.min(Date.parse(event.endsAt), dayEnd),
          })).sort((a, b) => a.segmentStart - b.segmentStart));
          return <div key={day.toISOString()} onClick={() => onCreate(day)} role="button" tabIndex={0} className="relative border-r border-line" style={{ height: HOUR_HEIGHT * 24 }}>
            {Array.from({ length: 24 }, (_, hour) => <div key={hour} style={{ top: hour * HOUR_HEIGHT }} className="absolute inset-x-0 border-t border-line" />)}
            {dayEvents.events.map(({ event, segmentStart, segmentEnd, lane }) => {
              const elapsedMinutes = (segmentStart - dayStart) / 60000;
              const duration = Math.max(1, (segmentEnd - segmentStart) / 60000);
              const top = (elapsedMinutes / 60) * HOUR_HEIGHT;
              const height = Math.min(HOUR_HEIGHT * 24 - top, Math.max(28, (duration / 60) * HOUR_HEIGHT));
              return <button key={`${event.calendarId}-${event.occurrenceKey}`} onClick={(e) => { e.stopPropagation(); onOpen(event); }} style={{ top, height, left: `calc(${lane * 100 / dayEvents.lanes}% + 3px)`, width: `calc(${100 / dayEvents.lanes}% - 6px)` }} className="absolute overflow-hidden rounded-md border-l-2 border-brand bg-brand/15 px-1.5 py-1 text-left hover:bg-brand/25"><span className="block truncate text-[10px] text-content-muted">{formatTime(event.startsAt)}–{formatTime(event.endsAt)}</span><span className="block truncate text-xs font-medium text-content">{event.title}</span>{height > 40 && event.notes && <span className="block truncate text-[10px] text-content-soft">{event.notes}</span>}</button>;
            })}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
