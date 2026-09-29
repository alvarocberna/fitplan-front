import { test, expect } from './fixtures';
import { getBackendCalls, mockGoalFeasibility } from './helpers/mock-backend';

// CU-CON-03: al terminar la evaluación física se evalúa si el objetivo es alcanzable. Si no lo es
// (ej. bajar de peso con IMC <= 20) no se pasa a generar la orden: se muestra el mensaje con
// "Salir" / "Nueva consulta".
const NOT_FEASIBLE_MESSAGE =
  'Lo siento, he detectado que tu peso corporal ya está bajo, y trabajar una pérdida de peso podría no ser adecuado. Si quieres, podemos trabajar otros objetivos.';

const CONTEXT = {
  personalInfo: { firstName: 'Ana', gender: 'FEMENINO' },
  anamnesis: {
    goals: { primaryGoal: 'bajar de peso', secondaryGoal: null },
    clinical: null,
    dietary: null,
    lifestyle: null,
  },
  measurements: null,
  nutritionPlan: null,
};

test.beforeEach(async ({ page }) => {
  await page.goto('/consulta/evaluacion-fisica');
  await page.evaluate((ctx) => window.localStorage.setItem('consulta_context', JSON.stringify(ctx)), CONTEXT);
  await page.reload();
});

async function submitPhysicalAssessment(page: import('@playwright/test').Page) {
  await page.getByLabel('Peso').fill('55');
  await page.getByLabel('Talla').fill('170');
  await page.locator('label[for^="somatotipo-"]').first().click();
  await page.getByRole('button', { name: 'Finalizar consulta' }).click();
}

test('shows the not-feasible message and "Nueva consulta" restarts the anamnesis', async ({ page }) => {
  await mockGoalFeasibility({ feasible: false, goal: 'definicion', message: NOT_FEASIBLE_MESSAGE });

  await submitPhysicalAssessment(page);

  await expect(page.getByText(NOT_FEASIBLE_MESSAGE)).toBeVisible();
  await expect(page).toHaveURL(/\/consulta\/evaluacion-fisica$/);
  const call = (await getBackendCalls()).find((c) => c.path === '/consultations/goal-feasibility');
  expect(call).toMatchObject({
    method: 'POST',
    authorized: true,
    body: { goals: CONTEXT.anamnesis.goals, measurements: { weight: 55, height: 170 } },
  });

  await page.getByRole('button', { name: 'Nueva consulta' }).click();
  await expect(page).toHaveURL(/\/consulta\/anamnesis$/);
  const stored = JSON.parse((await page.evaluate(() => window.localStorage.getItem('consulta_context'))) ?? '{}');
  expect(stored.anamnesis).toBeNull();
  expect(stored.measurements).toBeNull();
  expect(stored.personalInfo.firstName).toBe('Ana');
});

test('"Salir" discards the consultation and goes to the panel', async ({ page }) => {
  await mockGoalFeasibility({ feasible: false, goal: 'definicion', message: NOT_FEASIBLE_MESSAGE });

  await submitPhysicalAssessment(page);
  await page.getByRole('button', { name: 'Salir' }).click();

  await expect(page).toHaveURL(/\/panel$/);
});

test('a feasible goal continues to generate the order', async ({ page }) => {
  await mockGoalFeasibility({ feasible: true, goal: 'definicion' });

  await submitPhysicalAssessment(page);

  await expect(page).toHaveURL(/\/consulta\/generar-orden$/);
});
