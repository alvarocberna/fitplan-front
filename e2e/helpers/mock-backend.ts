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

// consultations/goal-feasibility (CU-CON-03). Sin llamar a esto responde "factible".
export async function mockGoalFeasibility(options: { feasible: boolean; goal?: string; message?: string }) {
  await setMock('goalFeasibility', options);
}

export async function mockCreateOrder(options: { orderId?: string; fail?: boolean } = {}) {
  await setMock('createOrder', {
    orderId: options.orderId ?? 'aaaaaaaa-0000-4000-8000-000000000123',
    fail: options.fail,
    message: 'Error al crear la orden',
  });
}

export async function mockSimulatePayment(options: { fail?: boolean } = {}) {
  await setMock('payment', { fail: options.fail, message: 'Error al procesar el pago' });
}

export async function mockSimulatePaymentRejection(options: { fail?: boolean } = {}) {
  await setMock('paymentRejection', { fail: options.fail, message: 'Error al procesar el pago' });
}

// orders/:id/status con una secuencia de estados (la última se repite), simulando la
// progresión que el polling de /ordenes/[id] vería del backend real.
export async function mockOrderStatusSequence(sequence: Array<Record<string, unknown>>) {
  await setMock('orderStatus', { sequence });
}

// plans/personalized (público): precio de la consulta. Sin llamar a esto responde 4990 CLP;
// `unavailable` responde 404 (producto no cargado en el backend).
export async function mockPersonalizedProduct(options: { price?: number; unavailable?: boolean } = {}) {
  await setMock('personalizedProduct', options);
}

// plans/standard/:code (público). Responde con la ficha del code pedido; los codes en
// `unavailableCodes` responden 404 (versión inexistente o inactiva).
export async function mockPredefinedProduct(options: { price?: number; unavailableCodes?: string[] } = {}) {
  await setMock('predefinedProduct', options);
}

// plans/standard/:code/purchase (con sesión).
export async function mockCreatePredefinedOrder(options: { orderId?: string; fail?: boolean } = {}) {
  await setMock('createPredefinedOrder', {
    orderId: options.orderId ?? 'aaaaaaaa-0000-4000-8000-0000000000f1',
    fail: options.fail,
    message: 'Error al crear la orden',
  });
}

// me/plans (tarjeta "Mis planes nutricionales" de inicio). Sin llamar a esto el listado responde vacío.
export async function mockPlansList(plans: Array<Record<string, unknown>>) {
  await setMock('plans', { plans });
}

// me/plans/:orderId (detalle en /planes/[orderId]). Responde `detail` solo para su `orderId`;
// cualquier otro id (o sin llamar a esto) responde 404, como el backend real.
// me/measurements (tarjeta "Mis mediciones" de inicio). Sin llamar a esto el listado responde vacío.
export async function mockMeasurementsList(measurements: Array<Record<string, unknown>>) {
  await setMock('measurements', { measurements });
}

// me/plans/latest/projection (gráfico de evolución, modo "Plan actual"). Sin llamar a esto responde
// 404 (sin plan con período), como el backend real.
export async function mockLatestPlanProjection(latest: Record<string, unknown>) {
  await setMock('latestPlanProjection', { latest });
}

// me/measurements/:id (GET y PATCH) y POST me/measurements: responden este detalle (GET/PATCH solo
// para su `measurementId`; cualquier otro id responde 404, como el backend real).
export async function mockMeasurementDetail(detail: Record<string, unknown> & { measurementId: string }) {
  await setMock('measurementDetail', { detail });
}

export async function mockPlanDetail(detail: Record<string, unknown> & { orderId: string }) {
  await setMock('planDetail', { detail });
}

// me/consultations (tarjeta "Mis consultas" de inicio). Sin llamar a esto el listado responde vacío.
export async function mockConsultationsList(consultations: Array<Record<string, unknown>>) {
  await setMock('consultations', { consultations });
}

// me/consultations/:id (detalle en /inicio/consultas/[id]). Responde `detail` solo para su
// `consultationId`; cualquier otro id (o sin llamar a esto) responde 404, como el backend real.
export async function mockConsultationDetail(detail: Record<string, unknown> & { consultationId: string }) {
  await setMock('consultationDetail', { detail });
}

// GET orders/:id/status responde 404: la orden no existe o no es del usuario.
export async function mockOrderNotFound() {
  await setMock('orderStatus', { notFound: true });
}
