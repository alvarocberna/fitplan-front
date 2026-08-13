
# DESCRIPCIÓN

Nutri-Agente es un agente de IA especializado en nutrición deportiva. El frontend (Next.js) recopila la
información del usuario en varios pasos, la envía a un backend en NestJS que la procesa con IA, y genera un
plan nutricional en PDF. El plan solo se genera una vez que el usuario paga la consulta.

El backend es un proyecto aparte (NestJS + SQLite) y no vive en este repo. Su base de datos tiene una única
entidad: **`orden`**, que concentra tanto los datos de la consulta como el estado de pago y de generación del
plan. El frontend habla con él a través de `NEXT_PUBLIC_BACKEND_URL` (`src/shared/api/client.ts`).


# FLUJO PRINCIPAL

`/consulta/informacion-personal` → `/consulta/anamnesis` → `/consulta/evaluacion-fisica` →
`/consulta/generar-orden` → `/pago/[ordenId]` → `/ordenes/[id]`

## 1. Información personal — `/consulta/informacion-personal`
Componente `FormUserInfo`. Formulario (react-hook-form) con los datos personales (`InformacionPersonalDto`:
rut, nombre, apellidos, género, correo, fecha de nacimiento). Al enviar, guarda el objeto en el context
(`setInformacionPersonal`) y redirige a `/consulta/anamnesis`. No hay llamada al backend en este paso.

## 2. Anamnesis — `/consulta/anamnesis`
Componente `ChatAnamnesis`. Chat guiado por IA que arranca con una pregunta fija ("¿Cómo estás? Soy Nuvi...").
Cada respuesta del usuario se envía a `POST consulta/chat` (`ConsultaService.enviarTurnoAnamnesis`) con el
DTO `InputChatDto`: historial completo de mensajes (`{ role, content }`) + el estado actual de `AnamnesisDto`.
El backend responde `OutputChatDto` con:
- `reply` / `titleReply`: la siguiente pregunta y su título.
- `anamnesis`: el objeto `AnamnesisDto` actualizado con lo que el LLM logró extraer.
- `isComplete`: true cuando el backend considera que ya hay suficiente información (objetivos, clínica,
  alimentaria, estilo de vida).

El estado de `anamnesis` se mantiene local al componente durante todo el chat; solo se persiste al context
(`setAnamnesis`) cuando el usuario hace click en "Siguiente" (visible una vez `isComplete === true`). Si se
recarga la página a mitad de conversación, ese progreso se pierde.

## 3. Evaluación física — `/consulta/evaluacion-fisica`
Componente `FormMediciones`. Formulario simple con peso y talla (`MedicionesDto`; hay otros campos
antropométricos definidos en el DTO pero comentados/deshabilitados en la UI). Al enviar, guarda
`mediciones` en el context y redirige a `/consulta/generar-orden`. Tampoco llama al backend acá: solo arma
el estado local, la consulta completa se envía recién en el paso siguiente.

## 4. Generar orden — `/consulta/generar-orden`
Página de resumen/checkout (precio fijo `PRECIO_CONSULTA`). El botón `BtnGenerarOrden`:
1. Arma `ConsultaCompletaDto` (`informacion_personal` + `anamnesis` + `mediciones`) desde el context.
2. Llama a `POST ordenes/crear` (`ConsultaService.crearOrden`), que crea la fila `orden` en el backend con
   `estado_pago: 'pendiente'`. **La IA todavía no genera el plan en este punto** — eso se difiere hasta que
   el pago se confirme, para no gastar cómputo en usuarios que abandonan antes de pagar.
3. Redirige a `/pago/{orden_id}`.

## 5. Pago — `/pago/[ordenId]`
Pasarela **simulada**: los campos de tarjeta son decorativos/`disabled`, no hay integración real con ningún
proveedor. El botón "Pagar" llama a `POST webhooks/ordenes/{ordenId}/simular-pago`
(`ConsultaService.simularPago`), que dispara en el backend la misma lógica que ejecutaría el webhook real de
un proveedor de pago (Mercado Pago, Flow, Stripe, etc.) al confirmar un cobro. Tras la respuesta, redirige a
`/ordenes/{ordenId}`.

> Cuando se integre una pasarela real, esta página se reemplaza por la redirección al checkout de ese
> proveedor, y la confirmación llegará por su webhook real en vez del botón "Pagar".

