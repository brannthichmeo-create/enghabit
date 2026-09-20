import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

/**
 * Vòng focus dùng chung cho các lớp phủ dạng hộp thoại: hộp thoại giữa màn hình
 * (`Modal`) và ngăn kéo điều hướng trên màn hình hẹp (`AppLayout`).
 *
 * Tách khỏi `Modal` vì ngăn kéo cần ĐÚNG ba hành vi này — đưa focus vào lúc mở, trả
 * focus về nút đã mở lúc đóng, giữ Tab quẩn bên trong — và chép lại lần thứ hai nghĩa
 * là hai bản sẽ lệch nhau ngay ở lần sửa đầu tiên. Thiếu chúng thì lớp phủ chỉ đúng
 * với người dùng chuột: người dùng bàn phím vẫn Tab thẳng ra trang nền đang bị che.
 */

/**
 * Các phần tử nhận được focus bằng phím Tab.
 *
 * Loại `tabindex="-1"` vì đó là phần tử chỉ focus được bằng mã — chính panel là một
 * trong số đó, và kéo nó vào vòng thì Tab sẽ dừng ở khung rỗng.
 */
export const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusablesWithin(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Khoá cuộn trang nền trong lúc lớp phủ mở, trả lại đúng giá trị cũ lúc đóng.
 *
 * Không khoá thì cuộn trên lớp phủ làm trang nền trôi phía sau, và đóng ra người dùng
 * đã ở một chỗ khác trong trang mà không hiểu vì sao.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const truocDo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = truocDo;
    };
  }, [active]);
}

/**
 * Quản lý focus cho một lớp phủ: trả về hàm xử lý phím Tab để gắn lên panel.
 *
 * Panel bắt buộc có `tabIndex={-1}` để nhận được focus lúc mở.
 */
export function useDialogFocus<T extends HTMLElement>(
  open: boolean,
  panelRef: RefObject<T>,
): (event: ReactKeyboardEvent<T>) => void {
  /*
    Ghi nhớ phần tử đã mở lớp phủ NGAY TRONG LÚC RENDER, không phải trong hiệu ứng: ô
    nhập có `autoFocus` giành được focus trước khi hiệu ứng chạy, nên tới lúc đó
    `activeElement` đã là phần tử BÊN TRONG lớp phủ. Đóng xong nó không còn trên trang
    nữa và focus chẳng trả về đâu cả. Lúc render thì DOM của lần mở này chưa gắn, nên
    đây vẫn là nút mà người dùng vừa bấm.
  */
  const openerRef = useRef<Element | null>(null);
  if (open && openerRef.current === null) openerRef.current = document.activeElement;
  if (!open) openerRef.current = null;

  /*
    Đưa focus vào panel đúng MỘT LẦN lúc mở, để người dùng bàn phím không bị bỏ lại ở
    nền. Đóng thì TRẢ focus về đúng phần tử đã mở. Không trả thì focus rơi về `<body>`
    và họ phải Tab lại từ đầu trang để về chỗ cũ.
  */
  useEffect(() => {
    if (!open) return;

    const opener = openerRef.current;
    panelRef.current?.focus();

    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [open, panelRef]);

  /*
    Giữ Tab quẩn trong lớp phủ.

    Không có vòng này thì Tab từ phần tử cuối đi thẳng ra trang nền: lớp phủ vẫn mở, nền
    vẫn nhận được focus, và người dùng bàn phím không có cách nào biết mình đã đi ra
    ngoài. Gắn ở PANEL chứ không ở `document` để các lớp phủ chồng nhau tự xử lý đúng —
    sự kiện chỉ chạy ở cái đang giữ focus.

    Cố ý KHÔNG đặt `inert`/`aria-hidden` cho nền: khối thông báo nổi (`ToastProvider`)
    nằm trong cây đó, và lỗi của chính thao tác trong lớp phủ hiện ở đấy — ẩn nền đi là
    trình đọc màn hình im lặng đúng lúc cần nói nhất.
  */
  return (event: ReactKeyboardEvent<T>): void => {
    if (event.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = focusablesWithin(panel);
    if (focusable.length === 0) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    const active = document.activeElement;

    // Chưa có gì bên trong được focus (vừa mở, focus đang ở chính panel) thì Tab đi vào
    // phần tử đầu — mặc định của trình duyệt cũng vậy, trừ khi đang Shift+Tab.
    if (event.shiftKey ? active === first || active === panel : active === last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };
}
