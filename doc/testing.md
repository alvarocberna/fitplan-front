# Testing

## Stack

- **Unitarios / componentes**: [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react) + jsdom.
  Se eligió Vitest sobre Jest porque el proyecto vive 100% en ESM (`moduleResolution: "bundler"`) y depende de paquetes ESM-only
  (`@nivo/*`) que bajo Jest requieren configuración adicional de transformación; Vitest los resuelve nativamente al estar
  construido sobre Vite/esbuild, y además arranca e itera más rápido.
- **E2E**: [Playwright](https://playwright.dev) contra `next dev`, con un **backend falso** en Node
  (`e2e/fake-backend/server.mjs`) en lugar del backend real, y una cookie de sesión firmada en lugar del login de Cognito.
  El backend falso replica las rutas del real bajo `/api/v1` (responde 404 si falta el prefijo) y registra cada llamada con la
  ruta **sin** el prefijo (ej. `/consultations`), que es lo que comparan los specs. Se
  eligió sobre Cypress porque integra mejor con esperas asíncronas reales para flujos con polling.

No hay backend real disponible en este repo (vive aparte, ver `README.md`), así que **ambas capas reemplazan al backend en vez
de integrar contra él**: los tests unitarios mockean `ConsultationService`/`apiFetch`/`apiFetchCMS`, y los e2e apuntan
`BACKEND_URL` a un servidor falso.

**Por qué un backend falso y no `page.route`**: `BACKEND_URL` es privado y solo lo llaman los Server Actions
(`consultation.actions.ts`, `profile.actions.ts`) desde el proceso de Node de `next dev`, nunca el navegador. El mock de red de
Playwright solo intercepta requests del navegador, así que no vería esas llamadas. (`page.route` ya no se usa para el backend de
consulta/órdenes; el CMS, `NEXT_PUBLIC_BACKEND_CMS_URL`, sí se llama desde el navegador pero ningún e2e lo ejercita hoy.)

## Cómo correr los tests

```bash
npm run test            # unitarios, una vez
npm run test:watch      # unitarios, watch mode
npm run test:coverage   # unitarios, con reporte de cobertura (text + html)

npm run test:e2e        # e2e (levanta next dev en :3100 automáticamente)
npm run test:e2e:ui     # e2e con la UI interactiva de Playwright
npm run test:e2e:report # abre el último reporte HTML de Playwright
```

`npm run test:e2e` levanta solos dos servidores (ver `webServer` en `playwright.config.ts`): el backend falso en `:3101` y
`next dev` en `:3100`, este último con `BACKEND_URL` apuntando al falso. Los e2e usan las variables de `.env.test`:
`BACKEND_URL` (el backend falso), `SESSION_SECRET` (dummy, solo para tests: firma la cookie de sesión) y hosts dummy no
resolubles para el CMS (`http://cms-backend.e2e.local`), de modo que cualquier request al CMS falle de forma ruidosa
(`net::ERR_NAME_NOT_RESOLVED`) en vez de colarse a un host real.

### Cómo funcionan los e2e

- **Sesión**: `src/proxy.ts` redirige a `/login` en `/consulta/*`, `/pago/*`, `/ordenes/*`, `/panel`, `/planes`, `/mediciones` y `/perfil` sin sesión. Los
  specs importan `test`/`expect` de `e2e/fixtures.ts` (no de `@playwright/test`): antes de cada test ese fixture instala la
  cookie `session` (un JWT HS256 firmado con `SESSION_SECRET`, fabricado en `e2e/helpers/session.ts` igual que lo emite
  `src/shared/auth/session.ts`). Para probar sin sesión: `test.use({ authenticated: false })`.
- **Backend falso**: cada endpoint responde lo que el test configuró con los helpers de `e2e/helpers/mock-backend.ts`
  (`mockChatTurn`, `mockCreateOrder`, `mockSimulatePayment`, `mockOrderStatusSequence`, `mockProfile`, ...); un endpoint sin
  configurar responde `501`, así una llamada inesperada falla en vez de devolver datos inventados. Los endpoints que en el
  backend real exigen sesión validan `Authorization: Bearer <token>` (el Access Token de la cookie) y responden `401` sin él,
  por lo que los e2e también verifican que los Server Actions lo adjuntan. `getBackendCalls()` devuelve el registro de
  llamadas para aserciones como "el backend no fue llamado".
- **En serie** (`workers: 1`, `fullyParallel: false`): el estado del backend falso es global, no por test; dos tests en
  paralelo se pisarían los mocks. El fixture lo resetea antes de cada test.

## Estructura

Los tests unitarios están co-ubicados junto al código que testean (`*.test.ts` / `*.test.tsx`), salvo las páginas bajo rutas
con corchetes (`[id]`, `[orderId]`), que viven en `src/app/__tests__/` para evitar fricción con esos nombres de carpeta:

```
src/shared/api/client.test.ts
src/shared/api/client-cms.test.ts
src/shared/context/consultation.context.test.tsx
src/shared/context/plan-selection.context.test.tsx
src/shared/components/modal.component.test.tsx
src/shared/components/login-options.test.tsx
src/shared/data/plan-code.test.ts
src/shared/auth/return-to.test.ts
src/features/plans/services/plans.service.test.ts
src/features/plans/components/plan-selection-modal.test.tsx
src/features/plans/components/cart-view.test.tsx
src/app/__tests__/planes-page.test.tsx
src/app/__tests__/plan-detail-page.test.tsx
src/app/__tests__/pago-page.test.tsx
src/features/consultation/services/consultation.service.test.ts
src/features/consultation/components/form-user-info.test.tsx
src/features/consultation/components/form-measurements.test.tsx
src/features/consultation/components/somatotype-selector.test.tsx
src/features/consultation/components/chat-anamnesis.test.tsx
src/features/nutrition-plan/components/generate-order-button.test.tsx
src/features/nutrition-plan/components/download-plan-pdf.test.tsx
src/features/articles/services/articles.service.test.ts
src/features/testimonials/services/testimonials.service.test.ts
src/features/profile/services/profile.service.test.ts
src/features/profile/components/profile-form.test.tsx
src/features/panel/services/panel.service.test.ts
src/features/panel/components/panel-summary.test.tsx
src/shared/components/navbar-sesion.test.tsx
src/shared/components/topbar-sesion.test.tsx
src/shared/components/sesion-nav-link.test.tsx
src/shared/components/sesion-shell.test.tsx
src/shared/components/navbar-landing-gate.test.tsx
src/shared/components/footer.test.tsx
src/shared/components/footer-gate.test.tsx
src/shared/auth/sesion-routes.test.ts
src/proxy.test.ts
src/app/__tests__/orders-id-page.test.tsx

e2e/
  fake-backend/
    server.mjs            # backend falso (BACKEND_URL) que llaman los Server Actions
  helpers/
    mock-backend.ts       # configura el backend falso por endpoint (chat, crear orden, estado, perfil, ...)
    session.ts            # fabrica la cookie `session` firmada con SESSION_SECRET
    seed-context.ts       # siembra localStorage antes de que la app arranque
  fixtures.ts             # `test` con reset del backend falso + cookie de sesión (opt-out: authenticated: false)
  personal-info.spec.ts
  anamnesis-chat.spec.ts
  physical-assessment.spec.ts
  generate-order-payment.spec.ts
  order-status-plan.spec.ts
  consultation-full-flow.spec.ts
  session-routes.spec.ts  # protección por proxy y layout de sesión (barra superior + sidebar acoplable)
```

Config: `vitest.config.ts` / `vitest.setup.tsx` (raíz) para unitarios; `playwright.config.ts` / `.env.test` (raíz) para e2e.

## Qué cubren los tests unitarios

- **`src/shared/api/client.ts` (`apiFetch`)**: construcción de URL/headers/body, respuesta 204, éxito, y los distintos casos de
  error HTTP (mensaje del body, campo `error` alternativo, body no-JSON, body sin campos reconocidos).
- **`src/shared/api/client-cms.ts` (`apiFetchCMS` / `apiFetchFormData`)** — la pieza de mayor riesgo del repo, sin cobertura
  previa: manejo de CSRF (cookie existente vs. fetch del token, solo en métodos mutantes), reintento único ante un 401 vía
  `/auth/refresh`, el caso en que el refresh falla, y el caso límite donde dos 401 simultáneos no quedan realmente deduplicados
  por el singleton `refreshPromise` (una condición de carrera real del código, documentada como comportamiento actual — ver
  sección de hallazgos).
- **`ConsultationService`**: que cada método pega al endpoint exacto esperado.
- **`ArticlesServicePublic` / `TestimonialsServicePublic`**: construcción de query params y la única lógica de negocio real de
  esa capa (`getArticleBySlug`).
- **`ConsultationProvider` / `useConsultation`**: hidratación desde `localStorage` (incluyendo JSON corrupto), que cada setter
  persiste sin pisar el resto del estado, `getCompleteConsultation()`, y los resets.
- **Formularios** (`FormUserInfo`, `FormMeasurements`, `SomatotypeSelector`): happy path, validaciones requeridas, límites de
  longitud del rut, y las guardas de "faltan datos de pasos anteriores".
- **`ChatAnamnesis`**: envío optimista del mensaje, Enter vs. Shift+Enter, estados de carga, manejo de error, y la transición a
  "Siguiente" al completarse la anamnesis.
- **`GenerateOrderButton`** y **`DownloadPlanPdf`**: guardas de datos incompletos, payload exacto enviado al backend, y los
  estados de carga/nombre de archivo del PDF (con `@react-pdf/renderer` parcialmente mockeado).
- **`/ordenes/[id]`**: el ciclo completo de polling con fake timers — cada 4s, el aviso de demora a los 45s, la detención del
  polling al completarse o fallar, resiliencia ante un error de red puntual, y la limpieza del intervalo al desmontar. Al
  completarse verifica la miniatura (`img` con la `thumbnailUrl`), el enlace "Descargar" hacia `pdfUrl`, que no haya
  `<iframe>`, y el placeholder cuando el plan no tiene miniatura.
- **`src/proxy.ts` (`PROTECTED_PATHS`)**: `/panel` y `/perfil` tienen su propio describe (mismo patrón:
  redirect sin cookie, redirect con cookie inválida/expirada, passthrough con sesión válida). `/pago/*` y `/ordenes/*`
  (gateadas por `isSessionGatedPrefix`) repiten ese patrón para la raíz (`/pago`, `/ordenes`) y una subruta
  (`/pago/abc`, `/ordenes/abc`), más la comprobación de que paths parecidos (`/pagox`, `/ordenesx`) no quedan gateados.
  `/consulta/*` sigue protegida salvo `/consulta`, que es pública.
- **`ProfileService` / `PanelService`**: que cada método pega al endpoint esperado (`me`, `me/summary`) y que un
  `ActionResult` con `ok: false` se traduce en una excepción con el mensaje del backend — mismo patrón que `ConsultationService`.
- **`ProfileForm`**: prellenado de los campos editables desde el perfil (con el correo deshabilitado y de solo lectura),
  envío que convierte la fecha a ISO y llama a `ProfileService.updateProfile`, toast de éxito/error, y las validaciones de
  campo requerido.
- **`PanelSummary`**: placeholders cuando faltan nombre/edad/objetivo y datos de la última medición, y el llamado a
  iniciar una consulta cuando no hay consulta ni medición.
- **`MeasurementsChart`** y **`chart-series.ts`**: filtro por período del plan (bordes incluidos), series por métrica
  sin cortar en los `null`, series meta desde el último valor medido (solo las métricas proyectadas), modo por
  defecto según haya plan, casillas que quitan/reponen mediciones y mensajes vacíos. `@nivo/line` se mockea con un
  stub que lista series y puntos (nivo necesita medidas reales del DOM).
- **`MeasurementDetail`** y **`measurement-detail-data.ts`**: posición en la escala de IMC (con recorte), barras en kg
  solo de los componentes presentes, torta sin grasa visceral y con "Resto" (omitido si la suma llega a 100), card de
  composición oculta en las básicas y "Otras mediciones" sin peso/talla/IMC/componentes. `@nivo/bar` y `@nivo/pie` se
  mockean con stubs que listan los datos.
- **`MeasurementsList`**, **`MeasurementDetail`**, **`MeasurementForm`** y **`MeasurementsService`**
  (`src/features/measurements/`): título + "Registrar medición" fuera de los cards, un card por medición con fecha, tipo y peso/IMC/% grasa ("—" sin
  dato) y link al detalle; secciones crudas y resultados
  presentes; campos de bioimpedancia condicionales (grasa y masa muscular obligatorias; grasa visceral y masa ósea
  opcionales: vacías no se envían al registrar y van como `null` al editar), payload de POST/PATCH, fecha futura y
  rangos bloqueados, modo edición con el tipo deshabilitado; `getMeasurement` devuelve `null` ante 404.
- **`MyPlansList`** (lista de `/planes`): mensaje sin planes, un card por plan en orden, nombre/tipo/fecha/régimen,
  los 4 macronutrientes con valor y unidad ("—" sin resumen), botones "Ver plan"/"Descargar plan" y la pestaña
  decorativa solo en el primero.
- **`PlansList`** (card "Mis planes nutricionales"): una fila por plan en el orden recibido, sin miniatura, con tipo,
  fecha, régimen y macros (o "—"), el enlace "Ver plan" a `/planes/[orderId]` y "Descargar plan" al `pdfUrl`; el
  mensaje de "sin planes" con la lista vacía. **`PlanDetail`**: encabezado (card del PDF con "Plan nutricional", "PDF" y
  descarga; "Datos del plan" con objetivo, régimen y duración —"—" sin término— y, en la misma card, los macronutrientes
  sin título propio; sin card "Resumen"),
  secciones del plan personalizado ("Resumen del plan": tiempo, hora y porciones por tiempo de comida; "Tiempos de comida"
  oculta por ahora; suplementación,
  recomendaciones deportivas; las vacías se ocultan) y del estándar (datos del encabezado desde su resumen).
  **`planDurationLabel`** / **`formatDateOnly`** (`panel/format.ts`): meses completos, días bajo un mes, `null` sin
  fechas, fechas DATE sin correr de día. **`NutritionalPlanSummary`**: bloque de resumen del detalle de consulta.
- **`PlanPreviewCard`** (`src/shared/components/`, usada en `/ordenes/[id]`): fecha (opcional), miniatura (`<img>` lazy con `alt`), enlace "Descargar" (o `downloadLabel`) con el `href` del PDF, y el
  placeholder "Vista previa no disponible" cuando `thumbnailUrl` es `null` o falta (backend aún sin actualizar).
- **`proxy` (CSP)**: `img-src` incluye el bucket de planes; `frame-src` y `connect-src` no.
- **`NavbarSesion`** (sidebar, solo md+: `hidden md:flex fixed left-0 top-15`, debajo de la barra superior): los links a
  `/panel` (label visible "Home"), `/planes` ("Planes"), `/mediciones` ("Mediciones"), `/perfil` ("Perfil") y
  `/api/cognito/logout`, en ese orden — "Nueva consulta" ya **no** es un
  ítem del sidebar, vive en `TopbarSesion`. Qué link queda resaltado según `usePathname` (igualdad exacta con el `href`): el
  activo cambia el `color` del texto a `var(--color-primary)` (no el fondo) y renderiza el indicador
  `data-testid="nav-active-indicator"` (`absolute left-0 inset-y-0 w-[5px]`); los inactivos no lo tienen. Y el toggle del
  sidebar: el botón (16×32px sobre el borde derecho) solo existe si se pasa `onToggle`, su `aria-label`/`aria-expanded` según
  `collapsed`, que un click en el `<nav>` (o en el botón, una sola vez) llama `onToggle` pero no uno sobre un link, el
  hover/focus del botón que ilumina su borde y el borde derecho del `<nav>` con `var(--color-primary)`, que los links llevan
  `hidden` al colapsar y el `<nav>` `w-14` en vez de `w-56`.
- **`TopbarSesion`** (barra superior `<header>` fija, `h-15`): logo "Nuvi" hacia `/panel`, botón "Nueva consulta" hacia
  `/consulta/anamnesis` (siempre visible, fuera del menú móvil), y el `<nav aria-label="Menú de usuario">` (`flex md:hidden`)
  con Perfil, Home y Cerrar sesión (mismos hrefs que el sidebar), con el link activo por pathname en color primary y **sin**
  rectángulo lateral (variante `compact`).
- **`SesionNavLink` / `SESION_NAV_ITEMS`** (`sesion-nav-link.component.tsx`, compartidos por sidebar y barra superior): la lista
  de ítems (Perfil, Home), activo = color primary + indicador (solo en la variante no-compact), inactivo sin ninguno, y que
  `className` se aplica al link.
- **`SesionShell`** (layout `(sesion)`): estado por defecto según la ruta (acoplado en `/consulta/*`, `/pago/*` y `/ordenes/*`, desacoplado en
  `/panel` y `/perfil`, verificado vía el `md:pl-*` del `<main>`), el toggle, que la elección manual se mantiene al navegar dentro
  de la misma sección (re-render sin remontar, con `usePathname` mockeado), y que al cambiar de sección vale el default de la nueva.
  También que renderiza `TopbarSesion` (banner con logo y "Nueva consulta") como hermano de `<main>`, y el padding superior del
  `<main>` (`pt-19 md:pt-23`). Además renderiza un único `Footer` (`contentinfo`) como hermano de `<main>` (posterior a él en el
  DOM), dentro de un wrapper con el mismo padding lateral que `<main>` (`md:pl-56` desacoplado / `md:pl-14` acoplado, porque el
  sidebar es `fixed` y taparía el borde izquierdo del footer), que cambia al hacer toggle y se reinicia al cambiar de sección.
  Gotcha: jsdom no aplica CSS, así que los enlaces Home/Perfil/Cerrar sesión aparecen **dos veces**
  en el DOM (sidebar + menú móvil `md:hidden` de la barra superior): los tests acotan por contenedor (`within(sidebar)`, donde
  el sidebar es el `<nav>` que contiene el botón de acoplar; o `within(getByRole('navigation', { name: 'Menú de usuario' }))`)
  en vez de `getByRole('link', { name: 'Home' })` a secas, que falla por "múltiples elementos".
- **`sesion-routes.ts`**: `isSesionRoute` (`/panel`, `/planes`, `/mediciones`, `/perfil` y sus subrutas como `/panel/consultas/abc`, sin falsos positivos
  tipo `/panelx`; la usa el proxy; `/pago/*` y `/ordenes/*` dan false), `isSessionGatedPrefix` (`/pago` y `/ordenes`, raíz y subrutas, sin falsos positivos tipo `/pagos`, `/pago-x`,
  `/ordenesx`; `/consulta` no entra), `isFocusRoute` (prefijos `/consulta`, `/pago` y `/ordenes` sin falsos positivos tipo
  `/consultas`) y `usesSesionLayout` (la unión de `isSesionRoute` e `isFocusRoute`).
- **`NavbarLandingGate`**: no renderiza nada en `/consulta/*`, `/pago/*`, `/ordenes/*`, `/panel`, `/perfil` ni `/dev*`; renderiza
  `NavbarLanding` (mockeado) en el resto de rutas.
- **`Footer`** (`footer.component.tsx`): `<footer>` (`contentinfo`) con el link de marca a `/`, el `<nav aria-label="Enlaces del pie de
  página">` con sus 3 links (`/#consulta-nutricional-virtual`, `/#plan-personal`, `/#plan-estandarizado-por-disciplina`, en ese
  orden) y el copyright con el año calculado al renderizar (verificado con `vi.useFakeTimers` + `setSystemTime`).
- **`FooterGate`** (layout raíz): no renderiza nada en las rutas de sesión (`/panel`, `/perfil`, `/consulta*`, `/pago/*`,
  `/ordenes/*`) porque ahí `SesionShell` monta su propio `Footer`; sí renderiza `Footer` (mockeado) en `/`, `/articulos`,
  `/login`, `/dev` y `/dev/*`.

### Planes predefinidos (selección → carro → pago → /panel)

Unitarios: `plan-code` (código de versión, solo 18-30 es "joven", la talla no cambia la versión, `PLANS` coincide con los slugs
del backend), `plan-selection.context` (hidratación, corrupción de `localStorage`, el carro admite un solo plan),
`Modal` (portal, Escape, clic en el fondo, foco, scroll), `PlanSelectionModal` (los 4 campos con sus opciones, "Confirmar"
deshabilitado hasta completar, navegación a `/planes-estandar/<slug>`), `/planes-estandar` (botón "Seleccionar", ya no "Añadir al carro"),
`/planes-estandar/[slug]` (busca la versión al completar los datos, precio, miniatura o imagen estática, versión no disponible, añadir
al carro), `CartView` (sin sesión abre el modal de registro con `return_to`, con sesión crea la orden y va a
`/pago/<id>?tipo=predefinido`, sesión expirada, errores), `/pago/[orderId]` (`?tipo=predefinido` → `/panel`, si no →
`/ordenes/<id>`), `return-to` y el `callback` con `return_to`.

E2E: `e2e/predefined-plan-purchase.spec.ts` (con handlers nuevos en el backend falso: `/plans/standard/:code`,
`/plans/standard/:code/purchase`, `/me/summary`, `/me/plans`). **Nota**: el e2e levanta su propio `next dev` en el puerto 3100 y Next
permite un solo `next dev` por directorio: hay que detener el `npm run dev` local antes de correrlo.

## Qué cubren los tests e2e

Los 6 pasos del flujo de consulta, cada uno con su happy path y sus casos de error/guarda, más un spec que encadena las 6
etapas de punta a punta (`consultation-full-flow.spec.ts`) para detectar problemas de integración entre pasos que los specs
individuales no verían (traspaso de `localStorage`, remonte de `ConsultationProvider` entre layouts):

1. **Información personal**: envío válido (el perfil se guarda en el backend con `PATCH me` y el Access Token de la
   sesión, y se persiste en `localStorage`), correo prellenado y de solo lectura, prellenado desde el perfil que el backend ya
   tiene, bloqueo con campos vacíos, error del backend en un toast, y que el `<select>` de género no ofrece "Otro". El
   formulario ya no pide Rut ni correo.
2. **Chat de anamnesis**: turnos de chat mockeados hasta completarse, avance a evaluación física, y manejo de error del
   backend sin romper el chat.
3. **Evaluación física**: envío válido, y la guarda cuando falta la anamnesis del paso anterior.
4. **Generar orden**: creación de la orden (con el Access Token adjunto) y redirección a pago, error del backend, y que no se
   llame al backend si faltan datos de pasos anteriores.
5. **Pago simulado**: pago exitoso y redirección al estado de la orden, y error de la simulación de pago.
6. **Estado de la orden**: polling hasta completarse (miniatura + enlace "Descargar" hacia la URL firmada del PDF, sin
   `<iframe>`, con `nutritionPlanMock` como `planJson`), placeholder cuando el plan no tiene miniatura, aviso de demora
   pasados 45s, y el estado de error reasegurante.
7. **Protección de rutas y layout de sesión** (`session-routes.spec.ts`): sin sesión, `/consulta/*`, `/pago/*`, `/ordenes/*`,
   `/panel` y `/perfil` redirigen a `/login` y `/consulta` (raíz) sigue pública; con sesión, `/consulta/*`, `/pago/*` y
   `/ordenes/*` muestran la barra superior (logo "Nuvi" y "Nueva consulta", siempre visible), el sidebar de sesión acoplado, sin
   el navbar de la landing, y el botón lo desacopla y lo vuelve a acoplar (sin afectar a la barra superior). En un viewport
   móvil (390px) el sidebar desaparece y Perfil/Home/Cerrar sesión pasan al menú de la barra superior. Los selectores se acotan
   al sidebar (`<nav>` que contiene el botón de acoplar), a la barra superior (`banner`) o al menú móvil
   (`navigation` "Menú de usuario"), y usan `exact: true` para "Home". Como `SesionShell` monta el `Footer` (que repite los links `/#...` de la landing), la
   ausencia del navbar de la landing se verifica con su CTA `a[href="/login"]` (count 0) y no con `a[href="/#plan-personal"]`;
   además se comprueba que haya un único `contentinfo`.

## Hallazgos durante el proceso

- **Bug corregido** — `/ordenes/[id]` usaba un `useRef` (`stoppedRef`) para detener el polling, compartido entre invocaciones
  del efecto. Bajo Strict Mode de desarrollo (`next dev`), React monta → limpia → remonta el efecto una vez al iniciar; el
  cleanup del primer montaje dejaba `stoppedRef.current = true` para siempre, y el polling del montaje real nunca volvía a
  ejecutarse — el usuario se quedaba viendo el spinner indefinidamente. Se reemplazó por una variable local (`cancelled`)
  declarada dentro de cada invocación del efecto, el patrón estándar para que un efecto sea seguro ante el doble-invocado de
  Strict Mode. **Esto no afecta producción** (ahí Strict Mode no duplica efectos), pero sí afectaba a cualquiera desarrollando
  o probando esta página localmente con `next dev`.
- **Comportamiento documentado, no corregido** (confirmado con el usuario) — el `<select>` de "deportista" en `FormUserInfo`
  tiene dos `<option>` con `value="false"` (la opción "Sí, de forma recreacional" es inalcanzable). Es el comportamiento
  actual deseado; el test solo deja constancia de él.
- **Comportamiento documentado, no corregido** — el singleton `refreshPromise` de `apiFetchCMS` que debería deduplicar
  refrescos de sesión concurrentes solo protege el caso en que el segundo 401 llega después de que el primero ya asignó la
  promesa; si dos 401 llegan en el mismo tick (antes de que cualquiera de los dos termine su propio `await ensureCsrfToken()`),
  cada uno dispara su propio `/auth/refresh`. Documentado con un test, no es parte del alcance de esta tarea.

## Notas / limitaciones conocidas

- Los e2e corren contra `next dev` (Turbopack), no contra un build de producción: un build real intenta pre-renderizar
  `/articulos` en build-time contra `NEXT_PUBLIC_BACKEND_CMS_URL`, que en `.env.test` es un host dummy — ni el mock de red de
  Playwright ni el backend falso cubren al CMS, y los fetches que Next hace en el servidor durante el build no pasan por
  el navegador.
- El login real contra Cognito (Hosted UI, Google) **no** se prueba en e2e: la cookie de sesión se fabrica directamente. Lo
  que sí ejercita el e2e es todo lo que depende de tener una sesión válida (proxy, layout, Access Token hacia el backend).
- `/perfil` no tiene e2e propio, y `/panel` solo se recorre como destino de la compra de un plan estándar (el backend falso
  responde `me/summary` y `me/plans` con valores por defecto).
- No hay CI configurado (no existe `.github/workflows` en el repo) — correr `npm test` / `npm run test:e2e` en un pipeline
  queda pendiente como tarea aparte.
