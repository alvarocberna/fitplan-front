# Manejo de errores (frontend)

Cómo maneja los errores `nutricionista-virtual-front` (estado al 2026-10-03). El lado del backend está en
`nutricionista-virtual-back/doc/error-handling.md`, y el manejo de errores a nivel de flujo de compra (estados
de la orden, qué ve el usuario en cada etapa) en `../doc/flows/purchase-flow-personalized-plan.md` §7.

## 1. Mapa general

Un error del backend recorre siempre las mismas capas antes de llegar al usuario:

```
backend (HTTP no-2xx, o sin respuesta)
  └─ apiFetch            lanza ApiError(message, status, code, requestId)   src/shared/api/client.ts
      └─ runAction       lo atrapa → { ok: false, message, status, code }   src/shared/api/action-result.ts
          └─ XxxService  unwrap(): lanza ActionError / SessionRequiredError src/shared/api/unwrap.ts
              ├─ Client Component   try/catch → notifyError (toast o login) / estado de la vista
              └─ Server Component   withSession (login) → error.tsx (boundary) o notFound()
```

| Mecanismo | Dónde | Para qué |
|---|---|---|
| `ApiError` | `src/shared/api/client.ts` | Error de una llamada al backend, con `status`, `code`, `requestId`, `errors` |
| `ActionResult` + `runAction` | `src/shared/api/action-result.ts` | Las Server Actions no lanzan: devuelven el error como valor |
| `unwrap` / `unwrapOrNull` | `src/shared/api/unwrap.ts` | Convierte el `ActionResult` fallido en un `throw` para el llamador |
| `ActionError`, `SessionRequiredError` | `src/shared/api/unwrap.ts` | Error con `status`/`code`; y el caso "no hay sesión" |
| `notifyError` | `src/shared/errors/notify-error.ts` | Único punto para avisar un error en un Client Component |
| `withSession` | `src/shared/auth/with-session.ts` | Sesión vencida en un Server Component → `/login` |
| Estados de vista | páginas y hooks | Errores esperados del negocio (orden expirada, pago rechazado, …) |
| `error.tsx` / `global-error.tsx` | `src/app/` | Errores no controlados durante el render |
| `useReportError` + `reportClientErrorAction` | `src/shared/errors/` | Reporta al servidor lo que atrapa un boundary |
| `notFound()` + `not-found.tsx` | páginas | Recurso inexistente o ajeno; URL inexistente |
| `src/proxy.ts` | raíz de `src/` | Sin cookie de sesión válida → redirect a `/login` |

No hay `alert()`/`confirm()` en el proyecto ni un servicio externo de reporte de errores (decisión explícita:
la correlación se hace con `requestId` y `digest` sobre los logs).

## 2. Clientes HTTP

### 2.1 `apiFetch` — backend de órdenes/consultas (`src/shared/api/client.ts`)

`server-only`. Todo lo que puede salir mal termina en un `ApiError` cuyo `message` es **siempre un texto en
español apto para mostrar**:

| Situación | `status` | `code` | `message` |
|---|---|---|---|
| Respuesta no-2xx con el contrato del backend | el HTTP | el del backend | el `message` del backend |
| Respuesta no-2xx sin un `message` utilizable (HTML de un proxy, `message` que no es string) | el HTTP | — | por defecto según el status (401, 404, 5xx, resto) |
| Sin respuesta (backend caído, DNS) | `0` | `NETWORK_ERROR` | `No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.` |
| Timeout (90 s, `AbortSignal.timeout`) | `0` | `TIMEOUT` | `El servidor tardó demasiado en responder. Intenta nuevamente.` |
| 2xx cuyo body no es JSON | el HTTP | `INVALID_RESPONSE` | genérico |

El backend responde `{ statusCode, code, message, errors?, requestId, timestamp, path }` con `message` como
string en español; `errors` (detalle de validación, en inglés) se conserva en `ApiError.errors` pero **no se
muestra**. Nunca llegan al usuario textos como `fetch failed`, `Internal server error` o `Error HTTP 502`.

