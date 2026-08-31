/**
 * Tên hệ thống: ENG//HABIT.
 *
 * Dùng đúng file thiết kế đã tách nền chứ không dựng lại bằng chữ, để hiển thị y hệt
 * bản gốc trên mọi máy — không phụ thuộc font người dùng đang có.
 *
 * Chọn file theo NỀN ĐANG ĐỨNG, không theo chế độ sáng/tối:
 *   - `/wordmark-dark.png`  bản sáng màu, dùng trên nền tối (nền hệ thống mận)
 *   - `/wordmark.png`       bản navy gốc, dùng trên nền sáng (panel đăng nhập)
 *
 * Từ khi nền hệ thống đổi sang mận #5A495C thì nó tối ở CẢ HAI chế độ, nên khung app
 * luôn dùng bản sáng — navy trên mận chỉ đạt 1.80:1.
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
  on = 'dark',
  className = '',
}: {
  size?: WordmarkSize;
  /** Nền mà tên đang đứng lên: `dark` cho nền hệ thống, `light` cho nền sáng. */
  on?: 'dark' | 'light';
  className?: string;
}): JSX.Element {
  return (
    <img
      src={on === 'dark' ? '/wordmark-dark.png' : '/wordmark.png'}
      alt="ENG//HABIT"
      className={`${HEIGHTS[size]} w-auto shrink-0 object-contain ${className}`}
      // Tên hệ thống nằm ở màn hình đầu tiên nên tải sớm, không lazy
      loading="eager"
      decoding="async"
    />
  );
}
