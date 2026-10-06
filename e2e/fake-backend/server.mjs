// Backend falso para los e2e. Reemplaza al backend NestJS real (repo aparte) y es a lo que apunta
// BACKEND_URL durante la corrida (ver playwright.config.ts).
//
// Por qué un servidor y no `page.route`: BACKEND_URL es privado y solo lo llaman los Server Actions
// (Node, dentro del proceso de `next dev`), nunca el navegador — el mock de red de Playwright solo
// intercepta requests del navegador, así que no los ve.
//
// Contrato de los tests con este servidor:
// - Cada endpoint responde con lo que el test configuró vía POST /__control/mock (helpers en
//   e2e/helpers/mock-backend.ts). Un endpoint sin configurar responde 501: una llamada inesperada
//   falla de forma ruidosa en vez de colarse con datos inventados (misma filosofía que los hosts
//   dummy de .env.test para el CMS).
// - Los endpoints que en el backend real exigen sesión validan `Authorization: Bearer <token>`
//   contra E2E_ACCESS_TOKEN; sin él responden 401. Así los e2e también verifican que el Server
//   Action adjunta el Access Token de la cookie de sesión.
// - POST /__control/reset limpia mocks y el registro de llamadas; GET /__control/calls devuelve
//   el registro para aserciones tipo "el backend NO fue llamado".
// - Como el backend real, la API cuelga de /api/v1 (API_PREFIX). Una llamada sin el prefijo responde
//   404; el registro de llamadas guarda la ruta SIN el prefijo (ej. '/consultations').
// El estado es global (no por test), por eso la suite corre en serie (workers: 1).
import http from 'node:http'

const PORT = Number(process.env.FAKE_BACKEND_PORT ?? 3101)
const API_PREFIX = '/api/v1'
const E2E_ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? 'e2e-access-token'

// mocks: { [nombre]: config } — ver cada handler abajo para la forma de cada uno
let mocks = {}
let calls = []

const ERROR_CODES = { 400: 'BAD_REQUEST', 401: 'UNAUTHENTICATED', 404: 'NOT_FOUND', 409: 'CONFLICT' }

