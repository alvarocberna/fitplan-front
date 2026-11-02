// Backend falso para los e2e. Reemplaza al backend NestJS real (repo aparte) y es a lo que apunta
// BACKEND_URL durante la corrida (ver playwright.config.ts).
//
// Por qué un servidor y no `page.route`: BACKEND_URL es privado y solo lo llaman los Server Actions
// (Node, dentro del proceso de Next), nunca el navegador: el mock de red de Playwright solo intercepta
// requests del navegador, así que no los ve.
//
// Contrato de los tests con este servidor:
// - Cada endpoint responde con lo que el test configuró vía POST /__control/mock (helpers en
//   e2e/helpers/mock-backend.ts).
// - Toda request se valida contra el contrato real (./contract.mjs, generado desde el backend): una ruta
//   inexistente, un id que no es UUID o un body inválido responden como el backend real y quedan
//   registrados como violación.
// - Un endpoint sin configurar responde 501 y también queda registrado. El fixture de e2e/fixtures.ts
//   hace fallar el test si hay violaciones (GET /__control/violations), aunque la pantalla haya tolerado
//   el error: una llamada inesperada no puede pasar inadvertida.
// - Los endpoints que en el backend real exigen sesión validan `Authorization: Bearer <token>`
//   contra E2E_ACCESS_TOKEN; sin él responden 401. Así los e2e también verifican que el Server
//   Action adjunta el Access Token de la cookie de sesión.
// - Cualquier endpoint configurado admite { fail: true, status?, code?, message? } para simular un error
//   con el formato de AllExceptionsFilter.
// - POST /__control/reset limpia mocks y registros; GET /__control/calls devuelve las llamadas para
//   aserciones tipo "el backend NO fue llamado".
// - Como el backend real, la API cuelga de /api/v1 (API_PREFIX); el registro de llamadas guarda la ruta
//   SIN el prefijo (ej. '/consultations').
// - /__cms/* reemplaza al CMS (artículos y testimonios), que es otro backend sin contrato acá.
// El estado es global (no por test), por eso la suite corre en serie (workers: 1).
import http from 'node:http'
import { checkRequest } from './contract.mjs'

const PORT = Number(process.env.FAKE_BACKEND_PORT ?? 3101)
const API_PREFIX = '/api/v1'
const CMS_PREFIX = '/__cms'
const E2E_ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? 'e2e-access-token'
// Webpay falso (ver el handler /__webpay/form): token y orden de compra de la única transacción que
// maneja, y la URL del frontend a la que devuelve al navegador.
const WEBPAY_TOKEN = 'e2ewebpaytoken0001'
const WEBPAY_BUY_ORDER = 'e2ebuyorder0001'
const WEBPAY_RETURN_URL = process.env.WEBPAY_RETURN_URL ?? 'http://localhost:3100/api/webpay/return'

// mocks: { [nombre]: config } — ver cada handler abajo para la forma de cada uno
let mocks = {}
let calls = []
let violations = []

const ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
}

// Un error ({ message } con status >= 400) se responde con el contrato del backend real
// (AllExceptionsFilter): { statusCode, code, message, errors?, requestId, timestamp, path }. El requestId
// es el que mandó el llamador en x-request-id, igual que en el backend. Un 2xx usa el status que declara
// el contrato para esa operación (un POST de Nest responde 201 salvo que declare otro).
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
      ...(body.errors && { errors: body.errors }),
      ...(typeof requestId === 'string' && { requestId }),
      timestamp: new Date().toISOString(),
      path: req?.url,
    }
  }
  res.writeHead(status < 300 && res.successStatus ? res.successStatus : status, headers)
  res.end(body === undefined ? undefined : JSON.stringify(body))
}

