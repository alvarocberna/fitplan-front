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
      `buildAuthorizationUrl`; `consulta/login/page.tsx` tiene un botón "Continuar con Google" que
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
      `evaluacion-fisica`, `generar-orden`, `plan-nutricional` (y cualquier ruta nueva bajo `/consulta/*`
      no listada explícitamente como pública — fail-closed); deja fuera `/consulta`, `/consulta/inicio` y
      `/consulta/login`. Sin cookie `session` válida, redirige a `/consulta/login` (sin `?next=` de
      retorno — fuera de alcance). No gatea `/pago/[orderId]` ni `/ordenes/[id]` (fuera del prefijo
      `/consulta`, no estaban en el pedido). Usa un nuevo `hasValidSession()` exportado de `session.ts`
      (reusa `decrypt()`, sin duplicar lógica de `jose`), y lee la cookie con `request.cookies.get(...)`
      en vez de `cookies()` de `next/headers` (evita depender de un comportamiento no verificado dentro
      de proxy).
- [x] **Botón "Registro" en `src/app/consulta/login/page.tsx`**: arreglado — apunta a
      `/api/cognito/login?screen_hint=signup` (mismo Route Handler, misma pestaña), que ahora reenvía
      `screen_hint` a `buildAuthorizationUrl` con un allowlist (`signup`) en vez de pass-through libre.
- [x] **UX de errores en el callback**: `callback/route.ts` ahora redirige a
      `/consulta/login?error=callback_failed` en el `catch` en vez de caer a la redirección de éxito;
      `consulta/login/page.tsx` lee `?error=` (allowlist vía `ERROR_MESSAGES`) y muestra un mensaje visible
      (`role="alert"`).
- [x] **Vida de la sesión**: `getSession()` ahora devuelve `status: 'authenticated' | 'expired' | 'anonymous'`
      (usa `jose`'s `errors.JWTExpired` para distinguir "expiró" de "nunca hubo sesión válida"). La home
      (`src/app/page.tsx`) muestra "Tu sesión expiró" en ese caso. No se implementó renovación silenciosa
      (sliding expiration) — decisión explícita, sigue siendo 7 días fijos; no se tocó `src/proxy.ts`.
- [ ] **Tests**: ninguno de los archivos nuevos (`cognito-config.ts`, `session.ts`, los tres Route Handlers,
      los cambios en `page.tsx` y `consulta/login/page.tsx`) tiene cobertura Vitest/Playwright — invocar al
      subagente `test-maintainer` cuando el flujo esté estable.

## Backend NestJS / base de datos

- [x] **Circuito real de validación + persistencia**: implementado. `apiFetch` dejó de llamarse
      directo desde el navegador (`NEXT_PUBLIC_BACKEND_URL` pública) — ahora es `server-only`,
      lee `BACKEND_URL` privada, y se invoca únicamente desde Server Actions nuevas
      (`src/features/consultation/services/consultation.actions.ts`), que adjuntan
      `Authorization: Bearer <access_token>` (con refresh silencioso vía `refreshTokenGrant` si
      venció — ver `src/shared/auth/tokens.ts`). `ConsultationService` (mismo API público, cero
      cambios en los call sites) delega en esas acciones. En el backend, nuevo módulo
      `presentation/auth/` con `CognitoAuthGuard` (`aws-jwt-verify`, valida el access_token contra
      JWKS del User Pool) y `AuthIdentityService.resolveUser()`, que usa el nuevo método
      `AuthIdentityRepository.findAuthIdentityByProvider('COGNITO', sub)` para vincular la sesión
      de Cognito con `User`/`AuthIdentity` (sin migración de Prisma — esas tablas ya existían sin
      consumidor). `ordenes/crear` y `consulta/chat` ahora exigen sesión válida (`@UseGuards`);
      `ordenes/obtener-estado/:id` y `webhooks/*` quedan sin cambios (fuera de alcance, ver
      `doc/flow.md`).
- [ ] Decidir si en algún momento conviene proteger también `ordenes/obtener-estado/:id` — implica
      resolver BOLA (validar que la orden pertenece al usuario del token, no solo que haya sesión),
      no solo agregar el Guard.

## Documentación del proyecto

- [ ] `CLAUDE.md` (este repo) todavía no menciona Cognito/OIDC en su sección de variables de entorno ni en
      la descripción de arquitectura — considerar invocar al subagente `doc-writer` una vez el flujo esté
      conectado con el backend (ahora mismo es un cambio grande pero aislado del resto de la app, así que se
      documentó aparte en `doc/auth.md` y `doc/flow.md` en vez de tocar `CLAUDE.md` directamente).
