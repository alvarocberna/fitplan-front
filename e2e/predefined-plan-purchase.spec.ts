import { test, expect } from './fixtures';
import {
  getBackendCalls,
  mockCreatePredefinedOrder,
  mockPlansList,
  mockPredefinedProduct,
  mockSimulatePayment,
} from './helpers/mock-backend';

const CODE = 'plan-gimnasio-volumen-50-60-m-joven';

// completa los 4 campos del modal o de /planes-estandar/[slug] (mismas etiquetas en ambos)
async function fillSelection(page: import('@playwright/test').Page) {
  await page.getByLabel('Peso').selectOption('50-60');
  await page.getByLabel('Talla (cm)').fill('175');
  await page.getByLabel('Sexo').selectOption('m');
  await page.getByLabel('Edad').selectOption('18-30');
}

test.describe('Planes predefinidos - selección y carro', () => {
  test('"Seleccionar" abre el modal, "Confirmar" lleva al plan con los datos ya cargados y muestra su precio', async ({ page }) => {
    await mockPredefinedProduct({ price: 14990 });
    await page.goto('/planes-estandar');

    await page.getByRole('button', { name: 'Seleccionar' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Completa tu información para obtener el plan más adecuado' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Confirmar' })).toBeDisabled();

    await fillSelection(page);
    await dialog.getByRole('button', { name: 'Confirmar' }).click();

    await expect(page).toHaveURL(/\/planes-estandar\/plan-gimnasio-volumen$/);
    // el estado global conserva lo que se completó en el modal
    await expect(page.getByLabel('Peso')).toHaveValue('50-60');
    await expect(page.getByLabel('Talla (cm)')).toHaveValue('175');
    await expect(page.getByLabel('Sexo')).toHaveValue('m');
    await expect(page.getByLabel('Edad')).toHaveValue('18-30');
    await expect(page.getByText('$14.990')).toBeVisible();
    // el backend recibió la consulta de la versión que corresponde (sin sesión: es un endpoint público)
    const productCall = (await getBackendCalls()).find((c) => c.path === `/plans/standard/${CODE}`);
    expect(productCall?.method).toBe('GET');
  });

  test('una versión no disponible se avisa y no permite añadir al carro', async ({ page }) => {
    await mockPredefinedProduct({ unavailableCodes: [CODE] });
    await page.goto('/planes-estandar/plan-gimnasio-volumen');

    await fillSelection(page);

    // filtrado por texto: Next también monta un role="alert" propio (el anunciador de rutas)
    await expect(page.getByRole('alert').filter({ hasText: 'aún no está disponible' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Añadir al carro' })).toBeDisabled();
  });

  test('añadir al carro lleva a /carrito con el plan y su precio real', async ({ page }) => {
    await mockPredefinedProduct({ price: 14990 });
    await page.goto('/planes-estandar/plan-gimnasio-volumen');
    await fillSelection(page);
    await expect(page.getByText('$14.990')).toBeVisible();

    await page.getByRole('button', { name: 'Añadir al carro' }).click();

    await expect(page).toHaveURL(/\/carrito$/);
    await expect(page.getByText(`Plan ${CODE}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pagar' })).toBeEnabled();
  });
});

test.describe('Planes predefinidos - pago con sesión', () => {
  test('paga el plan del carro y termina en /inicio', async ({ page }) => {
    await mockPredefinedProduct({ price: 14990 });
    await mockCreatePredefinedOrder({ orderId: 'aaaaaaaa-0000-4000-8000-0000000000f1' });
    await mockSimulatePayment();
    await mockPlansList([
      {
        orderId: 'aaaaaaaa-0000-4000-8000-0000000000f1',
        type: 'PREDEFINED',
        name: `Plan ${CODE}`,
        purchasedAt: '2026-09-21T12:00:00.000Z',
        pdfUrl: 'https://bucket.example/plan.pdf?sig=abc',
        thumbnailUrl: null,
        summary: null,
      },
    ]);
    await page.goto('/planes-estandar/plan-gimnasio-volumen');
    await fillSelection(page);
    await expect(page.getByText('$14.990')).toBeVisible();
    await page.getByRole('button', { name: 'Añadir al carro' }).click();
    await expect(page).toHaveURL(/\/carrito$/);

    await page.getByRole('button', { name: 'Pagar' }).click();
    await expect(page).toHaveURL(/\/pago\/aaaaaaaa-0000-4000-8000-0000000000f1\?tipo=predefinido$/);
    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page).toHaveURL(/\/inicio$/);
    // la lista de planes (con su descarga) vive en /planes, no en /inicio
    await page.goto('/planes');
    await expect(page.getByRole('link', { name: `Descargar plan Plan ${CODE}` })).toHaveAttribute('href', /plan\.pdf/);

    const calls = await getBackendCalls();
    // la orden se creó con la sesión y solo con el code (en la ruta): el precio no viaja desde el navegador
    const createCall = calls.find((c) => c.path === `/plans/standard/${CODE}/purchase`);
    expect(createCall).toMatchObject({ method: 'POST', authorized: true });
    expect(createCall?.body).toBeUndefined();
    expect(calls.find((c) => c.path === '/dev/orders/aaaaaaaa-0000-4000-8000-0000000000f1/simulate-payment')?.method).toBe('POST');
  });

  test('si el backend rechaza la orden muestra un error y se queda en el carro', async ({ page }) => {
    await mockPredefinedProduct();
    await mockCreatePredefinedOrder({ fail: true });
    await page.goto('/planes-estandar/plan-gimnasio-volumen');
    await fillSelection(page);
    await page.getByRole('button', { name: 'Añadir al carro' }).click();

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page.getByText('Error al crear la orden')).toBeVisible();
    await expect(page).toHaveURL(/\/carrito$/);
  });
});

test.describe('Planes predefinidos - pago sin sesión', () => {
  test.use({ authenticated: false });

  test('"Pagar" pide registrarse en un modal (con vuelta al carro) y no crea la orden', async ({ page }) => {
    await mockPredefinedProduct();
    await mockCreatePredefinedOrder();
    await page.goto('/planes-estandar/plan-gimnasio-volumen');
    await fillSelection(page);
    await page.getByRole('button', { name: 'Añadir al carro' }).click();
    await expect(page).toHaveURL(/\/carrito$/);

    await page.getByRole('button', { name: 'Pagar' }).click();

    const dialog = page.getByRole('dialog', { name: 'Inicia sesión para continuar' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Registro' })).toHaveAttribute(
      'href',
      '/api/cognito/login?screen_hint=signup&return_to=%2Fcarrito',
    );
    await expect(page).toHaveURL(/\/carrito$/);
    expect((await getBackendCalls()).filter((c) => c.path.endsWith('/purchase'))).toHaveLength(0);
  });
});
