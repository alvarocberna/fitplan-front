import { test, expect } from './fixtures';
import { seedConsultationContext } from './helpers/seed-context';

const VALID_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };
const VALID_PERSONAL_INFO = { firstName: 'Ana', gender: 'FEMENINO' };

test.describe('Consultation - physical assessment', () => {
  test('submits measurements, persists them and advances to generate-order', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS });
    await page.goto('/consulta/evaluacion-fisica');

    await page.getByLabel('Peso').fill('65');
    await page.getByLabel('Talla').fill('165');
    // el radio está visualmente oculto (sr-only); se selecciona haciendo clic en su label asociado
    await page.locator('label[for^="somatotipo-"]').first().click();
    await page.getByRole('button', { name: 'Finalizar consulta' }).click();

    await expect(page).toHaveURL(/\/consulta\/generar-orden$/);
    const stored = await page.evaluate(() => window.localStorage.getItem('consulta_context'));
    const measurements = JSON.parse(stored ?? '{}').measurements;
    expect(measurements.weight).toBe(65);
    expect(measurements.height).toBe(165);
    expect(typeof measurements.somatotype).toBe('string');
  });

  test('blocks submit with a toast when anamnesis from a previous step is missing', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: null });
    await page.goto('/consulta/evaluacion-fisica');

    await page.getByLabel('Peso').fill('65');
    await page.getByLabel('Talla').fill('165');
    // el radio está visualmente oculto (sr-only); se selecciona haciendo clic en su label asociado
    await page.locator('label[for^="somatotipo-"]').first().click();
    await page.getByRole('button', { name: 'Finalizar consulta' }).click();

    await expect(page.getByText('Faltan datos de pasos anteriores')).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/evaluacion-fisica$/);
  });
});