Cada llamada genera un `x-request-id` (`crypto.randomUUID()`) que viaja al backend; el backend lo devuelve en
sus errores y lo deja en sus logs. Los fallos sin respuesta se registran con `console.error` en el servidor de
Next junto a ese id.

### 2.2 `apiFetchCMS` / `apiFetchFormData` — backend CMS (`src/shared/api/client-cms.ts`)

Corre en el navegador (vía el rewrite `/api/*`) y en el servidor. Lanza `CmsApiError` (con `status`):

- **401 → refresh y reintento único**: `POST auth/refresh` (una sola promesa compartida entre requests
  concurrentes). Si el refresh falla —por respuesta o por red— lanza `CmsApiError('Sesión expirada', 401)`.
- **Otros no-2xx**: el `message` del CMS si es un texto; si no, un genérico en español.
- **Sin respuesta**: `CmsApiError` con `status: 0` y el mismo mensaje de red que `apiFetch`.
- **CSRF**: `ensureCsrfToken()` atrapa cualquier fallo en silencio; la request mutante sale sin token y es el
  CMS quien la rechaza.

## 3. Server Actions: el error como valor

Todas las acciones (`src/features/*/services/*.actions.ts`, `src/shared/auth/profile.actions.ts`) envuelven su
llamada en `runAction`, que nunca lanza:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string; status?: number; requestId?: string }
```

- **`ApiError`** → se copian `message`, `status`, `code` y `requestId`. Un **401** del backend se normaliza a
  `code: 'unauthenticated'` (el backend responde 401 cuando falta el token o no se pudo refrescar).
- **5xx o sin respuesta** → además se registra en el log del servidor de Next:
  `[action] backend 503 LLM_UNAVAILABLE (requestId …)`. Con ese id se busca la misma request en el log del backend.
- **Cualquier otro error** (un bug nuestro) → se registra completo con `console.error` y al cliente solo le llega
  `Ocurrió un error inesperado. Intenta nuevamente.`: su mensaje interno no se filtra.

El motivo de devolver el error como valor (detallado en `doc/auth.md`): en producción Next reemplaza el mensaje
de un error **lanzado** desde una Server Action por uno genérico.

### `unwrap` en los servicios

Los `XxxService` (`ConsultationService`, `DashboardService`, `MeasurementsService`, `PlansService`,
`ProfileService`) usan el `unwrap` compartido de `src/shared/api/unwrap.ts`:

- `unwrap(result)` → el dato, o lanza `ActionError` (conserva `status`, `code`, `requestId`); si
  `code === 'unauthenticated'` lanza `SessionRequiredError`.
- `unwrapOrNull(result)` → igual, pero un **404** devuelve `null` (`getConsultation`, `getPlan`,
  `getLatestPlanProjection`, `getMeasurement`).

Helpers para quien atrapa: `isSessionRequiredError(error)`, `isNotFoundError(error)`. Todo se exporta desde
`@/shared`.

## 4. Errores en Client Components

### 4.1 `notifyError`

`notifyError(error, fallback)` es el único punto para avisar un error atrapado:

- `SessionRequiredError` → navega a `/login?error=session_expired` (devuelve `true`), sin toast.
- Cualquier otro → `toast.error(error.message || fallback, { autoClose: 6000 })`.

`ToastContainer` se monta una vez en el layout raíz (`Providers`): arriba a la derecha, tema `colored`,
`autoClose` de 4 s por defecto (6 s los errores).

| Componente | Disparador | Mensaje |
|---|---|---|
| `ChatAnamnesis` | falla un turno del chat | el del error, o `No pudimos enviar tu mensaje. Intenta nuevamente.` (el mensaje del usuario queda en pantalla) |
| `FormMeasurements` | faltan datos de pasos anteriores | fijo: `Faltan datos de pasos anteriores` |
| `FormMeasurements` | falla la evaluación de factibilidad | el del error, o `No pudimos evaluar tu objetivo, intenta nuevamente` |
| `FormUserInfo` | falla `PATCH me` | el del error, o `No se pudo guardar tu información` |
| `GenerateOrderButton` | faltan datos del contexto | fijo: `Faltan datos de pasos anteriores` |
| `GenerateOrderButton` | falla `POST consultations` | el del error, o `Error al iniciar la consulta` |
| `CartView` | falla la creación de la orden | el del error, o `No se pudo iniciar el pago` (sesión vencida → `LoginModal`) |
| `/pago/[orderId]` | falla el pago o el rechazo simulado | el del error, o `Error al procesar el pago` |
| `ProfileForm`, `MeasurementForm` | falla guardar | el del error, o un mensaje fijo |
| `TestimonialFormPublic` | falla el envío al CMS | el del CMS, o `Error al enviar el testimonio` |

### 4.2 Errores esperados como estado de la vista

- **`/pago/[orderId]`**: al montar lee el estado de la orden. `EXPIRED` → "Esta orden expiró"; `REJECTED` →
  aviso `role="alert"` y reintento; `PAID` → redirige sin cobrar; **404 → "Orden no encontrada"**. Si la lectura
  falla por otro motivo se asume pagable (el backend valida igual). Si el pago falla, se vuelve a leer el
  estado: expirada o inexistente muestran su vista en vez del toast.
- **`/ordenes/[id]`** (polling cada 4 s):
  - `generationStatus ERROR` → "Tu pago está a salvo", con el número de la orden para contactar soporte.
  - `paymentStatus REJECTED` / `EXPIRED` → sus vistas.
  - **404** → "Orden no encontrada" y se detiene el polling.
  - **Sesión vencida** → `/login`.
  - **Error puntual** → se reintenta en el siguiente tick. Tras **5 fallos consecutivos** se detiene y muestra
    "No pudimos consultar el estado de tu orden" con un botón "Reintentar" que reinicia el polling. Una
    consulta exitosa reinicia la cuenta.
  - Pasados 45 s generando aparece el aviso "esto está tardando más de lo normal".
- **`FormMeasurements`**: objetivo no factible → `GoalNotFeasible` (`role="alert"`) con el mensaje del backend.
- **Hooks de `plans`** (`usePredefinedProduct`, `usePersonalizedProduct`, `usePlanPreviews`): exponen un estado
  (`unavailable` / `error`) en vez de propagar; el llamador muestra un aviso o cae a un respaldo estático.

Los efectos asíncronos usan una bandera local `cancelled` para no tocar estado tras desmontar.

### 4.3 Validación de formularios

`react-hook-form`, con reglas en `register` y el mensaje bajo el campo: `FormUserInfo`, `ProfileForm`,
`MeasurementForm`, `TestimonialFormPublic` y `FormMeasurements` (peso 20–300, talla 100–250 y contextura
requerida, cada uno con su mensaje; `noValidate` en el `<form>`). No hay librería de esquemas: la validación
definitiva la hace el backend.

### 4.4 Contextos

`ConsultationProvider` y `PlanSelectionProvider` leen y escriben `localStorage` dentro de `try/catch` vacíos:
un JSON corrupto o un storage no disponible equivale a "sin estado guardado".

## 5. Errores en Server Components

### 5.1 Sesión vencida: `withSession`

El proxy deja pasar mientras la cookie de sesión sea válida (7 días), pero el access token puede no poder
refrescarse. Las páginas `async` de `(sesion)` cargan sus datos dentro de
`withSession(() => …)` (`src/shared/auth/with-session.ts`, `server-only`): si el servicio lanza
`SessionRequiredError` hace `redirect('/login?error=session_expired')`; cualquier otro error sigue hacia el
boundary. Lo usan `/inicio`, `/planes`, `/mediciones`, `/perfil` y sus detalles. `/consulta/inicio` y
`/consulta/informacion-personal` hacen lo mismo mirando `result.code === 'unauthenticated'`.

### 5.2 Boundaries (`error.tsx`)

| Archivo | Cubre | Qué conserva |
|---|---|---|
| `src/app/(sesion)/error.tsx` | todo el área de sesión | `(sesion)/layout.tsx`: barra superior y sidebar |
| `src/app/error.tsx` | el resto (`/`, `/login`, `/testimonios`, `/articulos`, `/planes-estandar`, `/carrito`, `/dev/*`) | el layout raíz |
| `src/app/global-error.tsx` | un error en el propio layout raíz | nada: define su propio `<html>`/`<body>` |

Los tres muestran "Algo salió mal", el `digest` de Next como "Referencia" y un botón "Reintentar" (`reset()`).
**Nunca renderizan `error.message` ni el stack.** El texto pide reintentar y, si persiste, contactar indicando
la referencia: no afirma que alguien ya fue notificado.

Todos usan `useReportError(error, boundary)`, que registra el error en la consola del navegador y lo envía a
`reportClientErrorAction`: queda en el log del servidor de Next como `[client error] { boundary, digest, path,
message, stack }` (campos acotados en tamaño). El `digest` es el mismo que Next imprime junto al error original
de un Server Component, así que sirve para encontrarlo. El reporte es *best-effort*.

**Por qué `(sesion)` tiene el suyo**: un `error.tsx` reemplaza el contenido de su segmento pero no el
`layout.tsx` de su misma carpeta. Con solo el de raíz, un fallo en `/inicio` se llevaría el `SesionShell` completo.

`global-error.tsx` es autocontenido a propósito (estilos inline, sin el barrel `@/shared`): reemplaza el layout
raíz, y el CSS global se carga de forma transitiva (`layout.tsx` tiene el import de `globals.css` comentado).

### 5.3 `notFound()` y carga

- Detalles de `(sesion)` (`/inicio/consultas/[id]`, `/planes/[orderId]`, `/mediciones/[id]` y su `editar`):
  `null` del servicio (404 del backend) → `notFound()`, cada uno con su `not-found.tsx`.
- `/planes-estandar/[slug]` (slug fuera del catálogo) y `/articulos/[slug]` (`getArticleBySlug` devuelve
  `null`) → `notFound()`.
- `src/app/not-found.tsx`: 404 global para cualquier URL inexistente y para los `notFound()` sin página propia.
- `src/app/(sesion)/loading.tsx`: spinner mientras el Server Component de una página de sesión espera al backend.

### 5.4 Páginas que degradan en vez de fallar

- **`/consulta/inicio`**: si `syncProfileAction` falla (y no es por sesión), "Iniciar" lleva a
  `/consulta/informacion-personal`; si falla el precio, el paso de pago se muestra sin monto.
- **`/consulta/informacion-personal`**: si `syncProfileAction` falla (y no es por sesión), el formulario se
  muestra vacío.

## 6. Sesión y autenticación

| Punto | Comportamiento ante el error |
|---|---|
| `src/proxy.ts` | Cookie `session` ausente o inválida en una ruta protegida → redirect a `/login` |
| `session.ts` · `decrypt` | `JWTExpired` → `'expired'`; cualquier otro fallo de verificación → `null`. La lectura de `SESSION_SECRET` está **fuera** del `try`: si falta, lanza (no se disfraza de "sin sesión") |
| `tokens.ts` · `getValidAccessToken` | Falla el refresh contra Cognito → `console.error` y `null` (la request sale sin `Authorization`, el backend responde 401 y la UI lleva a login) |
| `cognito-config.ts` | Faltan variables → `throw`. Si falla el discovery se limpia la promesa cacheada para reintentar |
| `api/cognito/login` | Falta `COGNITO_REDIRECT_URI` o falla el discovery → `console.error` + redirect a `/login?error=login_unavailable` |
| `api/cognito/callback` | Falla el intercambio → `/login?error=callback_failed`. Falla `me/sync` posterior → se continúa (el login ya fue exitoso) |
| `api/cognito/logout` | Falta la configuración de Cognito → se borra igual la sesión local y se vuelve a `/` |
| `/login` | Traduce `?error=` (`callback_failed`, `session_expired`, `login_unavailable`, `email_not_verified`) a un aviso `role="alert"` |

Resumen del 401: un Server Action recibe 401 → `code: 'unauthenticated'` → `SessionRequiredError` → en un Client
Component `notifyError` lleva a `/login`; en un Server Component lo hace `withSession`. `CartView` es la
excepción: abre `LoginModal` para no perder el carro.

## 7. Qué ve el usuario y qué queda registrado

- **Ve**: mensajes en español (del backend o del frontend), el `digest` en un boundary y el número de orden en
  la vista de error de generación.
- **No ve**: stack traces, rutas de archivo, textos técnicos del runtime ni el `message` de un error no
  controlado. Además `productionBrowserSourceMaps: false` y `poweredByHeader: false` en `next.config.ts`.
- **Log del servidor de Next**: `[api] … sin respuesta (requestId …)`, `[action] backend 5xx … (requestId …)`,
  `[action] error inesperado`, `[client error] {…}`, y los de `tokens.ts` y las rutas de Cognito.

## 8. Tests

Detalle en `doc/testing.md`. Lo relacionado con errores:

- `client.test.ts` (contrato, mensajes por defecto, red, timeout), `action-result.test.ts`, `unwrap.test.ts`,
  `notify-error.test.ts`, `with-session.test.ts`, `session.test.ts`, `client-cms.test.ts`.
- `error-boundaries.test.tsx`: los tres boundaries (no muestran el mensaje, reportan, reintentan).
- `orders-id-page.test.tsx` (404, sesión, 5 fallos consecutivos y reintento) y `pago-page.test.tsx`.
- `login-logout.route.test.ts` y `route.test.ts` del callback de Cognito.
- Tests de componentes (toasts vía `notifyError`, validación de `FormMeasurements`) y de servicios.
- E2E: el backend falso (`e2e/fake-backend/server.mjs`) responde los errores con el contrato real y `501` a
  cualquier endpoint sin mock.

## 9. Cómo manejar un error nuevo

1. La Server Action envuelve la llamada en `runAction`; nunca lanza.
2. El servicio expone un método que hace `unwrap` (o `unwrapOrNull` si un 404 es un resultado válido).
3. En un Client Component: `try/catch` → `notifyError(error, 'mensaje de respaldo')`. Si el error es un
   resultado esperado del negocio, se modela como estado de la vista (usa `isNotFoundError`, `error.code`).
4. En un Server Component de `(sesion)`: carga dentro de `withSession`; sin `try/catch` propio (lo toma el
   boundary), salvo `null` → `notFound()`.
5. Para distinguir un caso del backend, usa `code` (p. ej. `ORDER_EXPIRED`), nunca el texto del mensaje.
6. Un endpoint nuevo necesita su handler en `e2e/fake-backend/server.mjs`, incluidas sus respuestas de error.

## 10. Pendiente

- **Servicio de reporte de errores** (Sentry o similar): no integrado por decisión; hoy el reporte de los
  boundaries llega solo al log del servidor de Next.
- **Detalle de validación por campo**: `ApiError.errors` trae los mensajes del backend (en inglés) pero no se
  propagan al cliente ni se pintan bajo cada campo.
- **`/testimonios` y `/articulos`** siguen dependiendo del boundary si el CMS falla: no tienen una vista
  degradada propia.
- **E2E de los casos nuevos** (404 de orden, sesión vencida, backend caído): cubiertos por tests unitarios, no
  por Playwright.
