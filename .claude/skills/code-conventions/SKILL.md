---
name: code-conventions
description: Convenciones de nomenclatura y estilo de código para este proyecto (Next.js 16 App Router, React 19, TypeScript, Server Actions). Usar al escribir código nuevo, al revisar/refactorizar código existente, o al decidir cómo nombrar un componente, hook, Server Action, servicio, DTO, tipo, variable, constante, archivo o carpeta nuevos.
metadata:
  version: "2.0.0"
---

# Code Conventions

Estandariza cómo se nombran tipos, componentes, variables, funciones, constantes, archivos y carpetas en este repo. El proyecto es **TypeScript** (`strict`) sobre Next.js 16 App Router + React 19 + Tailwind CSS 4, con runtime de servidor (Server Actions, route handlers, `src/proxy.ts`).

Esta skill cubre **nombres y estilo**. Dónde va cada pieza y cómo se conectan (capas `app` / `features` / `shared`, `apiFetch`, barrels, manejo de errores, seguridad) está en `CLAUDE.md` y `../doc/doc-front/`; no se repite aquí.

## 1. Reglas generales de nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `function PlanStatusBadge()` |
| Clases, interfaces, types | PascalCase | `class MeasurementsService`, `MeasurementSummaryDto` |
| Variables, funciones, métodos, propiedades | camelCase | `accessToken`, `buildPlanCode()` |
| Constantes de módulo (valores fijos, no reasignados) | UPPER_SNAKE_CASE | `STATUS_BADGE`, `DELAY_THRESHOLD_MS` |
| Carpetas | kebab-case | `nutrition-plan`, `evaluacion-fisica` |
| Archivos | kebab-case + sufijo de rol (ver §2) | `plan-status-badge.component.tsx` |

No apliques UPPER_SNAKE_CASE a estado de React (`useState`) ni a objetos que cambian según props — esa regla es solo para constantes verdaderas a nivel de módulo.

**Idioma.** Identificadores en inglés (`ConsultationService`, `getMyMeasurementsAction`, `isPaying`). En español van solo:
- las carpetas de rutas de `src/app` y las URLs que producen (`/consulta/evaluacion-fisica`, `/ordenes/[id]`);
- los textos que ve el usuario y los comentarios del código;
- lo ligado al grupo de rutas `(sesion)` (`SesionShell`, `isSesionRoute`, `sesion-routes.ts`);
- los campos que vienen tal cual del CMS (`nombre`, `calificacion`, `fecha_creacion` en las entidades de artículos/testimonios).

## 2. Archivos

**Regla general: kebab-case con sufijo de rol separado por punto.** El nombre del archivo no coincide en casing con lo que exporta: `plan-status-badge.component.tsx` exporta `PlanStatusBadge`. No uses `PascalCase.tsx` para archivos.

| Rol | Patrón | Ubicación |
|---|---|---|
| Componente | `<nombre>.component.tsx` | `features/<f>/components/`, `shared/components/` |
| Server Actions | `<feature>.actions.ts` | `features/<f>/services/`, `shared/auth/`, `shared/errors/` |
| Servicio (wrapper para Client Components) | `<feature>.service.ts` | `features/<f>/services/` |
| DTO | `<nombre>.dto.ts` | `features/<f>/dtos/` |
| Entidad (solo features del CMS) | `<nombre>.entity.ts` | `features/<f>/entities/` |
| Hook | `use-<nombre>.ts` | `features/<f>/hooks/` |
| Context / Provider | `<nombre>.context.tsx`, `<nombre>.provider.tsx` | `shared/context/`, `shared/providers/` |
| Constantes / estilos de un módulo | `<nombre>.constants.ts`, `<nombre>.styles.ts` | junto al módulo |
| Utilidad o lógica pura | `<nombre>.ts` (sin sufijo) | raíz del feature o `shared/<área>/` (`format-price.ts`, `plan-code.ts`) |
| Test unitario | `<archivo>.test.ts(x)` | junto al archivo que prueba |
| Test de una página | `<ruta>-page.test.tsx` | `src/app/__tests__/` |
| Test e2e | `<flujo>.spec.ts` | `e2e/` |

Extensiones: `.tsx` solo si el archivo contiene JSX; `.ts` para todo lo demás. No se agregan archivos `.js`/`.jsx` (los `.mjs` existentes son configuración y el fake backend de e2e).

**Excepción — nombres reservados de Next.js.** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `route.ts` y `src/proxy.ts` (reemplazo de `middleware.ts` en Next 16) deben mantenerse exactamente así: el framework los resuelve por nombre. Lo mismo las carpetas con sintaxis de ruta: `[id]`, `(sesion)`.

