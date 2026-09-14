# Autenticación con Amazon Cognito

## Resumen

La app usa Amazon Cognito (Hosted UI, flujo Authorization Code con cliente confidencial) como proveedor de
identidad, implementado con `openid-client@6` sobre Route Handlers de Next.js. La guía de configuración que
entrega AWS trae el ejemplo en Express (`express-session`, `app.use()`, EJS); nada de eso existe en este
proyecto, así que cada paso se tradujo a las convenciones reales del App Router en vez de copiarse literal.

Dos razones concretas por las que el código de AWS no se pudo copiar tal cual:

1. **No hay middleware chain.** Express encadena `app.use(session(...))` + `checkAuth` antes de cada ruta.
   Next.js no tiene ese concepto para Route Handlers/Server Components — la sesión se implementa como una
   cookie firmada, leída/escrita explícitamente donde se necesita, siguiendo el patrón oficial de
   `node_modules/next/dist/docs/01-app/02-guides/authentication.md` (`jose` + `server-only`).
2. **`openid-client@6` no es la API que usa el snippet de AWS.** La v6 eliminó las clases `Issuer`/`Client` y
   el export `generators` (API de la v5) en favor de funciones sueltas: `discovery()`, `randomState()`,
   `randomNonce()`, `buildAuthorizationUrl()`, `authorizationCodeGrant()`, `fetchUserInfo()`. Confirmado
   leyendo `node_modules/openid-client/build/index.d.ts` — usar el snippet de AWS tal cual habría fallado en
   runtime.

## Piezas implementadas

### `src/shared/auth/cognito-config.ts`
Singleton perezoso y cacheado de la `Configuration` de `openid-client`, construido con
`discovery(new URL(COGNITO_ISSUER_URL), COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)`. Equivale al
`initializeClient()`/`let client` de Express, adaptado a que Next.js no tiene un hook de arranque de app — el
módulo se carga bajo demanda y cachea la promesa en memoria del proceso. Si `discovery()` falla, el caché se
resetea para no dejar el singleton envenenado ante un fallo transitorio.

Marcado con `import 'server-only'` porque maneja `COGNITO_CLIENT_SECRET` — cualquier intento de importarlo
desde un Client Component rompe el build en vez de filtrar el secreto al bundle del navegador. No está
re-exportado en `src/shared/index.ts` (el barrel) por la misma razón: solo debe llegar a código server-only.

### `src/shared/auth/session.ts`
Sesión propia de la app como cookie `session` firmada con HMAC (`jose`'s `SignJWT`/`jwtVerify`, `HS256`,
clave derivada de `SESSION_SECRET`), `httpOnly`, `secure` en producción, `sameSite: 'lax'`, 7 días de
expiración (aplicada por el propio `exp` del JWT, no por un campo manual).

- `createSession(userInfo)` — setea la cookie. La usa el callback tras el login.
- `deleteSession()` — borra la cookie. La usa el logout.
- `getSession()` — lee y valida la cookie; nunca lanza ni redirige, devuelve
  `{ isAuthenticated: boolean, userInfo: Record<string, unknown> | null }`. Es el equivalente directo del
  middleware `checkAuth` de AWS (que tampoco bloquea, solo informa) — pero como función que cualquier Server
  Component puede llamar, no como middleware global.

### `src/app/api/cognito/login/route.ts` (paso 9 de la guía)
`GET` que genera `state`/`nonce` (`randomState()`/`randomNonce()`), construye la URL de autorización
(`buildAuthorizationUrl(config, { redirect_uri, scope: 'email openid phone', state, nonce })`) y redirige.
Guarda `state`/`nonce` en dos cookies `httpOnly` de vida corta (10 min: `cognito_state`, `cognito_nonce`) —
equivalen a `req.session.state`/`req.session.nonce` en Express, pero como cookies independientes de la
cookie `session` (no llevan `userInfo`, son de un solo uso, viven solo el viaje de ida y vuelta a Cognito).

