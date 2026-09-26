# Flujo de autenticación: frontend, Cognito, Google, backend NestJS y la DB

> **Nota sobre esta versión**: las versiones anteriores de este documento describían un diseño
> propuesto, no implementado — primero como especulación sin acceso al backend, después como un
> plan concreto pendiente de construir. **Esta versión describe el flujo real, ya implementado y
> verificado manualmente contra Cognito/Postgres reales.** Lo que sigue pendiente está en la
> sección 6 y en `doc/auth-pending.md`.

## 0. Mapa de piezas

| Pieza | Estado | Dónde |
|---|---|---|
| Login/registro contra Cognito Hosted UI (nativo + Google federado) | **Implementado** | `nutricionista-virtual-front/src/app/api/cognito/{login,callback,logout}/route.ts` |
| Sesión propia del frontend (cookie `session`, tokens incluidos) | **Implementado** | `nutricionista-virtual-front/src/shared/auth/session.ts` |
| Refresh silencioso del access_token | **Implementado** | `nutricionista-virtual-front/src/shared/auth/tokens.ts` |
| Google como Identity Provider en el User Pool de Cognito | **Implementado** (AWS Console) | Configuración de Cognito, fuera de ambos repos |
| Puente same-origin frontend↔backend (Server Actions, no llamadas directas del navegador) | **Implementado** | `nutricionista-virtual-front/src/features/consultation/services/consultation.actions.ts`, `src/shared/auth/profile.actions.ts` |
| Guard que valida el Access Token en el backend | **Implementado** | `nutricionista-virtual-back/src/presentation/auth/cognito-auth.guard.ts` |
| Creación de identidad (`AuthIdentity`+`User` esqueleto) al primer login | **Implementado** | `POST /auth/perfil` → `AuthIdentityService.syncUser` |
| Completar el perfil (RUT, nombre, género, fecha de nacimiento) | **Implementado**, separado del registro | `PATCH /auth/perfil` → `AuthIdentityService.updateProfile` |
| Gating de rutas `/consulta/*` según sesión + perfil completo | **Implementado** | `src/proxy.ts` (sesión — protege todo `/consulta/*` salvo `/consulta`, vacía y sin uso; incluye `/consulta/inicio`) + `src/app/(sesion)/consulta/inicio/page.tsx` (perfil completo, además de su propia verificación de sesión como defensa en profundidad, ya casi nunca alcanzada porque el proxy corta antes) |
| Botones "Iniciar Consulta" de la home ya evalúan sesión (antes iban siempre a `/consulta/inicio`) | **Implementado** | `src/shared/auth/session.ts` (`getStartConsultationHref`), usado en `navbar-landing.component.tsx`/`hero.component.tsx` |
| BOLA en `ordenes/obtener-estado/:id` | **Resuelto** (backend, repo separado) | Ver sección 5 |
| Atajo directo a `/panel` desde el propio callback si el perfil ya está completo (evita pasar por `/consulta/inicio`) | **Implementado** | `nutricionista-virtual-front/src/app/api/cognito/callback/route.ts` — chequeo best-effort de `POST /auth/perfil`, nunca bloquea el login si falla |
| Área de usuario logueado `/panel` y `/perfil`, gateada por sesión (`PROTECTED_PATHS`) | **Implementado** | `src/proxy.ts` (`PROTECTED_PATHS`) + `src/app/(sesion)/layout.tsx` (`SesionShell`: `TopbarSesion` + `NavbarSesion`) + `src/app/(sesion)/{panel,perfil}/page.tsx` |
| Layout `(sesion)` compartido por `/panel`, `/perfil`, `/consulta/*`, `/pago/[orderId]` y `/ordenes/[id]`: barra superior `TopbarSesion` (logo "Nuvi" + botón "Nueva consulta") más sidebar `NavbarSesion` acoplable en md+ (arranca acoplado en `/consulta/*`, `/pago/*` y `/ordenes/*`, desacoplado en `/panel` y `/perfil`; en móvil las opciones del sidebar pasan a la barra superior) en vez del navbar público. El layout en sí es solo presentación; la sesión la exige `src/proxy.ts`, que además de `/consulta/*`, `/panel` y `/perfil` protege `/pago/*` y `/ordenes/*` (`isSessionGatedPrefix`) | **Implementado** | `src/app/(sesion)/layout.tsx` → `SesionShell` (`src/shared/components/sesion-shell.component.tsx`) + `src/shared/auth/sesion-routes.ts` (`isFocusRoute`, `isSessionGatedPrefix`, `usesSesionLayout`). Detalle en `doc/auth.md` |

