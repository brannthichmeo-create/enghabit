import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';
import type { CalendarOccurrence } from '../calendar.types';

export function DayEventsDialog({ open, date, events, onClose, onOpen }: { open: boolean; date: Date; events: CalendarOccurrence[]; onClose: () => void; onOpen: (event: CalendarOccurrence) => void }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} size="lg"
      footer={<div className="flex justify-end"><Button variant="secondary" onClick={onClose}>{t('Đóng')}</Button></div>}>
      <div className="space-y-2">
        {events.map((event) => <button key={`${event.calendarId}-${event.occurrenceKey}`} onClick={() => onOpen(event)} className="block w-full rounded-lg border border-line bg-surface px-3 py-2 text-left hover:bg-sunken"><span className="block text-xs text-content-muted">{new Date(event.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span><span className="line-clamp-2 font-medium text-content">{event.title}</span>{event.notes && <span className="mt-0.5 line-clamp-1 block text-xs text-content-soft">{event.notes}</span>}</button>)}
      </div>
    </Modal>
  );
}
