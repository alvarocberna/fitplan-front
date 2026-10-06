import { test, expect } from './fixtures';
import { mockChatTurn, mockCreateOrder, mockSimulatePayment, mockOrderStatusSequence } from './helpers/mock-backend';
import { nutritionPlanMock } from '../src/features/nutrition-plan/dtos/nutrition-plan.mock';

const EMPTY_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };
const ORDER_ID = 'order-full-flow';

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
  await mockSimulatePayment();
  await mockOrderStatusSequence([
    { paymentStatus: 'PAID', generationStatus: 'GENERATING', planJson: null, pdfUrl: null, thumbnailUrl: null },
    {
      paymentStatus: 'PAID',
      generationStatus: 'COMPLETED',
      planJson: nutritionPlanMock,
      pdfUrl: 'https://nutricionista-virtual-planes-pdfs.s3.us-east-1.amazonaws.com/plan-e2e.pdf',
      thumbnailUrl: null,
    },
  ]);
  // 1. Información personal
  await page.goto('/consulta/informacion-personal');
  await page.getByLabel('Primer nombre').fill('Ana');
  await page.getByLabel('Apellido paterno').fill('Pérez');
  await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
  const personalInfoSelects = page.getByRole('combobox');
  await personalInfoSelects.nth(0).selectOption('FEMENINO');
  await personalInfoSelects.nth(1).selectOption('professional');
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

  // 5. Pago simulado
  await page.getByRole('button', { name: 'Pagar' }).click();
  await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));

  // 6. Estado de la orden -> plan listo (el polling real es cada 4s, se espera tiempo real)
  await expect(page.getByText('¡Tu plan nutricional está listo!')).toBeVisible({ timeout: 10_000 });

  const stored = await page.evaluate(() => window.localStorage.getItem('consulta_context'));
  const context = JSON.parse(stored ?? '{}');
  expect(context.personalInfo.firstName).toBe('Ana');
  expect(context.anamnesis.goals.primaryGoal).toBe('bajar de peso');
  expect(context.measurements.weight).toBe(65);
  expect(context.nutritionPlan.personalInfo.name).toBe(nutritionPlanMock.personalInfo.name);
});
