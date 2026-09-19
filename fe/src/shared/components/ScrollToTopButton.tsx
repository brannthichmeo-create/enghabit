import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useT } from '../i18n/language';

/**
 * Nút "Lên đầu trang", nổi ở góc dưới bên phải.
 *
 * Đặt MỘT LẦN trong `AppLayout` chứ không rải vào từng trang: mọi màn sau đăng nhập đều
 * cuộn bằng chính cửa sổ trình duyệt (header là `sticky`, nội dung chảy tự nhiên), nên
 * một nút ở khung app là phủ được mọi danh sách — kể cả màn thêm về sau, không ai phải
 * nhớ gắn thêm.
 *
 * Chỉ hiện khi đã cuộn quá MỘT MÀN HÌNH. Cuộn được xa như vậy nghĩa là trang đủ dài để
 * việc kéo ngược lên thật sự mất công; trang ngắn thì không bao giờ cuộn tới ngưỡng và
 * nút không bao giờ hiện, tự nhiên đúng với "chỉ khi có nhiều dữ liệu".
 */
export function ScrollToTopButton({ focusTargetId }: { focusTargetId: string }): JSX.Element {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Gom các sự kiện cuộn vào một khung hình: sự kiện `scroll` bắn hàng chục lần mỗi
    // giây, đặt state ở mỗi lần là vẽ lại cả nút theo từng pixel.
    let frame = 0;
    const update = (): void => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight);
    };
    const onScroll = (): void => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = (): void => {
    // Người bật "giảm chuyển động" trong hệ điều hành thì nhảy thẳng lên, không trượt.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

    /*
      Đưa focus về đầu vùng nội dung. Không làm vậy thì người dùng bàn phím thấy trang
      đã lên đầu nhưng focus vẫn nằm ở nút này tít dưới đáy — bấm Tab tiếp là trình
      duyệt cuộn tuột xuống lại chỗ cũ. `preventScroll` để việc chuyển focus không cắt
      ngang hiệu ứng trượt đang chạy.
    */
    document.getElementById(focusTargetId)?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t('Lên đầu trang')}
      title={t('Lên đầu trang')}
      /*
        Ẩn bằng `invisible` chứ không gỡ khỏi DOM: vẫn có hiệu ứng mờ dần, mà `visibility:
        hidden` cũng rút nút ra khỏi thứ tự Tab và khỏi cây trợ năng — nút đang ẩn không
        thể bị focus trúng.

        `z-30`: dưới lớp phủ của ngăn kéo menu (z-40) và hộp thoại (z-50) nên không bao
        giờ nổi lên trên chúng; ngang sidebar cố định nhưng hai thứ ở hai góc khác nhau.
        Nền `bg-surface` + `border-line` như một thẻ, nên chữ dùng bộ token `content*`.
      */
      className={`fixed bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-content-soft shadow-lg transition-[opacity,transform,visibility] duration-200 hover:border-brand hover:text-content focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 motion-reduce:transition-none sm:bottom-6 sm:right-6 ${
        visible ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
