import { test, expect } from './fixtures';
import type { ConsultationPlanSummaryDto, ConsultationSummaryDto } from '../src/features/dashboard/dtos/consultation-summary.dto';
import type { MyPlanSummaryDto } from '../src/features/dashboard/dtos/my-plan.dto';
import type { MeasurementDetailDto } from '../src/features/measurements/dtos/measurement.dto';
import {
  getBackendCalls,
  mockConsultationDetail,
  mockConsultationsList,
  mockLatestPlanProjection,
  mockMeasurementDetail,
  mockMeasurementsList,
  mockOrderStatusSequence,
  mockPlanDetail,
  mockPlansList,
  orderStatus,
} from './helpers/mock-backend';

const PENDING: ConsultationSummaryDto = {
  consultationId: 'cccccccc-0000-4000-8000-000000000002',
  consultationNumber: 2,
  consultationDate: '2026-05-10T12:00:00.000Z',
  mainGoal: 'Ganar masa muscular',
  planStatus: 'awaiting_payment',
  orderId: 'aaaaaaaa-0000-4000-8000-000000000002',
  plan: null,
};

const PLAN: ConsultationPlanSummaryDto = {
  planName: 'Plan personalizado',
  goal: 'definicion',
  dietRegimen: 'Hipocalórico',
  calorieIntake: 2000,
  proteinIntake: 150,
  carbohydrateIntake: 200,
  lipidIntake: 60,
};

const READY: ConsultationSummaryDto = {
  consultationId: 'cccccccc-0000-4000-8000-000000000001',
  consultationNumber: 1,
  consultationDate: '2026-03-15T12:00:00.000Z',
  mainGoal: 'Bajar de peso',
  planStatus: 'ready',
  orderId: 'aaaaaaaa-0000-4000-8000-000000000001',
  plan: PLAN,
};

