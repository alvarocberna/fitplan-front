import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const FAKE_BACKEND_PORT = process.env.FAKE_BACKEND_PORT ?? '3101';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // En serie a propósito: el backend falso (e2e/fake-backend/server.mjs) guarda los mocks de forma
  // global, no por test, así que dos tests en paralelo se pisarían la configuración.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      // Sustituto del backend NestJS (BACKEND_URL). Lo llaman los Server Actions desde Node, por lo
      // que no se puede mockear con `page.route`; ver el encabezado de e2e/fake-backend/server.mjs.
      command: 'node e2e/fake-backend/server.mjs',
      url: `http://localhost:${FAKE_BACKEND_PORT}/__health`,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      env: { FAKE_BACKEND_PORT, E2E_ACCESS_TOKEN: process.env.E2E_ACCESS_TOKEN ?? 'e2e-access-token' },
    },
    {
      // `next dev` (Turbopack) en vez de build+start: un build de producción intenta pre-renderizar
      // /articulos en build-time contra NEXT_PUBLIC_BACKEND_CMS_URL, que acá es un host dummy
      // (ver .env.test) — el mock de red de Playwright solo intercepta fetches del NAVEGADOR, no
      // los que Next hace en el servidor durante el build, así que un build real falla. `next dev`
      // no pre-renderiza en build-time y evita ese conflicto.
      command: 'npm run dev -- -p 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        // Backend de consulta/órdenes: privado (solo Server Actions), apunta al backend falso.
        BACKEND_URL: process.env.BACKEND_URL!,
        // Firma/verifica la cookie `session` (la misma con la que los tests la fabrican).
        SESSION_SECRET: process.env.SESSION_SECRET!,
        NEXT_PUBLIC_BACKEND_CMS_URL: process.env.NEXT_PUBLIC_BACKEND_CMS_URL!,
        NEXT_PUBLIC_PROYECTO_ID: process.env.NEXT_PUBLIC_PROYECTO_ID!,
      },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
