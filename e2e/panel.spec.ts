import { test, expect } from './fixtures';
import { getBackendCalls, mockConsultationDetail, mockConsultationsList } from './helpers/mock-backend';

const PENDING = {
  consultationId: 'c-2',
  consultationNumber: 2,
  consultationDate: '2026-05-10T12:00:00.000Z',
  mainGoal: 'Ganar masa muscular',
  planStatus: 'awaiting_payment',
  orderId: 'order-2',
  plan: null,
};

const PLAN = {
  planName: 'Plan personalizado',
  goal: 'definicion',
  dietRegimen: 'Hipocalórico',
  calorieIntake: 2000,
  proteinIntake: 150,
  carbohydrateIntake: 200,
  lipidIntake: 60,
};

const READY = {
  consultationId: 'c-1',
  consultationNumber: 1,
  consultationDate: '2026-03-15T12:00:00.000Z',
  mainGoal: 'Bajar de peso',
  planStatus: 'ready',
  orderId: 'order-1',
  plan: PLAN,
};

// /panel: tarjetas Resumen (GET me/summary), Mis consultas (GET me/consultations) y Mis planes
// (GET me/plans), todas pedidas con la sesión desde Server Actions; cada consulta abre su detalle
// en /panel/consultas/[id] (GET me/consultations/:id).
test.describe('Panel', () => {
  test('muestra las tres tarjetas y el estado vacío de consultas', async ({ page }) => {
    await page.goto('/panel');

    await expect(page.getByText('Mi información')).toBeVisible();
    await expect(page.getByText('Mis consultas')).toBeVisible();
    await expect(page.getByText('Mis planes nutricionales')).toBeVisible();
    await expect(page.getByText('Todavía no tienes consultas nutricionales.')).toBeVisible();

    const calls = await getBackendCalls();
    expect(calls.find((c) => c.path === '/me/consultations')).toMatchObject({ method: 'GET', authorized: true });
  });

  test('marca solo la consulta por pagar y permite retomar su pago', async ({ page }) => {
    await mockConsultationsList([PENDING, READY]);
    await page.goto('/panel');

    const pending = page.getByRole('listitem', { name: 'Consulta N°2' });
    const ready = page.getByRole('listitem', { name: 'Consulta N°1' });
    await expect(pending.getByText('Por pagar')).toBeVisible();
    await expect(ready.getByText('Hipocalórico')).toBeVisible();
    await expect(ready.getByText('Por pagar')).toHaveCount(0);
    await expect(ready.getByText('Plan personalizado')).toHaveCount(0);

    await pending.getByRole('link', { name: 'Pagar consulta' }).click();
    await expect(page).toHaveURL(/\/pago\/order-2$/);
  });

  test('al hacer click en una consulta abre su detalle', async ({ page }) => {
    await mockConsultationsList([READY]);
    await mockConsultationDetail({
      consultationId: 'c-1',
      consultationNumber: 1,
      consultationDate: '2026-03-15T12:00:00.000Z',
      goals: { mainGoal: 'Bajar de peso', secondaryGoals: ['Dormir mejor'] },
      planStatus: 'ready',
      orderId: 'order-1',
      measurements: [
        {
          measurementId: 'm-1',
          measurementNumber: 1,
          measuredAt: '2026-03-15T12:00:00.000Z',
          level: 'BASIC',
          basic: { weight: 70.5, height: 172, sittingHeight: null, armSpan: null },
          results: null,
        },
      ],
      plan: { ...PLAN, orderId: 'order-1', pdfUrl: 'https://bucket.example/plan.pdf?sig=abc' },
    });
    await page.goto('/panel');

    await page.getByRole('link', { name: 'Ver consulta N°1' }).click();

    await expect(page).toHaveURL(/\/panel\/consultas\/c-1$/);
    await expect(page.getByRole('heading', { name: 'Consulta N°1' })).toBeVisible();
    await expect(page.getByText('Dormir mejor')).toBeVisible();
    await expect(page.getByText('70.5 kg')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Descargar plan' })).toHaveAttribute('href', /plan\.pdf/);

    const calls = await getBackendCalls();
    expect(calls.find((c) => c.path === '/me/consultations/c-1')).toMatchObject({ method: 'GET', authorized: true });
  });

  test('una consulta inexistente o ajena muestra "Consulta no encontrada"', async ({ page }) => {
    await page.goto('/panel/consultas/no-existe');

    await expect(page.getByRole('heading', { name: 'Consulta no encontrada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver al panel' })).toHaveAttribute('href', '/panel');
  });
});

test.describe('Panel - sin sesión', () => {
  test.use({ authenticated: false });

  test('el detalle de una consulta exige sesión', async ({ page }) => {
    await page.goto('/panel/consultas/c-1');

    await expect(page).toHaveURL(/\/login/);
  });
});