// /inicio: Información personal (GET me/summary), datos y macros del último plan (GET me/plans +
// me/plans/:orderId), evolución (GET me/measurements + me/plans/latest/projection) y Mis consultas
// (GET me/consultations), todas pedidas con la sesión desde Server Actions; cada consulta abre su
// detalle en /inicio/consultas/[id] (GET me/consultations/:id). La lista de planes vive en /planes.
test.describe('Inicio', () => {
  test('muestra información personal, datos del plan, macros, evolución y consultas', async ({ page }) => {
    await page.goto('/inicio');

    await expect(page.getByRole('region', { name: 'Información personal' })).toBeVisible();
    // sin planes: la card de datos del plan con "—" y la dona sin datos
    await expect(page.getByRole('region', { name: 'Datos del plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Información plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evolución', exact: true })).toBeVisible();
    await expect(page.getByText('Sin información de macronutrientes')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Resumen actual' })).toBeVisible();
    await expect(page.getByText('Mis consultas')).toBeVisible();
    // "Mis planes nutricionales" ya no está en /inicio: vive en /planes
    await expect(page.getByText('Mis planes nutricionales')).toHaveCount(0);
    await expect(page.getByText('Todavía no tienes consultas nutricionales.')).toBeVisible();

    // la lista de mediciones sigue solo en /mediciones; el gráfico de evolución sí está en /inicio
    await expect(page.getByText('Mis mediciones')).not.toBeVisible();

    const calls = await getBackendCalls();
    expect(calls.find((c) => c.path === '/me/consultations')).toMatchObject({ method: 'GET', authorized: true });
    expect(calls.find((c) => c.path === '/me/measurements')).toMatchObject({ method: 'GET', authorized: true });
  });

  test('marca solo la consulta por pagar y permite retomar su pago', async ({ page }) => {
    await mockConsultationsList([PENDING, READY]);
    await mockOrderStatusSequence([orderStatus()]);
    await page.goto('/inicio');

    const pending = page.getByRole('listitem', { name: 'Consulta N°2' });
    const ready = page.getByRole('listitem', { name: 'Consulta N°1' });
    await expect(pending.getByText('Por pagar')).toBeVisible();
    await expect(ready.getByText('Hipocalórico')).toBeVisible();
    await expect(ready.getByText('Por pagar')).toHaveCount(0);
    await expect(ready.getByText('Plan personalizado')).toHaveCount(0);

    await pending.getByRole('link', { name: 'Pagar consulta' }).click();
    await expect(page).toHaveURL(/\/pago\/aaaaaaaa-0000-4000-8000-000000000002$/);
  });

  test('al hacer click en una consulta abre su detalle', async ({ page }) => {
    await mockConsultationsList([READY]);
    await mockConsultationDetail({
      consultationId: 'cccccccc-0000-4000-8000-000000000001',
      consultationNumber: 1,
      consultationDate: '2026-03-15T12:00:00.000Z',
      goals: { mainGoal: 'Bajar de peso', secondaryGoals: ['Dormir mejor'] },
      planStatus: 'ready',
      orderId: 'aaaaaaaa-0000-4000-8000-000000000001',
      measurements: [
        {
          measurementId: 'dddddddd-0000-4000-8000-000000000001',
          measurementNumber: 1,
          measuredAt: '2026-03-15T12:00:00.000Z',
          level: 'BASIC',
          basic: { weight: 70.5, height: 172, sittingHeight: null, armSpan: null },
          results: null,
        },
      ],
      plan: { ...PLAN, orderId: 'aaaaaaaa-0000-4000-8000-000000000001', pdfUrl: 'https://bucket.example/plan.pdf?sig=abc' },
    });
    // el detalle arma sus cards con el plan (GET me/plans/:orderId) y cada medición (GET me/measurements/:id)
    await mockPlanDetail({
      orderId: 'aaaaaaaa-0000-4000-8000-000000000001',
      type: 'GENERATED',
      name: 'Plan personalizado',
      purchasedAt: '2026-03-15T12:00:00.000Z',
      pdfUrl: 'https://bucket.example/plan.pdf?sig=abc',
      thumbnailUrl: null,
      predefined: null,
      generated: {
        consultationId: 'cccccccc-0000-4000-8000-000000000001',
        planName: 'Plan personalizado',
        period: null,
        startDate: null,
        endDate: null,
        goal: 'definicion',
        dietRegimen: 'Hipocalórico',
        requirements: { calories: 2100, protein: 160, carbohydrate: 210, fat: 65 },
        intake: { calories: 2000, protein: 150, carbohydrate: 200, fat: 60 },
        mealTimes: [],
        supplements: [{
          supplement: 'Creatina',
          requirement: 5,
          doseInstructions: '5 gr/día',
          intakeInstructions: 'Con el desayuno',
          intake: { calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
          effects: [],
          considerations: [],
        }],
        sportsRecommendations: [],
      },
    });
    await mockMeasurementDetail({
      measurementId: 'dddddddd-0000-4000-8000-000000000001',
      measurementNumber: 1,
      measuredAt: '2026-03-15T12:00:00.000Z',
      level: 'BASIC',
      origin: 'CONSULTATION',
      consultationId: 'cccccccc-0000-4000-8000-000000000001',
      consultationNumber: 1,
      editable: false,
      raw: { basic: { weight: 70.5, height: 172 }, skinfolds: null, circumferences: null, diameters: null },
      results: [],
    });
    await page.goto('/inicio');

    await page.getByRole('link', { name: 'Ver consulta N°1' }).click();

    await expect(page).toHaveURL(/\/inicio\/consultas\/cccccccc-0000-4000-8000-000000000001$/);
    await expect(page.getByRole('heading', { name: 'Consulta N°1' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Datos del plan' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Descargar plan nutricional' })).toHaveAttribute('href', /plan\.pdf/);
    await expect(page.getByRole('region', { name: 'Distribución de macronutrientes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Creatina' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Medición N°1' })).toBeVisible();
    await expect(page.getByText('70.5 kg')).toBeVisible();

    const calls = await getBackendCalls();
    expect(calls.find((c) => c.path === '/me/consultations/cccccccc-0000-4000-8000-000000000001')).toMatchObject({ method: 'GET', authorized: true });
    expect(calls.find((c) => c.path === '/me/plans/aaaaaaaa-0000-4000-8000-000000000001')).toMatchObject({ method: 'GET', authorized: true });
    expect(calls.find((c) => c.path === '/me/measurements/dddddddd-0000-4000-8000-000000000001')).toMatchObject({ method: 'GET', authorized: true });
  });

  test('una consulta inexistente o ajena muestra "Consulta no encontrada"', async ({ page }) => {
    await page.goto('/inicio/consultas/no-existe');

    await expect(page.getByRole('heading', { name: 'Consulta no encontrada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/inicio');
    // uuidParam corta un id con forma inválida antes de llegar al backend
    expect((await getBackendCalls()).filter((c) => c.path.startsWith('/me/consultations/'))).toHaveLength(0);
  });

  test('una consulta con id válido que el backend no encuentra (404: inexistente o de otro usuario) muestra lo mismo', async ({ page }) => {
    const id = 'cccccccc-0000-4000-8000-00000000dead';
    await page.goto(`/inicio/consultas/${id}`);

    await expect(page.getByRole('heading', { name: 'Consulta no encontrada' })).toBeVisible();
    expect((await getBackendCalls()).find((c) => c.path === `/me/consultations/${id}`)).toMatchObject({ authorized: true });
  });
});

test.describe('Mis planes (/planes)', () => {
  const PLAN_ROW: MyPlanSummaryDto = {
    orderId: 'aaaaaaaa-0000-4000-8000-000000000001',
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
    await page.goto('/planes');

    const row = page.getByRole('listitem', { name: 'Plan personalizado' });
    await expect(row.getByText('Personalizado', { exact: true })).toBeVisible();
    await expect(row.getByText('Hipocalórico')).toBeVisible();
    await expect(row.getByRole('link', { name: 'Descargar plan Plan personalizado' })).toHaveAttribute('href', /plan\.pdf/);
    await expect(row.getByRole('link', { name: 'Ver plan Plan personalizado' })).toHaveAttribute(
      'href',
      '/planes/aaaaaaaa-0000-4000-8000-000000000001',
    );
  });

  test('"Ver plan" abre el detalle completo del plan', async ({ page }) => {
    await mockPlansList([PLAN_ROW]);
    await mockPlanDetail({
      orderId: 'aaaaaaaa-0000-4000-8000-000000000001',
      type: 'GENERATED',
      name: 'Plan personalizado',
      purchasedAt: '2026-02-01T12:00:00.000Z',
      pdfUrl: 'https://bucket.example/plan.pdf?sig=abc',
      thumbnailUrl: null,
      predefined: null,
      generated: {
        consultationId: 'cccccccc-0000-4000-8000-000000000001',
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
    await page.goto('/planes');

    await page.getByRole('link', { name: 'Ver plan Plan personalizado' }).click();

    await expect(page).toHaveURL(/\/planes\/aaaaaaaa-0000-4000-8000-000000000001$/);
    await expect(page.getByRole('heading', { name: 'Plan personalizado' })).toBeVisible();
    await expect(page.getByRole('listitem', { name: 'Resumen de Desayuno' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Descargar plan nutricional' })).toHaveAttribute('href', /plan\.pdf/);

    const calls = await getBackendCalls();
    expect(calls.find((c) => c.path === '/me/plans/aaaaaaaa-0000-4000-8000-000000000001')).toMatchObject({ method: 'GET', authorized: true });
  });

  test('un plan inexistente, ajeno o no listo muestra "Plan no encontrado"', async ({ page }) => {
    await page.goto('/planes/no-existe');

    await expect(page.getByRole('heading', { name: 'Plan no encontrado' })).toBeVisible();
    expect((await getBackendCalls()).filter((c) => c.path.startsWith('/me/plans/'))).toHaveLength(0);
  });

  test('un plan con id válido que el backend no encuentra (404) muestra lo mismo', async ({ page }) => {
    const id = 'aaaaaaaa-0000-4000-8000-00000000dead';
    await page.goto(`/planes/${id}`);

    await expect(page.getByRole('heading', { name: 'Plan no encontrado' })).toBeVisible();
    expect((await getBackendCalls()).find((c) => c.path === `/me/plans/${id}`)).toMatchObject({ authorized: true });
  });
});

test.describe('Mediciones', () => {
  const DETAIL: MeasurementDetailDto = {
    measurementId: 'dddddddd-0000-4000-8000-000000000001',
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
        measurementId: 'dddddddd-0000-4000-8000-000000000001',
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
        bfKg: null,
        bfPercentage: null,
        mmKg: null,
        mmPercentage: null,
      },
    ]);
    await mockMeasurementDetail(DETAIL);
    await page.goto('/mediciones');

    const row = page.getByRole('listitem', { name: 'Medición N°1' });
    await expect(row.getByText('Básica', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Ver medición N°1' }).click();

    await expect(page).toHaveURL(/\/mediciones\/dddddddd-0000-4000-8000-000000000001$/);
    await expect(page.getByRole('heading', { name: 'Medición N°1' })).toBeVisible();
    await expect(page.getByText('Los resultados interpretados estarán disponibles próximamente.')).toBeVisible();
  });

  test('el gráfico de evolución abre en el plan actual y en "Todas" permite quitar mediciones', async ({ page }) => {
    const summary = {
      measurementNumber: 1,
      level: 'BASIC' as const,
      origin: 'SELF_REPORTED' as const,
      consultationId: null,
      consultationNumber: null,
      height: 172,
      bmiClassification: null,
      bfKg: null,
      bfPercentage: null,
      mmKg: null,
      mmPercentage: null,
    };
    await mockMeasurementsList([
      { ...summary, measurementId: 'dddddddd-0000-4000-8000-000000000002', measurementNumber: 2, measuredAt: '2026-09-28T12:00:00.000Z', weight: 78, bmi: 26.37 },
      { ...summary, measurementId: 'dddddddd-0000-4000-8000-000000000001', measuredAt: '2026-09-01T12:00:00.000Z', weight: 80, bmi: 27.04 },
    ]);
    await mockLatestPlanProjection({
      orderId: 'aaaaaaaa-0000-4000-8000-000000000001',
      planName: 'Plan de prueba',
      startDate: '2026-09-27',
      endDate: '2026-12-27',
      projection: {
        projectedStartDate: '2026-09-27',
        projectedEndDate: '2026-12-27',
        weight: 72,
        bmi: 24.34,
        bfKg: null,
        bfPercentage: null,
        mmKg: null,
        mmPercentage: null,
      },
    });
    await page.goto('/mediciones');

    await expect(page.getByRole('button', { name: 'Plan actual' })).toHaveAttribute('aria-pressed', 'true');
    // el período aparece en el encabezado del gráfico y en su resumen
    await expect(page.getByText('27/09/2026 al 27/12/2026').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Resumen actual' })).toBeVisible();

    await page.getByRole('button', { name: 'Todas las mediciones' }).click();
    await expect(page.getByRole('checkbox')).toHaveCount(2);
    await page.getByRole('checkbox', { name: 'Incluir medición N°1' }).uncheck();
    await page.getByRole('checkbox', { name: 'Incluir medición N°2' }).uncheck();
    await expect(page.getByText('Selecciona al menos una medición.')).toBeVisible();
  });

  test('registra una medición desde el formulario y abre su detalle', async ({ page }) => {
    await mockMeasurementDetail(DETAIL);
    await page.goto('/mediciones');

    await page.getByRole('link', { name: 'Registrar medición' }).click();
    await expect(page).toHaveURL(/\/mediciones\/nueva$/);
    await page.getByLabel('Peso (kg)').fill('70');
    await page.getByLabel('Talla (cm)').fill('172');
    await page.getByRole('button', { name: 'Registrar medición' }).click();

    await expect(page).toHaveURL(/\/mediciones\/dddddddd-0000-4000-8000-000000000001$/);
    const calls = await getBackendCalls();
    const post = calls.find((c) => c.path === '/me/measurements' && c.method === 'POST');
    expect(post).toMatchObject({ authorized: true, body: { level: 'BASIC', weight: 70, height: 172 } });
  });

  test('corrige una medición: precarga sus datos, guarda por PATCH y vuelve al detalle', async ({ page }) => {
    await mockMeasurementDetail(DETAIL);
    await page.goto(`/mediciones/${DETAIL.measurementId}/editar`);

    await expect(page.getByRole('heading', { name: 'Editar medición N°1' })).toBeVisible();
    await expect(page.getByLabel('Peso (kg)')).toHaveValue('70');
    await expect(page.getByLabel('Tipo de medición')).toBeDisabled();
    await page.getByLabel('Peso (kg)').fill('68');
    await page.getByRole('button', { name: /Guardar/ }).click();

    await expect(page).toHaveURL(new RegExp(`/mediciones/${DETAIL.measurementId}$`));
    const patch = (await getBackendCalls()).find((c) => c.method === 'PATCH');
    expect(patch).toMatchObject({ path: `/me/measurements/${DETAIL.measurementId}`, authorized: true, body: { weight: 68, height: 172 } });
    // el tipo no viaja al corregir: el backend real lo rechazaría
    expect(patch?.body).not.toHaveProperty('level');
  });

  test('una medición inexistente o ajena muestra "Medición no encontrada"', async ({ page }) => {
    await page.goto('/mediciones/no-existe');

    await expect(page.getByRole('heading', { name: 'Medición no encontrada' })).toBeVisible();
    expect((await getBackendCalls()).filter((c) => c.path.startsWith('/me/measurements/'))).toHaveLength(0);
  });

  test('una medición con id válido que el backend no encuentra (404) muestra lo mismo', async ({ page }) => {
    const id = 'dddddddd-0000-4000-8000-00000000dead';
    await page.goto(`/mediciones/${id}`);

    await expect(page.getByRole('heading', { name: 'Medición no encontrada' })).toBeVisible();
    expect((await getBackendCalls()).find((c) => c.path === `/me/measurements/${id}`)).toMatchObject({ authorized: true });
  });
});

test.describe('Inicio - sin sesión', () => {
  test.use({ authenticated: false });

  test('el detalle de una consulta exige sesión', async ({ page }) => {
    await page.goto('/inicio/consultas/cccccccc-0000-4000-8000-000000000001');

    await expect(page).toHaveURL(/\/login/);
  });
});
