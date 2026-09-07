import type { Page, Route } from '@playwright/test';

function jsonFulfill(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

// Intercepta consulta/chat. Cada llamada sucesiva devuelve la siguiente respuesta de la
// secuencia (la última se repite si hay más llamadas que respuestas), simulando los turnos
// del chat de anamnesis.
export async function mockChatTurn(page: Page, responses: Array<Record<string, unknown>>) {
  let call = 0;
  await page.route('**/consulta/chat', async (route) => {
    const body = responses[Math.min(call, responses.length - 1)];
    call += 1;
    await jsonFulfill(route, body);
  });
}

export async function mockCreateOrder(page: Page, options: { orderId?: string; fail?: boolean } = {}) {
  await page.route('**/ordenes/crear', async (route) => {
    if (options.fail) {
      await jsonFulfill(route, { message: 'Error al crear la orden' }, 500);
      return;
    }
    await jsonFulfill(route, { orderId: options.orderId ?? 'order-e2e-123' });
  });
}

export async function mockSimulatePayment(page: Page, options: { fail?: boolean } = {}) {
  await page.route('**/webhooks/ordenes/*/simular-pago', async (route) => {
    if (options.fail) {
      await jsonFulfill(route, { message: 'Error al procesar el pago' }, 500);
      return;
    }
    await jsonFulfill(route, { status: 'pagado' });
  });
}

// Intercepta ordenes/obtener-estado/:id con una secuencia de estados (la última se repite),
// simulando la progresión que el polling de /orders/[id] vería del backend real.
export async function mockOrderStatusSequence(page: Page, sequence: Array<Record<string, unknown>>) {
  let call = 0;
  await page.route('**/ordenes/obtener-estado/*', async (route) => {
    const body = sequence[Math.min(call, sequence.length - 1)];
    call += 1;
    await jsonFulfill(route, body);
  });
}
