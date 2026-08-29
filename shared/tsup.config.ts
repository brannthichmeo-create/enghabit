import { defineConfig } from 'tsup';

// shared/ build ra dist/ để cả fe, be, mobile cùng import từ bản build.
// Lý do (xem CLAUDE.md): Metro của React Native không resolve TS source qua symlink workspace.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