**Deuda existente** (corregir de forma oportunista, al tocar esos archivos por otra razón — no abrir un PR solo para esto salvo que se pida explícitamente):
- Componentes sin el sufijo `.component`: los de `features/consultation/components/`, `features/nutrition-plan/components/`, `features/dev/components/` y varios de `shared/components/` (`card.tsx`, `input-outlined.tsx`, `section-title.tsx`, `subsection-*.tsx`, `general-container.tsx`).
- `features/consultation/interfaces/*.interface.ts` con tipos terminados en `Interface` (`FormPersonalInfoInterface`): es un patrón antiguo; los tipos nuevos van en `dtos/` o junto al componente, sin ese sufijo.
- Handlers con prefijo `handle` anteriores a la regla de §3 (`handlePointerMove`, `handleKeyDown`, `handleNext`, `handleClick`, `handlePaymentError`): pasan a `on*` al tocar ese componente.

Renombrar un archivo existente rompe sus imports, su entrada en el barrel (`features/index.ts` / `shared/index.ts`) y su test — si el usuario pide aplicar esta skill a código ya escrito, señala las desviaciones pero no renombres nada sin confirmación explícita.

## 3. React / Next.js específico

- **Componentes** → PascalCase, `function` con **export nombrado** (`export function PlanDetail()`). `export default` solo en los archivos donde Next lo exige (`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`).
- **Props** → `interface <Componente>Props` declarada sobre el componente (`PlanFileCardProps`). Para una o dos props simples se acepta el tipo en línea: `({ status }: { status: ConsultationPlanStatus | null })`.
- **Hooks personalizados** → camelCase empezando con `use` (`usePredefinedProduct`, `useReportError`), en un archivo `use-<nombre>.ts`.
- **Server Actions** → camelCase, verbo primero y sufijo `Action` (`getMyMeasurementsAction`, `recordMeasurementAction`). El recurso propio del usuario lleva `My`, igual que la ruta `/me` del backend.
- **Servicios** → clase `<Feature>Service` con métodos `public static async`, mismo nombre que la acción sin `My` ni `Action` (`MeasurementsService.getMeasurements()` → `getMyMeasurementsAction()`).
- **DTOs y entidades** → sufijo `Dto` (`MeasurementSummaryDto`) o `Entity`; el DTO lleva un comentario con el archivo del backend que refleja. Los cuerpos de petición se nombran por la operación: `RecordMeasurementDto`, `UpdateMeasurementDto`.
- **Context** → `<Nombre>Provider` + hook `use<Nombre>` en `<nombre>.context.tsx` (`ConsultationProvider` / `useConsultation`).
- **Event handlers**: prefijo `on` tanto en la función definida dentro del componente como en el prop que la recibe — `const onSubmit = ...`, `<Modal onClose={onClose}>`, `<button onClick={onPay}>`. No uses el prefijo `handle`.
- **Directivas**: `'use client'` / `'use server'` en la primera línea del archivo. `'use server'` solo en archivos `*.actions.ts`.

## 4. TypeScript

- Interfaces y type aliases → PascalCase, **sin prefijo `I`** (`UserProfile`, no `IUserProfile`) y sin sufijo `Interface`/`Type`.
- `interface` para formas de objeto (DTOs, props); `type` para uniones, uniones discriminadas y tipos derivados (`Partial<Omit<...>>`).
- **Valores cerrados → unión de literales de string, no `enum`**: `type MeasurementLevel = 'BASIC' | 'ISAK_1' | 'BIOIMPEDANCE'`. Los literales se copian tal cual del backend (sus enums van en UPPER_SNAKE_CASE); los estados propios del front van en minúsculas (`'idle' | 'loading' | 'ready'`). El proyecto no usa `enum`.
- Mapas de etiquetas o estilos por valor → constante `Record<Union, ...>` en UPPER_SNAKE_CASE (`BMI_CLASSIFICATION_LABELS`, `STATUS_BADGE`).
- Tipos explícitos en la firma de lo exportado (parámetros y retorno de acciones, servicios y hooks). Evita `any` en código nuevo (quedan unos pocos en los clientes de API, los inputs compartidos y los tests): usa `unknown` y estrecha.
- `import type` / `export type` cuando solo se importa o reexporta un tipo desde un archivo `server-only` o `'use server'`.

## 5. Evitar nombres ambiguos

Malos: `data`, `temp`, `info`, `x`, `flag`, `val`, `onClick2`.
Buenos: `userProfile`, `filteredMeasurements`, `weightInKg`, `isFormValid`.

Regla práctica: el nombre debe responder "¿qué contiene / qué hace?" sin necesidad de leer la implementación. Para booleanos, prefijo `is`/`has`/`should` (`isModalOpen`, `hasError`, `shouldRetry`). Las unidades van en el nombre cuando no son obvias (`DELAY_THRESHOLD_MS`, `ERROR_TOAST_MS`).

## 6. Formato

No hay ESLint ni Prettier configurados, así que el formato no se aplica solo: sigue el del archivo que estás tocando. Lo dominante es indentación de 4 espacios, comillas simples e imports con el alias `@/` (`@/features`, `@/shared`) en vez de rutas relativas largas.

## Cómo aplicar esta skill

- **Código nuevo**: sigue estas reglas desde el primer commit.
- **Revisión/refactor de código existente**: señala las desviaciones encontradas (nombre, archivo, regla violada) pero no renombres archivos ni identificadores fuera del alcance pedido — proponlo y espera confirmación, ya que renombrar rompe imports y el historial de `git blame`.
