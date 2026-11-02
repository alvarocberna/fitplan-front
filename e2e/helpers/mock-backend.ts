// Configura el backend falso (e2e/fake-backend/server.mjs) desde los tests. Ya no se mockea con
// `page.route`: el backend lo llaman los Server Actions desde Node, no el navegador.
//
// Las respuestas se tipan con los DTOs del frontend, espejo de los del backend: si un DTO cambia, un mock
// desactualizado deja de compilar (`npm run test:e2e:types`; también lo comprueba `next build`).
import type { ArticlesEntityPublic } from '../../src/features/articles/entities/articles.entity';
import type { OutputChatDto } from '../../src/features/consultation/dtos/anamnesis-chat.dto';
import type { ProjectionGoal } from '../../src/features/consultation/dtos/goal-feasibility.dto';
import type { OrderStatusDto } from '../../src/features/consultation/dtos/order.dto';
import type { ConsultationDetailDto } from '../../src/features/dashboard/dtos/consultation-detail.dto';
import type { ConsultationSummaryDto } from '../../src/features/dashboard/dtos/consultation-summary.dto';
import type { DashboardSummaryDto } from '../../src/features/dashboard/dtos/dashboard-summary.dto';
import type {
  MyLatestPlanProjectionDto,
  MyPlanDetailDto,
  MyPlanSummaryDto,
} from '../../src/features/dashboard/dtos/my-plan.dto';
import type { MeasurementDetailDto, MeasurementSummaryDto } from '../../src/features/measurements/dtos/measurement.dto';
import type { PlanPreviewDto } from '../../src/features/plans/dtos/plan-preview.dto';
import type { TestimonialsEntityPublic } from '../../src/features/testimonials/entities/testimonials.entity';
import type { PerfilStatus } from '../../src/shared/auth/profile.actions';

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

// Limpia mocks y registros. Lo invoca el fixture `page` antes de cada test
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

// Lo que el backend real no habría aceptado (fuera del contrato) o que el test no configuró. El fixture
// hace fallar el test si esta lista no queda vacía.
export interface BackendViolation {
  kind: string;
  method: string;
  path: string;
  detail: string;
}

export async function getBackendViolations(): Promise<BackendViolation[]> {
  return (await control('/__control/violations')).json();
}

// Códigos estables del backend (fitplan-back/src/common/errors/error-codes.ts).
export type BackendErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'IDENTITY_NOT_SYNCED'
  | 'FORBIDDEN'
  | 'EMAIL_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ORDER_EXPIRED'
  | 'ORDER_ALREADY_PAID'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'PROFILE_INCOMPLETE'
  | 'GOAL_NOT_FEASIBLE'
  | 'LLM_UNAVAILABLE'
  | 'AUTH_UNAVAILABLE'
  | 'PAYMENT_UNAVAILABLE'
  | 'DATABASE_UNAVAILABLE'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface BackendFailure {
  status: number;
  code?: BackendErrorCode;
  message: string;
}

// Endpoints a los que se les puede simular un error con mockFailure.
export type MockName =
  | 'profile'
  | 'chat'
  | 'goalFeasibility'
  | 'createOrder'
  | 'personalizedProduct'
  | 'planPreviews'
  | 'predefinedProduct'
  | 'createPredefinedOrder'
  | 'dashboardSummary'
  | 'plans'
  | 'latestPlanProjection'
  | 'measurements'
  | 'measurementDetail'
  | 'planDetail'
  | 'consultations'
  | 'consultationDetail'
  | 'webpay'
  | 'payment'
  | 'paymentRejection'
  | 'orderStatus'
  | 'cmsArticles'
  | 'cmsTestimonials'
  | 'cmsArticle';

// El endpoint responde este error, con el formato de AllExceptionsFilter del backend.
export async function mockFailure(name: MockName, failure: BackendFailure) {
  await setMock(name, { fail: true, ...failure });
}

export const SESSION_EXPIRED: BackendFailure = {
  status: 401,
  code: 'UNAUTHENTICATED',
  message: 'Tu sesión expiró',
};

// Perfil (POST me/sync, GET/PATCH me). Sin llamar a esto el backend responde un perfil incompleto con el
// email de la sesión de prueba. `profile` pisa campos de ese perfil (ej. { profileComplete: true }).
export async function mockProfile(options: { profile?: Partial<PerfilStatus>; fail?: boolean; message?: string } = {}) {
  await setMock('profile', options);
}

// consultations/chat. Cada llamada sucesiva devuelve la siguiente respuesta de la secuencia (la última
// se repite si hay más llamadas que respuestas), simulando los turnos del chat de anamnesis.
export async function mockChatTurn(responses: OutputChatDto[]) {
  await setMock('chat', { sequence: responses });
}

export async function mockChatFailure(message = 'Error interno') {
  await setMock('chat', { fail: true, message });
}

// consultations/goal-feasibility (CU-CON-03). Sin llamar a esto responde "factible".
export async function mockGoalFeasibility(options: { feasible: boolean; goal?: ProjectionGoal; message?: string }) {
  await setMock('goalFeasibility', options);
}

export async function mockCreateOrder(options: { orderId?: string; fail?: boolean } = {}) {
  await setMock('createOrder', {
    orderId: options.orderId ?? 'aaaaaaaa-0000-4000-8000-000000000123',
    fail: options.fail,
    message: 'Error al crear la orden',
  });
}

