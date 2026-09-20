import { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Eraser, ListTodo } from 'lucide-react';
import { addDays, type LocalDate, type TodoRow } from '@enghabit/shared';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  SkeletonList,
} from '../../../shared/components/ui';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../shared/components/Toast';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useLocale, useT } from '../../../shared/i18n/language';
import {
  useClearDoneTodos,
  useDeleteTodo,
  useTodayLocalDate,
  useTodos,
  useUpdateTodo,
} from '../todo.hooks';
import { TodoComposer } from './TodoComposer';
import { TodoItem } from './TodoItem';

/**
 * Trang Việc cần làm.
 *
 * Danh sách của MỘT ngày, lật qua lại được bằng hai nút mũi tên. Không có chế độ "xem
 * tất cả": một danh sách việc vặt gom nhiều tháng chỉ còn là một đống dài không ai đọc,
 * còn thứ thật sự cần nhìn xuyên ngày là các việc chưa xong — chúng đã nổi lên khối
 * "Còn nợ" của hôm nay.
 */
export function TodosPage(): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const today = useTodayLocalDate();
  const [date, setDate] = useState<LocalDate>(today);

  const day = useTodos(date);
  const isToday = date === today;

  const items = day.data?.items ?? [];
  const doneCount = items.filter((item) => item.isDone).length;

  return (
    <div>
      <PageHeader
        title={t('Việc cần làm')}
        description={t('Ghi những việc của hôm nay và đánh dấu khi xong. Danh sách này không tính vào chuỗi ngày học.')}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          onClick={() => setDate(addDays(date, -1))}
          aria-label={t('Ngày trước')}
        />
        <span className="text-sm font-medium text-on-page">
          {isToday ? t('Hôm nay') : formatDay(date, locale)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronRight}
          onClick={() => setDate(addDays(date, 1))}
          aria-label={t('Ngày sau')}
        />
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
            {t('Về hôm nay')}
          </Button>
        )}
      </div>

      {day.isLoading && <SkeletonList rows={2} />}
      {day.isError && <ErrorState message={getErrorMessage(day.error)} onRetry={() => void day.refetch()} />}

      {day.data && (
        <>
          {day.data.overdue.length > 0 && <OverdueCard todos={day.data.overdue} today={today} />}

          <Card>
            <TodoComposer
              date={date}
              placeholder={isToday ? t('Thêm một việc cần làm…') : t('Thêm việc cho ngày này…')}
            />

            {items.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-content-muted">
                  <span>{t('{done}/{total} việc đã xong', { done: doneCount, total: items.length })}</span>
                  {doneCount > 0 && <ClearDoneButton date={date} count={doneCount} />}
                </div>
                <ProgressBar
                  percent={(doneCount / items.length) * 100}
                  done={doneCount === items.length}
                  label={t('Tiến độ việc cần làm')}
                />

                <ul className="mt-2">
                  {items.map((todo) => (
                    <TodoRowConnected key={todo.id} todo={todo} />
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {items.length === 0 && (
            <div className="mt-4">
              <EmptyState
                icon={ListTodo}
                title={isToday ? t('Hôm nay chưa có việc nào') : t('Ngày này không có việc nào')}
                description={t('Ghi những việc nhỏ và cụ thể, ví dụ: ôn 20 thẻ bộ "Động từ bất quy tắc".')}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Việc chưa xong của các ngày trước.
 *
 * Tách hẳn ra một thẻ riêng chứ không trộn vào danh sách hôm nay: đây là việc THUỘC ngày
 * khác, trộn vào rồi bấm xong sẽ ghi nhận nhầm ngày. Dời sang hôm nay là một thao tác có
 * chủ đích, nên có nút riêng.
 */
function OverdueCard({ todos, today }: { todos: TodoRow[]; today: LocalDate }): JSX.Element {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const updateTodo = useUpdateTodo();

  const moveAllToToday = (): void => {
    todos.forEach((todo) =>
      updateTodo.mutate(
        { id: todo.id, input: { date: today } },
        { onError: (error) => toast.error(getErrorMessage(error)) },
      ),
    );
  };

  return (
    <Card className="mb-4 border-accent/40 bg-accent-soft/40">
      {/* Tiêu đề tự vẽ chứ không dùng `SectionTitle`: component đó dành cho chữ NGOÀI
          thẻ nên lấy token `on-page*`, đặt vào trong thẻ là sai bộ màu (xem
          docs/color-rules.md). */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-content-soft">
          <AlertCircle className="h-3.5 w-3.5 text-accent-ink" aria-hidden />
          {t('Còn nợ từ hôm trước')}
        </h2>
        <Button variant="secondary" size="sm" onClick={moveAllToToday} loading={updateTodo.isPending}>
          {t('Dời hết sang hôm nay')}
        </Button>
      </div>

      <ul>
        {todos.map((todo) => (
          <TodoRowConnected key={todo.id} todo={todo} dateLabel={formatDay(todo.date, locale)} />
        ))}
      </ul>
    </Card>
  );
}

/** Một dòng đã nối sẵn vào các mutation — dùng ở cả danh sách hôm nay lẫn khối còn nợ. */
function TodoRowConnected({ todo, dateLabel }: { todo: TodoRow; dateLabel?: string }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleDelete = async (): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá việc "{name}"?', { name: todo.title }),
      message: t('Việc này sẽ biến mất khỏi danh sách và không khôi phục được.'),
      confirmLabel: t('Xoá việc'),
      tone: 'danger',
    });
    if (!ok) return;
    deleteTodo.mutate(todo.id, { onError: (error) => toast.error(getErrorMessage(error)) });
  };

  return (
    <TodoItem
      todo={todo}
      dateLabel={dateLabel}
      onToggle={(isDone) =>
        updateTodo.mutate(
          { id: todo.id, input: { isDone } },
          { onError: (error) => toast.error(getErrorMessage(error)) },
        )
      }
      onRename={(title) =>
        updateTodo.mutate(
          { id: todo.id, input: { title } },
          { onError: (error) => toast.error(getErrorMessage(error)) },
        )
      }
      onDelete={() => void handleDelete()}
    />
  );
}

function ClearDoneButton({ date, count }: { date: LocalDate; count: number }): JSX.Element {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const clearDone = useClearDoneTodos();

  const handleClear = async (): Promise<void> => {
    const ok = await confirm({
      title: t('Xoá {n} việc đã xong?', { n: count }),
      message: t('Các việc đã đánh dấu xong của ngày này sẽ bị xoá hẳn.'),
      confirmLabel: t('Xoá hết'),
      tone: 'danger',
    });
    if (!ok) return;
    clearDone.mutate(date, {
      onSuccess: (result) => toast.success(t('Đã xoá {n} việc đã xong', { n: result.deleted })),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={Eraser}
      onClick={() => void handleClear()}
      loading={clearDone.isPending}
    >
      {t('Xoá việc đã xong')}
    </Button>
  );
}

/**
 * Hiện ngày theo ngôn ngữ đang chọn. Ép `timeZone: 'UTC'` vì chuỗi ngày không mang giờ:
 * để trình duyệt tự đổi sang giờ máy thì người ở múi giờ âm thấy lùi một ngày.
 */
function formatDay(date: LocalDate, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
