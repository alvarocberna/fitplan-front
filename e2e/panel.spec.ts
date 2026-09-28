import { test, expect } from './fixtures';
import {
  getBackendCalls,
  mockConsultationDetail,
  mockConsultationsList,
  mockMeasurementDetail,
  mockMeasurementsList,
  mockPlanDetail,
  mockPlansList,
} from './helpers/mock-backend';

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

test.describe('Panel - mis planes', () => {
  const PLAN_ROW = {
    orderId: 'order-1',
    type: 'GENERATED',
    name: 'Plan personalizado',
    purchasedAt: '2026-02-01T12:00:00.000Z',
    pdfUrl: 'https://bucket.example/plan.pdf?sig=abc',
    thumbnailUrl: null,
    summary: {
      goal: 'definicion',
      dietRegimen: 'Hipocalórico',
      calorieIntake: 2000,
      proteinIntake: 150,
      carbohydrateIntake: 200,
      lipidIntake: 60,
    },
  };

  test('lista cada plan en una fila con su resumen y los botones "Ver plan" y "Descargar plan"', async ({ page }) => {
    await mockPlansList([PLAN_ROW]);
    await page.goto('/panel');

    const row = page.getByRole('listitem', { name: 'Plan personalizado' });
    await expect(row.getByText('Personalizado')).toBeVisible();
    await expect(row.getByText('Hipocalórico')).toBeVisible();
    await expect(row.getByRole('link', { name: 'Descargar plan Plan personalizado' })).toHaveAttribute('href', /plan\.pdf/);
    await expect(row.getByRole('link', { name: 'Ver plan Plan personalizado' })).toHaveAttribute(
      'href',
      '/panel/planes/order-1',
    );
  });

  test('"Ver plan" abre el detalle completo del plan', async ({ page }) => {
    await mockPlansList([PLAN_ROW]);
    await mockPlanDetail({
      orderId: 'order-1',
      type: 'GENERATED',
      name: 'Plan personalizado',
      purchasedAt: '2026-02-01T12:00:00.000Z',
      pdfUrl: 'https://bucket.example/plan.pdf?sig=abc',
      thumbnailUrl: null,
      predefined: null,
      generated: {
        consultationId: 'c-1',
        planName: 'Plan personalizado',
        period: null,
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: null,
        goal: 'definicion',
        dietRegimen: 'Hipocalórico',
        requirements: { calories: 2100, protein: 160, carbohydrate: 210, fat: 65 },
        intake: { calories: 2000, protein: 150, carbohydrate: 200, fat: 60 },
        mealTimes: [
          {
            time: 'BREAKFAST',
            hour: '8am',
            intake: { calories: 400, protein: 20, carbohydrate: 50, fat: 10 },
            portions: { cereal: 2 },
            examples: ['Pan con quesillo'],
            comments: [],
            equivalences: [],
          },
        ],
        supplements: [],
        sportsRecommendations: [],
      },
    });
    await page.goto('/panel');

    await page.getByRole('link', { name: 'Ver plan Plan personalizado' }).click();

    await expect(page).toHaveURL(/\/panel\/planes\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Plan personalizado' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Desayuno' }).getByText('Pan con quesillo')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Descargar plan nutricional' })).toHaveAttribute('href', /plan\.pdf/);

    const calls = await getBackendCalls();
    expect(calls.find((c) => c.path === '/me/plans/order-1')).toMatchObject({ method: 'GET', authorized: true });
  });

  test('un plan inexistente, ajeno o no listo muestra "Plan no encontrado"', async ({ page }) => {
    await page.goto('/panel/planes/no-existe');

    await expect(page.getByRole('heading', { name: 'Plan no encontrado' })).toBeVisible();
  });
});

test.describe('Panel - mis mediciones', () => {
  const DETAIL = {
    measurementId: 'm-1',
    measurementNumber: 1,
    measuredAt: '2026-05-10T12:00:00.000Z',
    level: 'BASIC',
    origin: 'SELF_REPORTED',
    consultationId: null,
    consultationNumber: null,
    editable: true,
    raw: { basic: { weight: 70, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
    results: [],
  };

  test('lista las mediciones y al hacer click abre su detalle', async ({ page }) => {
    await mockMeasurementsList([
      {
        measurementId: 'm-1',
        measurementNumber: 1,
        measuredAt: '2026-05-10T12:00:00.000Z',
        level: 'BASIC',
        origin: 'SELF_REPORTED',
        consultationId: null,
        consultationNumber: null,
        weight: 70,
        height: 172,
        bmi: null,
        bmiClassification: null,
        bfPercentage: null,
        mmPercentage: null,
      },
    ]);
    await mockMeasurementDetail(DETAIL);
    await page.goto('/panel');

    const row = page.getByRole('listitem', { name: 'Medición N°1' });
    await expect(row.getByText('Básica · Registro propio')).toBeVisible();
    await page.getByRole('link', { name: 'Ver medición N°1' }).click();

    await expect(page).toHaveURL(/\/panel\/mediciones\/m-1$/);
    await expect(page.getByRole('heading', { name: 'Medición N°1' })).toBeVisible();
    await expect(page.getByText('Los resultados interpretados estarán disponibles próximamente.')).toBeVisible();
  });

  test('registra una medición desde el formulario y abre su detalle', async ({ page }) => {
    await mockMeasurementDetail(DETAIL);
    await page.goto('/panel');

    await page.getByRole('link', { name: 'Registrar medición' }).click();
    await expect(page).toHaveURL(/\/panel\/mediciones\/nueva$/);
    await page.getByLabel('Peso (kg)').fill('70');
    await page.getByLabel('Talla (cm)').fill('172');
    await page.getByRole('button', { name: 'Registrar medición' }).click();

    await expect(page).toHaveURL(/\/panel\/mediciones\/m-1$/);
    const calls = await getBackendCalls();
    const post = calls.find((c) => c.path === '/me/measurements' && c.method === 'POST');
    expect(post).toMatchObject({ authorized: true, body: { level: 'BASIC', weight: 70, height: 172 } });
  });

  test('una medición inexistente o ajena muestra "Medición no encontrada"', async ({ page }) => {
    await page.goto('/panel/mediciones/no-existe');

    await expect(page.getByRole('heading', { name: 'Medición no encontrada' })).toBeVisible();
  });
});

test.describe('Panel - sin sesión', () => {
  test.use({ authenticated: false });

  test('el detalle de una consulta exige sesión', async ({ page }) => {
    await page.goto('/panel/consultas/c-1');

    await expect(page).toHaveURL(/\/login/);
  });
});
