/**
 * Logo Enghabit — linh vật cầm loa.
 *
 * Định nghĩa một chỗ để mọi nơi dùng cùng một kích thước, khoảng cách và chữ,
 * tránh mỗi trang tự dựng lại rồi lệch nhau.
 */

type LogoSize = 'sm' | 'md' | 'lg';

// Linh vật là hình nhân vật nhiều chi tiết nên cần lớn hơn icon chữ thông thường,
// dưới 32px thì chân tay mảnh biến mất và chỉ còn một vệt màu.
const MARK_SIZES: Record<LogoSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
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
        src="/logo.png"
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
