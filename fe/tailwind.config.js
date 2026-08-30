/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          strong: 'var(--brand-strong)',
          soft: 'var(--brand-soft)',
        },
        series: {
          vocab: 'var(--series-vocab)',
          flashcard: 'var(--series-flashcard)',
          quiz: 'var(--series-quiz)',
          habit: 'var(--series-habit)',
        },
      },
      boxShadow: {
        // Bóng nhẹ, nhiều lớp — tránh cảm giác "hộp nổi" thô của shadow mặc định
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