## 6. Orden — `/ordenes/[id]`
Hace polling a `GET ordenes/obtener-estado/{id}` (`ConsultaService.obtenerEstadoOrden`) cada 4s
(`INTERVALO_POLLING_MS`), leyendo `EstadoOrdenDto { estado_pago, estado_generacion, plan_json }`:
- `no_iniciado` / `generando` → spinner ("Estamos generando tu plan nutricional..."). Pasados 45s
  (`UMBRAL_DEMORA_MS`) se muestra un aviso de demora, aclarando que el pago ya quedó registrado.
- `completado` (con `plan_json`) → detiene el polling, muestra el botón de descarga del PDF
  (`DescargarPlanPdf`, cargado dinámicamente porque `@react-pdf/renderer` solo corre en el navegador).
- `error` → detiene el polling, mensaje tranquilizador ("Tu pago está a salvo") indicando que el equipo fue
  notificado.

Al llegar el webhook de pago confirmado, el backend pasa a generar el plan de forma asíncrona; esta página es
la que espera y muestra ese resultado. El enlace es reutilizable: el usuario puede cerrar la pestaña y volver
más tarde con la misma URL.

# PLAN GENERADO

## Pagina 1
- En la sección 'prescripción' se muestra el aporte real de macronutrientes del plan, y NO el calculo teorico,
  sino el resultado del aporte nutricional de todas las porciones de alimentos prescritas.


# ESTADO (CONTEXT)

`ConsultaProvider` / `useConsulta` (`src/shared/context/consulta.context.tsx`) mantiene cuatro piezas de
estado — `informacionPersonal`, `anamnesis`, `mediciones`, `planNutricional` — cada una con su setter
(`setInformacionPersonal`, etc.) y su reset individual. Todo el estado se persiste en `localStorage`
(`consulta_context`) en cada mutación, por lo que sobrevive a un refresh de página (excepto el progreso de
chat no confirmado del paso 2). `getConsultaCompleta()` arma el `ConsultaCompletaDto` completo a partir de
las tres primeras piezas (retorna `null` si falta alguna).

Nota: `planNutricional` en el context queda hoy sin usar en el flujo principal — desde que se introdujo el
flujo de orden/pago, el plan se obtiene vía polling en `/ordenes/[id]` (`plan_json` de `EstadoOrdenDto`), no
a través del context.


# BACKEND (NestJS + SQLite)

Vive en otro repo. Su base de datos SQLite contiene una única entidad, **`orden`**, que concentra:
- los datos de la consulta enviados al crearla (`informacion_personal`, `anamnesis`, `mediciones`),
- `estado_pago`: `'pendiente' | 'pagado'`,
- `estado_generacion`: `'no_iniciado' | 'generando' | 'completado' | 'error'`,
- `plan_json`: el `PlanNutricionalDto` resultante, una vez generado.

Endpoints consumidos por este frontend (`ConsultaService`, `src/features/consulta/services/consulta.service.ts`):

| Método | Endpoint | Uso |
|---|---|---|
| POST | `consulta/chat` | turno de chat de anamnesis |
| POST | `ordenes/crear` | crea la orden (`estado_pago: 'pendiente'`) |
| POST | `webhooks/ordenes/:ordenId/simular-pago` | simula la confirmación de pago (stand-in del webhook real) |
| GET | `ordenes/obtener-estado/:ordenId` | polling de estado de pago/generación y `plan_json` |

La URL base sale de `NEXT_PUBLIC_BACKEND_URL` (`src/shared/api/client.ts`), que centraliza el `fetch` y el
manejo de errores HTTP para todo el servicio.

# DEUDA TECNICA

La URL del backend está como variable de entorno publica. Eso es innecesario y peligroso. No debería
exponer la url de backend. Cambiar a una variable privada, y cambiar el método de fetch para que sea
compatible con este cambio.

Sería bueno que la información recopilada en anamnesis se vaya almacenando en cada respuesta, y no solo
al final del chat. Esto ayudaría economicamente en caso de que el usuario recargue la página, ya que
se evitaría volver a hacer las mismas request que van consumiendo tokens. Además mejoraría la experiencia
del usuario. Habría que añadir un button de reset eso si por si el usario abandona intencionalmente, y luego
quiere una nueva conversación desde cero.

El objeto planNutricional se almacena en el context pero queda sin usar, ya que para generar el plan de hace
polling al backend que provee este objeto. Se mantiene por ahora porque tampoco hace daño.