> **E2E**: las specs de Playwright (`e2e/`) instalan una cookie de sesión firmada (fixture
> `e2e/fixtures.ts`) y usan un backend falso (`e2e/fake-backend/server.mjs`) en lugar del backend real,
> porque los Server Actions llaman al backend desde Node. El login real de Cognito no se prueba en e2e.
> Ver `doc/testing.md`.

## 1. Flujo completo, de punta a punta

El diagrama empieza en `/login`, pero a esa pantalla se llega recién si el usuario **no**
tiene sesión — los botones "Iniciar Consulta" de la home (navbar y hero) ya evalúan sesión antes
(`getStartConsultationHref()`, ver `doc/auth.md`): con sesión activa saltan directo a
`/consulta/inicio`, sin pasar por login de nuevo.

```mermaid
sequenceDiagram
    actor U as Usuario (navegador)
    participant FE as Next.js (frontend)
    participant COG as Cognito Hosted UI
    participant G as Google (IdP federado)
    participant BE as NestJS (backend)
    participant DB as PostgreSQL

    U->>FE: home → "Iniciar Consulta" (sin sesión) → /login → "Continuar con Google" (o "Registro"/"Inicio de sesión" nativo)
    FE-->>U: Set-Cookie cognito_state/cognito_nonce
    FE->>U: 307 a Cognito (identity_provider=Google, o screen_hint=signup, o ninguno)
    alt Google
        COG->>U: 307 a Google
        U->>G: consentimiento
        G->>COG: 307 a /oauth2/idpresponse
    else nativo
        COG->>U: formulario Hosted UI (registro o login)
        U->>COG: credenciales
    end
    COG->>COG: crea/resuelve el usuario en el User Pool (sub estable)
    COG->>U: 307 a redirect_uri (este frontend) con ?code&state
    U->>FE: GET /api/cognito/callback?code&state
    FE->>COG: authorizationCodeGrant (server-side, con client_secret)
    COG-->>FE: access_token + id_token + refresh_token
    FE->>COG: fetchUserInfo(access_token)
    COG-->>FE: claims (sub, email, ...)
    FE->>FE: createSession({userInfo, accessToken, refreshToken, ...}) → cookie session
    FE->>BE: POST /auth/perfil {email} — Authorization: Bearer <access_token> (chequeo best-effort, con el email/token ya en memoria de este request, no bloquea el login si falla)
    alt chequeo responde
        BE->>BE: CognitoAuthGuard valida el token (JWKS)
        BE->>DB: find-or-create AuthIdentity(sub) + User "esqueleto"
        DB-->>BE: User
        BE-->>FE: { profileComplete }
    else falla (red, backend caído)
        Note over FE: se loguea el error; se trata como perfil no confirmado, nunca como error de login
    end
    alt profileComplete === true
        FE-->>U: 307 a /panel (salta /consulta/inicio)
    else profileComplete === false, o el chequeo falló
        FE-->>U: 307 a /consulta/inicio, ya autenticado
    end

    U->>FE: /consulta/inicio (Server Component) — solo si no hubo atajo directo a /panel
    FE->>FE: getSession() → hay sesión
    FE->>BE: POST /auth/perfil {email} — Authorization: Bearer <access_token> (llamada duplicada respecto a la del callback; aceptado porque el endpoint es idempotente)
    BE->>BE: CognitoAuthGuard valida el token (JWKS)
    BE->>DB: find-or-create AuthIdentity(sub) + User "esqueleto"
    DB-->>BE: User (firstName/gender/dateOfBirth aún null)
    BE-->>FE: { profileComplete: false }
    FE->>U: botón "Iniciar" → /consulta/informacion-personal

    U->>FE: completa el formulario (nombre, apellido, género, fecha nacimiento)
    FE->>BE: PATCH /auth/perfil {...} — Authorization: Bearer
    BE->>DB: UPDATE User (completa el perfil)
    BE-->>FE: { profileComplete: true }
    FE->>U: navega a /consulta/anamnesis

    Note over U,BE: resto del wizard (chat, evaluación física) — ver doc/flow-happy-path.md del backend

    U->>FE: "Generar orden"
    FE->>BE: POST /ordenes/crear — Authorization: Bearer
    BE->>BE: CognitoAuthGuard valida el token
    BE->>DB: resuelve User por sub (ya completo) → crea Order + NutritionalConsultation
    BE-->>FE: { orderId }
```

