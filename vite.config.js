// @ts-check
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './index.html',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@github/catalyst', 'textfit'],
      input: ['./src/smn-presentation.ts', './src/smn-slide.ts'],
      output: {
        dir: './dist',
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
});
