# Autenticación con Amazon Cognito

## Resumen

La app usa Amazon Cognito (Hosted UI, flujo Authorization Code con cliente confidencial) como
proveedor de identidad — login nativo (usuario/contraseña) y **Google como Identity Provider
federado**. Implementado con `openid-client@6` sobre Route Handlers de Next.js.

A diferencia de la primera versión de esta funcionalidad, **el backend (`nutricionista-virtual-back`)
ya no es ciego a esto**: valida el Access Token de Cognito y resuelve la identidad real
(`User`/`AuthIdentity` en Postgres). El navegador nunca llama al backend directo — todo pasa por
**Server Actions** de Next.js, que adjuntan el token. Detalle del lado del backend:
`nutricionista-virtual-back/doc/auth.md`. Flujo end-to-end completo (ambos repos + DB):
`doc/flow.md` de este mismo directorio.

## Piezas implementadas — Cognito Hosted UI (login/logout)

### `src/shared/auth/cognito-config.ts`
Singleton perezoso y cacheado de la `Configuration` de `openid-client`, construido con
`discovery(new URL(COGNITO_ISSUER_URL), COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)`. Marcado con
`import 'server-only'` porque maneja `COGNITO_CLIENT_SECRET`.

### `src/shared/auth/session.ts`
Sesión propia de la app como cookie `session` **cifrada** (JWE: `jose`'s `EncryptJWT`/`jwtDecrypt`,
`dir` + `A256GCM`, clave de 256 bits = SHA-256 de `SESSION_SECRET`), `httpOnly`, `secure` en producción,
`sameSite: 'lax'`, 7 días de expiración. Va cifrada y no solo firmada porque contiene el access y el
refresh token de Cognito. `SESSION_SECRET` debe tener al menos 32 caracteres (obligatorio en producción).

El payload guarda **más que el perfil del usuario**: también los tokens de Cognito, necesarios
para autenticar las llamadas al backend (ver sección "Server Actions" más abajo).

```ts
interface SessionData {
  userInfo: Record<string, unknown>   // claims de Cognito (email, sub, ...)
  accessToken: string                 // se manda al backend como Authorization: Bearer
  refreshToken: string | null         // para renovar el access_token sin re-loguear
  accessTokenExpiresAt: number        // epoch ms
}
```

- `createSession(data: SessionData)` — setea la cookie. La usa el callback tras el login, y
  `tokens.ts` cuando refresca el access_token.