async function readText(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function readJson(req) {
  const raw = await readText(req)
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

// Sin mock: 501 y una violación. El test que pasó por acá falla aunque la pantalla tolere el error.
function unmocked(res, method, path, name) {
  violations.push({ kind: 'unmocked', method, path, detail: `Falta configurar el mock "${name}"` })
  return send(res, 501, { message: `${method} ${path} sin mock` })
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

const CMS_ARTICLES_DEFAULT = {
  id: 'cms-articulos',
  titulo: 'Artículos',
  descripcion: null,
  activo: true,
  aprobar: false,
  notificacion: false,
  proyecto_id: 'e2e-test-project',
  articulo: [],
}

const CMS_TESTIMONIALS_DEFAULT = {
  id: 'cms-testimonios',
  titulo: 'Testimonios',
  descripcion: 'Lo que dicen nuestros pacientes',
  activo: true,
  aprobar: false,
  notificacion: false,
  proyecto_id: 'e2e-test-project',
  testimonio: [],
}

// CMS falso: lecturas públicas de artículos y testimonios. La URL del navegador pasa por el rewrite de
// Next (/api/* -> NEXT_PUBLIC_BACKEND_CMS_URL/*) y la del servidor llega directo.
function handleCms(res, method, path) {
  if (method === 'GET' && path === '/articulos/project/ver-todo') {
    return respond(res, mocks.cmsArticles, mocks.cmsArticles?.data ?? CMS_ARTICLES_DEFAULT)
  }
  if (method === 'GET' && path === '/testimonios/project/ver-todo') {
    return respond(res, mocks.cmsTestimonials, mocks.cmsTestimonials?.data ?? CMS_TESTIMONIALS_DEFAULT)
  }
  if (method === 'GET' && path.startsWith('/articulos/project/ver/')) {
    const mock = mocks.cmsArticle
    if (!mock) return send(res, 404, { message: 'Artículo no encontrado' })
    return respond(res, mock, mock.data)
  }
  return unmocked(res, method, `${CMS_PREFIX}${path}`, 'cms')
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
      violations = []
      return send(res, 200, { ok: true })
    }
    if (fullPath === '/__control/calls' && method === 'GET') return send(res, 200, calls)
    if (fullPath === '/__control/violations' && method === 'GET') return send(res, 200, violations)
    if (fullPath === '/__control/mock' && method === 'POST') {
      const { name, config } = await readJson(req)
      mocks[name] = { ...config, calls: 0 }
      return send(res, 200, { ok: true })
    }

    // ---- Webpay falso: el formulario de pago al que /pago/[orderId] envía al navegador ----
    // No es parte de la API del backend: reemplaza al sitio de Transbank. Recibe token_ws por POST y
    // devuelve al navegador a la URL de retorno del frontend, como hace Webpay: con token_ws si el
    // usuario "pagó" (aprobado o rechazado) o con TBK_TOKEN si "anuló" (mock webpay.abort).
    if (fullPath === '/__webpay/form' && method === 'POST') {
      const token = new URLSearchParams(await readText(req)).get('token_ws') ?? ''
      const mock = mocks.webpay
      const returnUrl = new URL(mock?.returnUrl ?? WEBPAY_RETURN_URL)
      if (mock?.abort) {
        returnUrl.searchParams.set('TBK_TOKEN', token)
        returnUrl.searchParams.set('TBK_ORDEN_COMPRA', WEBPAY_BUY_ORDER)
      } else {
        returnUrl.searchParams.set('token_ws', token)
      }
      res.writeHead(303, { Location: returnUrl.toString() })
      return res.end()
    }

    if (fullPath.startsWith(`${CMS_PREFIX}/`)) {
      calls.push({ method, path: fullPath, authorized: false })
      return handleCms(res, method, fullPath.slice(CMS_PREFIX.length))
    }

    if (!fullPath.startsWith(`${API_PREFIX}/`)) {
      violations.push({ kind: 'missing-api-prefix', method, path: fullPath, detail: `Ruta fuera de ${API_PREFIX}` })
      return send(res, 404, { message: `Ruta fuera de ${API_PREFIX}: ${method} ${fullPath}` })
    }
    const path = fullPath.slice(API_PREFIX.length)

    const body = ['POST', 'PATCH', 'PUT'].includes(method) ? await readJson(req) : undefined
    calls.push({ method, path, authorized: isAuthorized(req), body })

    // ---- contrato: lo que el backend real rechazaría se rechaza igual, y se registra ----
    const check = checkRequest(method, path, body)
    res.successStatus = check.successStatus
    if (check.violation) {
      violations.push({ ...check.violation, method, path })
      if (check.violation.kind === 'route-not-in-contract') {
        return send(res, 501, { message: `Ruta fuera del contrato: ${method} ${path}` })
      }
      return send(res, 400, {
        message: 'Los datos enviados no son válidos',
        code: 'VALIDATION_ERROR',
        errors: [check.violation.detail],
      })
    }

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
      if (!mock) return unmocked(res, method, path, 'chat')
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
      if (!mock) return unmocked(res, method, path, 'createOrder')
      return respond(res, mock, { orderId: mock.orderId ?? 'aaaaaaaa-0000-4000-8000-000000000123' })
    }

    // ---- planes predefinidos ----
    // ficha pública del plan personalizado (sin auth): el precio de la consulta. Responde por defecto
    // (sin mock) porque la consultan /consulta/inicio y /consulta/generar-orden en casi todos los flujos.
    if (path === '/plans/personalized' && method === 'GET') {
      const mock = mocks.personalizedProduct
      if (mock?.unavailable) return send(res, 404, { message: 'Plan personalizado no disponible' })
      return respond(res, mock, {
        name: 'Plan Nutricional Personalizado',
        description: 'Plan de prueba',
        price: mock?.price ?? 4990,
        currency: 'CLP',
      })
    }

    // fichas públicas de vista previa por familia (carrusel). Antes de plans/standard/:code.
    if (path === '/plans/standard/previews' && method === 'GET') {
      const mock = mocks.planPreviews
      return respond(res, mock, mock?.previews ?? [])
    }

    // ficha pública de una versión (sin auth, como en el backend real): responde con el code pedido
    if (/^\/plans\/standard\/[^/]+$/.test(path) && method === 'GET') {
      const mock = mocks.predefinedProduct
      if (!mock) return unmocked(res, method, path, 'predefinedProduct')
      const code = decodeURIComponent(path.split('/').pop())
      if (mock.unavailableCodes?.includes(code)) return send(res, 404, { message: `Plan ${code} no disponible` })
      return respond(res, mock, {
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
      if (!mock) return unmocked(res, method, path, 'createPredefinedOrder')
      return respond(res, mock, { orderId: mock.orderId ?? 'aaaaaaaa-0000-4000-8000-0000000000f1' })
    }

    // ---- inicio (/inicio): resumen del usuario y listado de planes (el destino tras pagar un plan predefinido) ----
    if (path === '/me/summary' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return respond(res, mocks.dashboardSummary, mocks.dashboardSummary?.summary ?? DASHBOARD_SUMMARY_DEFAULT)
    }

    if (path === '/me/plans' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return respond(res, mocks.plans, mocks.plans?.plans ?? [])
    }

    if (path === '/me/plans/latest/projection' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.latestPlanProjection
      if (mock?.fail) return respond(res, mock)
      // como el backend real: sin plan con período -> 404
      if (!mock?.latest) return send(res, 404, { message: 'No hay un plan con período definido' })
      return send(res, 200, mock.latest)
    }

    // ---- mediciones (/mediciones: lista, detalle, registrar y corregir) ----
    if (path === '/me/measurements' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return respond(res, mocks.measurements, mocks.measurements?.measurements ?? [])
    }

    if (path === '/me/measurements' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.measurementDetail
      if (mock?.fail) return respond(res, mock)
      if (!mock?.detail) return unmocked(res, method, path, 'measurementDetail')
      return send(res, 201, mock.detail)
    }

    if (/^\/me\/measurements\/[^/]+$/.test(path) && (method === 'GET' || method === 'PATCH')) {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const measurementId = decodeURIComponent(path.split('/').pop())
      const mock = mocks.measurementDetail
      if (mock?.fail) return respond(res, mock)
      // como el backend real: inexistente o ajena -> 404
      if (!mock?.detail || mock.detail.measurementId !== measurementId) {
        return send(res, 404, { message: 'Medición no encontrada' })
      }
      return send(res, 200, mock.detail)
    }

    if (/^\/me\/plans\/[^/]+$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const orderId = decodeURIComponent(path.split('/').pop())
      const mock = mocks.planDetail
      if (mock?.fail) return respond(res, mock)
      // como el backend real: inexistente, ajeno o no listo -> 404
      if (!mock?.detail || mock.detail.orderId !== orderId) {
        return send(res, 404, { message: 'Plan no encontrado' })
      }
      return send(res, 200, mock.detail)
    }

    if (path === '/me/consultations' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return respond(res, mocks.consultations, mocks.consultations?.consultations ?? [])
    }

    if (/^\/me\/consultations\/[^/]+$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const consultationId = decodeURIComponent(path.split('/').pop())
      const mock = mocks.consultationDetail
      if (mock?.fail) return respond(res, mock)
      // como el backend real: inexistente o ajena -> 404
      if (!mock?.detail || mock.detail.consultationId !== consultationId) {
        return send(res, 404, { message: 'Consulta no encontrada' })
      }
      return send(res, 200, mock.detail)
    }

    // ---- pago con Webpay: inicio (exige la sesión del dueño de la orden) ----
    // mock webpay: { orderId, outcome, productType?, abort?, statusAfterCommit?, startFail?, commitFail? }
    if (/^\/orders\/[^/]+\/payments$/.test(path) && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.webpay
      if (!mock) return unmocked(res, method, path, 'webpay')
      if (mock.fail) return respond(res, mock)
      if (mock.startFail) {
        return send(res, 503, { message: 'No pudimos conectar con el medio de pago', code: 'PAYMENT_UNAVAILABLE' })
      }
      return send(res, 201, { url: `http://localhost:${PORT}/__webpay/form`, token: WEBPAY_TOKEN })
    }

    // ---- pago con Webpay: confirmación al volver (sin sesión, la llama /api/webpay/return) ----
    if (path === '/payments/webpay/commit' && method === 'POST') {
      const mock = mocks.webpay
      if (!mock) return unmocked(res, method, path, 'webpay')
      if (mock.commitFail) {
        return send(res, 503, { message: 'No pudimos conectar con el medio de pago', code: 'PAYMENT_UNAVAILABLE' })
      }
      const known = [body?.tokenWs, body?.tbkToken].includes(WEBPAY_TOKEN) || body?.tbkBuyOrder === WEBPAY_BUY_ORDER
      if (!known) return send(res, 404, { message: 'Pago no encontrado' })
      // el estado de la orden que verá /pago/[orderId] después de confirmar
      if (mock.statusAfterCommit) mocks.orderStatus = { sequence: [mock.statusAfterCommit], calls: 0 }
      return send(res, 200, {
        orderId: mock.orderId,
        productType: mock.productType ?? 'GENERATED',
        outcome: body?.tbkToken || !body?.tokenWs ? 'cancelled' : mock.outcome,
      })
    }

    // ---- pago simulado: como en el backend real, exige la sesión del dueño de la orden ----
    // statusAfter: los estados que responderá orders/:id/status después de pagar, como en el backend real,
    // donde la orden recién pasa a PAID con este pago.
    if (/^\/dev\/orders\/[^/]+\/simulate-payment$/.test(path) && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.payment
      if (!mock) return unmocked(res, method, path, 'payment')
      if (!mock.fail && mock.statusAfter) mocks.orderStatus = { sequence: mock.statusAfter, calls: 0 }
      return respond(res, mock, { status: 'processed' })
    }

    // ---- rechazo de pago simulado ----
    if (/^\/dev\/orders\/[^/]+\/simulate-payment-rejection$/.test(path) && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.paymentRejection
      if (!mock) return unmocked(res, method, path, 'paymentRejection')
      if (!mock.fail && mock.statusAfter) mocks.orderStatus = { sequence: mock.statusAfter, calls: 0 }
      return respond(res, mock, { status: 'rejected' })
    }

    // ---- estado de la orden (polling de /ordenes/[id]) ----
    if (/^\/orders\/[^/]+\/status$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.orderStatus
      if (!mock) return unmocked(res, method, path, 'orderStatus')
      if (mock.fail) return respond(res, mock)
      // { notFound: true } => la orden no existe o no es del usuario (404, regla R2)
      if (mock.notFound) return send(res, 404, { message: 'Orden no encontrada' })
      return send(res, 200, nextInSequence(mock))
    }

    return unmocked(res, method, path, 'sin handler en el backend falso')
  } catch (err) {
    violations.push({ kind: 'fake-backend-error', method, path: fullPath, detail: String(err) })
    return send(res, 500, { message: err instanceof Error ? err.message : 'Error interno del backend falso' })
  }
})

server.listen(PORT, () => {
  console.log(`[fake-backend] escuchando en http://localhost:${PORT}`)
})
