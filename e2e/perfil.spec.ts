import { test, expect } from './fixtures';
import { getBackendCalls, mockFailure, mockProfile } from './helpers/mock-backend';

const PROFILE = {
  profileComplete: true,
  firstName: 'Ana',
  paternalLastName: 'Pérez',
  dateOfBirth: '1990-05-20T00:00:00.000Z',
};

test.describe('Mi perfil (/perfil)', () => {
  test('muestra los datos del backend, con el correo de solo lectura', async ({ page }) => {
    await mockProfile({ profile: PROFILE });
    await page.goto('/perfil');

    await expect(page.getByLabel('Nombre')).toHaveValue('Ana');
    await expect(page.getByLabel('Apellido')).toHaveValue('Pérez');
    await expect(page.getByLabel('Fecha de nacimiento')).toHaveValue('1990-05-20');
    await expect(page.getByLabel('Correo')).toHaveValue('ana@test.com');
    await expect(page.getByLabel('Correo')).toBeDisabled();
  });

  test('guarda los cambios por PATCH me y confirma con un aviso', async ({ page }) => {
    await mockProfile({ profile: PROFILE });
    await page.goto('/perfil');

    await page.getByLabel('Nombre').fill('Luisa');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Perfil actualizado correctamente' })).toBeVisible();
    const patch = (await getBackendCalls()).find((c) => c.method === 'PATCH' && c.path === '/me');
    expect(patch).toMatchObject({ authorized: true, body: { firstName: 'Luisa', paternalLastName: 'Pérez' } });
    // el correo es de la identidad de Cognito: nunca se envía
    expect(patch?.body).not.toHaveProperty('email');
  });

  test('no envía el formulario con campos vacíos', async ({ page }) => {
    await mockProfile({ profile: PROFILE });
    await page.goto('/perfil');

    await page.getByLabel('Nombre').fill('');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText('Campo requerido')).toBeVisible();
    expect((await getBackendCalls()).filter((c) => c.method === 'PATCH')).toHaveLength(0);
  });

  test('un error del backend al guardar se muestra y conserva lo escrito', async ({ page }) => {
    await mockProfile({ profile: PROFILE });
    await page.goto('/perfil');
    await page.getByLabel('Nombre').fill('Luisa');
    await mockFailure('profile', { status: 400, code: 'VALIDATION_ERROR', message: 'Los datos enviados no son válidos' });

    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Los datos enviados no son válidos' })).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveValue('Luisa');
  });
});
