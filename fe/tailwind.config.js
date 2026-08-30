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
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
