import { useState } from 'react';
import { CalendarRecurrence } from '@enghabit/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';
import type { CalendarOccurrence, CalendarRow } from '../calendar.types';

interface Props {
  open: boolean;
  event?: CalendarOccurrence | CalendarRow;
  onClose: () => void;
  onEdit: (event: CalendarOccurrence | CalendarRow) => void;
  onDelete: (event: CalendarOccurrence | CalendarRow) => void;
}

export function CalendarDetailDialog({ open, event, onClose, onEdit, onDelete }: Props) {
  const t = useT();
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  if (!event) return null;

  const recurrenceName: Record<CalendarRecurrence, string> = {
    NONE: t('Không lặp'), DAILY: t('Hằng ngày'), WEEKLY: t('Hằng tuần'), MONTHLY: t('Hằng tháng'), YEARLY: t('Hằng năm'),
  };
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const sameDay = start.toLocaleDateString() === end.toLocaleDateString();
  const dateTime = (date: Date) => date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Modal open={open} onClose={onClose} title={t('Chi tiết lịch')} size="lg"
      footer={<div className="flex flex-wrap justify-between gap-2"><Button variant="danger" onClick={() => onDelete(event)}>{t('Xoá')}</Button><div className="flex gap-2"><Button variant="secondary" onClick={onClose}>{t('Đóng')}</Button><Button onClick={() => onEdit(event)}>{t('Sửa')}</Button></div></div>}>
      <div className="space-y-5">
        <div>
          <h3 className={`text-xl font-semibold text-content ${titleExpanded ? '' : 'line-clamp-2'}`}>{event.title}</h3>
          {event.title.length > 55 && <button className="mt-1 text-sm text-on-page-link" onClick={() => setTitleExpanded((value) => !value)}>{titleExpanded ? t('Thu gọn') : t('Xem thêm')}</button>}
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-content-muted">{t('Bắt đầu')}</dt><dd className="mt-1 text-content">{dateTime(start)}</dd></div>
          <div><dt className="text-content-muted">{t('Kết thúc')}</dt><dd className="mt-1 text-content">{dateTime(end)}</dd></div>
          <div><dt className="text-content-muted">{t('Lặp lại')}</dt><dd className="mt-1 text-content">{recurrenceName[event.recurrence]}</dd></div>
          {'recurrenceEndsAt' in event && event.recurrenceEndsAt && <div><dt className="text-content-muted">{t('Ngày kết thúc chuỗi')}</dt><dd className="mt-1 text-content">{event.recurrenceEndsAt}</dd></div>}
        </dl>
        {event.notes && <div><p className="mb-1 text-sm text-content-muted">{t('Ghi chú')}</p><p className={`whitespace-pre-wrap text-content ${notesExpanded ? '' : 'line-clamp-2'}`}>{event.notes}</p>{event.notes.length > 90 && <button className="mt-1 text-sm text-on-page-link" onClick={() => setNotesExpanded((value) => !value)}>{notesExpanded ? t('Thu gọn') : t('Xem thêm')}</button>}</div>}
        {!sameDay && <p className="text-xs text-content-muted">{t('Lịch kéo dài qua nhiều ngày')}</p>}
      </div>
    </Modal>
  );
}
