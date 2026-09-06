import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useT } from '../i18n/language';

/**
 * Hộp thoại nổi giữa màn hình.
 *
 * Đặt ở `shared` vì đang dùng ở ba chỗ khác feature nhau: popup "đợi quản trị viên
 * xác nhận" của luồng quên mật khẩu, form nhập lý do từ chối, và chi tiết tài khoản
 * ở khu quản trị.
 *
 * Cố ý KHÔNG dùng thẻ `<dialog>` của trình duyệt: `showModal()` đưa phần tử lên
 * top-layer nằm ngoài cây DOM thường, nên nền mờ và bo góc theo token màu của app
 * phải viết lại bằng `::backdrop` — một bộ quy tắc riêng nằm ngoài Tailwind, dễ lệch
 * với phần còn lại của giao diện.
 */
/** Viết thành bảng tra thay vì ghép chuỗi điều kiện: Tailwind quét mã nguồn để sinh
 *  class, nên tên class phải xuất hiện NGUYÊN VẸN ở đâu đó trong file. */
const SIZES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
} as const;

export function Modal({
  open,
  onClose,
  title,
  titleContent,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  bodyHeight,
}: {
  open: boolean;
  onClose: () => void;
  /** Luôn bắt buộc: dùng làm `aria-label` kể cả khi phần đầu vẽ bằng `titleContent`. */
  title: string;
  /**
   * Thay phần tiêu đề mặc định bằng nội dung tự vẽ (vd avatar kèm tên và email).
   * Nút đóng vẫn do Modal giữ, để mọi hộp thoại đóng ở cùng một chỗ.
   */
  titleContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Bề ngang tối đa. `xl` dành cho hộp thoại có nội dung xếp được thành NHIỀU CỘT —
   * nới rộng một khối nội dung vẫn xếp dọc chỉ tạo ra hai dải trống hai bên, không
   * làm hộp thoại thấp đi.
   */
  size?: 'md' | 'lg' | 'xl';
  /**
   * Chiều cao CỐ ĐỊNH của phần ruột, tính bằng px.
   *
   * Dành cho hộp thoại có nhiều tab: để ruột tự co giãn theo nội dung thì mỗi lần đổi
   * tab cả hộp thoại lại nhảy kích thước, nút đóng và thanh tab trôi đi chỗ khác ngay
   * dưới con trỏ. Cố định rồi thì tab nào ngắn để trống, tab nào dài thì cuộn.
   *
   * Vẫn co lại được khi màn hình thấp (`flex: 0 1 auto`), nếu không thì trên laptop
   * nhỏ hộp thoại sẽ tràn quá `max-h-[85vh]` và nút đóng bị đẩy ra ngoài màn hình.
   */
  bodyHeight?: number;
  /**
   * Bấm ra nền mờ có đóng hộp thoại không.
   *
   * Đặt `false` cho hộp thoại có nhiều thao tác bên trong: người dùng đang thao tác
   * mà lỡ tay bấm trượt ra ngoài sẽ mất cả bảng đang xem. Hộp thoại chỉ để đọc một
   * câu rồi bấm "Đã hiểu" thì để mặc định — đóng nhanh tiện hơn.
   *
   * Phím Esc thì LUÔN đóng, kể cả khi cờ này tắt: Esc là thao tác cố ý, không phải
   * bấm trượt, và bỏ nó đi là nhốt người dùng bàn phím lại trong hộp thoại.
   */
  closeOnBackdrop?: boolean;
}): JSX.Element | null {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);

  // Đóng bằng phím Esc. Gắn ở `document` chứ không ở panel: người dùng có thể chưa
  // bấm vào đâu trong hộp thoại nên focus vẫn còn nằm ngoài nó.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Khoá cuộn nền, nếu không thì cuộn chuột sẽ trôi trang phía sau hộp thoại.
    const scrollCu = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Đưa focus vào hộp thoại để người dùng bàn phím không bị bỏ lại ở nền.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollCu;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/*
        Vừa tối vừa MỜ phần nền: chỉ tối màu thì chữ phía sau vẫn đọc được lờ mờ và mắt
        bị kéo về đó, nhất là khi hộp thoại nằm trên một trang dày chữ. Làm mờ khiến nền
        thành một mảng không đọc được, nên hộp thoại là thứ duy nhất còn rõ.

        Trình duyệt cũ không hỗ trợ `backdrop-filter` thì lớp tối vẫn còn nguyên — mất
        hiệu ứng chứ không vỡ giao diện.
      */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        {/*
          `max-h-[85vh]` cộng cột flex: phần đầu và chân đứng yên, chỉ RUỘT cuộn. Để cả
          hộp thoại cuộn thì nút đóng trôi khỏi màn hình khi nội dung dài — đúng lúc
          người dùng cần nó nhất.
        */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={`pointer-events-auto flex max-h-[85vh] w-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-xl outline-none ${SIZES[size]}`}
        >
          <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
            {titleContent ?? <h2 className="text-base font-semibold text-content">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded text-content-muted transition-colors hover:text-content"
              aria-label={t('Đóng')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto text-sm text-content-soft"
            style={bodyHeight === undefined ? undefined : { height: bodyHeight, flex: '0 1 auto' }}
          >
            {children}
          </div>

          {footer && <div className="mt-5 flex shrink-0 justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </>
  );
}