No usa PKCE: se siguió el paso 9 literal de AWS (solo `state` + `nonce`), que es suficiente para un cliente
confidencial (tiene `client_secret`, a diferencia de un cliente público donde PKCE es obligatorio). Ver
`doc/auth-pending.md` si se quiere endurecer esto más adelante.

### `src/app/api/cognito/callback/route.ts` (paso 10)
Es el `redirect_uri` real registrado en Cognito — **tiene que ser un Route Handler**, no una página: una
página (Server Component) no puede setear cookies durante el render, y ahí es exactamente donde hay que
crear la sesión. Esto difiere del snippet de AWS, donde el mismo path (`/consulta/inicio` en el pedido
original del usuario) hace de `redirect_uri` y de vista renderizada a la vez — algo que solo funciona en
Express porque `res.render()` ocurre en el mismo handler.

Flujo: lee `cognito_state`/`cognito_nonce` de las cookies, las borra, intercambia el `code` por tokens con
`authorizationCodeGrant(config, currentUrl, { expectedState, expectedNonce })`, obtiene el `sub` del ID token
(`tokens.claims()?.sub`) y pide el perfil con `fetchUserInfo(config, tokens.access_token, sub)`, y llama a
`createSession(userInfo)`. Al terminar (éxito o error) redirige a **`/consulta/inicio`**, pedido explícito del
usuario en vez del `/` que usa el ejemplo de AWS.

Igual que el snippet de AWS: un error se loguea (`console.error`) pero igual redirige, sin mostrar nada al
usuario — fiel al tutorial, aunque es una limitación de UX real (ver `doc/auth-pending.md`).

### `src/app/api/cognito/logout/route.ts` (paso 11)
`deleteSession()` + redirección al `/logout` del Hosted UI de Cognito. **No usa `buildEndSessionUrl()`** de
`openid-client`: esa función requiere que el discovery document del issuer publique `end_session_endpoint`
(estándar RP-Initiated Logout, con `post_logout_redirect_uri`/`id_token_hint`), y Cognito no lo publica — su
logout es un endpoint propietario (`{dominio}/logout?client_id=...&logout_uri=...`). Por eso se arma la URL a
mano con `URL`/`searchParams`, igual que hace el propio ejemplo de AWS, pero parametrizada con la variable
`COGNITO_DOMAIN` en vez de hardcodeada, y con `logout_uri` calculada dinámicamente desde el origin de la
request (no un `localhost:3000` fijo).

### `src/app/page.tsx` (pasos 8 y 12)
Dejó de ser Client Component (no usaba hooks, solo componía secciones) para poder llamar a `getSession()`
server-side. Muestra "Iniciar sesión" (→ `/api/cognito/login`) si no hay sesión, o
"Hola, {email} · Cerrar sesión" (→ `/api/cognito/logout`) si la hay. No se incluyó el volcado
`JSON.stringify(userInfo, null, 4)` del ejemplo EJS de AWS — es material de debug del tutorial, no algo para
dejar visible en producción.

### `src/app/consulta/login/page.tsx`
El botón "Inicio de sesión" ahora apunta a `/api/cognito/login` (mismo tab, sin `target="_blank"`) en vez de
la URL hardcodeada del Hosted UI con un `redirect_uri` que apuntaba a un dominio CloudFront ajeno a esta app.
El botón "Registro" se dejó intacto — sigue roto, ver `doc/auth-pending.md`.

### Paso 13 de la guía (`app.set('view engine', 'ejs')`) — no aplica
Next.js usa JSX/React como motor de vistas en todo el proyecto. No hay nada equivalente que configurar; este
paso del tutorial de AWS es inherente a Express y no tiene traducción.

## Variables de entorno (`.env.template`)

Todas server-only, sin prefijo `NEXT_PUBLIC_` (nunca deben llegar al bundle del navegador):