- `deleteSession()` — borra la cookie. La usa el logout.
- `getSession()` — API pública para UI, nunca expone tokens. Devuelve
  `{ isAuthenticated, status: 'authenticated' | 'expired' | 'anonymous', userInfo }`. `status`
  distingue "nunca inició sesión" de "la sesión expiró" (usa `jose`'s `errors.JWTExpired`).
- `getRawSession()` — uso interno (`tokens.ts`), devuelve el `SessionData` completo con tokens.
- `hasValidSession(token)` — verificación optimista usada por `src/proxy.ts` para el gating de
  rutas (ver más abajo); no distingue expirado de inválido, solo "¿alcanza para dejar pasar?".

### `src/shared/auth/tokens.ts` — refresh silencioso del access_token
`getValidAccessToken(): Promise<string | null>` — devuelve un access_token vigente para llamar al
backend. Si el guardado en la cookie venció, lo refresca contra Cognito (`refreshTokenGrant`) antes
de devolverlo, sin pedirle al usuario que vuelva a loguearse mientras el `refresh_token` siga
vigente.

**Detalle no obvio, encontrado en verificación manual**: persistir el token refrescado
(`createSession(...)`) solo funciona si la llamada corre dentro de un Server Action o Route
Handler — Next.js no permite escribir cookies durante el render de un Server Component. Como
`getValidAccessToken()` se invoca tanto desde Server Actions reales (ej. al enviar un mensaje del
chat) como desde el render de páginas (`consulta/inicio`, `informacion-personal`, que llaman a
`syncProfileAction()` directo para decidir a dónde redirigir), el intento de persistir puede fallar
en el segundo caso. Por eso el refresh contra Cognito y el intento de persistir la cookie están en
`try/catch` **separados**: si falla solo la escritura de la cookie, se loguea un warning pero el
token recién obtenido igual se devuelve y se usa para esa respuesta — se persistirá en la próxima
llamada real desde un Server Action.

### `src/app/api/cognito/login/route.ts`
`GET` que genera `state`/`nonce` (`randomState()`/`randomNonce()`), construye la URL de autorización
y redirige. Guarda `state`/`nonce` en dos cookies `httpOnly` de vida corta (10 min: `cognito_state`,
`cognito_nonce`).

Acepta dos query params opcionales, ambos con allowlist explícita (nunca se reflejan valores
arbitrarios sin validar hacia la URL de autorización de Cognito):
- **`?screen_hint=signup`** — salta directo a la pantalla de registro nativo de la Hosted UI en vez
  de la de login. Usado por el botón "Registro".
- **`?identity_provider=Google`** — salta directo al consentimiento de Google (evita la pantalla
  nativa de la Hosted UI). Usado por el botón "Continuar con Google". Requiere que Google esté
  habilitado como Identity Provider federado en el User Pool + App Client (configuración de AWS,
  fuera de este repo).

No usa PKCE (solo `state` + `nonce`) — válido porque el intercambio de código ocurre server-side
en `callback/route.ts`, no en el navegador (ver `doc/architecture/deployment-architecture.md §6`
del repo raíz para la justificación completa de esta divergencia respecto a la recomendación
estándar de "cliente público + PKCE").

### `src/app/api/cognito/callback/route.ts`
El `redirect_uri` real registrado en Cognito. Lee `cognito_state`/`cognito_nonce`, las borra,
intercambia el `code` por tokens (`authorizationCodeGrant`), obtiene el `sub` del ID token y pide el
perfil con `fetchUserInfo`, y llama a `createSession({ userInfo, accessToken, refreshToken,
accessTokenExpiresAt })` — guarda los tokens, no solo el perfil (necesario para las llamadas
autenticadas al backend).

**Volver a un destino concreto (`return_to`)**: `/api/cognito/login` acepta `?return_to=<ruta>` (lo agrega el modal de
registro al pagar desde `/carrito`) y lo guarda en una cookie httpOnly de 10 minutos (`post_login_return_to`; si no se
pide destino, borra una vieja de un intento abandonado). El callback la lee y la borra, y **solo** si la ruta está en la
lista permitida de `src/shared/auth/return-to.ts` (hoy `/carrito`) redirige ahí en vez de a `/inicio` o `/consulta/inicio`;
cualquier otro valor se ignora (evita usar el login como redirección abierta). El chequeo de perfil (`POST /me/sync`)
se ejecuta igual: es lo que crea la identidad que el backend necesita para crear la orden.

**UX de errores**: si el intercambio falla (usuario cancela en Google/Hosted UI, `state` no
coincide, etc.), redirige a `/login?error=callback_failed` con un mensaje visible, en vez
de fingir éxito.

Al terminar (éxito), hace un chequeo **best-effort** del estado del perfil antes de decidir el
redirect: llama `POST /me/sync` (mismo endpoint que ya usaba `syncProfileAction()`) directo vía
`apiFetch`, con el `accessToken` que ya tiene en memoria de este mismo request (sin body: el email lo obtiene
el backend desde Cognito) — sin releer
la cookie de sesión recién escrita. Si `profileComplete === true`, redirige directo a **`/inicio`**,
saltándose `/consulta/inicio`. Si da `false`, o si la llamada falla (red, backend caído), redirige a
**`/consulta/inicio`** como antes — un fallo en este chequeo nunca bloquea el login ni manda a la
pantalla de error, porque la sesión ya se creó independientemente de él (el `try/catch` de este
chequeo es separado del que envuelve el intercambio de tokens). `/consulta/inicio/page.tsx` no
cambió: sigue llamando a `syncProfileAction()` por su cuenta como defensa en profundidad para quien
llegue ahí con perfil incompleto (o si el chequeo del callback falló) — en el caso "perfil
incompleto" eso implica una llamada duplicada a `POST /me/sync` (una en el callback, otra en
`/consulta/inicio`), aceptada como trade-off porque el endpoint es idempotente. Ver `doc/flow.md`
para el diagrama completo.

### `src/app/api/cognito/logout/route.ts`
`deleteSession()` + redirección al `/logout` propietario del Hosted UI de Cognito (arma la URL a
mano con `COGNITO_DOMAIN`; Cognito no publica `end_session_endpoint` para usar
`buildEndSessionUrl()` estándar). Solo cierra la sesión ante una navegación iniciada en el propio sitio
(cabeceras `Sec-Fetch-Site` / `Sec-Fetch-Mode`): un enlace en otro sitio o un `fetch` en segundo plano se
redirigen a `/` sin tocar la sesión. Por eso "Cerrar sesión" es un `<a>` común (`hardNavigation` en
`SesionNavLink`), que además borra del `localStorage` la consulta en curso (`clearClientState`).

