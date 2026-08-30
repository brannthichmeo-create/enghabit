/**
 * Logo Enghabit — linh vật cầm loa.
 *
 * Định nghĩa một chỗ để mọi nơi dùng cùng một kích thước, khoảng cách và chữ,
 * tránh mỗi trang tự dựng lại rồi lệch nhau.
 */

type LogoSize = 'sm' | 'md' | 'lg';

const MARK_SIZES: Record<LogoSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
};

/**
 * Cỡ nhỏ dùng mốc thu gọn (mark.svg), cỡ lớn mới dùng linh vật đầy đủ.
 *
 * Linh vật có chân tay mảnh nên dưới ~40px chỉ còn là một vệt màu không đọc được.
 * Mốc thu gọn giữ lại đúng ba yếu tố nhận diện: nền xanh ngọc, loa vàng, nét navy.
 */
const MARK_SRC: Record<LogoSize, string> = {
  sm: '/mark.svg',
  md: '/logo.png',
  lg: '/logo.png',
};

const TEXT_SIZES: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function Logo({
  size = 'md',
  withText = true,
  onDark = false,
}: {
  size?: LogoSize;
  withText?: boolean;
  /** Đặt trên nền tối thì chữ đổi sang màu trắng. */
  onDark?: boolean;
}): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={MARK_SRC[size]}
        alt=""
        aria-hidden
        className={`${MARK_SIZES[size]} shrink-0 object-contain`}
        // Logo hiện ở màn hình đầu tiên nên tải sớm, không lazy
        loading="eager"
        decoding="async"
      />
      {withText && (
        <span
          className={`font-bold tracking-tight ${TEXT_SIZES[size]} ${onDark ? 'text-white' : 'text-slate-900'}`}
        >
          Enghabit
        </span>
      )}
    </span>
  );
}
