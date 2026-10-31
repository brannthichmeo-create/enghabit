import { useMemo, useState } from 'react';
import { CalendarRecurrence, CALENDAR_NOTES_MAX, CALENDAR_TITLE_MAX, type CreateCalendarInput, type UpdateCalendarInput } from '@enghabit/shared';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';
import { Button, ErrorMessage, Field, Input, Select, Textarea } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';
import type { CalendarOccurrence, CalendarRow, CalendarScope } from '../calendar.types';
import { fromDateTimeLocal, toDateTimeLocal, withLocalTime } from '../calendar.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCalendarInput | UpdateCalendarInput) => void;
  saving: boolean;
  error?: string;
  initialDate?: Date;
  event?: CalendarOccurrence | CalendarRow;
  scope?: CalendarScope;
}

export function CalendarFormDialog({ open, onClose, onSubmit, saving, error, initialDate, event, scope }: Props) {
  const t = useT();
  const confirm = useConfirm();
  const initialStart = event?.startsAt ?? (initialDate ? withLocalTime(initialDate).toISOString() : new Date().toISOString());
  const initialEnd = event?.endsAt ?? (initialDate ? withLocalTime(initialDate, '10:00').toISOString() : new Date(Date.now() + 3600000).toISOString());
  const [title, setTitle] = useState(event?.title ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(initialStart));
  const [endsAt, setEndsAt] = useState(toDateTimeLocal(initialEnd));
  const [recurrence, setRecurrence] = useState<CalendarRecurrence>(event?.recurrence ?? CalendarRecurrence.NONE);
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState(event && 'recurrenceEndsAt' in event ? event.recurrenceEndsAt ?? '' : '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const baseline = useMemo(() => JSON.stringify({ title: event?.title ?? '', notes: event?.notes ?? '', startsAt: toDateTimeLocal(initialStart), endsAt: toDateTimeLocal(initialEnd), recurrence: event?.recurrence ?? CalendarRecurrence.NONE, recurrenceEndsAt: event && 'recurrenceEndsAt' in event ? event.recurrenceEndsAt ?? '' : '' }), [event, initialEnd, initialStart]);
  const current = JSON.stringify({ title, notes, startsAt, endsAt, recurrence, recurrenceEndsAt });

  const requestClose = async (): Promise<void> => {
    if (current !== baseline && !(await confirm({ title: t('Huỷ thay đổi?'), message: t('Các thay đổi chưa lưu sẽ bị mất.'), confirmLabel: t('Huỷ thay đổi') }))) return;
    onClose();
  };

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = t('Tiêu đề không được để trống');
    if (title.length > CALENDAR_TITLE_MAX) errors.title = t('Tiêu đề tối đa 100 ký tự');
    if (notes.length > CALENDAR_NOTES_MAX) errors.notes = t('Ghi chú tối đa 200 ký tự');
    if (!startsAt) errors.startsAt = t('Ngày giờ bắt đầu không được để trống');
    if (!endsAt) errors.endsAt = t('Ngày giờ kết thúc không được để trống');
    if (startsAt && endsAt && Date.parse(fromDateTimeLocal(endsAt)) < Date.parse(fromDateTimeLocal(startsAt))) errors.endsAt = t('Thời gian kết thúc phải sau thời gian bắt đầu');
    if (recurrence !== CalendarRecurrence.NONE && !recurrenceEndsAt) errors.recurrenceEndsAt = t('Ngày kết thúc chuỗi không được để trống');
    if (recurrence !== CalendarRecurrence.NONE && recurrenceEndsAt && recurrenceEndsAt < startsAt.slice(0, 10)) errors.recurrenceEndsAt = t('Ngày kết thúc chuỗi không được trước ngày bắt đầu');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      title: title.trim(), notes: notes.trim(), startsAt: fromDateTimeLocal(startsAt), endsAt: fromDateTimeLocal(endsAt),
      recurrence,
      recurrenceEndsAt: recurrence === CalendarRecurrence.NONE ? null : recurrenceEndsAt,
      ...(scope ? { scope } : {}),
      ...((scope && 'occurrenceKey' in (event ?? {}) ? { occurrenceKey: (event as CalendarOccurrence).occurrenceKey } : {})),
    };
    onSubmit(event ? payload as UpdateCalendarInput : payload as CreateCalendarInput);
  };

  return (
    <Modal open={open} onClose={() => void requestClose()} title={event ? t('Sửa lịch') : t('Tạo lịch')} size="lg" closeOnBackdrop={false}
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => void requestClose()}>{t('Huỷ')}</Button><Button type="submit" form="calendar-form" loading={saving}>{event ? t('Cập nhật') : t('Tạo lịch')}</Button></div>}>
      <form id="calendar-form" onSubmit={submit} className="space-y-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Field label={t('Tiêu đề')} error={fieldErrors.title} hint={`${title.length}/${CALENDAR_TITLE_MAX}`}>
          <Input value={title} maxLength={CALENDAR_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Bắt đầu')} error={fieldErrors.startsAt}><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></Field>
          <Field label={t('Kết thúc')} error={fieldErrors.endsAt}><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></Field>
        </div>
        <Field label={t('Lặp lại')}>
          <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as CalendarRecurrence)}>
            <option value={CalendarRecurrence.NONE}>{t('Không lặp')}</option>
            <option value={CalendarRecurrence.DAILY}>{t('Hằng ngày')}</option>
            <option value={CalendarRecurrence.WEEKLY}>{t('Hằng tuần')}</option>
            <option value={CalendarRecurrence.MONTHLY}>{t('Hằng tháng')}</option>
            <option value={CalendarRecurrence.YEARLY}>{t('Hằng năm')}</option>
          </Select>
        </Field>
        {recurrence !== CalendarRecurrence.NONE && <Field label={t('Ngày kết thúc chuỗi')} error={fieldErrors.recurrenceEndsAt}><Input type="date" value={recurrenceEndsAt} onChange={(e) => setRecurrenceEndsAt(e.target.value)} /></Field>}
        <Field label={t('Ghi chú')} error={fieldErrors.notes} hint={`${notes.length}/${CALENDAR_NOTES_MAX}`}>
          <Textarea value={notes} maxLength={CALENDAR_NOTES_MAX} rows={4} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
