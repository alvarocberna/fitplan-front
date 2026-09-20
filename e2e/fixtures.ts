import { test as base, expect } from '@playwright/test';
import { resetFakeBackend } from './helpers/mock-backend';
import { createSessionCookieValue } from './helpers/session';

// `test` de los e2e: los specs lo importan de acá en vez de '@playwright/test'. Antes de cada test:
//  1. deja limpio el backend falso (mocks y registro de llamadas),
//  2. si `authenticated` (por defecto true), instala la cookie de sesión — casi toda la app
//     (/consulta/*, /pago/*, /ordenes/*, /panel, /perfil) redirige a /login sin ella.
// Para probar el comportamiento sin sesión: `test.use({ authenticated: false })`.
export const test = base.extend<{ authenticated: boolean }>({
  authenticated: [true, { option: true }],

  page: async ({ page, context, baseURL, authenticated }, use) => {
    await resetFakeBackend();
    if (authenticated) {
      await context.addCookies([{ name: 'session', value: await createSessionCookieValue(), url: baseURL! }]);
    }
    await use(page);
  },
});

export { expect };
