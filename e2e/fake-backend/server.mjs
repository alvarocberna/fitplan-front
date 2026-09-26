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
// El estado es global (no por test), por eso la suite corre en serie (workers: 1).
import http from 'node:http'

const PORT = Number(process.env.FAKE_BACKEND_PORT ?? 3101)
const E2E_ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? 'e2e-access-token'

// mocks: { [nombre]: config } — ver cada handler abajo para la forma de cada uno
let mocks = {}
let calls = []

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
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

// Aplica una respuesta configurada: { fail: true, status?, message? } => error; si no => body.
function respond(res, config, body) {
  if (config?.fail) return send(res, config.status ?? 500, { message: config.message ?? 'Error del backend de prueba' })
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

const PANEL_SUMMARY_DEFAULT = {
  firstName: 'Ana',
  middleName: null,
  paternalLastName: 'Pérez',
  maternalLastName: null,
  age: 30,
  lastConsultationDate: null,
  goal: null,
  nutritionalPlan: null,
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const path = url.pathname
  const method = req.method ?? 'GET'

  try {
    // ---- control ----
    if (path === '/__health') return send(res, 200, { ok: true })
    if (path === '/__control/reset' && method === 'POST') {
      mocks = {}
      calls = []
      return send(res, 200, { ok: true })
    }
    if (path === '/__control/calls' && method === 'GET') return send(res, 200, calls)
    if (path === '/__control/mock' && method === 'POST') {
      const { name, config } = await readJson(req)
      mocks[name] = { ...config, calls: 0 }
      return send(res, 200, { ok: true })
    }

    const body = ['POST', 'PATCH', 'PUT'].includes(method) ? await readJson(req) : undefined
    calls.push({ method, path, authorized: isAuthorized(req), body })

    // ---- perfil (Server Actions syncProfileAction / updateProfileAction) ----
    if (path === '/auth/perfil') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.profile
      if (method === 'POST') return respond(res, mock, { ...PROFILE_DEFAULT, ...(mock?.profile ?? {}) })
      if (method === 'PATCH') {
        // el perfil queda completo con lo que el formulario envió (firstName, paternalLastName, gender, dateOfBirth)
        return respond(res, mock, { ...PROFILE_DEFAULT, ...(mock?.profile ?? {}), ...body, profileComplete: true })
      }
    }

    // ---- chat de anamnesis ----
    if (path === '/consulta/chat' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.chat
      if (!mock) return send(res, 501, { message: 'consulta/chat sin mock' })
      if (mock.fail) return respond(res, mock)
      return send(res, 200, nextInSequence(mock))
    }

    // ---- crear orden ----
    if (path === '/ordenes/crear' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.createOrder
      if (!mock) return send(res, 501, { message: 'ordenes/crear sin mock' })
      return respond(res, mock, { orderId: mock.orderId ?? 'order-e2e-123' })
    }

    // ---- planes predefinidos ----
    // ficha pública de una versión (sin auth, como en el backend real): responde con el code pedido
    if (/^\/productos\/predefinidos\/[^/]+$/.test(path) && method === 'GET') {
      const mock = mocks.predefinedProduct
      if (!mock) return send(res, 501, { message: 'productos/predefinidos sin mock' })
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

    if (path === '/ordenes/crear-predefinido' && method === 'POST') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.createPredefinedOrder
      if (!mock) return send(res, 501, { message: 'ordenes/crear-predefinido sin mock' })
      return respond(res, mock, { orderId: mock.orderId ?? 'order-predef-1' })
    }

    // ---- panel: resumen del usuario y listado de planes (el destino tras pagar un plan predefinido) ----
    if (path === '/panel/resumen' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return send(res, 200, mocks.panelSummary?.summary ?? PANEL_SUMMARY_DEFAULT)
    }

    if (path === '/ordenes' && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      return send(res, 200, mocks.orders?.orders ?? [])
    }

    // ---- pago simulado (sin auth en el backend real: es el stand-in del webhook) ----
    if (/^\/webhooks\/ordenes\/[^/]+\/simular-pago$/.test(path) && method === 'POST') {
      const mock = mocks.payment
      if (!mock) return send(res, 501, { message: 'simular-pago sin mock' })
      return respond(res, mock, { status: 'pagado' })
    }

    // ---- estado de la orden (polling de /ordenes/[id]) ----
    if (/^\/ordenes\/obtener-estado\/[^/]+$/.test(path) && method === 'GET') {
      if (!isAuthorized(req)) return send(res, 401, { message: 'No autorizado' })
      const mock = mocks.orderStatus
      if (!mock) return send(res, 501, { message: 'ordenes/obtener-estado sin mock' })
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
