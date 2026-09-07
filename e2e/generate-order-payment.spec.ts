import { test, expect } from '@playwright/test';
import { seedConsultationContext } from './helpers/seed-context';
import { mockCreateOrder, mockSimulatePayment } from './helpers/mock-backend';

const VALID_PERSONAL_INFO = { firstName: 'Ana' };
const VALID_ANAMNESIS = { goals: null, clinical: null, dietary: null, lifestyle: null };
const VALID_MEASUREMENTS = { weight: 65, height: 165, somatotype: 'MESO' };

test.describe('Consultation - generate order', () => {
  test('creates the order and navigates to the simulated payment page', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockCreateOrder(page, { orderId: 'order-e2e-123' });
    await page.goto('/consultation/generate-order');

    await expect(page.getByText('$5').first()).toBeVisible();
    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page).toHaveURL(/\/payment\/order-e2e-123$/);
  });

  test('shows an error toast and stays on the page when order creation fails', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS, measurements: VALID_MEASUREMENTS });
    await mockCreateOrder(page, { fail: true });
    await page.goto('/consultation/generate-order');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page.getByText('Error al crear la orden')).toBeVisible();
    await expect(page).toHaveURL(/\/consultation\/generate-order$/);
  });

  test('does not call the backend and shows a toast when previous-step data is incomplete', async ({ page }) => {
    await seedConsultationContext(page, { personalInfo: VALID_PERSONAL_INFO, anamnesis: VALID_ANAMNESIS, measurements: null });
    let createOrderCalled = false;
    await page.route('**/ordenes/crear', (route) => {
      createOrderCalled = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/consultation/generate-order');

    await page.getByRole('button', { name: 'Realizar pago' }).click();

    await expect(page.getByText('Faltan datos de pasos anteriores')).toBeVisible();
    expect(createOrderCalled).toBe(false);
  });
});

test.describe('Consultation - simulated payment', () => {
  test('pays and navigates to the order status page', async ({ page }) => {
    await mockSimulatePayment(page);
    await page.goto('/payment/order-e2e-123');

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page).toHaveURL(/\/orders\/order-e2e-123$/);
  });

  test('shows an error toast and stays on the page when payment simulation fails', async ({ page }) => {
    await mockSimulatePayment(page, { fail: true });
    await page.goto('/payment/order-e2e-123');

    await page.getByRole('button', { name: 'Pagar' }).click();

    await expect(page.getByText('Error al procesar el pago')).toBeVisible();
    await expect(page).toHaveURL(/\/payment\/order-e2e-123$/);
  });
});
