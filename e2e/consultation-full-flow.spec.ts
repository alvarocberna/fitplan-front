import { test, expect } from './fixtures';
import {
  getBackendCalls,
  mockChatTurn,
  mockCreateOrder,
  mockOrderStatusSequence,
  mockSimulatePayment,
  orderStatus,
} from './helpers/mock-backend';
import { nutritionPlanMock } from '../src/features/nutrition-plan/dtos/nutrition-plan.mock';

const EMPTY_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };
const ORDER_ID = 'aaaaaaaa-0000-4000-8000-000000000456';

test('completes the full consultation flow end-to-end: personal info -> anamnesis -> physical assessment -> order -> payment -> plan', async ({ page }) => {
  await mockChatTurn([
    { reply: 'Cuéntame más', titleReply: 'Objetivos', anamnesis: EMPTY_ANAMNESIS, isComplete: false },
    {
      reply: 'Listo, tengo suficiente información',
      titleReply: 'Resumen',
      anamnesis: { ...EMPTY_ANAMNESIS, goals: { primaryGoal: 'bajar de peso', secondaryGoal: null } },
      isComplete: true,
    },
  ]);
  await mockCreateOrder({ orderId: ORDER_ID });
  // la orden nace pendiente y recién queda pagada con la llamada de pago: sin ella, el test no avanza
  await mockOrderStatusSequence([orderStatus()]);
  await mockSimulatePayment({
    statusAfter: [
      orderStatus({ paymentStatus: 'PAID', generationStatus: 'GENERATING' }),
      orderStatus({
        paymentStatus: 'PAID',
        generationStatus: 'COMPLETED',
        planJson: nutritionPlanMock,
        pdfUrl: 'https://fitplan-planes-pdfs.s3.us-east-1.amazonaws.com/plan-e2e.pdf',
      }),
    ],
  });

  // 1. Información personal
  await page.goto('/consulta/informacion-personal');
  await page.getByLabel('Primer nombre').fill('Ana');
  await page.getByLabel('Apellido paterno').fill('Pérez');
  await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
  await page.getByLabel('Género').selectOption('FEMENINO');
  await page.getByLabel('Deportista').selectOption('professional');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/\/consulta\/anamnesis$/);

  // 2. Chat de anamnesis
  const textarea = page.getByPlaceholder(/Escribe tu respuesta/);
  await textarea.fill('Quiero bajar de peso');
  await textarea.press('Enter');
  await expect(page.getByText('Cuéntame más')).toBeVisible();
  await textarea.fill('Eso es todo por ahora');
  await textarea.press('Enter');
  await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/\/consulta\/evaluacion-fisica$/);

  // 3. Evaluación física
  await page.getByLabel('Peso').fill('65');
  await page.getByLabel('Talla').fill('165');
  // el radio está visualmente oculto (sr-only); se selecciona haciendo clic en su label asociado
  await page.locator('label[for^="somatotipo-"]').first().click();
  await page.getByRole('button', { name: 'Finalizar consulta' }).click();
  await expect(page).toHaveURL(/\/consulta\/generar-orden$/);

  // 4. Generar orden
  await page.getByRole('button', { name: 'Realizar pago' }).click();
  await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));

  // la orden está pendiente: la página de pago no avanza sola
  await expect(page.getByRole('button', { name: 'Simular pago' })).toBeVisible();
  const paymentPath = `/dev/orders/${ORDER_ID}/simulate-payment`;
  expect((await getBackendCalls()).filter((c) => c.path === paymentPath)).toHaveLength(0);

  // 5. Pago simulado
  await page.getByRole('button', { name: 'Simular pago' }).click();
  await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));
  const calls = await getBackendCalls();
  expect(calls.filter((c) => c.path === paymentPath)).toHaveLength(1);
  // la consulta que se creó lleva lo recogido en los pasos anteriores (y el backend la validó contra su contrato)
  expect(calls.find((c) => c.method === 'POST' && c.path === '/consultations')).toMatchObject({
    authorized: true,
    body: {
      personalInfo: { firstName: 'Ana', paternalLastName: 'Pérez', gender: 'FEMENINO', athlete: true },
      anamnesis: { goals: { primaryGoal: 'bajar de peso' } },
      measurements: { weight: 65, height: 165 },
    },
  });

  // 6. Estado de la orden -> plan listo (el polling real es cada 4s, se espera tiempo real)
  await expect(page.getByText('¡Tu plan nutricional está listo!')).toBeVisible({ timeout: 10_000 });

  const stored = await page.evaluate(() => window.localStorage.getItem('consulta_context'));
  const context = JSON.parse(stored ?? '{}');
  expect(context.personalInfo.firstName).toBe('Ana');
  expect(context.anamnesis.goals.primaryGoal).toBe('bajar de peso');
  expect(context.measurements.weight).toBe(65);
  expect(context.nutritionPlan.personalInfo.name).toBe(nutritionPlanMock.personalInfo.name);
});
