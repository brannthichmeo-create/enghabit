/**
 * Tên hệ thống: ENG//HABIT.
 *
 * Dùng đúng file thiết kế đã tách nền chứ không dựng lại bằng chữ, để hiển thị y hệt
 * bản gốc trên mọi máy — không phụ thuộc font người dùng đang có.
 *
 * Màu chữ nằm TRONG file ảnh nên không đổi theo token được:
 *   - `/wordmark.png`       bản navy #16255F, dùng trên nền SÁNG
 *   - `/wordmark-dark.png`  bản nhạt #C5CDF2, dùng trên nền TỐI
 *
 * Từ khi nền hệ thống đổi sang xanh pastel #E7EFFA, nó SÁNG ở chế độ sáng và TỐI ở
 * chế độ tối — không còn cố định một chiều như thời nền mận. Vì vậy khung app phải
 * dùng `on="auto"`: component vẽ cả hai ảnh rồi để CSS ẩn bớt một (xem index.css).
 * Cách này bám đúng bộ selector của token màu nên không bao giờ lệch với nền thật.
 *
 * Panel đăng nhập vẫn `on="light"` cố định vì nền ở đó luôn sáng ở cả hai chế độ.
 */

type WordmarkSize = 'sm' | 'md' | 'lg' | 'xl';

/** Chiều cao ảnh theo từng cỡ; chiều rộng tự co theo tỷ lệ gốc. */
const HEIGHTS: Record<WordmarkSize, string> = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-7',
  xl: 'h-10',
};

export function Wordmark({
  size = 'md',
  on = 'auto',
  className = '',
}: {
  size?: WordmarkSize;
  /**
   * Nền mà tên đang đứng lên:
   *   - `auto`  theo chế độ giao diện (dùng cho khung app, nơi nền đổi theo chế độ)
   *   - `light` nền luôn sáng (panel đăng nhập)
   *   - `dark`  nền luôn tối
   */
  on?: 'auto' | 'dark' | 'light';
  className?: string;
}): JSX.Element {
  const base = `${HEIGHTS[size]} w-auto shrink-0 object-contain ${className}`;

  if (on !== 'auto') {
    return <Image src={on === 'dark' ? '/wordmark-dark.png' : '/wordmark.png'} className={base} />;
  }

  return (
    <>
      <Image src="/wordmark.png" className={`wordmark-on-light ${base}`} />
      <Image src="/wordmark-dark.png" className={`wordmark-on-dark ${base}`} />
    </>
  );
}

function Image({ src, className }: { src: string; className: string }): JSX.Element {
  return (
    <img
      src={src}
      alt="ENG//HABIT"
      className={className}
      // Tên hệ thống nằm ở màn hình đầu tiên nên tải sớm, không lazy
      loading="eager"
      decoding="async"
    />
  );
}
