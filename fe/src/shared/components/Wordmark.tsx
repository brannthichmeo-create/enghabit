/**
 * Tên hệ thống: ENG//HABIT.
 *
 * Dùng đúng file thiết kế đã tách nền (`/wordmark.png`) chứ không dựng lại bằng chữ,
 * để hiển thị y hệt bản gốc trên mọi máy — không phụ thuộc font người dùng đang có.
 *
 * Chế độ tối dùng file riêng (`/wordmark-dark.png`) cùng hình dáng nhưng đổi sang bậc
 * sáng: navy gốc đặt trên nền tối chỉ đạt 1.8:1, gần như không đọc được.
 *
 * Việc đổi file KHÔNG dùng `<picture media>` được, vì app có ba trạng thái giao diện
 * (sáng / tối / theo hệ thống) và lựa chọn tay ghi vào `data-theme` — media query
 * không thấy thuộc tính đó. Hai ảnh cùng render, CSS trong index.css ẩn/hiện.
 */

type WordmarkSize = 'sm' | 'md' | 'lg' | 'xl';

/** Chiều cao ảnh theo từng cỡ; chiều rộng tự co theo tỷ lệ gốc. */
const HEIGHTS: Record<WordmarkSize, string> = {
  sm: 'h-[18px]',
  md: 'h-5',
  lg: 'h-7',
  xl: 'h-10',
};

export function Wordmark({
  size = 'md',
  variant = 'auto',
  className = '',
}: {
  size?: WordmarkSize;
  /**
   * `auto` đổi ảnh theo chế độ sáng/tối của app.
   * `light` ép dùng bản navy — dành cho chỗ nền luôn sáng bất kể chế độ, như panel
   * đăng nhập màu xanh ngọc; ở đó bản sáng màu sẽ chìm mất.
   */
  variant?: 'auto' | 'light';
  className?: string;
}): JSX.Element {
  const height = HEIGHTS[size];

  if (variant === 'light') {
    return <img src="/wordmark.png" alt="ENG//HABIT" className={imageClass(height, className)} {...LOADING} />;
  }

  return (
    <>
      <img
        src="/wordmark.png"
        alt="ENG//HABIT"
        className={`wordmark-light ${imageClass(height, className)}`}
        {...LOADING}
      />
      <img
        src="/wordmark-dark.png"
        alt="ENG//HABIT"
        className={`wordmark-dark ${imageClass(height, className)}`}
        {...LOADING}
      />
    </>
  );
}

function imageClass(height: string, className: string): string {
  return `${height} w-auto shrink-0 object-contain ${className}`;
}

/** Tên hệ thống nằm ở màn hình đầu tiên nên tải sớm, không lazy. */
const LOADING = { loading: 'eager', decoding: 'async' } as const;
