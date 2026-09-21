import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, LayoutList } from 'lucide-react';
import type { AuditTargetType } from '@enghabit/shared';
import { useT } from '../../../shared/i18n/language';
import { AuditLogPanel } from './AuditLogPanel';

/** Giá trị của `?tab=` khi đang xem nhật ký. Thiếu tham số là tab quản lý. */
const LOG_TAB = 'log';

/**
 * Đang ở tab Nhật ký của màn hiện tại hay không.
 *
 * Màn có nút ở tiêu đề (Tạo bộ thẻ, Thêm loại…) dùng hook này để ẩn nút đó ở tab Nhật
 * ký: hộp thoại mà nút mở nằm trong nội dung tab Quản lý, bấm ở tab Nhật ký thì không
 * có gì hiện ra — một nút bấm mà không phản hồi tệ hơn không có nút.
 */
export function useAdminLogTab(): boolean {
  const [params] = useSearchParams();
  return params.get('tab') === LOG_TAB;
}

/**
 * Hai tab của một màn quản lý: nội dung quản lý, và nhật ký thao tác của ĐÚNG màn đó.
 *
 * Tab nằm trên URL (`?tab=log`), không trong state — cùng lý do với tab của `/groups`:
 * nút Quay lại và liên kết dán cho đồng nghiệp phải về đúng tab đang xem.
 *
 * `enabled = false` thì chỉ vẽ nội dung, không có thanh tab — cho màn dùng chung hai vai
 * trò (Cộng đồng), nơi người học không có nhật ký nào để xem.
 */
export function AdminLogTabs({
  targetTypes,
  mainLabel = 'Quản lý',
  enabled = true,
  children,
}: {
  /** Loại đối tượng màn này quản lý — tab Nhật ký chỉ hiện thao tác trên các loại đó. */
  targetTypes: readonly AuditTargetType[];
  /** Nhãn tab nội dung chính; bảng dữ liệu nên dịch ở chỗ hiển thị. */
  mainLabel?: string;
  enabled?: boolean;
  children: ReactNode;
}): JSX.Element {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const onLog = params.get('tab') === LOG_TAB;

  if (!enabled) return <>{children}</>;

  const select = (log: boolean): void => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (log) next.set('tab', LOG_TAB);
      else next.delete('tab');
      return next;
    });
  };

  const tabs = [
    { log: false, label: t(mainLabel), icon: LayoutList },
    { log: true, label: t('Nhật ký'), icon: History },
  ];

  return (
    <>
      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1" role="tablist" aria-label={t('Phần của màn hình')}>
        {tabs.map(({ log, label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={onLog === log}
            onClick={() => select(log)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm transition ${
              onLog === log ? 'bg-surface font-medium text-content shadow-sm' : 'text-content-soft'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {onLog ? <AuditLogPanel targetTypes={targetTypes} /> : children}
    </>
  );
}
