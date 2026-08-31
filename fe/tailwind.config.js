/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Màu ngữ nghĩa theo VAI TRÒ. Component dùng các tên này thay vì slate-*,
        // nhờ vậy đổi sáng/tối chỉ cần đổi token trong index.css.
        // <alpha-value> cho phép dùng biến thể độ mờ như bg-brand/20, text-soft/70.
        page: 'rgb(var(--page) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong: 'rgb(var(--line-strong) / <alpha-value>)',
        },
        content: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          soft: 'rgb(var(--text-soft) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          strong: 'rgb(var(--brand-strong) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          vivid: 'rgb(var(--brand-vivid) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'on-fill': 'rgb(var(--on-fill) / <alpha-value>)',
        'on-brand': 'rgb(var(--on-brand) / <alpha-value>)',
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          soft: 'rgb(var(--success-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          soft: 'rgb(var(--danger-soft) / <alpha-value>)',
        },
        series: {
          vocab: 'var(--series-vocab)',
          flashcard: 'var(--series-flashcard)',
          quiz: 'var(--series-quiz)',
          habit: 'var(--series-habit)',
        },
      },
      boxShadow: {
        // Bóng nhẹ, nhiều lớp — tránh cảm giác "hộp nổi" thô của shadow mặc định.
        // Nền tối gần như không thấy bóng nên chế độ đó dựa vào viền để tách lớp.
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        'card-hover': '0 4px 8px rgb(16 24 40 / 0.06), 0 2px 4px rgb(16 24 40 / 0.04)',
      },
      keyframes: {
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        // Vào màn hình: dịch lên kèm mờ dần, dùng cho từng phần tử của form
        'enter-up': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        // Khối màu trôi chậm ở nền panel thương hiệu.
        // Chỉ animate transform để trình duyệt chạy trên GPU, không gây giật.
        'drift-a': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-25px, 25px) scale(0.95)' },
        },
        'drift-b': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-35px, 30px) scale(1.08)' },
          '66%': { transform: 'translate(30px, -20px) scale(0.94)' },
        },
        // Nhịp đập nhẹ cho biểu tượng ngọn lửa streak
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
        'enter-up': 'enter-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'drift-a': 'drift-a 18s ease-in-out infinite',
        'drift-b': 'drift-b 22s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