| Variable | Uso |
|---|---|
| `COGNITO_ISSUER_URL` | Issuer OIDC del user pool, para `discovery()`. |
| `COGNITO_CLIENT_ID` | Client ID del App Client. |
| `COGNITO_CLIENT_SECRET` | Secret del App Client (cliente confidencial). |
| `COGNITO_REDIRECT_URI` | Debe apuntar a `/api/cognito/callback` y estar registrada como "Allowed callback URL" en el App Client. |
| `COGNITO_DOMAIN` | Dominio del Hosted UI (`https://<prefijo>.auth.<región>.amazoncognito.com`), usado para construir el logout. |
| `SESSION_SECRET` | Clave para firmar la cookie `session`. Debe ser un valor fuerte generado aparte (ej. `openssl rand -base64 32`), no un placeholder tipo `'some secret'`. |

## Cookies

| Cookie | Contenido | Vida | Quién la setea/lee |
|---|---|---|---|
| `session` | JWT firmado con `{ userInfo }` | 7 días | `createSession`/`getSession`/`deleteSession` en `session.ts` |
| `cognito_state` | `state` de la request de autorización | 10 min | seteada en `/api/cognito/login`, leída y borrada en `/api/cognito/callback` |
| `cognito_nonce` | `nonce` de la request de autorización | 10 min | ídem |

## Contexto de backend/DB (no implementado en este repo, ver `doc/flow.md`)

Lo de abajo describe `nutricionista-virtual-back` (repo aparte, NestJS + Prisma/PostgreSQL), leído
directamente para esta actualización — no es especulación. Detalle completo, con diagrama objetivo,
en `doc/flow.md`.

- El backend **ya tiene** un modelo de dominio pensado para esto: `prisma/schema.prisma` define
  `User` y `AuthIdentity` (con `provider: 'COGNITO' | 'GOOGLE'` y
  `@@unique([provider, providerUserId])`), con toda la capa `domain/`+`infrastructure/` construida
  (`identity-auth/**`) y registrada en `app.module.ts`. **Pero nada en `presentation/` la usa** —
  no hay endpoint, guard, ni validación de JWT contra el JWKS del User Pool. `AuthIdentityRepository`
  no tiene un solo consumidor real hoy.
- La única escritura real en la tabla `user` hoy es `OrdersService.createOrder`
  (`userRepository.findOrCreateUserByEmail`), disparada al generar una orden de pago — usa el email
  del formulario de "información personal", no tiene nada que ver con Cognito, y no crea ningún
  `AuthIdentity`. Es una isla de identidad paralela a la de este frontend.
- `.env.template` del backend trae `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`BCRYPT_SALT_OR_ROUNDS`:
  son restos de un módulo de auth local (usuario/contraseña propio) que fue removido, **sin
  relación** con `User`/`AuthIdentity` ni con la validación de tokens de Cognito.
- Google **no** está configurado como Identity Provider en Cognito todavía (ni en AWS ni en el
  parámetro `identity_provider` de la URL de autorización que arma `login/route.ts`) — es 100% lo
  que falta para el objetivo "clic en Registro → Google → registrado". Ver `doc/flow.md` sección 4
  para los tres pasos (AWS, frontend, backend).

## Verificación realizada

`tsc --noEmit` y `npm run build` compilan limpio en cada paso (el build de producción falla más adelante en
`/articulos` por falta de conexión al backend CMS en este entorno — no relacionado con Cognito). Con
`npm run dev` y sin credenciales reales en `.env`: `/` renderiza igual que antes con el enlace "Iniciar
sesión"; `/api/cognito/login` y `/api/cognito/logout` devuelven 500 (fallan al validar que faltan las
variables de entorno, comportamiento esperado); `/api/cognito/callback` sin `code` redirige igual a
`/consulta/inicio` limpiando las cookies `cognito_state`/`cognito_nonce`. No se pudo probar el flujo completo
contra Cognito real por falta de credenciales en este entorno — ver `doc/auth-pending.md`.