Logout: `GET /api/cognito/logout` borra la cookie `session` y redirige al `/logout` propietario del
Hosted UI de Cognito.

## 2. Por qué identidad y perfil están separados

Antes, `AuthIdentity`/`User` se creaban recién al llamar `ordenes/crear`, usando el email escrito en
el formulario. Eso generaba tres inconsistencias reales (la discusión completa que llevó a este
rediseño está en el historial de este proyecto, resumida acá):

1. El registro en Cognito no dejaba ningún rastro en la DB hasta la primera orden.
2. Un usuario ya registrado tenía que volver a escribir todos sus datos cada vez que iniciaba una
   consulta, porque nada conectaba la sesión con el formulario.
3. `User.email` quedaba "congelado" al valor escrito en el formulario la primera vez, sin relación
   con el email real de la cuenta de Cognito/Google.

La razón por la que **no se puede** simplemente "crear el `User` completo al registrarse": Cognito
nunca da RUT, género ni fecha de nacimiento — ni siquiera con Google de por medio (el scope en uso
es `openid email phone`, sin `profile`; y aunque se agregara, Google no comparte género/fecha de
nacimiento por este medio). Por eso `User.firstName`/`paternalLastName`/`gender`/`dateOfBirth` son
**nullable** en el schema (migración `relax_user_profile_fields` en el backend) — modelan
correctamente el estado "existe pero no ha completado su perfil".

El resultado: `POST /auth/perfil` crea la identidad con lo único garantizado (el `sub` del token y
el email de la sesión de Cognito — nunca de un formulario), y `PATCH /auth/perfil` completa el
resto cuando el usuario llena `informacion-personal`. `ordenes/crear` ya no toca `User` en absoluto
— solo valida que el perfil ya esté completo.

**Consecuencia en el frontend**: el wizard (`evaluacion-fisica`, `generar-orden`) depende de que
`personalInfo` esté en el contexto de cliente (`localStorage`), no solo en el backend. Si un
usuario con perfil ya completo entra directo a `/consulta/anamnesis` (saltándose
`informacion-personal`) desde un dispositivo/navegador donde `localStorage` está vacío, el
contexto se **hidrata desde el perfil del backend** (`syncProfileAction()` en un `useEffect` de
`consulta/anamnesis/page.tsx`) antes de que el usuario note nada.

El campo "Deportista" (`athlete`) vive en `User`: `informacion-personal` lo envía en
`updateProfileAction` (`PATCH /auth/perfil`) y lo pre-llena desde el perfil. Un usuario que salta
`informacion-personal` conserva su última respuesta.

## 3. Google como Identity Provider — qué cambió y qué no

