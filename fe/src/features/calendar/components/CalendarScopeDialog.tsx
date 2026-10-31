import { CalendarScope } from '@enghabit/shared';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';

export function CalendarScopeDialog({ open, action, onClose, onChoose }: { open: boolean; action: 'edit' | 'delete'; onClose: () => void; onChoose: (scope: CalendarScope) => void }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={action === 'edit' ? t('Sửa lịch lặp') : t('Xoá lịch lặp')} size="md"
      footer={<Button variant="secondary" onClick={onClose}>{t('Huỷ')}</Button>}>
      <p className="mb-4 text-sm text-content-soft">{t('Bạn muốn áp dụng thay đổi cho phần nào của chuỗi?')}</p>
      <div className="grid gap-3">
        <Button variant="secondary" className="justify-start" onClick={() => onChoose(CalendarScope.THIS)}>{t('Chỉ lịch này')}</Button>
        <Button variant="secondary" className="justify-start" onClick={() => onChoose(CalendarScope.FUTURE)}>{t('Tất cả lịch còn lại')}</Button>
      </div>
    </Modal>
  );
}
