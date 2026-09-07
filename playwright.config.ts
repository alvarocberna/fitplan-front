import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // `next dev` (Turbopack) en vez de build+start: un build de producción intenta pre-renderizar
    // /articles en build-time contra NEXT_PUBLIC_BACKEND_CMS_URL, que acá es un host dummy
    // (ver .env.test) — el mock de red de Playwright solo intercepta fetches del NAVEGADOR, no
    // los que Next hace en el servidor durante el build, así que un build real falla. `next dev`
    // no pre-renderiza en build-time y evita ese conflicto.
    command: 'npm run dev -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL!,
      NEXT_PUBLIC_BACKEND_CMS_URL: process.env.NEXT_PUBLIC_BACKEND_CMS_URL!,
      NEXT_PUBLIC_PROYECTO_ID: process.env.NEXT_PUBLIC_PROYECTO_ID!,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
