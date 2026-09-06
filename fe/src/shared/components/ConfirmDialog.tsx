import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui';
import { Modal } from './Modal';
import { useT } from '../i18n/language';

/**
 * Hộp thoại xác nhận dùng chung, thay cho `window.confirm` của trình duyệt.
 *
 * Vì sao không dùng `confirm()` nữa:
 * - Nó do trình duyệt vẽ nên không theo bảng màu, phông chữ hay chế độ tối của app;
 *   giữa một giao diện tiếng Việt lại hiện hộp thoại mang tên miền "localhost:5173".
 * - Nó KHOÁ CỨNG toàn bộ tab trong lúc chờ: mọi ảnh động dừng, dữ liệu đang tải cũng
 *   treo theo, và trên vài trình duyệt di động nó bị chặn hoàn toàn — người dùng bấm
 *   nút xoá mà không có gì xảy ra.
 * - Không đặt được nhãn nút, nên nút chỉ có "OK/Cancel" thay vì "Xoá nhóm/Huỷ".
 *
 * Cách dùng giữ nguyên hình dạng của `confirm()` để chỗ gọi đọc vẫn tự nhiên, chỉ
 * thêm `await`:
 *
 * ```tsx
 * const confirm = useConfirm();
 * if (!(await confirm({ title: 'Xoá nhóm?', tone: 'danger' }))) return;
 * ```
 */

export interface ConfirmOptions {
  /** Câu hỏi chính, ngắn gọn. Hiện ở dòng tiêu đề. */
  title: string;
  /** Giải thích hậu quả — nhất là thứ không khôi phục được. */
  message?: string;
  /** Nhãn nút đồng ý. Mặc định "Xác nhận"; nên đặt đúng hành động, vd "Xoá nhóm". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` cho thao tác mất dữ liệu — nút đồng ý chuyển sang đỏ kèm biểu tượng. */
  tone?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }): JSX.Element {
  const t = useT();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  /**
   * Giữ hàm `resolve` của Promise đang chờ trong ref, không phải state.
   *
   * Đặt vào state sẽ khiến mỗi lần render lại tạo một Promise mới và lời hứa cũ không
   * bao giờ được giải quyết — chỗ gọi `await` mãi mãi.
   */
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    // Đang có hộp thoại khác mở dở thì coi như người dùng đã huỷ nó, tránh bỏ rơi
    // một Promise không ai giải quyết.
    resolverRef.current?.(false);

    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const isDanger = options?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Modal
        open={options !== null}
        onClose={() => close(false)}
        title={options?.title ?? ''}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => close(false)}>
              {options?.cancelLabel ?? t('Huỷ')}
            </Button>
            <Button variant={isDanger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
              {options?.confirmLabel ?? t('Xác nhận')}
            </Button>
          </div>
        }
      >
        <div className="flex gap-3">
          {isDanger && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />}
          <p className="text-sm text-content-soft">
            {options?.message ?? t('Bạn có chắc muốn tiếp tục?')}
          </p>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm phải được dùng bên trong ConfirmProvider');
  return context;
}
