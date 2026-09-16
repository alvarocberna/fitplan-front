# Tareas pendientes para completar la autenticación

Estado a la fecha: el flujo login → callback → sesión → logout está implementado y compila, pero no se probó
contra un user pool real (sin credenciales en este entorno) y no está conectado al backend de órdenes. Ver
`doc/auth.md` (lógica implementada) y `doc/flow.md` (flujo completo, incluida la parte no implementada).

## Configuración (fuera del código, en AWS/entorno)

- [x] `.env` con los valores reales de Cognito y `SESSION_SECRET` — configurado por el usuario.
- [x] Probado manualmente end-to-end contra el user pool real: login nativo → Hosted UI → callback
      → sesión → `ordenes/crear` autenticado → se crea la fila `auth_identity` → una segunda orden
      reutiliza el mismo `user`/`auth_identity`.
- [x] **Google como Identity Provider federado**: configurado en el User Pool + App Client (AWS
      Console, hecho por el usuario). En el código: `login/route.ts` acepta
      `?identity_provider=Google` (allowlist, mismo patrón que `screen_hint`) y lo reenvía a
      `buildAuthorizationUrl`; `src/app/login/page.tsx` tiene un botón "Continuar con Google" que
      apunta ahí. **No hizo falta ningún cambio en el backend** — Cognito abstrae la federación: el
      access_token que llega es igual de un login nativo que de uno vía Google (mismo `sub` estable
      en el User Pool), así que `AuthIdentityService` sigue creando la fila con
      `provider: 'COGNITO'` siempre (el valor `'GOOGLE'` del enum `AuthProvider` queda sin uso real
      con este diseño — es un detalle a tener presente, no un bug).
- [ ] Repetir el registro de callback/logout URLs (y las credenciales de Google) para el dominio de
      producción cuando exista.
- [ ] Probar manualmente el login vía Google end-to-end (el nativo ya se probó; Google se integró
      en el código pero no se ejercitó todavía contra el User Pool real).

## Frontend

- [x] **Gating de rutas de `/consulta/*`**: implementado como verificación optimista en `src/proxy.ts`
      (patrón "Optimistic checks with Proxy"). Protege `informacion-personal`, `anamnesis`,
      `evaluacion-fisica`, `generar-orden`, `plan-nutricional`, **`inicio`** (y cualquier ruta nueva
      bajo `/consulta/*` no listada explícitamente como pública — fail-closed); deja fuera únicamente
      `/consulta` (vacía, sin uso — `/consulta/inicio` ya requiere sesión como el resto; `/login` vive
      fuera del namespace `/consulta/*`, así que tampoco necesita estar en esa allowlist). Sin
      cookie `session` válida, redirige a `/login` (sin `?next=` de
      retorno — fuera de alcance). No gatea `/pago/[orderId]` ni `/ordenes/[id]` (fuera del prefijo
      `/consulta`, no estaban en el pedido). Usa un nuevo `hasValidSession()` exportado de `session.ts`
      (reusa `decrypt()`, sin duplicar lógica de `jose`), y lee la cookie con `request.cookies.get(...)`
      en vez de `cookies()` de `next/headers` (evita depender de un comportamiento no verificado dentro
      de proxy).
- [x] **Botón "Registro" en `src/app/login/page.tsx`**: arreglado — apunta a
      `/api/cognito/login?screen_hint=signup` (mismo Route Handler, misma pestaña), que ahora reenvía
      `screen_hint` a `buildAuthorizationUrl` con un allowlist (`signup`) en vez de pass-through libre.
- [x] **UX de errores en el callback**: `callback/route.ts` ahora redirige a
      `/login?error=callback_failed` en el `catch` en vez de caer a la redirección de éxito;
      `src/app/login/page.tsx` lee `?error=` (allowlist vía `ERROR_MESSAGES`) y muestra un mensaje visible
      (`role="alert"`).
