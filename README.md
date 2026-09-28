# Nutricionista Virtual (Front)

Aplicación web construida con [Next.js](https://nextjs.org) que sirve como interfaz de un agente de IA experto en nutrición deportiva. El frontend recopila la información del usuario en varios pasos (datos personales, anamnesis conversacional y evaluación física), la envía a un backend en NestJS que la procesa con IA, y genera un plan nutricional en formato PDF. El plan solo se genera una vez que el usuario paga la consulta.

El backend es un proyecto aparte (NestJS + SQLite) y no vive en este repo. Su base de datos tiene una única entidad: **`orden`**, que concentra tanto los datos de la consulta como el estado de pago y de generación del plan. El frontend habla con él a través de `NEXT_PUBLIC_BACKEND_URL` (`src/shared/api/client.ts`).

## Stack

- [Next.js](https://nextjs.org) 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- React Hook Form para formularios
- `@react-pdf/renderer` para la generación del plan en PDF
- `@nivo` para gráficos
- FontAwesome / Heroicons para iconografía

## Flujo principal

`/consulta/informacion-personal` → `/consulta/anamnesis` → `/consulta/evaluacion-fisica` →
`/consulta/generar-orden` → `/pago/[ordenId]` → `/ordenes/[id]`

El estado de la consulta se administra mediante `ConsultaProvider` (React Context) y persiste en `localStorage` para no perderse entre pasos.

**Layout de estas páginas.** Las páginas de `/consulta/*`, `/pago/[ordenId]` y `/ordenes/[id]` viven en el route group
`src/app/(sesion)/` (el paréntesis no agrega segmento a la URL; las URLs no cambian), junto con `/panel`,
`/planes`, `/mediciones` y `/perfil`. Comparten `src/app/(sesion)/layout.tsx`, que renderiza `SesionShell`
(`src/shared/components/sesion-shell.component.tsx`): una barra superior fija `TopbarSesion` (100% de ancho,
60px de alto, con el logo "Nuvi" a la izquierda, que lleva a `/panel`, y el botón "Nueva consulta" a la derecha, que
lleva a `/consulta/anamnesis`), un sidebar `NavbarSesion` a la izquierda (solo md+, debajo de la barra superior) y
el contenido con el padding correspondiente. El sidebar tiene las opciones Home (`/panel`), Planes (`/planes`),
Mediciones (`/mediciones`), Perfil y Cerrar sesión; en móvil no se renderiza y esas opciones pasan a la barra superior. Estas rutas ya no muestran el
navbar público (`NavbarLanding`). En
`/consulta/*`, `/pago/*` y `/ordenes/*` el sidebar arranca **acoplado** en pantallas md+ (angosto, sin links; se
alterna con el botón de flecha del borde derecho o con un click en el sidebar) para dejar espacio al flujo, mientras que
en `/panel`, `/planes`, `/mediciones` y `/perfil` arranca desacoplado. La elección manual se mantiene entre páginas de una misma
sección y se reinicia al pasar de una a la otra. Todo el flujo exige sesión: el proxy protege `/consulta/*`
(salvo la raíz vacía `/consulta`), `/pago/*` y `/ordenes/*` además de `/panel`, `/planes`, `/mediciones` y `/perfil`; sin sesión válida
redirige a `/login`. Detalle del gating en `doc/auth.md`.

### 1. Información personal — `/consulta/informacion-personal`
Componente `FormUserInfo`. Formulario (react-hook-form) con los datos personales (`InformacionPersonalDto`:
rut, nombre, apellidos, género, correo, fecha de nacimiento). Al enviar, guarda el objeto en el context
(`setInformacionPersonal`) y redirige a `/consulta/anamnesis`. No hay llamada al backend en este paso.

### 2. Anamnesis — `/consulta/anamnesis`
Componente `ChatAnamnesis`. Chat guiado por IA que arranca con una pregunta fija ("¿Cómo estás? Soy Nuvi...").
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
Página de resumen/checkout (precio fijo `PRECIO_CONSULTA`). El botón `BtnGenerarOrden`:
1. Arma `ConsultaCompletaDto` (`informacion_personal` + `anamnesis` + `mediciones`) desde el context.
2. Llama a `POST /consultations` (`createOrderAction`), que crea la consulta y su orden en el backend con
   `paymentStatus: 'PENDING'`. **La IA todavía no genera el plan en este punto** — eso se difiere hasta que
   el pago se confirme, para no gastar cómputo en usuarios que abandonan antes de pagar.
3. Redirige a `/pago/{orderId}`.

### 5. Pago — `/pago/[ordenId]`
Pasarela **simulada**: los campos de tarjeta son decorativos/`disabled`, no hay integración real con ningún
proveedor. El botón "Pagar" llama a `POST dev/orders/{orderId}/simulate-payment`
(`simulatePaymentAction`; en el backend requiere `ENABLE_PAYMENT_SIMULATION=true`), que dispara en el backend la misma lógica que ejecutaría el webhook real de
un proveedor de pago (Mercado Pago, Flow, Stripe, etc.) al confirmar un cobro. Tras la respuesta, redirige a
`/ordenes/{ordenId}`.

> Cuando se integre una pasarela real, esta página se reemplaza por la redirección al checkout de ese
> proveedor, y la confirmación llegará por su webhook real en vez del botón "Pagar".

### 6. Orden — `/ordenes/[id]`
Hace polling a `GET orders/{id}/status` (`getOrderStatusAction`) cada 4s
(`INTERVALO_POLLING_MS`), leyendo `EstadoOrdenDto { estado_pago, estado_generacion, plan_json, pdf_url }`:
- `NOT_STARTED` / `GENERATING` → spinner ("Estamos generando tu plan nutricional..."). Pasados 45s
  (`UMBRAL_DEMORA_MS`) se muestra un aviso de demora, aclarando que el pago ya quedó registrado.
- `COMPLETED` (con `pdf_url`) → detiene el polling y muestra `PlanPreviewCard`
  (`src/shared/components/plan-preview-card.component.tsx`, la misma tarjeta que usa `/panel`): la miniatura
  de la página 1 del plan (`thumbnailUrl`, URL firmada de S3 de corta duración; placeholder si es `null`) y un
  botón "Descargar" hacia `pdfUrl` (URL firmada con `Content-Disposition: attachment`, que baja el PDF
  completo). El PDF ya no se incrusta en un `<iframe>`. El PDF tampoco se genera en el navegador: antes esta
  página renderizaba `DescargarPlanPdf` (`@react-pdf/renderer`, cargado dinámicamente porque solo corre
  client-side) a partir de `plan_json`; ahora el backend lo genera, lo sube a S3 y devuelve `pdf_url`
  directamente. `DescargarPlanPdf` sigue existiendo y en uso en `/consulta/plan-nutricional`, solo dejó
  de usarse acá.
- `error` → detiene el polling, mensaje tranquilizador ("Tu pago está a salvo") indicando que el equipo fue
  notificado.

Al llegar el webhook de pago confirmado, el backend pasa a generar el plan de forma asíncrona; esta página es
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

Vive en otro repo (`../nutricionista-virtual-back`). Su contrato está documentado en su README y en
`../doc/product/use-cases.md`. Todas sus rutas cuelgan de `/api/v1`: `apiFetch`
(`src/shared/api/client.ts`, `server-only`) antepone ese prefijo a cada endpoint y usa `BACKEND_URL`
(privado) como base. Solo se llama desde Server Actions, que adjuntan el Access Token de Cognito.

| Método | Endpoint (sin `/api/v1`) | Server Action | Uso |
|---|---|---|---|
| POST | `me/sync` | `syncProfileAction` + callback de Cognito | crea/sincroniza la identidad y devuelve el perfil |
| GET / PATCH | `me` | `getUserProfileAction` / `updateUserProfileAction`, `updateProfileAction` | leer / actualizar el perfil (PATCH parcial) |
| GET | `me/summary` | `getPanelSummaryAction` | resumen de `/panel` (tarjeta 1, incluye la última medición) |
| GET | `me/consultations` | `getMyConsultationsAction` | consultas del usuario con estado del plan (`/panel`, tarjeta 2) |
| GET | `me/consultations/:id` | `getMyConsultationAction` | detalle de una consulta (`/panel/consultas/[id]`; 404 → página "Consulta no encontrada") |
| GET | `me/plans` | `getMyPlansAction` | planes del usuario con PDF (nombre, tipo, fecha, resumen), del más nuevo al más antiguo (`/panel`, tarjeta 3) |
| GET | `me/plans/:orderId` | `getMyPlanAction` | detalle de un plan (`/panel/planes/[orderId]`; 404 → página "Plan no encontrado") |
| GET | `me/measurements` | `getMyMeasurementsAction` | mediciones del usuario, más reciente primero (`/mediciones`) |
| GET | `me/measurements/:id` | `getMyMeasurementAction` | detalle de una medición (`/mediciones/[id]` y su edición; 404 → "Medición no encontrada") |
| POST / PATCH | `me/measurements`, `me/measurements/:id` | `recordMeasurementAction` / `updateMeasurementAction` | registrar (`/mediciones/nueva`) y corregir (`/mediciones/[id]/editar`) una medición. Bioimpedancia: grasa corporal y masa muscular obligatorias, grasa visceral y masa ósea opcionales, cada una en % o kg (un solo valor); el backend calcula la otra unidad y el IMC |
| POST | `consultations/chat` | `sendAnamnesisTurnAction` | turno de chat de anamnesis |
| POST | `consultations` | `createOrderAction` | crea la consulta y su orden (`paymentStatus: 'PENDING'`) |
| GET | `orders/:id/status` | `getOrderStatusAction` | polling de estado de pago/generación, `planJson`, `pdfUrl`, `thumbnailUrl` |
| POST | `dev/orders/:id/simulate-payment` | `simulatePaymentAction` | simula la confirmación de pago (stand-in del webhook real) |
| GET | `plans/standard/previews`, `plans/standard/:code` | `getPlanPreviewsAction`, `getPredefinedProductAction` | catálogo público de planes estándar |
| POST | `plans/standard/:code/purchase` | `createPredefinedOrderAction` | compra de un plan estándar (sin body) |

## Deuda técnica

La URL del backend está como variable de entorno publica. Eso es innecesario y peligroso. No debería
exponer la url de backend. Cambiar a una variable privada, y cambiar el método de fetch para que sea
compatible con este cambio.

Sería bueno que la información recopilada en anamnesis se vaya almacenando en cada respuesta, y no solo
al final del chat. Esto ayudaría economicamente en caso de que el usuario recargue la página, ya que
se evitaría volver a hacer las mismas request que van consumiendo tokens. Además mejoraría la experiencia
del usuario. Habría que añadir un button de reset eso si por si el usario abandona intencionalmente, y luego
quiere una nueva conversación desde cero.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
