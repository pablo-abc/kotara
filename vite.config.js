// @ts-check
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: [
        './src/index.ts',
        './src/kot-marked.ts',
        './src/kot-code.ts',
        './src/kot-slide.ts',
        './src/kot-presentation.ts',
      ],
      formats: ['es'],
      fileName: (_, entry) => `${entry}.js`,
    },
    rollupOptions: {
      external: [
        '@github/catalyst',
        'textfit',
        'motion',
        'highlight.js',
        'marked',
      ],
      output: {
        hoistTransitiveImports: false,
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
});
