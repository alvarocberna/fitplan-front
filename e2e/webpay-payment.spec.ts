import { test, expect } from './fixtures';
import type { GenerationStatus, PaymentStatus } from '../src/features/consultation/dtos/order.dto';
import { getBackendCalls, mockOrderStatusSequence, mockWebpay, orderStatus } from './helpers/mock-backend';

// Pago con Webpay de punta a punta: /pago/[orderId] -> formulario de Webpay (falso, lo sirve el backend
// falso) -> /api/webpay/return -> confirmación en el backend -> de vuelta a /pago/[orderId].
const ORDER_ID = 'aaaaaaaa-0000-4000-8000-000000000123';
const WEBPAY_TOKEN = 'e2ewebpaytoken0001';

const status = (paymentStatus: PaymentStatus, generationStatus: GenerationStatus = 'NOT_STARTED') =>
  orderStatus({ paymentStatus, generationStatus });

test.describe('Pago con Webpay', () => {
  test('pago aprobado: confirma el pago al volver y sigue a la página de la orden', async ({ page }) => {
    await mockOrderStatusSequence([status('PENDING')]);
    await mockWebpay({ outcome: 'paid', statusAfterCommit: status('PAID', 'GENERATING') });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Pagar con Webpay' }).click();

    await expect(page).toHaveURL(new RegExp(`/ordenes/${ORDER_ID}$`));
    const calls = await getBackendCalls();
    // el pago se inicia con la sesión y sin datos del navegador: el monto lo pone el backend
    const startCall = calls.find((c) => c.path === `/orders/${ORDER_ID}/payments`);
    expect(startCall).toMatchObject({ method: 'POST', authorized: true });
    expect(startCall?.body).toBeUndefined();
    // la confirmación reenvía el token que devolvió Webpay y no depende de la sesión
    const commitCall = calls.find((c) => c.path === '/payments/webpay/commit');
    expect(commitCall).toMatchObject({ method: 'POST', authorized: false, body: { tokenWs: WEBPAY_TOKEN } });
  });

  test('pago rechazado: vuelve a la página de pago, avisa y permite reintentar', async ({ page }) => {
    await mockOrderStatusSequence([status('PENDING')]);
    await mockWebpay({ outcome: 'rejected', statusAfterCommit: status('REJECTED') });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Pagar con Webpay' }).click();

    await expect(page.getByText('Tu pago fue rechazado')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));
    await expect(page.getByRole('button', { name: 'Pagar con Webpay' })).toBeEnabled();
  });

  test('pago anulado en Webpay: vuelve a la página de pago con el aviso y sin cobro', async ({ page }) => {
    await mockOrderStatusSequence([status('PENDING')]);
    await mockWebpay({ abort: true });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Pagar con Webpay' }).click();

    await expect(page.getByText('Anulaste el pago en Webpay')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}\\?resultado=anulado$`));
    const commitCall = (await getBackendCalls()).find((c) => c.path === '/payments/webpay/commit');
    expect(commitCall?.body).toMatchObject({ tbkToken: WEBPAY_TOKEN });
  });

  test('plan predefinido pagado: vuelve con ?tipo=predefinido y termina en /inicio', async ({ page }) => {
    await mockOrderStatusSequence([status('PENDING')]);
    await mockWebpay({
      outcome: 'paid',
      productType: 'PREDEFINED',
      statusAfterCommit: status('PAID', 'COMPLETED'),
    });
    await page.goto(`/pago/${ORDER_ID}?tipo=predefinido`);

    await page.getByRole('button', { name: 'Pagar con Webpay' }).click();

    await expect(page).toHaveURL(/\/inicio$/);
  });

  test('si no se puede confirmar el pago al volver, ofrece reintentar la confirmación', async ({ page }) => {
    await mockOrderStatusSequence([status('PENDING')]);
    await mockWebpay({ commitFail: true });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Pagar con Webpay' }).click();

    await expect(page.getByText('No pudimos confirmar tu pago')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reintentar confirmación' })).toHaveAttribute(
      'href',
      `/api/webpay/return?token_ws=${WEBPAY_TOKEN}`,
    );
  });

  test('si no se puede iniciar el pago muestra el error y se queda en la página', async ({ page }) => {
    await mockOrderStatusSequence([status('PENDING')]);
    await mockWebpay({ startFail: true });
    await page.goto(`/pago/${ORDER_ID}`);

    await page.getByRole('button', { name: 'Pagar con Webpay' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'No pudimos conectar con el medio de pago' })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/pago/${ORDER_ID}$`));
  });
});
