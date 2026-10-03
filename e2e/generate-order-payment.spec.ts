import { test, expect } from './fixtures';
import { seedConsultationContext } from './helpers/seed-context';
import {
  getBackendCalls,
  mockCreateOrder,
  mockOrderStatusSequence,
  mockSimulatePayment,
  mockSimulatePaymentRejection,
} from './helpers/mock-backend';

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
    const createCall = (await getBackendCalls()).find((c) => c.path === '/consultations');
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
    expect((await getBackendCalls()).filter((c) => c.path === '/consultations')).toHaveLength(0);
  });
});

test.describe('Consultation - simulated payment', () => {
  test('pays and navigates to the order status page', async ({ page }) => {
    await mockSimulatePayment();
    await page.goto('/pago/order-e2e-123');

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page).toHaveURL(/\/ordenes\/order-e2e-123$/);
    const payCall = (await getBackendCalls()).find((c) => c.path === '/dev/orders/order-e2e-123/simulate-payment');
    expect(payCall?.method).toBe('POST');
  });

  test('a rejected payment keeps the user on the page and can be retried', async ({ page }) => {
    await mockSimulatePaymentRejection();
    await mockSimulatePayment();
    await page.goto('/pago/order-e2e-123');

    await page.getByRole('button', { name: 'Simular rechazo' }).click();

    await expect(page.getByText('Tu pago fue rechazado')).toBeVisible();
    await expect(page).toHaveURL(/\/pago\/order-e2e-123$/);
    const rejectCall = (await getBackendCalls()).find(
      (c) => c.path === '/dev/orders/order-e2e-123/simulate-payment-rejection',
    );
    expect(rejectCall?.method).toBe('POST');

    await page.getByRole('button', { name: 'Pagar' }).click();
    await expect(page).toHaveURL(/\/ordenes\/order-e2e-123$/);
  });

  test('an expired order cannot be paid and offers starting a new consultation', async ({ page }) => {
    await mockOrderStatusSequence([
      { paymentStatus: 'EXPIRED', expirationDate: '2026-01-02T00:00:00.000Z', generationStatus: 'NOT_STARTED', planJson: null, pdfUrl: null, thumbnailUrl: null },
    ]);
    await page.goto('/pago/order-e2e-123');

    await expect(page.getByText('Esta orden expiró')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pagar' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Iniciar una nueva consulta' })).toBeVisible();
  });

  test('shows an error toast and stays on the page when payment simulation fails', async ({ page }) => {
    await mockSimulatePayment({ fail: true });
    await page.goto('/pago/order-e2e-123');

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page.getByText('Error al procesar el pago')).toBeVisible();
    await expect(page).toHaveURL(/\/pago\/order-e2e-123$/);
  });
});
