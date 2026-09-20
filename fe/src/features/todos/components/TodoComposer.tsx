import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { TODO_TITLE_MAX, type LocalDate } from '@enghabit/shared';
import { Button, Input } from '../../../shared/components/ui';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useToast } from '../../../shared/components/Toast';
import { useT } from '../../../shared/i18n/language';
import { useCreateTodo } from '../todo.hooks';

/**
 * Ô thêm việc mới. Dùng chung cho trang và cho bảng thả xuống.
 *
 * Là `form` thật chứ không phải input + nút: gõ xong bấm Enter là thêm được, không phải
 * với tay sang chuột. Thêm xong ô tự trống và giữ con trỏ để gõ tiếp việc kế — danh sách
 * việc cần làm thường được nhập một mạch nhiều dòng.
 */
export function TodoComposer({
  date,
  placeholder,
  autoFocus = false,
}: {
  date: LocalDate;
  placeholder?: string;
  autoFocus?: boolean;
}): JSX.Element {
  const t = useT();
  const toast = useToast();
  const createTodo = useCreateTodo();
  const [title, setTitle] = useState('');

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createTodo.mutate(
      { title: trimmed, date },
      {
        // Chỉ xoá ô khi server đã nhận. Xoá ngay lúc bấm rồi request hỏng là người dùng
        // mất luôn câu vừa gõ và không có cách nào lấy lại.
        onSuccess: () => setTitle(''),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <Input
        autoFocus={autoFocus}
        value={title}
        maxLength={TODO_TITLE_MAX}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder ?? t('Thêm một việc cần làm…')}
        aria-label={t('Tên việc')}
        className="mt-0"
      />
      <Button type="submit" icon={Plus} loading={createTodo.isPending} disabled={!title.trim()}>
        {t('Thêm')}
      </Button>
    </form>
  );
}
