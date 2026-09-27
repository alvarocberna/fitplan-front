// Configura el backend falso (e2e/fake-backend/server.mjs) desde los tests. Ya no se mockea con
// `page.route`: el backend lo llaman los Server Actions desde Node, no el navegador.

export const FAKE_BACKEND_URL = `http://localhost:${process.env.FAKE_BACKEND_PORT ?? 3101}`

async function control(path: string, init?: RequestInit) {
  const res = await fetch(`${FAKE_BACKEND_URL}${path}`, init);
  if (!res.ok) throw new Error(`Backend falso: ${init?.method ?? 'GET'} ${path} respondió ${res.status}`);
  return res;
}

async function setMock(name: string, config: Record<string, unknown>) {
  await control('/__control/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, config }),
  });
}

// Limpia mocks y el registro de llamadas. Lo invoca el fixture `page` antes de cada test
// (ver e2e/fixtures.ts), así que los specs no lo necesitan.
export async function resetFakeBackend() {
  await control('/__control/reset', { method: 'POST' });
}

export interface BackendCall {
  method: string;
  path: string;
  authorized: boolean;
  body?: unknown;
}

export async function getBackendCalls(): Promise<BackendCall[]> {
  return (await control('/__control/calls')).json();
}

// Perfil (POST me/sync, GET/PATCH me). Sin llamar a esto el backend responde un perfil incompleto con el
// email de la sesión de prueba. `profile` pisa campos de ese perfil (ej. { profileComplete: true }).
export async function mockProfile(options: { profile?: Record<string, unknown>; fail?: boolean; message?: string } = {}) {
  await setMock('profile', options);
}

// consultations/chat. Cada llamada sucesiva devuelve la siguiente respuesta de la secuencia (la última
// se repite si hay más llamadas que respuestas), simulando los turnos del chat de anamnesis.
export async function mockChatTurn(responses: Array<Record<string, unknown>>) {
  await setMock('chat', { sequence: responses });
}

export async function mockChatFailure(message = 'Error interno') {
  await setMock('chat', { fail: true, message });
}

export async function mockCreateOrder(options: { orderId?: string; fail?: boolean } = {}) {
  await setMock('createOrder', {
    orderId: options.orderId ?? 'order-e2e-123',
    fail: options.fail,
    message: 'Error al crear la orden',
  });
}

export async function mockSimulatePayment(options: { fail?: boolean } = {}) {
  await setMock('payment', { fail: options.fail, message: 'Error al procesar el pago' });
}

// orders/:id/status con una secuencia de estados (la última se repite), simulando la
// progresión que el polling de /ordenes/[id] vería del backend real.
export async function mockOrderStatusSequence(sequence: Array<Record<string, unknown>>) {
  await setMock('orderStatus', { sequence });
}

// plans/standard/:code (público). Responde con la ficha del code pedido; los codes en
// `unavailableCodes` responden 404 (versión inexistente o inactiva).
export async function mockPredefinedProduct(options: { price?: number; unavailableCodes?: string[] } = {}) {
  await setMock('predefinedProduct', options);
}

// plans/standard/:code/purchase (con sesión).
export async function mockCreatePredefinedOrder(options: { orderId?: string; fail?: boolean } = {}) {
  await setMock('createPredefinedOrder', {
    orderId: options.orderId ?? 'order-predef-1',
    fail: options.fail,
    message: 'Error al crear la orden',
  });
}

// ordenes (listado de planes del panel). Sin llamar a esto el listado responde vacío.
export async function mockOrdersList(orders: Array<Record<string, unknown>>) {
  await setMock('orders', { orders });
}
