import { test, expect } from './fixtures';
import { EMPTY_ANAMNESIS, VALID_MEASUREMENTS, VALID_PERSONAL_INFO, seedConsultationContext } from './helpers/seed-context';
import {
  getBackendCalls,
  mockCreateOrder,
  mockOrderStatusSequence,
  mockSimulatePayment,
  mockSimulatePaymentRejection,
  orderStatus,
} from './helpers/mock-backend';

const ORDER_ID = 'aaaaaaaa-0000-4000-8000-000000000123';
const PAID_GENERATING = orderStatus({ paymentStatus: 'PAID', generationStatus: 'GENERATING' });

test.describe('Consultation - generate order', () => {
  test('creates the order and navigates to the simulated payment page', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: EMPTY_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockCreateOrder({ orderId: ORDER_ID });
    await mockOrderStatusSequence([orderStatus()]);
    await page.goto('/consulta/generar-orden');

    // el precio viene del backend (GET plans/personalized), no está fijo en el frontend
    await expect(page.getByText('$4.990').first()).toBeVisible();
    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));
    // el Server Action creó la orden adjuntando el Access Token de la sesión
    const createCall = (await getBackendCalls()).find((c) => c.path === '/consultations');
    expect(createCall).toMatchObject({ method: 'POST', authorized: true });
  });

  test('shows an error toast and stays on the page when order creation fails', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: EMPTY_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockCreateOrder({ fail: true });
    await page.goto('/consulta/generar-orden');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Error al crear la orden' })).toBeVisible();
    await expect(page).toHaveURL(/\/consulta\/generar-orden$/);
  });

  test('does not call the backend and shows a toast when previous-step data is incomplete', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: EMPTY_ANAMNESIS, measurements: null });
    await mockCreateOrder();
    await page.goto('/consulta/generar-orden');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page.getByText('Faltan datos de pasos anteriores')).toBeVisible();
    expect((await getBackendCalls()).filter((c) => c.path === '/consultations')).toHaveLength(0);
  });
});

test.describe('Consultation - simulated payment', () => {
  test('pays and navigates to the order status page', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockSimulatePayment({ statusAfter: [PAID_GENERATING] });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Simular pago' }).click();

    await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));
    const payCall = (await getBackendCalls()).find((c) => c.path === `/dev/orders/${ORDER_ID}/simulate-payment`);
    expect(payCall?.method).toBe('POST');
  });

  test('an already paid order is not charged again and goes straight to its status', async ({ page }) => {
    await mockOrderStatusSequence([PAID_GENERATING]);
    await mockSimulatePayment();
    await page.goto(`/pago/${ORDER_ID}`);

    await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));
    expect((await getBackendCalls()).filter((c) => c.path.endsWith('/simulate-payment'))).toHaveLength(0);
  });

  test('a rejected payment keeps the user on the page and can be retried', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockSimulatePaymentRejection({ statusAfter: [orderStatus({ paymentStatus: 'REJECTED' })] });
    await mockSimulatePayment({ statusAfter: [PAID_GENERATING] });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Simular rechazo' }).click();

    await expect(page.getByText('Tu pago fue rechazado')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));
    const rejectCall = (await getBackendCalls()).find((c) => c.path === `/dev/orders/${ORDER_ID}/simulate-payment-rejection`);
    expect(rejectCall?.method).toBe('POST');

    await page.getByRole('button', { name: 'Simular pago' }).click();
    await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));
  });

  test('an expired order cannot be paid and offers starting a new consultation', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus({ paymentStatus: 'EXPIRED', expirationDate: '2026-01-02T00:00:00.000Z' })]);
    await page.goto(`/pago/${ORDER_ID}`);

    await expect(page.getByText('Esta orden expiró')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Simular pago' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Iniciar una nueva consulta' })).toBeVisible();
  });

  test('shows an error toast and stays on the page when payment simulation fails', async ({ page }) => {
    await mockOrderStatusSequence([orderStatus()]);
    await mockSimulatePayment({ fail: true });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Simular pago' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Error al procesar el pago' })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));
  });
});
