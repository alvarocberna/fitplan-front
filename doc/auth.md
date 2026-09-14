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
Sesión propia de la app como cookie `session` firmada con HMAC (`jose`'s `SignJWT`/`jwtVerify`,
`HS256`, clave derivada de `SESSION_SECRET`), `httpOnly`, `secure` en producción,
`sameSite: 'lax'`, 7 días de expiración.

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

**UX de errores**: si el intercambio falla (usuario cancela en Google/Hosted UI, `state` no
coincide, etc.), redirige a `/login?error=callback_failed` con un mensaje visible, en vez
de fingir éxito.

Al terminar (éxito), hace un chequeo **best-effort** del estado del perfil antes de decidir el
redirect: llama `POST /auth/perfil` (mismo endpoint que ya usaba `syncProfileAction()`) directo vía
`apiFetch`, con el `email`/`accessToken` que ya tiene en memoria de este mismo request — sin releer
la cookie de sesión recién escrita. Si `profileComplete === true`, redirige directo a **`/home`**,
saltándose `/consulta/inicio`. Si da `false`, o si la llamada falla (red, backend caído), redirige a
**`/consulta/inicio`** como antes — un fallo en este chequeo nunca bloquea el login ni manda a la
pantalla de error, porque la sesión ya se creó independientemente de él (el `try/catch` de este
chequeo es separado del que envuelve el intercambio de tokens). `/consulta/inicio/page.tsx` no
cambió: sigue llamando a `syncProfileAction()` por su cuenta como defensa en profundidad para quien
llegue ahí con perfil incompleto (o si el chequeo del callback falló) — en el caso "perfil
incompleto" eso implica una llamada duplicada a `POST /auth/perfil` (una en el callback, otra en
`/consulta/inicio`), aceptada como trade-off porque el endpoint es idempotente. Ver `doc/flow.md`
para el diagrama completo.

### `src/app/api/cognito/logout/route.ts`
`deleteSession()` + redirección al `/logout` propietario del Hosted UI de Cognito (arma la URL a
mano con `COGNITO_DOMAIN`; Cognito no publica `end_session_endpoint` para usar
`buildEndSessionUrl()` estándar).

### `src/app/login/page.tsx`
Tres opciones: **"Continuar con Google"** (`/api/cognito/login?identity_provider=Google`, con
ícono), separador "o con tu correo", **"Registro"** (`/api/cognito/login?screen_hint=signup`) e
**"Inicio de sesión"** (`/api/cognito/login`, nativo). Muestra el mensaje de error si
`?error=callback_failed` está presente en la URL.

### Botones "Iniciar Consulta" de la home — `getStartConsultationHref()`
Los dos botones "Iniciar Consulta" del sitio (navbar global y hero de la home) usan
`getStartConsultationHref()` (`session.ts`) para no mandar a todo el mundo a `/consulta/inicio` por
igual: sin sesión (o expirada) van directo a `/login`; con sesión, a `/consulta/inicio`
(que a su vez decide entre `informacion-personal`/`home` según el perfil — ver `doc/flow.md`).

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
  endpoints protegidos (`ordenes/crear`, `consulta/chat`, `ordenes/obtener-estado/:id`) obtienen el
  token con `getValidAccessToken()` y lo adjuntan como `Authorization: Bearer`.
- `src/shared/auth/profile.actions.ts` — `syncProfileAction` (`POST /auth/perfil`) y
  `updateProfileAction` (`PATCH /auth/perfil`), usadas por el flujo de registro/perfil (ver
  `doc/flow.md`).
- `src/shared/api/action-result.ts` — `ActionResult<T>`/`runAction()` compartido por ambos
  archivos de arriba. Las acciones **no lanzan** errores (siguen la guía oficial de Next para
  Server Functions: *"avoid using try/catch blocks and throw errors. Instead, model expected
  errors as return values"*), devuelven `{ok: true, data} | {ok: false, message}` — evita que Next
  redacte el mensaje de error en producción. `ConsultationService`/las páginas que llaman a estas
  acciones "desenvuelven" el resultado (`unwrap`), reconstruyendo un `throw new Error(message)`
  del lado del cliente si `ok: false` — así el resto de la app sigue viendo el mismo
  comportamiento de siempre (un `try/catch` con `error.message`).

Esto significa que el `Guard` del backend (`CognitoAuthGuard`) nunca ve una request directa del
navegador — todas llegan server-to-server desde el propio servidor de Next.js.

## Gating de rutas — `src/proxy.ts`

Verificación optimista (patrón "Optimistic checks with Proxy" de Next.js): antes del bloque que
genera el CSP, si el `pathname` empieza con `/consulta/` y no está en una allowlist explícita
(solo `/consulta`, vacía y sin uso — `/consulta/inicio` ya requiere sesión como el resto de
`/consulta/*`), lee la cookie `session` con
`request.cookies.get(...)` (no `cookies()` de `next/headers`, para no depender de un comportamiento
no verificado dentro de proxy) y, si no es válida (`hasValidSession()`), redirige a
`/login`. `/login` vive fuera del namespace `/consulta/*` (`src/app/login/page.tsx`), así que ya no
necesita estar en esa allowlist. Cualquier ruta nueva bajo `/consulta/*` no listada explícitamente
como pública queda protegida por defecto (fail-closed).

No protege `/pago/[orderId]` ni `/ordenes/[id]` (fuera del prefijo `/consulta`).

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
| `session` | JWT firmado con `{ userInfo, accessToken, refreshToken, accessTokenExpiresAt }` | 7 días | `createSession`/`getSession`/`getRawSession`/`deleteSession` en `session.ts` |
| `cognito_state` | `state` de la request de autorización | 10 min | seteada en `/api/cognito/login`, leída y borrada en `/api/cognito/callback` |
| `cognito_nonce` | `nonce` de la request de autorización | 10 min | ídem |

## Backend — implementado, ya no es una caja negra

Ver `nutricionista-virtual-back/doc/auth.md` para el detalle completo. Resumen:

- El backend valida el Access Token (`CognitoAuthGuard`, `aws-jwt-verify` contra el JWKS del User
  Pool) en las rutas que lo requieren: `ordenes/crear`, `consulta/chat`,
  `ordenes/obtener-estado/:id`.
- La identidad (`AuthIdentity`+`User` "esqueleto") se crea apenas hay sesión válida
  (`POST /auth/perfil`), separada de completar el perfil (`PATCH /auth/perfil`) — ver `doc/flow.md`
  para el flujo completo, incluido por qué están separados.
- Google como Identity Provider no requirió **ningún** cambio en el backend: Cognito abstrae la
  federación, así que un login nativo y uno vía Google producen el mismo tipo de token.

## Verificación realizada

`tsc --noEmit`, `npm run build` y la suite de Vitest compilan/pasan limpio en cada paso. Probado
manualmente end-to-end contra el User Pool real: login nativo, registro, gating de rutas, creación
de orden autenticada, refresh silencioso del access_token, y el flujo completo de
`consulta/inicio` → `informacion-personal` (o directo a `/home` si el perfil ya está completo).
Login vía Google integrado en el código pero no ejercitado todavía contra el User Pool real — ver
`doc/auth-pending.md`.