Configurado en AWS (Cognito User Pool → Federated identity provider sign-in → Google), con
credenciales OAuth de Google Cloud Console. En el código:

- `login/route.ts` acepta `?identity_provider=Google` (allowlist) y lo reenvía a
  `buildAuthorizationUrl` — salta la pantalla nativa de la Hosted UI y va directo al consentimiento
  de Google.
- `src/app/login/page.tsx` tiene el botón "Continuar con Google".

**No hizo falta ningún cambio en el backend.** Cognito abstrae por completo la federación: tanto un
login nativo como uno vía Google producen un Access Token de Cognito indistinguible desde la
perspectiva del backend, con un `sub` estable del User Pool. Por eso `AuthIdentity.provider`
**en la práctica siempre queda `'COGNITO'`**, nunca `'GOOGLE'` — el valor existe en el tipo
`AuthProvider` pero este diseño nunca lo escribe. No es un bug.

**Gap conocido, no verificado**: si el User Pool no tiene "account linking" configurado, una
persona que se registre primero nativo y después entre con Google (mismo email) puede terminar con
dos `sub` distintos — y por lo tanto dos `AuthIdentity`/`User` para la misma persona. Depende de
configuración de AWS, no de código de ningún repo.

## 4. El navegador nunca habla con el backend directo

`apiFetch` (`src/shared/api/client.ts`) es `server-only`, lee `BACKEND_URL` (privada). Se invoca
únicamente desde **Server Actions** de Next.js — el `Guard` del backend nunca ve una request
directa del navegador. Detalle completo (incluido el bug de refresh-de-token-en-Server-Component
encontrado y arreglado durante la verificación manual) en `doc/auth.md`, sección "Server Actions".

## 5. Endpoints protegidos en el backend

| Endpoint | Requiere sesión | Nota |
|---|---|---|
| `POST /auth/perfil`, `PATCH /auth/perfil` | Sí | Crea/completa la identidad |
| `POST /ordenes/crear` | Sí | Además valida perfil completo |
| `POST /consulta/chat` | Sí | Solo gating, no usa la identidad |
| `GET /ordenes/obtener-estado/:id` | Sí | **BOLA resuelto** (backend, repo separado): ahora valida que la orden sea del usuario del token. Devuelve además `pdfUrl` (URL firmada de S3 con el PDF del plan) una vez `completado` |
| `GET /ordenes` | Sí | Lista las órdenes con plan generado del usuario del token, del más nuevo al más antiguo (usada en `/panel`, ver `doc/flow.md` del backend y `README.md` de este repo) |
| `GET /user/me`, `PATCH /user/me` | Sí | Edita datos básicos (`firstName`/`paternalLastName`/`dateOfBirth`) desde `/perfil`; endpoint distinto de `auth/perfil`, ver `doc/auth.md` |
| `GET /panel/resumen` | Sí | Resumen para `/panel`: datos del usuario + último plan nutricional generado |
| `POST /webhooks/pago`, `POST /webhooks/ordenes/:id/simular-pago` | No | Los llama la pasarela de pago (o el frontend sin sesión de por medio, en el caso simulado) — necesitan verificación de firma propia, no sesión de usuario |

Detalle completo (Guard, `aws-jwt-verify`, `AuthIdentityService`) en
`nutricionista-virtual-back/doc/auth.md`.

## 6. Pendientes

Ver `doc/auth-pending.md` para el checklist completo y actualizado. Resumen de lo que sigue
abierto:

- Probar el login vía Google end-to-end contra el User Pool real (integrado en código, no
  ejercitado todavía).
- Registrar callback/logout URLs y credenciales de Google para el dominio de producción.
- Cobertura de tests (Vitest/Jest) para todo el código de auth — ninguno de los archivos nuevos
  tiene tests hoy.
- `CLAUDE.md` de ambos repos todavía no menciona este módulo de auth.
