// @ts-check
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['@github/catalyst', 'textfit', 'motion'],
    },
  },
  esbuild: {
    keepNames: true,
  },
});