### `src/app/login/page.tsx`
Tres opciones: **"Continuar con Google"** (`/api/cognito/login?identity_provider=Google`, con
ícono), separador "o con tu correo", **"Registro"** (`/api/cognito/login?screen_hint=signup`) e
**"Inicio de sesión"** (`/api/cognito/login`, nativo). Muestra el mensaje de error si
`?error=callback_failed` está presente en la URL.

### Botones "Iniciar Consulta" de la home — `getStartConsultationHref()`
Los dos botones "Iniciar Consulta" del sitio (navbar global y hero de la home) usan
`getStartConsultationHref()` (`session.ts`) para no mandar a todo el mundo a `/consulta/inicio` por
igual: sin sesión (o expirada) van directo a `/login`; con sesión, a `/consulta/inicio`
(que a su vez decide entre `informacion-personal`/`inicio` según el perfil — ver `doc/flow.md`).

**Gotcha de bundling a tener presente**: `Hero` (`hero.component.tsx`) y `NavbarLanding`
(`navbar-landing.component.tsx`) se re-exportan desde el barrel `@/features/index.ts`, que también
re-exporta un Client Component (`testimonial-form.component.tsx`). Eso arrastra el **barrel
entero** al bundle del navegador — cualquier componente re-exportado ahí que importe algo
`server-only` (como `getStartConsultationHref()`, que depende de `next/headers`) rompe el build,
sin importar que en la práctica solo se renderice server-side. Por eso ninguno de los dos llama a
`getStartConsultationHref()` internamente: el `href` se calcula en el Server Component padre real
(`src/app/page.tsx` para `Hero`, `src/app/layout.tsx` para `NavbarLanding`, ninguno de los dos
pasa por ese barrel) y se pasa como prop `startHref`. Cualquier componente nuevo que se agregue a
ese barrel y necesite código `server-only` va a pisar el mismo problema.

## El navegador nunca llama al backend directo — Server Actions

`apiFetch` (`src/shared/api/client.ts`) es `server-only` y lee `BACKEND_URL` (privada, sin prefijo
`NEXT_PUBLIC_`). Solo se invoca desde **Server Actions** (`'use server'`):

- `src/features/consultation/services/consultation.actions.ts` — `createOrderAction`,
  `simulatePaymentAction`, `sendAnamnesisTurnAction`, `getOrderStatusAction`. Las que llaman a
  endpoints protegidos (`/consultations`, `/consultations/chat`, `/orders/:id/status`) obtienen el
  token con `getValidAccessToken()` y lo adjuntan como `Authorization: Bearer`.
- `src/shared/auth/profile.actions.ts` — `syncProfileAction` (`POST /me/sync`) y
  `updateProfileAction` (`PATCH /me`), usadas por el flujo de registro/perfil (ver
  `doc/flow.md`).