// Pago con Webpay: POST orders/:id/payments devuelve la URL de un Webpay falso servido por el backend
// falso, que devuelve al navegador a /api/webpay/return (con TBK_TOKEN si `abort`), y
// POST payments/webpay/commit responde `outcome`. `statusAfterCommit` es lo que responderá
// orders/:id/status después de confirmar (el estado que lee /pago/[orderId] al volver).
export async function mockWebpay(options: {
  orderId?: string;
  outcome?: 'paid' | 'rejected' | 'not_committed' | 'needs_review';
  productType?: 'GENERATED' | 'PREDEFINED';
  abort?: boolean;
  statusAfterCommit?: OrderStatusDto;
  startFail?: boolean;
  commitFail?: boolean;
} = {}) {
  await setMock('webpay', {
    orderId: 'aaaaaaaa-0000-4000-8000-000000000123',
    outcome: 'paid',
    ...options,
  });
}

// `statusAfter`: los estados que responderá orders/:id/status después del pago. Como en el backend real, la
// orden solo cambia con esta llamada: si el test no la hace, no se pasa al siguiente estado.
export async function mockSimulatePayment(options: { fail?: boolean; statusAfter?: OrderStatusDto[] } = {}) {
  await setMock('payment', { fail: options.fail, statusAfter: options.statusAfter, message: 'Error al procesar el pago' });
}

export async function mockSimulatePaymentRejection(options: { fail?: boolean; statusAfter?: OrderStatusDto[] } = {}) {
  await setMock('paymentRejection', { fail: options.fail, statusAfter: options.statusAfter, message: 'Error al procesar el pago' });
}

// orders/:id/status con una secuencia de estados (la última se repite), simulando la
// progresión que el polling de /ordenes/[id] vería del backend real.
export async function mockOrderStatusSequence(sequence: OrderStatusDto[]) {
  await setMock('orderStatus', { sequence });
}

export function orderStatus(overrides: Partial<OrderStatusDto> = {}): OrderStatusDto {
  return {
    paymentStatus: 'PENDING',
    expirationDate: '2099-01-02T00:00:00.000Z',
    generationStatus: 'NOT_STARTED',
    planJson: null,
    pdfUrl: null,
    thumbnailUrl: null,
    ...overrides,
  };
}

// plans/personalized (público): precio de la consulta. Sin llamar a esto responde 4990 CLP;
// `unavailable` responde 404 (producto no cargado en el backend).
export async function mockPersonalizedProduct(options: { price?: number; unavailable?: boolean } = {}) {
  await setMock('personalizedProduct', options);
}

// plans/standard/previews (público): fichas del carrusel. Sin llamar a esto responde una lista vacía.
export async function mockPlanPreviews(previews: PlanPreviewDto[]) {
  await setMock('planPreviews', { previews });
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

// me/summary. Sin llamar a esto responde un resumen sin plan ni mediciones.
export async function mockDashboardSummary(summary: DashboardSummaryDto) {
  await setMock('dashboardSummary', { summary });
}

// me/plans (lista de /planes). Sin llamar a esto el listado responde vacío.
export async function mockPlansList(plans: MyPlanSummaryDto[]) {
  await setMock('plans', { plans });
}

// me/measurements (lista de /mediciones). Sin llamar a esto el listado responde vacío.
export async function mockMeasurementsList(measurements: MeasurementSummaryDto[]) {
  await setMock('measurements', { measurements });
}

// me/plans/latest/projection (gráfico de evolución, modo "Plan actual"). Sin llamar a esto responde
// 404 (sin plan con período), como el backend real.
export async function mockLatestPlanProjection(latest: MyLatestPlanProjectionDto) {
  await setMock('latestPlanProjection', { latest });
}

// me/measurements/:id (GET y PATCH) y POST me/measurements: responden este detalle (GET/PATCH solo
// para su `measurementId`; cualquier otro id responde 404, como el backend real).
export async function mockMeasurementDetail(detail: MeasurementDetailDto) {
  await setMock('measurementDetail', { detail });
}

// me/plans/:orderId (detalle en /planes/[orderId]). Responde `detail` solo para su `orderId`;
// cualquier otro id (o sin llamar a esto) responde 404, como el backend real.
export async function mockPlanDetail(detail: MyPlanDetailDto) {
  await setMock('planDetail', { detail });
}

// me/consultations (lista de /inicio). Sin llamar a esto el listado responde vacío.
export async function mockConsultationsList(consultations: ConsultationSummaryDto[]) {
  await setMock('consultations', { consultations });
}

// me/consultations/:id (detalle en /inicio/consultas/[id]). Responde `detail` solo para su
// `consultationId`; cualquier otro id (o sin llamar a esto) responde 404, como el backend real.
export async function mockConsultationDetail(detail: ConsultationDetailDto) {
  await setMock('consultationDetail', { detail });
}

// GET orders/:id/status responde 404: la orden no existe o no es del usuario.
export async function mockOrderNotFound() {
  await setMock('orderStatus', { notFound: true });
}

// CMS (otro backend): artículos y testimonios. Sin llamar a esto responden colecciones vacías.
export async function mockCmsArticles(data: ArticlesEntityPublic) {
  await setMock('cmsArticles', { data });
}

export async function mockCmsTestimonials(data: TestimonialsEntityPublic) {
  await setMock('cmsTestimonials', { data });
}