- [x] **Vida de la sesión**: `getSession()` ahora devuelve `status: 'authenticated' | 'expired' | 'anonymous'`
      (usa `jose`'s `errors.JWTExpired` para distinguir "expiró" de "nunca hubo sesión válida"). La home
      (`src/app/page.tsx`) muestra "Tu sesión expiró" en ese caso. No se implementó renovación silenciosa
      (sliding expiration) — decisión explícita, sigue siendo 7 días fijos; no se tocó `src/proxy.ts`.
- [ ] **Tests**: ninguno de los archivos nuevos (`cognito-config.ts`, `session.ts`, los tres Route Handlers,
      los cambios en `page.tsx` y `src/app/login/page.tsx`) tiene cobertura Vitest/Playwright — invocar al
      subagente `test-maintainer` cuando el flujo esté estable.
- [x] **Botones "Iniciar Consulta" (navbar y hero de la home) ahora evalúan sesión**: antes apuntaban
      siempre a `/consulta/inicio` sin importar si había sesión. Ahora usan
      `getStartConsultationHref()` (`session.ts`): sin sesión → `/login` directo; con sesión
      → `/consulta/inicio` (que ya tenía su propio ruteo de 3 destinos, sin cambios). El botón dentro
      de `hero-old.component.tsx` no se tocó — ese componente no se usa en ningún lado (código muerto).
      **Bug de bundling encontrado y arreglado en el camino**: `Hero` y `NavbarLanding` se
      re-exportan desde el barrel `@/features/index.ts`, que también re-exporta un Client Component
      (`testimonial-form.component.tsx`) — eso arrastra el barrel entero al bundle del navegador, y
      cualquier componente ahí que importe algo `server-only` (como `session.ts`) rompe el build. Se
      resolvió pasando `startHref` como prop calculada en el Server Component padre real
      (`src/app/page.tsx` para `Hero`, `src/app/layout.tsx` para `NavbarLanding`) en vez de que cada
      componente llame a `getStartConsultationHref()` internamente. Ojo con este patrón: **cualquier
      componente re-exportado desde ese barrel no puede importar código `server-only` directamente**,
      sin importar si en la práctica solo se renderiza server-side.

## Backend NestJS / base de datos

- [x] **Circuito real de validación + persistencia**: implementado. `apiFetch` dejó de llamarse
      directo desde el navegador (`NEXT_PUBLIC_BACKEND_URL` pública) — ahora es `server-only`,
      lee `BACKEND_URL` privada, y se invoca únicamente desde Server Actions nuevas
      (`src/features/consultation/services/consultation.actions.ts`), que adjuntan
      `Authorization: Bearer <access_token>` (con refresh silencioso vía `refreshTokenGrant` si
      venció — ver `src/shared/auth/tokens.ts`). `ConsultationService` (mismo API público, cero
      cambios en los call sites) delega en esas acciones. En el backend, nuevo módulo
      `presentation/auth/` con `CognitoAuthGuard` (`aws-jwt-verify`, valida el access_token contra
      JWKS del User Pool), que usa el nuevo método
      `AuthIdentityRepository.findAuthIdentityByProvider('COGNITO', sub)` para vincular la sesión
      de Cognito con `User`/`AuthIdentity` (sin migración de Prisma en ese momento — esas tablas ya
      existían sin consumidor). `ordenes/crear` y `consulta/chat` ahora exigen sesión válida
      (`@UseGuards`); `ordenes/obtener-estado/:id` y `webhooks/*` quedan sin cambios (fuera de
      alcance, ver `doc/flow.md`).
- [x] **Identidad separada de "completar perfil"**: `AuthIdentity`+`User` ("esqueleto") se crean
      apenas hay sesión válida, ya no al llamar `ordenes/crear`. Nuevos endpoints
      `POST /auth/perfil` (sincroniza, idempotente — email tomado siempre de la sesión de Cognito,
      nunca de un formulario) y `PATCH /auth/perfil` (completa `firstName`/`paternalLastName`/
      `gender`/`dateOfBirth`) en `presentation/auth/auth.controller.ts`.
      `AuthIdentityService.resolveUser()` se reemplazó por `syncUser()` (find-or-create) y
      `getUserBySub()` (lookup estricto, usado por `ordenes/crear`, que ahora también valida que el
      perfil esté completo antes de crear la orden). **Migración de Prisma real** (primera de todo
      este trabajo): `User.firstName`/`paternalLastName`/`gender`/`dateOfBirth` pasan de NOT NULL a
      nullable (`rut`/`rutCheckDigit`/`middleName`/`maternalLastName`/`email` ya eran nullable).
      Frontend: `consulta/inicio` redirige a login/informacion-personal/panel según sesión +
      estado del perfil; `informacion-personal` quitó los inputs de rut/dv-rut/segundo
      nombre/apellido materno, el email quedó de solo lectura (pre-llenado desde la sesión), y el
      submit persiste al backend antes de navegar. `consulta/anamnesis` hidrata el contexto de
      cliente desde el perfil del backend si `personalInfo` no está en localStorage (ej. otro
      dispositivo) — necesario porque `evaluacion-fisica`/`generar-orden` bloquean el avance
      basados en el contexto local, no en el backend.
      **Deuda técnica documentada, no resuelta**: el campo "Deportista" (`athlete`) no es un campo
      de `User` (es por consulta) — un usuario que salta `informacion-personal` porque su perfil ya
      está completo nunca vuelve a responderlo, se asume `false`.
      **Bug encontrado y arreglado durante la verificación manual**: `getValidAccessToken()`
      (`tokens.ts`) intentaba persistir el token refrescado con `createSession()` (escribe la
      cookie) sin importar desde dónde se llamaba. Invocado desde el render de un Server Component
      (`consulta/inicio`, `informacion-personal` llaman a `syncProfileAction()` directo, no desde un
      evento de cliente) esa escritura de cookie falla (Next.js solo permite `cookies().set()`
      dentro de un Server Action o Route Handler) — y como el `catch` envolvía tanto el refresh
      como el `createSession`, un fallo ahí descartaba el access_token recién obtenido de Cognito
      y devolvía `null`, haciendo que `POST /auth/perfil` fallara con 401 aunque el usuario sí
      tuviera una sesión válida. Se separó el `try/catch`: el refresh contra Cognito sigue
      invalidando el resultado si falla, pero un fallo al persistir la cookie ahora solo loguea un
      warning y el token igual se devuelve/usa para esa respuesta (se persistirá en la próxima
      llamada real desde un Server Action, ej. al enviar el formulario o un mensaje del chat).
- [x] **`ordenes/obtener-estado/:id` ahora exige sesión válida** (mismo `CognitoAuthGuard`, sin
      `@CognitoUser()` porque `getStatus` no usa la identidad para nada). `getOrderStatusAction`
      (frontend) actualizado para adjuntar el `access_token`, si no el polling hubiera empezado a
      fallar con 401 incluso para el dueño de la orden.
      **Dos consecuencias abiertas en su momento, la primera ya resuelta después:**
      - **BOLA — resuelto en un cambio posterior del backend**: en ese momento cualquier usuario
        logueado podía ver el estado de una orden ajena si conocía/adivinaba el UUID (el Guard solo
        exigía "hay sesión", no "la orden es tuya"); el backend ahora valida que la orden pertenezca
        al usuario del token. Ver `doc/flow.md`, sección 5.
      - **Se rompió el "revisitar por link" que `CLAUDE.md` documentaba como intencional**: alguien
        que vuelva a `/ordenes/[id]` sin una sesión activa (otro dispositivo, cookies borradas,
        sesión vencida) ya no puede ver el estado de su propia orden — antes sí podía, a propósito.

## Documentación del proyecto

- [ ] `CLAUDE.md` (este repo) todavía no menciona Cognito/OIDC en su sección de variables de entorno ni en
      la descripción de arquitectura — considerar invocar al subagente `doc-writer` una vez el flujo esté
      conectado con el backend (ahora mismo es un cambio grande pero aislado del resto de la app, así que se
      documentó aparte en `doc/auth.md` y `doc/flow.md` en vez de tocar `CLAUDE.md` directamente).
