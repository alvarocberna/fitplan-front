import { test, expect } from '@playwright/test';

test.describe('Consultation - personal info', () => {
  test('submits valid data, persists it and advances to anamnesis', async ({ page }) => {
    await page.goto('/consultation/personal-info');

    await page.getByLabel('Rut', { exact: true }).fill('12345678');
    await page.getByLabel('DV-Rut').fill('K');
    await page.getByLabel('Primer nombre').fill('Ana');
    await page.getByLabel('Apellido paterno').fill('Pérez');
    await page.getByLabel('Correo').fill('ana@test.com');
    await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
    const selects = page.getByRole('combobox');
    await selects.nth(0).selectOption('FEMENINO');
    await selects.nth(1).selectOption('true');

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page).toHaveURL(/\/consultation\/anamnesis$/);
    const stored = await page.evaluate(() => window.localStorage.getItem('consulta_context'));
    expect(JSON.parse(stored ?? '{}').personalInfo).toMatchObject({
      firstName: 'Ana',
      paternalLastName: 'Pérez',
      email: 'ana@test.com',
      gender: 'FEMENINO',
      athlete: true,
    });
  });

  test('blocks submit and shows validation errors when submitted empty', async ({ page }) => {
    await page.goto('/consultation/personal-info');

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page).toHaveURL(/\/consultation\/personal-info$/);
    await expect(page.getByText('Campo requerido').first()).toBeVisible();
  });

  test('only offers Masculino/Femenino as gender options (no "Otro")', async ({ page }) => {
    await page.goto('/consultation/personal-info');

    const genderSelect = page.getByRole('combobox').nth(0);
    const optionLabels = await genderSelect.locator('option').allTextContents();

    expect(optionLabels).toEqual(['Masculino', 'Femenino']);
  });
});
