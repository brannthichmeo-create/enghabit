import { useEffect, useRef, useState } from 'react';
import { ListTodo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeatureKey, UserRole, type TodoRow } from '@enghabit/shared';
import { useCurrentUser } from '../../auth/auth.store';
import { useFeatureQueryEnabled } from '../../feature-flags/feature-flag.hooks';
import { ErrorMessage } from '../../../shared/components/ui';
import { useToast } from '../../../shared/components/Toast';
import { getErrorMessage } from '../../../shared/lib/api-client';
import { useT } from '../../../shared/i18n/language';
import { remainingCount, useTodayLocalDate, useTodos, useUpdateTodo } from '../todo.hooks';
import { TodoComposer } from './TodoComposer';
import { TodoItem } from './TodoItem';

/**
 * Việc cần làm ngay trên thanh trên cùng.
 *
 * Mục đích là đánh dấu xong một việc MÀ KHÔNG rời màn hình đang mở — đang học giữa chừng
 * mà phải điều hướng sang trang khác rồi tìm đường quay lại là đủ để người dùng thôi
 * không đánh dấu nữa.
 *
 * Danh sách ở đây và trang `/todos` là CÙNG một ô cache (`todoKeys.day(today)`), không
 * phải hai bản sao được đồng bộ với nhau — nên chúng không thể lệch nhau.
 *
 * Khác chuông thông báo ở một chỗ: chuông chỉ tải nội dung khi mở, còn ở đây danh sách
 * tải sẵn vì chính nó là nguồn của con số trên huy hiệu. Một ngày tối đa 50 dòng chữ
 * ngắn nên không đáng tách thêm một endpoint đếm riêng.
 */
export function TodoPopover(): JSX.Element | null {
  const t = useT();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const user = useCurrentUser();
  const isLearner = user?.role !== UserRole.ADMIN;
  // Chờ biết CHẮC cờ đang bật rồi mới gọi API — gọi lạc quan lúc tính năng đã tắt là
  // một lỗi 404 đỏ trong console mỗi lần mở app.
  const enabled = useFeatureQueryEnabled(FeatureKey.TODO);

  const today = useTodayLocalDate();
  const day = useTodos(today, isLearner && enabled);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Quản trị viên không có việc cần làm, và tính năng tắt thì nút cũng biến mất.
  if (!isLearner || !enabled) return null;

  const remaining = remainingCount(day.data);
  const items = day.data?.items ?? [];
  const overdue = day.data?.overdue ?? [];

  return (
    /*
      `static` dưới `sm`, `relative` từ `sm` — đây là thứ quyết định bảng thả xuống neo
      vào đâu, không phải trang trí.

      Nút này KHÔNG nằm ngoài cùng bên phải (sau nó còn chuông, và từ `lg` là ngôn ngữ và
      giao diện), nên mép phải nút cách mép phải màn hình khoảng 56px. Neo `right-0` vào
      nút thì bảng rộng 340px bắt đầu ở x = −15 trên iPhone 14: mép trái bị cắt mất, đúng
      lỗi đang thấy. Thu hẹp bảng không cứu được — sai ở chỗ NEO, không phải chiều rộng.

      Bỏ `relative` trên màn hình hẹp thì khối bao gần nhất trở thành chính `<header>`
      (nó đã `sticky` nên là phần tử có định vị), và bảng trải đều hai mép màn hình. Từ
      `sm` trở lên màn đủ rộng nên neo lại theo nút như cũ, gần chỗ vừa bấm hơn.
    */
    <div ref={containerRef} className="static sm:relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-page-muted transition-colors hover:bg-hover hover:text-on-page"
        aria-label={
          remaining > 0 ? t('Việc cần làm, còn {n} việc', { n: remaining }) : t('Việc cần làm')
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ListTodo className="h-4 w-4" aria-hidden />
        {remaining > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-on-brand">
            {remaining > 9 ? '9+' : remaining}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          /*
            `top-full` bám mép dưới của khối bao, nên nó tự đúng ở cả hai chế độ neo: dưới
            `sm` là mép dưới thanh trên cùng, từ `sm` là mép dưới nút. Không có con số
            chiều cao nào bị chép cứng ở đây — sửa chiều cao thanh trên cùng không làm
            bảng này lệch.

            Dưới `sm` chiều rộng do `left-2 right-2` quyết định nên phải để `w-auto`: đặt
            cả `left`, `right` lẫn `width` thì trình duyệt bỏ `right`, và bảng lại thò ra
            ngoài mép phải.
          */
          className="absolute left-2 right-2 top-full z-50 mt-1.5 w-auto animate-slide-up overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg sm:left-auto sm:right-0 sm:w-[min(340px,calc(100vw-2rem))]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="text-sm font-semibold text-content">{t('Việc cần làm hôm nay')}</span>
            {/* Hai con số và một dấu gạch — không có chữ nào nên không đi qua `t()`:
                thêm một khoá dịch mà bản tiếng Anh y hệt bản tiếng Việt chỉ làm dày
                từ điển. */}
            <span className="text-xs tabular-nums text-content-muted">
              {items.filter((item) => item.isDone).length}/{items.length}
            </span>
          </div>

          <div className="px-3 py-2">
            <TodoComposer date={today} autoFocus />
          </div>

          <div className="max-h-[300px] overflow-y-auto px-2 pb-1">
            {day.isError && (
              <div className="px-1 py-2">
                <ErrorMessage>{getErrorMessage(day.error)}</ErrorMessage>
              </div>
            )}

            {!day.isError && items.length === 0 && overdue.length === 0 && (
              <p className="px-1 py-6 text-center text-sm text-content-muted">
                {t('Chưa có việc nào cho hôm nay.')}
              </p>
            )}

            {overdue.length > 0 && (
              <>
                <p className="px-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-content-muted">
                  {t('Còn nợ từ hôm trước')}
                </p>
                <ul>
                  {overdue.map((todo) => (
                    <QuickRow key={todo.id} todo={todo} />
                  ))}
                </ul>
              </>
            )}

            <ul>
              {items.map((todo) => (
                <QuickRow key={todo.id} todo={todo} />
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate('/todos');
            }}
            className="block w-full border-t border-line px-3 py-2 text-center text-xs text-brand-strong transition-colors hover:bg-sunken"
          >
            {t('Mở trang Việc cần làm')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Dòng rút gọn: chỉ bấm tích. Sửa tên và xoá để dành cho trang, nơi có đủ chỗ. */
function QuickRow({ todo }: { todo: TodoRow }): JSX.Element {
  const toast = useToast();
  const updateTodo = useUpdateTodo();

  return (
    <TodoItem
      todo={todo}
      compact
      onToggle={(isDone) =>
        updateTodo.mutate(
          { id: todo.id, input: { isDone } },
          { onError: (error) => toast.error(getErrorMessage(error)) },
        )
      }
    />
  );
}
