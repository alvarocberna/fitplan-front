# Fitplan (Front)

Aplicación web construida con [Next.js](https://nextjs.org) que sirve como interfaz de un agente de IA experto en nutrición deportiva. El frontend recopila la información del usuario en varios pasos (datos personales, anamnesis conversacional y evaluación física), la envía a un backend en NestJS que la procesa con IA, y genera un plan nutricional en formato PDF. El plan solo se genera una vez que el usuario paga la consulta.

Es uno de los tres repos del workspace Fitplan: el backend (NestJS + PostgreSQL) vive en `../fitplan-back` y la base de datos local en `../fitplan-db`. El navegador nunca llama al backend directo: todo pasa por Server Actions que corren en el servidor (`src/shared/api/client.ts`).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- React Hook Form para formularios
- `@react-pdf/renderer` para la generación del plan en PDF
- `@nivo` para gráficos
- FontAwesome / Heroicons para iconografía
- Autenticación con AWS Cognito (OIDC) y pago con Webpay Plus (Transbank)
- Vitest (unit) y Playwright (e2e)

## Requisitos previos

- Node.js 22
- El backend corriendo en `http://localhost:3001` (ver `../fitplan-back/README.md`), con su base de datos levantada (`docker compose up -d` en `../fitplan-db`)
- Un User Pool de Cognito para el login (ver `../doc/flows/auth-flow.md`)

## Puesta en marcha

```bash
cp .env.template .env   # y completar las variables (ver abajo)
npm install
npm run dev             # http://localhost:3000
```

## Variables de entorno

El detalle de cada una está comentado en `.env.template`.

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `BACKEND_URL` | Sí | URL del backend (solo servidor). Ej.: `http://localhost:3001` |
| `SESSION_SECRET` | Sí | Cifra la cookie de sesión (mínimo 32 caracteres) |
| `COGNITO_ISSUER_URL`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_REDIRECT_URI`, `COGNITO_DOMAIN` | Sí | Login con Cognito (solo servidor) |
| `NEXT_PUBLIC_WEBPAY_ENABLED` | No | `true` habilita el pago con Webpay. En `npm run dev` viene habilitado por defecto. Se lee en el build |
| `NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION` | No | `true` muestra los botones de pago simulado (solo desarrollo y pruebas) |
| `WEBPAY_FORM_ORIGINS` | No | Orígenes a los que el CSP deja enviar el formulario de pago (por defecto, Webpay) |
| `PLANS_S3_BUCKET_ORIGIN` | No | Origen del bucket S3 de los planes, permitido por el CSP |
| `NEXT_PUBLIC_BACKEND_CMS_URL`, `NEXT_PUBLIC_PROYECTO_ID` | No | Backend CMS de artículos y testimonios, y el id del proyecto en ese CMS |

## Comandos

```bash
npm run dev              # servidor de desarrollo (:3000)
npm run build            # build de producción
npm run lint:check       # ESLint (npm run lint además corrige)
npm test                 # tests unitarios (Vitest)
npm run test:e2e         # e2e (Playwright): backend falso en :3101 + build de producción en :3100
npm run test:e2e:dev     # e2e contra next dev, más rápido de arrancar
npm run e2e:contract:update  # regenera el contrato del backend que validan los e2e
```

Más detalle sobre los tests en `../doc/doc-front/testing.md`.

## Estructura

```
src/
  app/        rutas (App Router); el área con sesión vive en el route group (sesion)
  features/   un módulo por funcionalidad: consultation, plans, dashboard, profile, measurements, ...
  shared/     componentes, contexto, cliente de la API, auth y errores compartidos
  proxy.ts    CSP con nonce y protección de rutas
e2e/          specs de Playwright, backend falso y copia del contrato del backend
```

Las reglas de arquitectura (Server Actions, barrels, DTOs) están en `CLAUDE.md`.

## Flujo principal

`/consulta/informacion-personal` → `/consulta/anamnesis` → `/consulta/evaluacion-fisica` →
`/consulta/generar-orden` → `/pago/[ordenId]` → `/ordenes/[id]`

El estado de la consulta se administra mediante `ConsultaProvider` (React Context) y persiste en `localStorage` para no perderse entre pasos.

**Layout de estas páginas.** Las páginas de `/consulta/*`, `/pago/[ordenId]` y `/ordenes/[id]` viven en el route group
`src/app/(sesion)/` (el paréntesis no agrega segmento a la URL; las URLs no cambian), junto con `/inicio`,
`/planes`, `/mediciones` y `/perfil`. Comparten `src/app/(sesion)/layout.tsx`, que renderiza `SesionShell`
(`src/shared/components/sesion-shell.component.tsx`): una barra superior fija `TopbarSesion` (100% de ancho,
60px de alto, con el logo "Fitplan" a la izquierda, que lleva a `/inicio`, y el botón "Nueva consulta" a la derecha, que
lleva a `/consulta/anamnesis`), un sidebar `NavbarSesion` a la izquierda (solo md+, debajo de la barra superior) y
el contenido con el padding correspondiente. El sidebar tiene las opciones Inicio (`/inicio`), Planes (`/planes`),
Mediciones (`/mediciones`), Perfil y Cerrar sesión; en móvil no se renderiza y esas opciones pasan a la barra superior. Estas rutas ya no muestran el
navbar público (`NavbarLanding`). En
`/consulta/*`, `/pago/*` y `/ordenes/*` el sidebar arranca **acoplado** en pantallas md+ (angosto, sin links; se
alterna con el botón de flecha del borde derecho o con un click en el sidebar) para dejar espacio al flujo, mientras que
en `/inicio`, `/planes`, `/mediciones` y `/perfil` arranca desacoplado. La elección manual se mantiene entre páginas de una misma
sección y se reinicia al pasar de una a la otra. Todo el flujo exige sesión: el proxy protege `/consulta/*`
(salvo la raíz vacía `/consulta`), `/pago/*` y `/ordenes/*` además de `/inicio`, `/planes`, `/mediciones` y `/perfil`; sin sesión válida
redirige a `/login`. Detalle del gating en `../doc/doc-front/auth.md`.

### 1. Información personal — `/consulta/informacion-personal`
Componente `FormUserInfo`. Formulario (react-hook-form) con los datos personales (`InformacionPersonalDto`:
rut, nombre, apellidos, género, correo, fecha de nacimiento). Al enviar, guarda el objeto en el context
(`setInformacionPersonal`) y redirige a `/consulta/anamnesis`. No hay llamada al backend en este paso.

### 2. Anamnesis — `/consulta/anamnesis`
Componente `ChatAnamnesis`. Chat guiado por IA que arranca con una pregunta fija ("¿Cómo estás? Soy Fitplan...").
Cada respuesta del usuario se envía a `POST /consultations/chat` (`ConsultaService.enviarTurnoAnamnesis`) con el
DTO `InputChatDto`: historial completo de mensajes (`{ role, content }`) + el estado actual de `AnamnesisDto`.
El backend responde `OutputChatDto` con:
- `reply` / `titleReply`: la siguiente pregunta y su título.
- `anamnesis`: el objeto `AnamnesisDto` actualizado con lo que el LLM logró extraer.
- `isComplete`: true cuando el backend considera que ya hay suficiente información (objetivos, clínica,
  alimentaria, estilo de vida).

El estado de `anamnesis` se mantiene local al componente durante todo el chat; solo se persiste al context
(`setAnamnesis`) cuando el usuario hace click en "Siguiente" (visible una vez `isComplete === true`). Si se
recarga la página a mitad de conversación, ese progreso se pierde.

### 3. Evaluación física — `/consulta/evaluacion-fisica`
Componente `FormMediciones`. Formulario simple con peso y talla (`MedicionesDto`; hay otros campos
antropométricos definidos en el DTO pero comentados/deshabilitados en la UI). Al enviar, guarda
`mediciones` en el context y redirige a `/consulta/generar-orden`. Tampoco llama al backend acá: solo arma
el estado local, la consulta completa se envía recién en el paso siguiente.

### 4. Generar orden — `/consulta/generar-orden`
Página de resumen/checkout. El precio no está fijo en el frontend: lo trae `usePersonalizedProduct` desde `GET plans/personalized` (el producto del que el backend toma el monto de la orden) y se muestra con `formatPrice`; `—` mientras carga o si no se pudo obtener. El botón `BtnGenerarOrden`:
1. Arma `ConsultaCompletaDto` (`informacion_personal` + `anamnesis` + `mediciones`) desde el context.
2. Llama a `POST /consultations` (`createOrderAction`), que crea la consulta y su orden en el backend con
   `paymentStatus: 'PENDING'`. **La IA todavía no genera el plan en este punto** — eso se difiere hasta que
   el pago se confirme, para no gastar cómputo en usuarios que abandonan antes de pagar.
3. Redirige a `/pago/{orderId}`.

### 5. Pago — `/pago/[ordenId]`
Pago con **Webpay Plus** (Transbank):

1. "Pagar con Webpay" llama a `POST orders/{orderId}/payments` (`startPaymentAction`): el backend crea la
   transacción con el monto de la orden y responde `{ url, token }`.
2. La página envía un formulario POST con `token_ws` a esa `url` (el formulario de pago de Webpay). El CSP lo
   permite solo hacia Webpay (`form-action` en `src/proxy.ts`; los orígenes se pueden reemplazar con
   `WEBPAY_FORM_ORIGINS`).
3. Al terminar, Webpay devuelve al navegador a **`/api/webpay/return`** (route handler, por GET o por POST, **sin
   exigir sesión**: en un POST entre sitios la cookie `session` no viaja). Ese handler reenvía los parámetros a
   `POST payments/webpay/commit` —el backend confirma el cobro con Transbank— y redirige (303) a
   `/pago/{orderId}`, con `?tipo=predefinido` si el producto es un plan estándar y `?resultado=` cuando el estado
   de la orden no basta para explicar qué pasó (`anulado`, `no_cobrado`, `revision`).
4. De vuelta en `/pago/{orderId}`, la página lee el estado de la orden: pagada → sigue a `/ordenes/{orderId}` (o
   a `/inicio`, vaciando el carro, con `?tipo=predefinido`); rechazada o anulada → aviso y reintento.

Si la confirmación falla (backend o Transbank caídos), el handler redirige a **`/pago/error`**, que ofrece
"Reintentar confirmación" (vuelve a `/api/webpay/return` con el mismo token; es idempotente, no cobra dos veces).

**Webpay aún no validado.** Mientras Transbank no valide la integración, `NEXT_PUBLIC_WEBPAY_ENABLED` queda sin
definir: la página muestra un aviso ("El pago con Webpay aún no está validado…") y "Pagar con Webpay" queda
deshabilitado. Con `NEXT_PUBLIC_WEBPAY_ENABLED=true` (se lee en el build) el pago funciona normalmente; `.env.test` y
`vitest.config.ts` lo definen para las pruebas. En desarrollo (`npm run dev`) Webpay queda **habilitado por defecto**: el
backend usa el ambiente de integración de Transbank y se paga con sus
[tarjetas de prueba](https://www.transbankdevelopers.cl/documentacion/como_empezar#tarjetas-de-prueba) (p. ej. VISA
`4051 8856 0044 6623`, CVV `123`, cualquier fecha futura; RUT `11.111.111-1`, clave `123`). Para apagarlo en desarrollo:
`NEXT_PUBLIC_WEBPAY_ENABLED=false`.

**Pago simulado (solo desarrollo y pruebas).** Con `NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION=true` la página
muestra además "Simular pago" (`simulatePaymentAction` → `POST dev/orders/{orderId}/simulate-payment`) y
"Simular rechazo" (`simulatePaymentRejectionAction`), que marcan la orden sin pasar por Webpay. En el backend
requieren `ENABLE_PAYMENT_SIMULATION=true`. En producción no se define ninguna de las dos variables.

Al entrar, la página consulta el estado de la orden (`getOrderStatusAction`):

- **`REJECTED`** (el último pago fue rechazado): muestra el aviso "Tu pago fue rechazado" y deja reintentar.
- **`EXPIRED`** (pasaron 24 h sin pagarse): muestra "Esta orden expiró" sin botón de pago, con un enlace para
  empezar de nuevo (`/consulta/anamnesis`, o `/planes-estandar` con `?tipo=predefinido`). El backend borra la
  consulta de una orden expirada. Si la orden vence con la página abierta, iniciar el pago falla (409) y se
  muestra este mismo estado.
- **`PAID`**: no vuelve a cobrar; redirige como si se acabara de pagar.

`/ordenes/{ordenId}` también corta el polling ante `REJECTED` (enlace "Reintentar pago" a `/pago/{ordenId}`) y
`EXPIRED`. En `/inicio`, una consulta con el pago rechazado lleva el tag "Pago rechazado" (`planStatus:
'payment_rejected'`) y conserva el botón "Pagar consulta".


### 6. Orden — `/ordenes/[id]`
Hace polling a `GET orders/{id}/status` (`getOrderStatusAction`) cada 4s
(`INTERVALO_POLLING_MS`), leyendo `EstadoOrdenDto { estado_pago, estado_generacion, plan_json, pdf_url }`:
- `NOT_STARTED` / `GENERATING` → barra de avance `PlanGenerationProgress`
  (`features/consultation/components/plan-generation-progress.tsx`) con el aviso "suele tardar entre 2 y 3
  minutos". El avance es **simulado** (no refleja el proceso real del backend): sigue la curva
  `90 × (1 − e^(−t/60 s))`, así que se acerca al 90 % sin alcanzarlo nunca, para no quedar "completa" con el plan
  aún sin llegar. El inicio se guarda por orden en `sessionStorage` (`plan_generation_started_<orderId>`): una
  recarga no reinicia la barra. Mientras llega la primera respuesta del estado se muestra un spinner. Pasados
  4 min (`DELAY_THRESHOLD_MS`) se suma un aviso de demora, aclarando que el pago ya quedó registrado.
- `COMPLETED` (con `pdf_url`) → detiene el polling y muestra `PlanFileCard`
  (`src/shared/components/plan-file-card.component.tsx`, la misma card del PDF que usa `/planes/[orderId]`): la miniatura
  de la página 1 del plan (`thumbnailUrl`, URL firmada de S3 de corta duración; placeholder si es `null`) y un
  botón "Descargar plan" hacia `pdfUrl` (URL firmada con `Content-Disposition: attachment`, que baja el PDF
  completo), más un botón "Ir a inicio" (→ `/inicio`) que la card muestra solo en `/ordenes/[id]` (`usePathname`). El PDF ya no se incrusta en un `<iframe>`. El PDF tampoco se genera en el navegador: antes esta
  página renderizaba `DescargarPlanPdf` (`@react-pdf/renderer`, cargado dinámicamente porque solo corre
  client-side) a partir de `plan_json`; ahora el backend lo genera, lo sube a S3 y devuelve `pdf_url`
  directamente. `DescargarPlanPdf` sigue existiendo y en uso en `/consulta/plan-nutricional`, solo dejó
  de usarse acá.
- `error` → detiene el polling, mensaje tranquilizador ("Tu pago está a salvo") indicando que el equipo fue
  notificado.

Al confirmarse el pago, el backend pasa a generar el plan de forma asíncrona; esta página es
la que espera y muestra ese resultado. El enlace es reutilizable: el usuario puede cerrar la pestaña y volver
más tarde con la misma URL.

## Plan generado

### Página 1
- En la sección 'prescripción' se muestra el aporte real de macronutrientes del plan, y NO el calculo teorico,
  sino el resultado del aporte nutricional de todas las porciones de alimentos prescritas.

## Estado (Context)

`ConsultaProvider` / `useConsulta` (`src/shared/context/consulta.context.tsx`) mantiene cuatro piezas de
estado — `informacionPersonal`, `anamnesis`, `mediciones`, `planNutricional` — cada una con su setter
(`setInformacionPersonal`, etc.) y su reset individual. Todo el estado se persiste en `localStorage`
(`consulta_context`) en cada mutación, por lo que sobrevive a un refresh de página (excepto el progreso de
chat no confirmado del paso 2). `getConsultaCompleta()` arma el `ConsultaCompletaDto` completo a partir de
las tres primeras piezas (retorna `null` si falta alguna).

Nota: `planNutricional` en el context queda hoy sin usar en el flujo principal — desde que se introdujo el
flujo de orden/pago, el plan se obtiene vía polling en `/ordenes/[id]` (`plan_json` de `EstadoOrdenDto`), no
a través del context.

## Backend (NestJS + PostgreSQL)

Vive en otro repo (`../fitplan-back`). Su contrato está documentado en su README y en
`../doc/product/use-cases.md`. Todas sus rutas cuelgan de `/api/v1`: `apiFetch`
(`src/shared/api/client.ts`, `server-only`) antepone ese prefijo a cada endpoint y usa `BACKEND_URL`
(privado) como base. Solo se llama desde Server Actions, que adjuntan el Access Token de Cognito.

| Método | Endpoint (sin `/api/v1`) | Server Action | Uso |
|---|---|---|---|
| POST | `me/sync` | `syncProfileAction` + callback de Cognito | crea/sincroniza la identidad y devuelve el perfil |
| GET / PATCH | `me` | `getUserProfileAction` / `updateUserProfileAction`, `updateProfileAction` | leer / actualizar el perfil (PATCH parcial) |
| GET | `me/summary` | `getDashboardSummaryAction` | nombre y edad de la card "Información personal" de `/inicio` |
| GET | `me/consultations` | `getMyConsultationsAction` | consultas del usuario con estado del plan (`/inicio`, tarjeta 2) |
| GET | `me/consultations/:id` | `getMyConsultationAction` | detalle de una consulta (`/inicio/consultas/[id]`; 404 → página "Consulta no encontrada") |
| GET | `me/plans` | `getMyPlansAction` | planes del usuario con PDF (nombre, tipo, fecha, resumen), del más nuevo al más antiguo (`/inicio`, tarjeta 3) |
| GET | `me/plans/:orderId` | `getMyPlanAction` | detalle de un plan (`/planes/[orderId]` y el plan de `/inicio/consultas/[id]`; 404 → página "Plan no encontrado") |
| GET | `me/measurements` | `getMyMeasurementsAction` | mediciones del usuario, más reciente primero (`/mediciones`) |
| GET | `me/measurements/:id` | `getMyMeasurementAction` | detalle de una medición (`/mediciones/[id]` y su edición, y cada medición de `/inicio/consultas/[id]`; 404 → "Medición no encontrada") |
| POST / PATCH | `me/measurements`, `me/measurements/:id` | `recordMeasurementAction` / `updateMeasurementAction` | registrar (`/mediciones/nueva`) y corregir (`/mediciones/[id]/editar`) una medición. Bioimpedancia: grasa corporal y masa muscular obligatorias, grasa visceral y masa ósea opcionales, cada una en % o kg (un solo valor); el backend calcula la otra unidad y el IMC |
| POST | `consultations/chat` | `sendAnamnesisTurnAction` | turno de chat de anamnesis |
| POST | `consultations` | `createOrderAction` | crea la consulta y su orden (`paymentStatus: 'PENDING'`) |
| GET | `orders/:id/status` | `getOrderStatusAction` | polling de estado de pago (`PENDING`/`PAID`/`REJECTED`/`EXPIRED`)/generación, `expirationDate`, `planJson`, `pdfUrl`, `thumbnailUrl` |
| POST | `orders/:id/payments` | `startPaymentAction` | inicia el pago en Webpay: `{ url, token }` para el formulario de pago |
| POST | `payments/webpay/commit` | route handler `/api/webpay/return` (sin sesión) | confirma el pago al volver de Webpay: `{ orderId, productType, outcome }` |
| POST | `dev/orders/:id/simulate-payment` | `simulatePaymentAction` | pago simulado, solo desarrollo y pruebas (`NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION`) |
| POST | `dev/orders/:id/simulate-payment-rejection` | `simulatePaymentRejectionAction` | simula un pago rechazado (la orden queda `REJECTED`, reintentable) |
| GET | `plans/standard/previews`, `plans/standard/:code` | `getPlanPreviewsAction`, `getPredefinedProductAction` | catálogo público de planes estándar |
| GET | `plans/personalized` | `getPersonalizedProductAction` | precio del plan personalizado (lo muestran `/consulta/inicio` y `/consulta/generar-orden`; es el monto con que el backend crea la orden) |
| POST | `plans/standard/:code/purchase` | `createPredefinedOrderAction` | compra de un plan estándar (sin body) |


## Despliegue y CI

- **Despliegue**: AWS Amplify, configurado en `amplify.yml`. Amplify solo expone las variables durante el build, así que las de servidor se incrustan al construir (`SERVER_ENV_KEYS` en `next.config.ts`): una variable de servidor nueva se agrega ahí y en el `grep` de `amplify.yml`. Más detalle en `../doc/architecture/deployment-guide.md`.
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) en cada PR y en cada push a `main` y `dev`: lint, tipos, tests unitarios, e2e y `npm audit`. Ver `../doc/architecture/ci.md`.


## Contribuir

- Ramas desde `dev`, con PR hacia `dev`/`main`. El CI debe pasar.
- Commits con el formato `tipo(alcance): descripción` en español, p. ej. `fix(csp): ...`, `update(doc): ...`.
- Un cambio en el contrato con el backend se despliega junto con `fitplan-back` y actualiza el backend falso de los e2e.
