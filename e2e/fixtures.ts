import { test as base, expect } from '@playwright/test';
import { getBackendViolations, resetFakeBackend } from './helpers/mock-backend';
import { createSessionCookieValue } from './helpers/session';

interface E2EOptions {
  authenticated: boolean;
  // Errores de consola que el test espera (p. ej. el que Next registra al llegar a un error boundary).
  expectedBrowserErrors: RegExp | null;
}

// `next dev` reenvía los logs del servidor a la consola del navegador: ahí un console.error no indica un
// problema de la página. Las excepciones del navegador se revisan igual.
const DEV_MODE = process.env.E2E_DEV === 'true';

// `test` de los e2e: los specs lo importan de acá en vez de '@playwright/test'.
// Antes de cada test:
//  1. deja limpio el backend falso (mocks y registros),
//  2. si `authenticated` (por defecto true), instala la cookie de sesión — casi toda la app
//     (/consulta/*, /pago/*, /ordenes/*, /inicio, /perfil) redirige a /login sin ella.
//     Para probar el comportamiento sin sesión: `test.use({ authenticated: false })`.
// Después de cada test, lo hace fallar aunque sus aserciones hayan pasado si:
//  3. llamó a algo que el backend real no aceptaría o que no configuró (ver fake-backend/server.mjs),
//  4. hubo una excepción sin atrapar o un error de consola en el navegador (incluye violaciones del CSP).
export const test = base.extend<E2EOptions>({
  authenticated: [true, { option: true }],
  expectedBrowserErrors: [null, { option: true }],

  page: async ({ page, context, baseURL, authenticated, expectedBrowserErrors }, use) => {
    await resetFakeBackend();
    if (authenticated) {
      await context.addCookies([{ name: 'session', value: await createSessionCookieValue(), url: baseURL! }]);
    }

    const browserErrors: string[] = [];
    page.on('pageerror', (error) => browserErrors.push(`excepción: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && !DEV_MODE) browserErrors.push(`consola: ${message.text()}`);
    });

    await use(page);

    // Da tiempo a que terminen las llamadas en curso: una aserción puede pasar antes de que la página
    // termine de cargar sus datos, y esa llamada también debe revisarse.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    const unexpected = browserErrors.filter((text) => !expectedBrowserErrors?.test(text));
    expect(await getBackendViolations(), 'llamadas al backend fuera del contrato o sin mock').toEqual([]);
    expect(unexpected, 'errores en el navegador').toEqual([]);
  },
});

export { expect };
