import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Gọi API qua đường dẫn tương đối trong dev để không phải xử lý CORS/cookie khác origin.
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