- `src/features/profile/services/profile.actions.ts` — `getUserProfileAction` (`GET /me`) y
  `updateUserProfileAction` (`PATCH /me`), usadas por `/perfil` (ver sección "Área de usuario
  logueado" más abajo). Pegan al **mismo** recurso que `src/shared/auth/profile.actions.ts`
  (el backend unificó `auth/perfil` y `user/me` en `/me`, con un único DTO de campos opcionales): este
  archivo solo lee/edita nombre, apellido y fecha de nacimiento, mientras que `updateProfileAction`
  completa el perfil obligatorio (género, deportista) que gatea el wizard de `/consulta/*`.
- `src/features/dashboard/services/dashboard.actions.ts` — `getDashboardSummaryAction` (`GET /me/summary`) y
  `getMyConsultationsAction` (`GET /me/consultations`), usadas por `/inicio`, y
  `getMyConsultationAction` (`GET /me/consultations/:id`), usada por `/inicio/consultas/[id]`,
  `getMyPlansAction` (`GET /me/plans`, `/inicio`) y `getMyPlanAction` (`GET /me/plans/:orderId`,
  `/planes/[orderId]` y `/inicio/consultas/[id]`).
- `src/features/measurements/services/measurements.actions.ts` — `getMyMeasurementsAction`
  (`GET /me/measurements`, `/inicio`), `getMyMeasurementAction` (`GET /me/measurements/:id`),
  `recordMeasurementAction` (`POST /me/measurements`) y `updateMeasurementAction`
  (`PATCH /me/measurements/:id`), usadas por `/mediciones/*` vía `MeasurementsService`.
- `src/shared/api/action-result.ts` — `ActionResult<T>`/`runAction()` compartido por todos los
  archivos de arriba. Las acciones **no lanzan** errores (siguen la guía oficial de Next para
  Server Functions: *"avoid using try/catch blocks and throw errors. Instead, model expected
  errors as return values"*), devuelven `{ok: true, data} | {ok: false, message, status?, code?, requestId?}`
  — evita que Next redacte el mensaje de error en producción. Un 401 del backend sale con
  `code: 'unauthenticated'`. Los servicios "desenvuelven" el resultado con el `unwrap` compartido
  (`src/shared/api/unwrap.ts`), que lanza `ActionError` o, sin sesión válida, `SessionRequiredError`:
  los Client Components lo pasan a `notifyError` (lleva a `/login?error=session_expired`) y las páginas
  de `(sesion)` cargan sus datos dentro de `withSession`. Detalle en `doc/error-handling.md`.

Esto significa que el `Guard` del backend (`CognitoAuthGuard`) nunca ve una request directa del
navegador — todas llegan server-to-server desde el propio servidor de Next.js.

## Gating de rutas — `src/proxy.ts`

Verificación optimista (patrón "Optimistic checks with Proxy" de Next.js): antes del bloque que
genera el CSP, `requiresSession(pathname)` decide si la ruta necesita sesión combinando tres
mecanismos:

- **Prefijo `/consulta/`**: protegido por defecto salvo que esté en `PUBLIC_CONSULTA_PATHS` (solo
  `/consulta`, vacía y sin uso — `/consulta/inicio` ya requiere sesión como el resto de
  `/consulta/*`). Cualquier ruta nueva bajo `/consulta/*` no listada ahí queda protegida por
  defecto (fail-closed).
- **Prefijos `/pago` y `/ordenes`** (`SESSION_GATED_PREFIXES` / `isSessionGatedPrefix()` en
  `src/shared/auth/sesion-routes.ts`): protegen la raíz y todas las subrutas (`/pago`,
  `/pago/[orderId]`, `/ordenes`, `/ordenes/[id]`, y cualquier ruta nueva bajo esos prefijos —
  fail-closed). Completan el flujo de consulta → pago → orden, que ahora exige sesión de punta a
  punta.
- **`PROTECTED_PATHS`** (hoy `SESION_PATHS` / `isSesionRoute()` en `src/shared/auth/sesion-routes.ts`):
  un set explícito de rutas *fuera* de los prefijos anteriores que también requieren
  sesión — `/inicio`, `/planes`, `/mediciones` y `/perfil` (área de usuario logueado, ver sección siguiente), **con sus
  subrutas** (p. ej. `/inicio/consultas/[id]`, el detalle de una consulta): la comparación es por
  prefijo (`/inicio` y `/inicio/*`, sin falsos positivos tipo `/iniciox`). Una ruta nueva fuera de
  `/consulta/*`, `/pago/*`, `/ordenes/*`, `/inicio/*`, `/planes/*`, `/mediciones/*` y `/perfil/*` queda pública salvo que se agregue
  explícitamente a este set.

Si la ruta lo requiere, lee la cookie `session` con `request.cookies.get(...)` (no `cookies()` de
`next/headers`, para no depender de un comportamiento no verificado dentro de proxy) y, si no es
válida (`hasValidSession()`), redirige a `/login`. `/login` vive fuera de ambos mecanismos, así que
no necesita estar en ninguna allowlist.

`/pago/*` y `/ordenes/*` **antes no estaban protegidas** (ni en `PROTECTED_PATHS` ni bajo
`/consulta/*`) y ahora sí: sin sesión válida, el proxy responde con un redirect 307 a `/login`. Ojo
con la relación con el route group `(sesion)` (ver sección siguiente): el layout compartido solo
cambia cómo se ve la página, no agrega ninguna verificación de sesión — el proxy se rige por la URL,
no por en qué carpeta esté el archivo, y por eso el gating de `/pago/*` y `/ordenes/*` es un
mecanismo propio (`isSessionGatedPrefix`) y no un efecto de haberlas movido a `(sesion)`.

**E2E**: las specs de Playwright (`e2e/`) fabrican la cookie `session` (JWT cifrado con la clave derivada de
`SESSION_SECRET`, `e2e/helpers/session.ts`) para pasar por el proxy, y `e2e/session-routes.spec.ts`
verifica el gating (sin sesión → `/login`) y el layout de estas rutas. El login real contra Cognito no
se prueba en e2e. Ver `doc/testing.md`.

## Área de usuario logueado — layout `(sesion)`

Todas las rutas del route group `src/app/(sesion)/` (el paréntesis no agrega segmento a la URL)
comparten `src/app/(sesion)/layout.tsx`: `/inicio`, `/planes`, `/mediciones`, `/perfil`, `/consulta/*`, `/pago/[orderId]` y
`/ordenes/[id]` (`/pago` vivía antes en `src/app/pago/` con el navbar público; se movió a
`src/app/(sesion)/pago/` sin cambiar la URL).

El layout renderiza `SesionShell` (`src/shared/components/sesion-shell.component.tsx`, Client
Component), que arma la barra superior `TopbarSesion`
(`src/shared/components/topbar-sesion.component.tsx`), el sidebar `NavbarSesion`
(`src/shared/components/navbar-sesion.component.tsx`) y un `<main>` cuyo padding izquierdo (md+) sigue
el ancho actual del sidebar y cuyo padding superior (`pt-19 md:pt-23`) deja libre la barra superior
(estas rutas ya no muestran `NavbarLanding`: `NavbarLandingGate` se oculta con
`usesSesionLayout(pathname)`, ver `src/shared/auth/sesion-routes.ts`).

- **Barra superior (`TopbarSesion`)**: fija, 100% de ancho, `h-15` (60px). A la izquierda el logo de
  texto "Nuvi" (link a `/inicio`); a la derecha el botón "Nueva consulta" (link a `/consulta/anamnesis`). En
  móvil (<md) también aloja las opciones de navegación (Inicio, Planes, Mediciones, Perfil y Cerrar sesión, en variante
  `compact`: ícono sobre la etiqueta), porque el sidebar no se renderiza en esa resolución.
- **Sidebar (`NavbarSesion`, solo md+)**: `hidden md:flex`, fijo a la izquierda debajo de la barra
  superior (`top-15`, alto `calc(100vh - 3.75rem)`). Sus opciones son, en orden, Inicio (etiqueta
  visible de `/inicio`; el href sigue siendo `/inicio`), Planes (`/planes`), Mediciones (`/mediciones`),
  Perfil (`/perfil`) y Cerrar sesión (`/api/cognito/logout`), más el
  botón de acoplar/desacoplar (16×32px con una flecha, centrado sobre el borde derecho del sidebar;
  al pasar el mouse se ilumina su borde y el borde derecho del sidebar con `var(--color-primary)`); ya no incluye "Nueva consulta" (ahora vive en la barra
  superior). La opción activa se marca con el texto en `var(--color-primary)` y un rectángulo de 5px
  en el borde izquierdo, sin fondo. Las opciones y el link con ese estilo son compartidos entre
  sidebar y barra superior (`SESION_NAV_ITEMS`, `SesionNavLink` en
  `src/shared/components/sesion-nav-link.component.tsx`).
- **Sidebar acoplable (solo md+)**: desacoplado es `w-56` con los links; acoplado es `w-14` sin links
  (en mobile no hay sidebar, así que no aplica). Se alterna con el botón del borde derecho o con un
  click en cualquier parte del sidebar que no sea un link de navegación. El
  estado inicial depende de la sección: en `/consulta/*`, `/pago/*` y `/ordenes/*`
  (`isFocusRoute()`, "rutas de flujo") arranca **acoplado** para dejar espacio al contenido del
  flujo; en `/inicio`, `/planes`, `/mediciones` y `/perfil` arranca **desacoplado**. La elección manual del usuario
  (`SesionShell`, `useState`) persiste entre páginas de una misma sección mientras el layout no se
  remonte, y se descarta al cambiar entre la sección de usuario (inicio/planes/mediciones/perfil) y la de flujo (vuelve al valor
  por defecto de la nueva sección).
- **Padding de las páginas**: como el `<main>` del layout ya aporta el padding, los wrappers de
  las páginas de `/consulta/*`, `/pago/[orderId]` y `/ordenes/[id]` (que no deben sumar su propio
  `min-h-screen` ni un padding superior grande) usan `py-4` (`/pago`, además,
  `w-full flex justify-center px-6`) en vez del antiguo `min-h-screen py-24` / `pt-40` /
  `min-h-screen items-center` (que compensaban el navbar público o centraban en pantalla completa).
- **Gating**: `/inicio`, `/planes`, `/mediciones` y `/perfil` están en `PROTECTED_PATHS` (ver arriba); `/consulta/*` (salvo
  `/consulta`) y `/pago/*` + `/ordenes/*` se protegen por prefijo — sin sesión válida,
  `src/proxy.ts` redirige a `/login` antes de que el layout o la página se rendericen.
  `isSesionRoute()` (`/inicio`, `/planes`, `/mediciones`, `/perfil` y sus subrutas) e `isSessionGatedPrefix()` (`/pago`, `/ordenes`) son
  lo que consulta el proxy; `isFocusRoute()` y `usesSesionLayout()` (que agrupa `isSesionRoute` +
  `isFocusRoute`) solo deciden presentación (navbar/sidebar), no seguridad.

Páginas propias del área (además del flujo `/consulta/*`, documentado en `doc/flow.md`):

- **`/inicio`** (`src/app/(sesion)/inicio/page.tsx`, Server Component): llama en paralelo, vía
  `DashboardService` (`src/features/dashboard/services/dashboard.service.ts` → Server Actions de `dashboard.actions.ts`,
  que obtienen el access token con `getValidAccessToken()` y llaman al backend vía `apiFetch`),
  `getSummary()` (`GET /me/summary`), `getConsultations()` (`GET /me/consultations`), `getPlans()`
  (`GET /me/plans`), `MeasurementsService.getMeasurements()` (`GET /me/measurements`) y
  `getLatestPlanProjection()` (`GET /me/plans/latest/projection`); después, `getPlan()` del plan más reciente
  (`GET /me/plans/:orderId`, `null` sin planes o ante 404). Renderiza, en orden: `PersonalInfoCard`
  ("Información personal": ícono de usuario; nombre y edad en una fila; 100 % del ancho); en dos columnas del 50 %
  (apiladas en móvil) `PlanOverviewCard` (título "Información plan", que el detalle `/planes/[orderId]` no
  muestra; objetivo, régimen, duración y macronutrientes del último plan; "—" sin plan) y `MacroDistributionCard` (dona con el % de
  calorías de cada macronutriente, gramos debajo del %, vía `planMacrosOf`); `MeasurementsChart` (el mismo
  gráfico de `/mediciones`, con título interno "Evolución" que `/mediciones` no muestra); `ConsultationsList` (título "Mis consultas" y, sin card contenedor, un card por consulta con la estructura
  de `MyPlansList`: fecha y "Consulta N°X"; "Consulta nutricional" + estado, objetivo, régimen y macronutrientes
  con íconos (`MacrosRow`, compartido con `MyPlansList`); "Ver detalle" y, si está por pagar, "Pagar consulta";
  todo el card abre `/inicio/consultas/[id]`). Inicio ya no lista los planes: `getPlans()` solo elige el más
  reciente; la lista vive en `/planes`.
- **`/inicio/consultas/[id]`** (Server Component): `DashboardService.getConsultation(id)` (`GET /me/consultations/:id`;
  `null` ante 404 → "Consulta no encontrada") y, en paralelo, el plan de la consulta (`DashboardService.getPlan`,
  `GET /me/plans/:orderId`) y el detalle de cada medición (`MeasurementsService.getMeasurement`, `GET /me/measurements/:id`).
  `ConsultationDetail` reutiliza las cards de otras secciones: encabezado ("Consulta N°X", estado, fecha); `PlanOverviewCard`
  a ancho completo; fila 50/50 con `PlanFileCard` y `MacroDistributionCard`; `GeneratedPlanSections` (resumen por tiempo
  de comida, suplementación, recomendaciones deportivas — la misma de `/planes/[orderId]`); y "Mediciones" con
  `MeasurementDetail` en modo `embedded` (encabezado compacto con "Ver medición", sin "Volver"/"Editar"). Sin plan listo,
  en lugar de las cards del plan muestra su estado ("Pagar consulta", generando o error con "Ver estado del plan").
- **`/planes/[orderId]`** (Server Component): `DashboardService.getPlan(orderId)` (`GET /me/plans/:orderId`;
  `null` ante 404 → `notFound()` → "Plan no encontrado"; contenido al 90 % del ancho disponible). Renderiza `PlanDetail`:
  encabezado en dos columnas (apiladas en móvil) — a la izquierda (60 %) título, fecha de compra, una card
  "Datos del plan" (objetivo, régimen y duración, calculada con `planDurationLabel` de `dashboard/format.ts`
  desde `startDate`/`endDate`; "—" en los estándar o sin término) y, en la misma card tras una línea
  horizontal, los macronutrientes sin título propio (calorías, proteínas, carbohidratos y lípidos); a la derecha (40 %) la card del PDF (miniatura, "Plan nutricional",
  "PDF" y "Descargar plan"). Debajo, el detalle guardado en la base — personalizado: "Resumen Plan Nutricional"
  (un card de títulos "Tiempo | Alimentos | Aporte nutricional" y, debajo, una sub-card por tiempo de comida con esas 3 columnas: tiempo y hora | porciones con valor | calorías, proteínas, carbohidratos y lípidos en 2×2), "Suplementación" (título a la izquierda con ícono; por suplemento: nombre con ícono, Dosis 1/4 | Toma 3/4,
  aporte nutricional en un card interno de 4 columnas y Efectos | Consideraciones en 2 columnas) y
  "Recomendaciones deportivas" (título con ícono; por sesión: nombre con ícono, estrategia en un card interno y antes |
  durante | después de la actividad en 3 columnas con ícono, "—" sin dato) (la card "Tiempos de comida" con el detalle está oculta por ahora); estándar: descripción (sus datos
  del encabezado salen del resumen del producto). Ya no hay card "Resumen". Ninguna vista incrusta el PDF en un `<iframe>` (`PdfViewer` se eliminó).
- **`/mediciones/[id]`**, **`/mediciones/nueva`** y **`/mediciones/[id]/editar`**: detalle
  (`MeasurementDetail`, datos y resultados juntos por tema: card "Peso e IMC" con la escala del IMC por rangos
  OMS (`BmiScale`), card "Composición corporal" solo si hay componentes (barras en kg con `@nivo/bar` y torta
  en % del peso con `@nivo/pie`, sin grasa visceral y con "Resto"; `BodyCompositionCharts`) y card "Otras
  mediciones" (pliegues, perímetros, diámetros, talla sentado, envergadura e índices) solo si hay; la lógica
  vive en `features/measurements/measurement-detail-data.ts`; 404 → "Medición no encontrada"), registro y corrección de una medición (`MeasurementForm`, Client Component con
  react-hook-form que llama a `MeasurementsService` y, al guardar, navega al detalle). Registro y edición
  van dentro de una `Card` sólida. Todas vuelven a `/mediciones`. `/inicio` no muestra mediciones.
- **`/planes`** (`src/app/(sesion)/planes/page.tsx`, Server Component): título "Mis planes nutricionales"
  (arriba de la lista, a la izquierda) y `MyPlansList` (`DashboardService.getPlans()` → `GET /me/plans`, ya ordenados del más
  nuevo al más antiguo por el backend; sin card contenedor): cada plan es un card blanco de 3 columnas — ícono de comida en un cuadrado redondeado;
  nombre + tipo, fecha de compra, régimen, una línea divisoria y los 4 macronutrientes con su ícono (`features/dashboard/plan-icons.ts`,
  compartido con el detalle); "Ver plan" y "Descargar plan" (`pdfUrl`, URL firmada con `Content-Disposition: attachment`, que
  descarga el PDF completo en vez de abrirlo) — y el primero (el último plan) lleva una pestaña
  del color primario a la izquierda. "Ver plan" (en `/planes` y en `/inicio`) abre `/planes/[orderId]`, cuyo
  "Volver" regresa a `/planes`.
- **`/mediciones`** (`src/app/(sesion)/mediciones/page.tsx`, Server Component): el título "Evolución de tus mediciones" (fuera de la card)
  y la card `MeasurementsChart` (gráfico de evolución, Client Component con `@nivo/line`, contenido al 96 %) y `MeasurementsList` (un card con el título "Mis mediciones" y "Registrar medición", y
  debajo, sin card contenedor, un card por medición: calendario; fecha y tipo; peso, IMC y % de grasa, cada uno
  con su ícono en el color de su línea del gráfico)
  (`MeasurementsService.getMeasurements()` → `GET /me/measurements`); es la única página que las muestra. El
  gráfico recibe además `DashboardService.getLatestPlanProjection()` (→ `GET /me/plans/latest/projection`, `null`
  ante 404) y tiene dos modos: "Plan actual" (mediciones dentro del período del último plan + la proyección
  como meta, en línea discontinua del mismo color; el eje X va por tramos: las mediciones ocupan el 70 % del ancho
  y el tramo de la última medición a la fecha proyectada el 30 % restante (`buildTimeAxis`; con una sola medición, esta va
  al inicio y la proyección ocupa todo el ancho), con marcas en cada
  fecha medida y en la proyectada; la leyenda suma "Proyección"; el rango del plan, con un ícono de calendario, va a la izquierda
  de los botones de modo; deshabilitado sin plan) y "Todas las mediciones" (una casilla por medición para
  quitarla o reponerla). Grafica peso, IMC, grasa (kg) y masa muscular (kg), con una línea horizontal cada 10
  unidades (`yScaleTicks`). En una columna paralela (debajo en móvil), "Resumen actual": el último valor
  registrado de cada métrica (`latestMetricValues`), en un recuadro con el mismo fondo que el círculo del
  calendario; la columna izquierda lleva el rango del plan + los modos, el gráfico y las casillas; las series se arman en
  `features/measurements/chart-series.ts`. Registro, detalle y edición cuelgan de `/mediciones/*`.
- **`/perfil`** (`src/app/(sesion)/perfil/page.tsx`, Server Component): llama
  `ProfileService.getProfile()` (`src/features/profile/services/profile.service.ts` →
  `getUserProfileAction` → `GET /me`) y renderiza `ProfileForm` (Client Component,
  react-hook-form) para editar `firstName`/`paternalLastName`/`dateOfBirth`; el correo se muestra
  pero queda deshabilitado (viene fijo de la sesión de Cognito, no es editable acá). Al guardar,
  llama `updateUserProfileAction` → `PATCH /me` (solo con los campos editados).

Ambos endpoints (`GET`/`PATCH /me`, `GET /me/summary`) viven en el módulo `identity` del backend
(`nutricionista-virtual-back/src/modules/identity`), protegidos por el mismo `CognitoAuthGuard` que el
resto de rutas autenticadas. Todas las rutas llevan el prefijo `/api/v1`, que agrega `apiFetch`.

## Variables de entorno (`.env.template`)

Todas server-only, sin prefijo `NEXT_PUBLIC_`:

| Variable | Uso |
|---|---|
| `COGNITO_ISSUER_URL` | Issuer OIDC del user pool, para `discovery()`. |
| `COGNITO_CLIENT_ID` | Client ID del App Client. Debe coincidir con `COGNITO_CLIENT_ID` del backend (mismo App Client). |
| `COGNITO_CLIENT_SECRET` | Secret del App Client (cliente confidencial). |
| `COGNITO_REDIRECT_URI` | Debe apuntar a `/api/cognito/callback` y estar registrada como "Allowed callback URL" en el App Client. |
| `COGNITO_DOMAIN` | Dominio del Hosted UI, usado para construir el logout. |
| `SESSION_SECRET` | Clave para firmar la cookie `session`. |
| `BACKEND_URL` | URL del backend de consulta/órdenes — privada, el navegador nunca la usa directo. |

## Cookies

| Cookie | Contenido | Vida | Quién la setea/lee |
|---|---|---|---|
| `session` | JWT cifrado (JWE A256GCM) con `{ userInfo, accessToken, refreshToken, accessTokenExpiresAt }` | 7 días | `createSession`/`getSession`/`getRawSession`/`deleteSession` en `session.ts` |
| `cognito_state` | `state` de la request de autorización | 10 min | seteada en `/api/cognito/login`, leída y borrada en `/api/cognito/callback` |
| `cognito_nonce` | `nonce` de la request de autorización | 10 min | ídem |

## Backend — implementado, ya no es una caja negra

Ver `nutricionista-virtual-back/doc/auth.md` para el detalle completo. Resumen:

- El backend valida el Access Token (`CognitoAuthGuard`, `aws-jwt-verify` contra el JWKS del User
  Pool) en las rutas que lo requieren: `/consultations`, `/consultations/chat`,
  `/orders/:id/status`, `me/plans` (listado usado en `/inicio`).
- La identidad (`AuthIdentity`+`User` "esqueleto") se crea apenas hay sesión válida
  (`POST /me/sync`), separada de completar el perfil (`PATCH /me`) — ver `doc/flow.md`
  para el flujo completo, incluido por qué están separados.
- Google como Identity Provider no requirió **ningún** cambio en el backend: Cognito abstrae la
  federación, así que un login nativo y uno vía Google producen el mismo tipo de token.

## Verificación realizada

`tsc --noEmit`, `npm run build` y la suite de Vitest compilan/pasan limpio en cada paso. Probado
manualmente end-to-end contra el User Pool real: login nativo, registro, gating de rutas, creación
de orden autenticada, refresh silencioso del access_token, y el flujo completo de
`consulta/inicio` → `informacion-personal` (o directo a `/inicio` si el perfil ya está completo).
Login vía Google integrado en el código pero no ejercitado todavía contra el User Pool real — ver
`doc/auth-pending.md`.
