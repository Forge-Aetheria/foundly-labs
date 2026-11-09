import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Foundly Book — Vite SPA build (feature 024).
 * Replaces `next dev`/`next build`; the app is served as static assets with SPA
 * fallback. React/Emotion/MUI are deduped so the hoisted monorepo install does
 * not produce duplicate copies (Theme/context breakage).
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: { port: 3001 },
  preview: { port: 3001 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
    ],
  },
});
