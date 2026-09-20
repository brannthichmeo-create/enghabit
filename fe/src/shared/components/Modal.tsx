import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useT } from '../i18n/language';
import { useBodyScrollLock, useDialogFocus } from '../lib/focus-trap';

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
/**
 * Sổ theo dõi các hộp thoại ĐANG MỞ, dùng để xếp tầng khi hộp thoại này chồng lên
 * hộp thoại khác.
 *
 * Phải là sổ chung ở cấp module chứ không phải React context: hộp thoại xác nhận do
 * `ConfirmProvider` dựng ở gốc cây, không nằm bên trong hộp thoại mà nó chồng lên —
 * nên context của cây React không nhìn thấy quan hệ trên/dưới giữa hai cái.
 */
const openModals = new Set<number>();
let lastModalId = 0;

/**
 * Tầng của hộp thoại: 1 là cái đầu tiên, 2 là cái mở chồng lên nó...
 *
 * Cần con số này vì z-index cố định làm hộp thoại mới nằm DƯỚI hộp thoại cũ: lớp nền
 * mờ của nó bị khuất, người dùng thấy hai hộp thoại rõ như nhau và không biết cái nào
 * đang chờ mình trả lời.
 */
function useModalLayer(open: boolean): number {
  const [layer, setLayer] = useState(1);

  useEffect(() => {
    if (!open) return;

    lastModalId += 1;
    const id = lastModalId;
    openModals.add(id);
    setLayer(openModals.size);

    return () => {
      openModals.delete(id);
      // Đóng hết thì đánh số lại từ đầu, tránh z-index lớn dần vô hạn sau nhiều lần mở.
      if (openModals.size === 0) lastModalId = 0;
    };
  }, [open]);

  return layer;
}

/**
 * Mốc z-index của hộp thoại. Chọn 50 vì đó là giá trị cao nhất trong phần còn lại của
 * giao diện (ngăn kéo điều hướng), nên hộp thoại đầu tiên đã nằm trên mọi thứ.
 */
const MODAL_Z_BASE = 50;

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
  const layer = useModalLayer(open);

  /*
    Giữ `onClose` trong ref để hiệu ứng bên dưới KHÔNG phụ thuộc vào nó.

    Chỗ gọi thường truyền hàm inline (`onClose={() => ...}`), tức là một hàm MỚI sau mỗi
    lần render của trang cha. Nếu hiệu ứng phụ thuộc vào `onClose` thì nó chạy lại theo,
    kéo theo dòng `focus()` bên dưới — con trỏ bị giật khỏi ô nhập ngay giữa lúc người
    dùng đang gõ. Đây là lỗi thật đã xảy ra: gõ được đúng một ký tự rồi phải bấm lại vào
    ô mới gõ tiếp được.
  */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Đóng bằng phím Esc. Gắn ở `document` chứ không ở panel: người dùng có thể chưa bấm
  // vào đâu trong hộp thoại nên focus vẫn còn nằm ngoài nó.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useBodyScrollLock(open);

  /*
    Focus của hộp thoại — đưa vào lúc mở, trả về nút đã mở lúc đóng, giữ Tab quẩn bên
    trong. Dùng chung với ngăn kéo điều hướng, xem `shared/lib/focus-trap.ts`.
  */
  const onPanelKeyDown = useDialogFocus(open, panelRef);

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        // z-index tính theo tầng chứ không cố định: nhờ vậy lớp nền của hộp thoại mới
        // phủ lên CẢ hộp thoại đang mở phía dưới, làm mờ nó đi như mọi thứ khác.
        style={{ zIndex: MODAL_Z_BASE + layer * 10 }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: MODAL_Z_BASE + layer * 10 + 5 }}
      >
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
          onKeyDown={onPanelKeyDown}
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