// Un error ({ message } con status >= 400) se responde con el contrato del backend real
// (AllExceptionsFilter): { statusCode, code, message, requestId, timestamp, path }. El requestId es el
// que mandó el llamador en x-request-id, igual que en el backend.
function send(res, status, body) {
  const req = res.req
  const requestId = req?.headers['x-request-id']
  const headers = { 'Content-Type': 'application/json' }
  if (typeof requestId === 'string') headers['x-request-id'] = requestId
  if (status >= 400 && body && typeof body.message === 'string') {
    body = {
      statusCode: status,
      code: body.code ?? ERROR_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
      message: body.message,
      ...(typeof requestId === 'string' && { requestId }),
      timestamp: new Date().toISOString(),
      path: req?.url,
    }
  }
  res.writeHead(status, headers)
  res.end(body === undefined ? undefined : JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : undefined
}

// Devuelve el siguiente elemento de una secuencia; el último se repite (simula el polling y los
// turnos de chat sin obligar al test a conocer cuántas llamadas habrá).
function nextInSequence(mock) {
  const item = mock.sequence[Math.min(mock.calls, mock.sequence.length - 1)]
  mock.calls += 1
  return item
}

// Aplica una respuesta configurada: { fail: true, status?, message?, code? } => error; si no => body.
function respond(res, config, body) {
  if (config?.fail) {
    return send(res, config.status ?? 500, { message: config.message ?? 'Error del backend de prueba', code: config.code })
  }
  return send(res, 200, body)
}

function isAuthorized(req) {
  return req.headers.authorization === `Bearer ${E2E_ACCESS_TOKEN}`
}

const PROFILE_DEFAULT = {
  profileComplete: false,
  firstName: null,
  middleName: null,
  paternalLastName: null,
  maternalLastName: null,
  gender: null,
  dateOfBirth: null,
  athlete: false,
  email: 'ana@test.com',
  rut: null,
  rutCheckDigit: null,
}

const DASHBOARD_SUMMARY_DEFAULT = {
  firstName: 'Ana',
  middleName: null,
  paternalLastName: 'Pérez',
  maternalLastName: null,
  age: 30,
  lastConsultationDate: null,
  goal: null,
  nutritionalPlan: null,
  lastMeasurement: null,
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const fullPath = url.pathname
  const method = req.method ?? 'GET'

  try {
    // ---- control ----
    if (fullPath === '/__health') return send(res, 200, { ok: true })
    if (fullPath === '/__control/reset' && method === 'POST') {
      mocks = {}
      calls = []
      return send(res, 200, { ok: true })
    }
    if (fullPath === '/__control/calls' && method === 'GET') return send(res, 200, calls)
    if (fullPath === '/__control/mock' && method === 'POST') {
      const { name, config } = await readJson(req)
      mocks[name] = { ...config, calls: 0 }
      return send(res, 200, { ok: true })
    }

    if (!fullPath.startsWith(`${API_PREFIX}/`)) {
      return send(res, 404, { message: `Ruta fuera de ${API_PREFIX}: ${method} ${fullPath}` })
    }
    const path = fullPath.slice(API_PREFIX.length)

    const body = ['POST', 'PATCH', 'PUT'].includes(method) ? await readJson(req) : undefined
    calls.push({ method, path, authorized: isAuthorized(req), body })

    // ---- perfil (Server Actions syncProfileAction / updateProfileAction / getUserProfileAction) ----
    if (path === '/me/sync' || path === '/me') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.profile
      if (method === 'POST' && path === '/me/sync') return respond(res, mock, { ...PROFILE_DEFAULT, ...(mock?.profile ?? {}) })
      if (method === 'GET' && path === '/me') return respond(res, mock, { ...PROFILE_DEFAULT, ...(mock?.profile ?? {}) })
      if (method === 'PATCH' && path === '/me') {
        // el perfil queda completo con lo que el formulario envió (firstName, paternalLastName, gender, dateOfBirth)
        return respond(res, mock, { ...PROFILE_DEFAULT, ...(mock?.profile ?? {}), ...body, profileComplete: true })
      }
    }

    // ---- chat de anamnesis ----
    if (path === '/consultations/chat' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.chat
      if (!mock) return send(res, 501, { message: 'consultations/chat sin mock' })
      if (mock.fail) return respond(res, mock)
      return send(res, 200, nextInSequence(mock))
    }

    // ---- factibilidad del objetivo (CU-CON-03, al terminar la evaluación física) ----
    // factible por defecto, para no romper los flujos que no lo mockean
    if (path === '/consultations/goal-feasibility' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.goalFeasibility
      return respond(res, mock, {
        feasible: mock?.feasible ?? true,
        goal: mock?.goal ?? 'mantencion',
        message: mock?.feasible === false ? (mock.message ?? 'Objetivo no factible') : null,
      })
    }

    // ---- crear consulta (y su orden) ----
    if (path === '/consultations' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.createOrder
      if (!mock) return send(res, 501, { message: 'consultations sin mock' })
      return respond(res, mock, { orderId: mock.orderId ?? 'aaaaaaaa-0000-4000-8000-000000000123' })
    }

    // ---- planes predefinidos ----
    // ficha pública del plan personalizado (sin auth): el precio de la consulta. Responde por defecto
    // (sin mock) porque la consultan /consulta/inicio y /consulta/generar-orden en casi todos los flujos.
    if (path === '/plans/personalized' && method === 'GET') {
      const mock = mocks.personalizedProduct
      if (mock?.unavailable) return send(res, 404, { message: 'Plan personalizado no disponible' })
      return send(res, 200, {
        name: 'Plan Nutricional Personalizado',
        description: 'Plan de prueba',
        price: mock?.price ?? 4990,
        currency: 'CLP',
      })
    }

    // ficha pública de una versión (sin auth, como en el backend real): responde con el code pedido
    if (/^\/plans\/standard\/[^/]+$/.test(path) && method === 'GET') {
      const mock = mocks.predefinedProduct
      if (!mock) return send(res, 501, { message: 'plans/standard/:code sin mock' })
      const code = decodeURIComponent(path.split('/').pop())
      if (mock.unavailableCodes?.includes(code)) return send(res, 404, { message: `Plan ${code} no disponible` })
      return send(res, 200, {
        code,
        name: `Plan ${code}`,
        description: 'Plan de prueba',
        price: mock.price ?? 14990,
        currency: 'CLP',
        thumbnailUrl: null,
      })
    }

    if (/^\/plans\/standard\/[^/]+\/purchase$/.test(path) && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.createPredefinedOrder
      if (!mock) return send(res, 501, { message: 'plans/standard/:code/purchase sin mock' })
      return respond(res, mock, { orderId: mock.orderId ?? 'aaaaaaaa-0000-4000-8000-0000000000f1' })
    }

    // ---- inicio (/inicio): resumen del usuario y listado de planes (el destino tras pagar un plan predefinido) ----
    if (path === '/me/summary' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return send(res, 200, mocks.dashboardSummary?.summary ?? DASHBOARD_SUMMARY_DEFAULT)
    }

    if (path === '/me/plans' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return send(res, 200, mocks.plans?.plans ?? [])
    }

    // antes de /me/plans/:orderId (aunque esa regex no captura dos segmentos)
    if (path === '/me/plans/latest/projection' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const latest = mocks.latestPlanProjection?.latest
      // como el backend real: sin plan con período -> 404
      if (!latest) return send(res, 404, { message: 'No hay un plan con período definido' })
      return send(res, 200, latest)
    }

    // ---- mediciones (/mediciones: lista, detalle, registrar y corregir) ----
    if (path === '/me/measurements' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return send(res, 200, mocks.measurements?.measurements ?? [])
    }

    if (path === '/me/measurements' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const detail = mocks.measurementDetail?.detail
      if (!detail) return send(res, 501, { message: 'POST me/measurements sin mock' })
      return send(res, 201, detail)
    }

    if (/^\/me\/measurements\/[^/]+$/.test(path) && (method === 'GET' || method === 'PATCH')) {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const measurementId = decodeURIComponent(path.split('/').pop())
      const detail = mocks.measurementDetail?.detail
      // como el backend real: inexistente o ajena -> 404
      if (!detail || detail.measurementId !== measurementId) {
        return send(res, 404, { message: 'Medición no encontrada' })
      }
      return send(res, 200, detail)
    }

    if (/^\/me\/plans\/[^/]+$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const orderId = decodeURIComponent(path.split('/').pop())
      const detail = mocks.planDetail?.detail
      // como el backend real: inexistente, ajeno o no listo -> 404
      if (!detail || detail.orderId !== orderId) {
        return send(res, 404, { message: 'Plan no encontrado' })
      }
      return send(res, 200, detail)
    }

    if (path === '/me/consultations' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return send(res, 200, mocks.consultations?.consultations ?? [])
    }

    if (/^\/me\/consultations\/[^/]+$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const consultationId = decodeURIComponent(path.split('/').pop())
      const detail = mocks.consultationDetail?.detail
      // como el backend real: inexistente o ajena -> 404
      if (!detail || detail.consultationId !== consultationId) {
        return send(res, 404, { message: 'Consulta no encontrada' })
      }
      return send(res, 200, detail)
    }

    // ---- pago simulado: como en el backend real, exige la sesión del dueño de la orden ----
    if (/^\/dev\/orders\/[^/]+\/simulate-payment$/.test(path) && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.payment
      if (!mock) return send(res, 501, { message: 'simulate-payment sin mock' })
      return respond(res, mock, { status: 'processed' })
    }

    // ---- rechazo de pago simulado ----
    if (/^\/dev\/orders\/[^/]+\/simulate-payment-rejection$/.test(path) && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.paymentRejection
      if (!mock) return send(res, 501, { message: 'simulate-payment-rejection sin mock' })
      return respond(res, mock, { status: 'rejected' })
    }

    // ---- estado de la orden (polling de /ordenes/[id]) ----
    if (/^\/orders\/[^/]+\/status$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.orderStatus
      if (!mock) return send(res, 501, { message: 'orders/:id/status sin mock' })
      // { notFound: true } => la orden no existe o no es del usuario (404, regla R2)
      if (mock.notFound) return send(res, 404, { message: 'Orden no encontrada' })
      return send(res, 200, nextInSequence(mock))
    }

    return send(res, 501, { message: `Endpoint sin mock en el backend falso: ${method} ${path}` })
  } catch (err) {
    return send(res, 500, { message: err instanceof Error ? err.message : 'Error interno del backend falso' })
  }
})

server.listen(PORT, () => {
  console.log(`[fake-backend] escuchando en http://localhost:${PORT}`)
})
