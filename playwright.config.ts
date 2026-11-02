import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

// override: la configuración de los e2e no debe depender de lo que haya definido en la terminal.
dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

const FAKE_BACKEND_PORT = process.env.FAKE_BACKEND_PORT ?? '3101';
// E2E_DEV=true corre contra `next dev`: arranca antes y sirve para escribir tests, pero no es lo que corre
// en producción (Strict Mode duplica efectos, overlay de errores, compilación bajo demanda).
const devMode = process.env.E2E_DEV === 'true';

const nextEnv = {
  // Build aparte (.next-e2e): sus NEXT_PUBLIC_* de prueba quedan incrustados y no deben mezclarse con .next.
  NEXT_DIST_DIR: '.next-e2e',
  NODE_ENV: devMode ? 'development' : 'production',
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // En serie a propósito: el backend falso (e2e/fake-backend/server.mjs) guarda los mocks de forma
  // global, no por test, así que dos tests en paralelo se pisarían la configuración.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // reuseExistingServer: false en ambos, para no correr contra un servidor viejo o con otra configuración:
  // si un puerto está ocupado, la corrida falla al arrancar con un error claro.
  webServer: [
    {
      // Sustituto del backend NestJS (BACKEND_URL). Lo llaman los Server Actions desde Node, por lo
      // que no se puede mockear con `page.route`; ver el encabezado de e2e/fake-backend/server.mjs.
      command: 'node e2e/fake-backend/server.mjs',
      url: `http://localhost:${FAKE_BACKEND_PORT}/__health`,
      reuseExistingServer: false,
      timeout: 15_000,
      env: { FAKE_BACKEND_PORT, E2E_ACCESS_TOKEN: process.env.E2E_ACCESS_TOKEN ?? 'e2e-access-token' },
    },
    {
      command: devMode ? 'npm run dev -- -p 3100' : 'npm run build && npm run start -- -p 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: devMode ? 60_000 : 300_000,
      // .env.test ya está en process.env y Next no lo pisa con .env: la corrida no depende del .env local.
      env: nextEnv,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
