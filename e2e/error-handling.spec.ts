import { test, expect } from './fixtures';
import {
  mockCreateOrder,
  mockFailure,
  mockOrderStatusSequence,
  orderStatus,
  SESSION_EXPIRED,
} from './helpers/mock-backend';
import { EMPTY_ANAMNESIS, VALID_MEASUREMENTS, VALID_PERSONAL_INFO, seedConsultationContext } from './helpers/seed-context';

const ORDER_ID = 'aaaaaaaa-0000-4000-8000-000000000123';
const toast = (page: import('@playwright/test').Page, text: string) => page.getByRole('alert').filter({ hasText: text });

// El proxy deja pasar mientras la cookie sea válida, pero el backend puede responder 401 (refresh
// revocado o vencido): cualquier pantalla debe llevar a iniciar sesión, nunca a "Algo salió mal".
test.describe('Sesión vencida (401 del backend con cookie válida)', () => {
  const SESSION_EXPIRED_URL = /\/login\?error=session_expired$/;

  for (const [route, name] of [
    ['/inicio', 'dashboardSummary'],
    ['/planes', 'plans'],
    ['/mediciones', 'measurements'],
    ['/perfil', 'profile'],
  ] as const) {
    test(`${route}: lleva a iniciar sesión con el aviso`, async ({ page }) => {
      await mockFailure(name, SESSION_EXPIRED);
      await page.goto(route);

      await expect(page).toHaveURL(SESSION_EXPIRED_URL);
      await expect(page.getByRole('alert').filter({ hasText: 'Tu sesión expiró' })).toBeVisible();
    });
  }

  test('al enviar un formulario: lleva a iniciar sesión sin mostrar un toast', async ({ page }) => {
    await page.goto('/consulta/informacion-personal');
    await page.getByLabel('Primer nombre').fill('Ana');
    await page.getByLabel('Apellido paterno').fill('Pérez');
    await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
    await mockFailure('profile', SESSION_EXPIRED);

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page).toHaveURL(SESSION_EXPIRED_URL);
  });

  test('durante el polling de la orden: detiene la espera y lleva a iniciar sesión', async ({ page }) => {
    await mockFailure('orderStatus', SESSION_EXPIRED);
    await page.goto(`/ordenes/${ORDER_ID}`);

    await expect(page).toHaveURL(/\/login/);
  });

  test('al pagar: lleva a iniciar sesión', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockFailure('payment', SESSION_EXPIRED);
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Simular pago' }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});

// Errores de negocio: la pantalla muestra el `message` del backend y deja al usuario donde pueda seguir.
test.describe('Errores de negocio del backend', () => {
  test('ORDER_EXPIRED al pagar: la orden venció con la página abierta y se muestra "Esta orden expiró"', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockFailure('payment', { status: 409, code: 'ORDER_EXPIRED', message: 'La orden expiró' });
    await page.goto(`/pago/${ORDER_ID}`);
    await expect(page.getByRole('button', { name: 'Simular pago' })).toBeVisible();
    // al fallar el pago, la página vuelve a leer el estado: ya está vencida
    await mockOrderStatusSequence([orderStatus({ paymentStatus: 'EXPIRED' })]);

    await page.getByRole('button', { name: 'Simular pago' }).click();

    await expect(page.getByText('Esta orden expiró')).toBeVisible();
  });

  test('ORDER_ALREADY_PAID al pagar: sigue a la orden en vez de mostrar un error', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockFailure('payment', { status: 409, code: 'ORDER_ALREADY_PAID', message: 'La orden ya está pagada' });
    await page.goto(`/pago/${ORDER_ID}`);
    await expect(page.getByRole('button', { name: 'Simular pago' })).toBeVisible();
    await mockOrderStatusSequence([orderStatus({ paymentStatus: 'PAID', generationStatus: 'GENERATING' })]);

    await page.getByRole('button', { name: 'Simular pago' }).click();

    await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));
  });

  test('una orden que dejó de existir al pagar muestra "Orden no encontrada"', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockFailure('payment', { status: 404, code: 'NOT_FOUND', message: 'Orden no encontrada' });
    await page.goto(`/pago/${ORDER_ID}`);
    await expect(page.getByRole('button', { name: 'Simular pago' })).toBeVisible();
    await mockFailure('orderStatus', { status: 404, code: 'NOT_FOUND', message: 'Orden no encontrada' });

    await page.getByRole('button', { name: 'Simular pago' }).click();

    await expect(page.getByRole('heading', { name: 'Orden no encontrada' })).toBeVisible();
  });

  test('PROFILE_INCOMPLETE al crear la orden: muestra el mensaje y se queda en la página', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: EMPTY_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockFailure('createOrder', { status: 400, code: 'PROFILE_INCOMPLETE', message: 'Completa tu perfil para continuar' });
    await page.goto('/consulta/generar-orden');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(toast(page, 'Completa tu perfil para continuar')).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/generar-orden$/);
  });

  test('GOAL_NOT_FEASIBLE al crear la orden: muestra el mensaje del backend', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: EMPTY_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockFailure('createOrder', { status: 400, code: 'GOAL_NOT_FEASIBLE', message: 'Tu objetivo no es factible' });
    await page.goto('/consulta/generar-orden');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(toast(page, 'Tu objetivo no es factible')).toBeVisible();
  });

  for (const failure of [
    { status: 503, code: 'LLM_UNAVAILABLE', message: 'El asistente no está disponible por ahora' },
    { status: 429, code: 'RATE_LIMITED', message: 'Demasiadas solicitudes, espera un momento' },
  ] as const) {
    test(`${failure.code} en el chat: avisa y permite volver a intentar`, async ({ page }) => {
      await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO });
      await mockFailure('chat', failure);
      await page.goto('/consulta/anamnesis');

      const textarea = page.getByPlaceholder(/Escribe tu respuesta/);
      await textarea.fill('Hola');
      await textarea.press('Enter');

      await expect(toast(page, failure.message)).toBeVisible();
      await expect(textarea).toBeEnabled();
    });
  }

  test('VALIDATION_ERROR al guardar el perfil: muestra el mensaje y no avanza', async ({ page }) => {
    await page.goto('/consulta/informacion-personal');
    await page.getByLabel('Primer nombre').fill('Ana');
    await page.getByLabel('Apellido paterno').fill('Pérez');
    await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
    await mockFailure('profile', { status: 400, code: 'VALIDATION_ERROR', message: 'Los datos enviados no son válidos' });

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(toast(page, 'Los datos enviados no son válidos')).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/informacion-personal$/);
  });

  test('el resto de un flujo no se rompe tras un error puntual: reintentar crea la orden', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: EMPTY_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockFailure('createOrder', { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'No pudimos guardar tu consulta' });
    await page.goto('/consulta/generar-orden');
    await page.getByRole('button', { name: 'Realizar pago' }).click();
    await expect(toast(page, 'No pudimos guardar tu consulta')).toBeVisible();

    await mockCreateOrder({ orderId: ORDER_ID });
    await mockOrderStatusSequence([orderStatus()]);
    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));
  });
});

// Un fallo del backend al cargar una pantalla del área de sesión llega a su error boundary. El navegador
// registra el error de la carga, que acá es lo esperado.
test.describe('Fallo del backend al cargar una pantalla', () => {
  test.use({ expectedBrowserErrors: /react\.dev\/errors\/441/ });
  // en `next dev` el error boundary muestra el mensaje a propósito: esto solo vale para producción
  test.skip(process.env.E2E_DEV === 'true', 'el mensaje solo se oculta en un build de producción');

  for (const [route, name] of [
    ['/inicio', 'dashboardSummary'],
    ['/planes', 'plans'],
    ['/mediciones', 'measurements'],
    ['/perfil', 'profile'],
  ] as const) {
    test(`${route}: muestra la pantalla de error con opción de reintentar, sin exponer detalles`, async ({ page }) => {
      await mockFailure(name, { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'detalle interno del backend' });
      await page.goto(route);

      await expect(page.getByRole('button', { name: /Reintentar|Intentar/i })).toBeVisible();
      await expect(page.getByText('detalle interno del backend')).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
    });
  }
});
