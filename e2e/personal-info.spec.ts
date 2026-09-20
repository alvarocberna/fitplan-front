import { test, expect } from './fixtures';
import { getBackendCalls, mockProfile } from './helpers/mock-backend';

// El formulario ya no pide Rut ni correo: el email sale de la sesión (campo deshabilitado,
// prellenado desde el perfil del backend) y los datos se guardan en el backend con
// updateProfileAction (PATCH auth/perfil) antes de avanzar.
test.describe('Consultation - personal info', () => {
  test('submits valid data, saves the profile in the backend, persists it and advances to anamnesis', async ({ page }) => {
    await page.goto('/consulta/informacion-personal');

    await expect(page.getByLabel('Correo')).toHaveValue('ana@test.com');
    await expect(page.getByLabel('Correo')).toBeDisabled();

    await page.getByLabel('Primer nombre').fill('Ana');
    await page.getByLabel('Apellido paterno').fill('Pérez');
    await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
    const selects = page.getByRole('combobox');
    await selects.nth(0).selectOption('FEMENINO');
    await selects.nth(1).selectOption('true');

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page).toHaveURL(/\/consulta\/anamnesis$/);
    const stored = await page.evaluate(() => window.localStorage.getItem('consulta_context'));
    expect(JSON.parse(stored ?? '{}').personalInfo).toMatchObject({
      firstName: 'Ana',
      paternalLastName: 'Pérez',
      email: 'ana@test.com',
      gender: 'FEMENINO',
      athlete: true,
    });

    // el Server Action guardó el perfil en el backend adjuntando el Access Token de la sesión
    const patch = (await getBackendCalls()).find((c) => c.method === 'PATCH' && c.path === '/auth/perfil');
    expect(patch).toMatchObject({
      authorized: true,
      body: { firstName: 'Ana', paternalLastName: 'Pérez', gender: 'FEMENINO' },
    });
  });

  test('prefills the form with the profile the backend already has', async ({ page }) => {
    await mockProfile({ profile: { firstName: 'Luisa', paternalLastName: 'Soto', gender: 'FEMENINO' } });
    await page.goto('/consulta/informacion-personal');

    await expect(page.getByLabel('Primer nombre')).toHaveValue('Luisa');
    await expect(page.getByLabel('Apellido paterno')).toHaveValue('Soto');
  });

  test('blocks submit and shows validation errors when submitted empty', async ({ page }) => {
    await page.goto('/consulta/informacion-personal');

    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page).toHaveURL(/\/consulta\/informacion-personal$/);
    await expect(page.getByText('Campo requerido').first()).toBeVisible();
  });

  test('shows the backend error in a toast and stays on the page when saving the profile fails', async ({ page }) => {
    await mockProfile({ fail: true, message: 'No se pudo guardar el perfil' });
    await page.goto('/consulta/informacion-personal');

    await page.getByLabel('Primer nombre').fill('Ana');
    await page.getByLabel('Apellido paterno').fill('Pérez');
    await page.getByLabel('Fecha nacimiento').fill('1990-05-20');
    await page.getByRole('button', { name: 'Siguiente' }).click();

    await expect(page.getByText('No se pudo guardar el perfil')).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/informacion-personal$/);
  });

  test('only offers Masculino/Femenino as gender options (no "Otro")', async ({ page }) => {
    await page.goto('/consulta/informacion-personal');

    const genderSelect = page.getByRole('combobox').nth(0);
    const optionLabels = await genderSelect.locator('option').allTextContents();

    expect(optionLabels).toEqual(['Masculino', 'Femenino']);
  });
});
