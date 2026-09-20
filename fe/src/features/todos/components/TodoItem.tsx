import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { TODO_TITLE_MAX, type TodoRow } from '@enghabit/shared';
import { Button, Input } from '../../../shared/components/ui';
import { useT } from '../../../shared/i18n/language';

/**
 * Một dòng việc cần làm.
 *
 * Dùng ở CẢ trang `/todos` lẫn bảng thả xuống trên thanh trên cùng — cùng một component
 * nên ô tích nằm đúng một chỗ, chữ gạch ngang theo đúng một luật, và sửa một lần là cả
 * hai nơi đổi theo. Chỉ khác nhau ở `compact`: bảng thả xuống hẹp nên bỏ nút sửa/xoá,
 * người dùng vào trang để làm những việc đó.
 */
export function TodoItem({
  todo,
  onToggle,
  onRename,
  onDelete,
  compact = false,
  /** Nhãn ngày hiện bên phải — dùng cho khối việc quá hạn. */
  dateLabel,
}: {
  todo: TodoRow;
  onToggle: (isDone: boolean) => void;
  onRename?: (title: string) => void;
  onDelete?: () => void;
  compact?: boolean;
  dateLabel?: string;
}): JSX.Element {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  const startEdit = (): void => {
    setDraft(todo.title);
    setEditing(true);
  };

  const commit = (): void => {
    const title = draft.trim();
    // Xoá trắng ô rồi bấm Enter KHÔNG được coi là xoá việc: xoá là một nút riêng, có
    // hỏi lại. Ở đây chỉ bỏ qua và trả về tên cũ.
    if (title && title !== todo.title) onRename?.(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="flex items-center gap-2 px-1 py-1.5">
        <Input
          // `autoFocus` chứ không phải ref: `Input` của shared là component thường, không
          // chuyển tiếp ref. Ô chỉ dựng lên khi bấm Sửa nên con trỏ luôn vào đúng chỗ.
          autoFocus
          value={draft}
          maxLength={TODO_TITLE_MAX}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="mt-0"
          aria-label={t('Tên việc')}
        />
        <Button size="sm" icon={Check} onClick={commit} aria-label={t('Lưu')} />
        <Button size="sm" variant="ghost" icon={X} onClick={() => setEditing(false)} aria-label={t('Huỷ')} />
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-sunken">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--brand))]"
        />
        <span
          className={`min-w-0 flex-1 break-words text-sm ${
            todo.isDone ? 'text-content-muted line-through' : 'text-content'
          }`}
        >
          {todo.title}
        </span>
      </label>

      {dateLabel && (
        <span className="shrink-0 text-xs tabular-nums text-content-muted">{dateLabel}</span>
      )}

      {!compact && (
        /*
          Nút chỉ hiện khi rê chuột hoặc khi bàn phím đi vào dòng (`focus-within`) — thiếu
          `focus-within` thì người dùng bàn phím Tab tới một nút vô hình và không biết
          mình đang đứng ở đâu.
        */
        <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {onRename && (
            <Button
              size="sm"
              variant="ghost"
              icon={Pencil}
              onClick={startEdit}
              aria-label={t('Sửa tên việc')}
            />
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={onDelete}
              aria-label={t('Xoá việc')}
            />
          )}
        </span>
      )}
    </li>
  );
}
