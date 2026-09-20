import { test, expect } from './fixtures';
import { seedConsultationContext } from './helpers/seed-context';
import { getBackendCalls, mockCreateOrder, mockSimulatePayment } from './helpers/mock-backend';

const VALID_PERSONAL_INFO = { firstName: 'Ana' };
const VALID_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };
const VALID_MEASUREMENTS = { weight: 65, height: 165, somatotype: 'MESO' };

test.describe('Consultation - generate order', () => {
  test('creates the order and navigates to the simulated payment page', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockCreateOrder({ orderId: 'order-e2e-123' });
    await page.goto('/consulta/generar-orden');

    await expect(page.getByText('$5').first()).toBeVisible();
    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page).toHaveURL(/\/pago\/order-e2e-123$/);
    // el Server Action creó la orden adjuntando el Access Token de la sesión
    const createCall = (await getBackendCalls()).find((c) => c.path === '/ordenes/crear');
    expect(createCall).toMatchObject({ method: 'POST', authorized: true });
  });

  test('shows an error toast and stays on the page when order creation fails', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockCreateOrder({ fail: true });
    await page.goto('/consulta/generar-orden');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page.getByText('Error al crear la orden')).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/generar-orden$/);
  });

  test('does not call the backend and shows a toast when previous-step data is incomplete', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS, measurements: null });
    await mockCreateOrder();
    await page.goto('/consulta/generar-orden');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page.getByText('Faltan datos de pasos anteriores')).toBeVisible();
    expect((await getBackendCalls()).filter((c) => c.path === '/ordenes/crear')).toHaveLength(0);
  });
});

test.describe('Consultation - simulated payment', () => {
  test('pays and navigates to the order status page', async ({ page }) => {
    await mockSimulatePayment();
    await page.goto('/pago/order-e2e-123');

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page).toHaveURL(/\/ordenes\/order-e2e-123$/);
    const payCall = (await getBackendCalls()).find((c) => c.path === '/webhooks/ordenes/order-e2e-123/simular-pago');
    expect(payCall?.method).toBe('POST');
  });

  test('shows an error toast and stays on the page when payment simulation fails', async ({ page }) => {
    await mockSimulatePayment({ fail: true });
    await page.goto('/pago/order-e2e-123');

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page.getByText('Error al procesar el pago')).toBeVisible();
    await expect(page).toHaveURL(/\/pago\/order-e2e-123$/);
  });
});
