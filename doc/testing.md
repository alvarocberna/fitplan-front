# Testing

## Stack

- **Unitarios / componentes**: [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react) + jsdom.
  Se eligió Vitest sobre Jest porque el proyecto vive 100% en ESM (`moduleResolution: "bundler"`) y depende de paquetes ESM-only
  (`@nivo/*`) que bajo Jest requieren configuración adicional de transformación; Vitest los resuelve nativamente al estar
  construido sobre Vite/esbuild, y además arranca e itera más rápido.
- **E2E**: [Playwright](https://playwright.dev), mockeando la red con `page.route` (sin backend real ni servidor fake). Se
  eligió sobre Cypress por su intercepción de red nativa (funciona igual de bien cross-origin, relevante porque
  `NEXT_PUBLIC_BACKEND_URL` es una URL absoluta distinta del origen de la app) y porque integra mejor con esperas asíncronas
  reales para flujos con polling.

No hay backend real disponible en este repo (vive aparte, ver `README.md`), así que **ambas capas mockean los servicios/la red
en vez de integrar contra un backend**: los tests unitarios mockean `ConsultationService`/`apiFetch`/`apiFetchCMS`, y los e2e
interceptan las requests HTTP del navegador con `page.route`.

## Cómo correr los tests

```bash
npm run test            # unitarios, una vez
npm run test:watch      # unitarios, watch mode
npm run test:coverage   # unitarios, con reporte de cobertura (text + html)

npm run test:e2e        # e2e (levanta next dev en :3100 automáticamente)
npm run test:e2e:ui     # e2e con la UI interactiva de Playwright
npm run test:e2e:report # abre el último reporte HTML de Playwright
```

Los e2e usan variables de entorno dummy definidas en `.env.test` (hosts no resolubles como
`http://consultation-backend.e2e.local`) precisamente para que cualquier request que no esté mockeada explícitamente falle de
forma ruidosa (`net::ERR_NAME_NOT_RESOLVED`) en vez de colarse en silencio a un host real.

## Estructura

Los tests unitarios están co-ubicados junto al código que testean (`*.test.ts` / `*.test.tsx`), salvo las páginas bajo rutas
con corchetes (`[id]`, `[orderId]`), que viven en `src/app/__tests__/` para evitar fricción con esos nombres de carpeta:

```
src/shared/api/client.test.ts
src/shared/api/client-cms.test.ts
src/shared/context/consultation.context.test.tsx
src/features/consultation/services/consultation.service.test.ts
src/features/consultation/components/form-user-info.test.tsx
src/features/consultation/components/form-measurements.test.tsx
src/features/consultation/components/somatotype-selector.test.tsx
src/features/consultation/components/chat-anamnesis.test.tsx
src/features/nutrition-plan/components/generate-order-button.test.tsx
src/features/nutrition-plan/components/download-plan-pdf.test.tsx
src/features/articles/services/articles.service.test.ts
src/features/testimonials/services/testimonials.service.test.ts
src/app/__tests__/orders-id-page.test.tsx

e2e/
  helpers/
    mock-backend.ts      # mocks de red por endpoint (consulta/chat, ordenes/crear, etc.)
    seed-context.ts       # siembra localStorage antes de que la app arranque
  personal-info.spec.ts
  anamnesis-chat.spec.ts
  physical-assessment.spec.ts
  generate-order-payment.spec.ts
  order-status-plan.spec.ts
  consultation-full-flow.spec.ts
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
  polling al completarse o fallar, resiliencia ante un error de red puntual, y la limpieza del intervalo al desmontar.

## Qué cubren los tests e2e

Los 6 pasos del flujo de consulta, cada uno con su happy path y sus casos de error/guarda, más un spec que encadena las 6
etapas de punta a punta (`consultation-full-flow.spec.ts`) para detectar problemas de integración entre pasos que los specs
individuales no verían (traspaso de `localStorage`, remonte de `ConsultationProvider` entre layouts):

1. **Información personal**: envío válido y persistencia, bloqueo con campos vacíos, y que el `<select>` de género ya no
   ofrece "Otro".
2. **Chat de anamnesis**: turnos de chat mockeados hasta completarse, avance a evaluación física, y manejo de error del
   backend sin romper el chat.
3. **Evaluación física**: envío válido, y la guarda cuando falta la anamnesis del paso anterior.
4. **Generar orden**: creación de la orden y redirección a pago, error del backend, y que no se llame al backend si faltan
   datos de pasos anteriores.
5. **Pago simulado**: pago exitoso y redirección al estado de la orden, y error de la simulación de pago.
6. **Estado de la orden**: polling hasta completarse (con el PDF real generándose vía `@react-pdf/renderer`, usando el mock
   `nutritionPlanMock` ya existente en el repo), aviso de demora pasados 45s, y el estado de error reasegurante.

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
  `/articulos` en build-time contra `NEXT_PUBLIC_BACKEND_CMS_URL`, que en `.env.test` es un host dummy — el mock de red de
  Playwright solo intercepta fetches del navegador, no los que Next hace en el servidor durante el build.
- No hay CI configurado (no existe `.github/workflows` en el repo) — correr `npm test` / `npm run test:e2e` en un pipeline
  queda pendiente como tarea aparte.
