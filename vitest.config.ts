import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  css: {
    // evita que Vite intente cargar postcss.config.mjs (Tailwind 4 / Next-specific) al
    // resolver el árbol de imports de @/shared, cuyo barrel arrastra un `import '../app/globals.css'`
    postcss: { plugins: [] },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    css: false,
    env: {
      NEXT_PUBLIC_BACKEND_URL: 'https://api.consultation.test',
      NEXT_PUBLIC_BACKEND_CMS_URL: 'https://cms.test',
      NEXT_PUBLIC_PROYECTO_ID: 'test-project-id',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/**/layout.tsx', 'src/**/*.d.ts'],
    },
  },
});
