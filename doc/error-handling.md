# Manejo de errores (error boundaries)

## Contexto

Un escaneo OWASP ZAP sobre `http://localhost:3000` reportó "Divulgación de error de aplicación" en
`/testimonios`: el mensaje de error podía revelar información sensible (ruta del archivo que produjo la
excepción, stack trace).

Al revisar el flujo se confirmó que el problema era real y no estaba acotado a esa página: **el proyecto no
tenía ningún `error.tsx` ni `global-error.tsx` en `src/app`**, en ninguna ruta. Sin un boundary de error, un
`throw` no controlado durante el render de un Server Component llega hasta el overlay de error de desarrollo
de Next.js, que sí incluye stack trace completo, fragmento de código fuente y ruta del archivo — exactamente
lo que detectó ZAP.

Caso concreto que dispara el problema: `src/app/testimonios/page.tsx` hace
`await TestimonialsServicePublic.getTestimonials()`, que internamente usa `apiFetchCMS`
(`src/shared/api/client-cms.ts`). `apiFetchCMS` lanza (`throw new Error(...)`) si el backend CMS no responde,
devuelve un HTTP de error, o el JSON viene malformado. Ese throw no estaba envuelto en ningún `try/catch`.

## Solución: boundaries de error a nivel de app

Se agregaron dos archivos en la raíz de `src/app`:

### `src/app/error.tsx`

Boundary de error genérico para toda la aplicación. En App Router, un `error.tsx` captura los errores de su
propio segmento **y de todos los segmentos anidados por debajo**, hasta encontrar otro `error.tsx` más
cercano en el árbol. Como no hay ningún `error.tsx` más específico en ninguna ruta, este único archivo cubre
hoy todas las rutas existentes que no viven bajo `(sesion)` (`testimonios`, `articulos`, `planes`,
`pago/*`, `carrito`, `dev/*`); `consulta/*`, `ordenes/*`, `panel` y `perfil` las cubre el
`error.tsx` propio de `(sesion)` (ver "Ya implementado para `(sesion)`" más abajo).

Comportamiento:
- Debe ser Client Component (`'use client'`), requisito de Next.js para archivos `error.tsx`.
- Loguea el error completo (`error`, `error.digest`) solo en consola/servidor vía `console.error` — nunca se
  renderiza `error.message` ni el stack al cliente.
- Al usuario se le muestra un mensaje genérico y, si existe, el `digest` — el id de correlación que Next.js
  genera automáticamente para errores de Server Components — como referencia que puede reportar a soporte.
- Ofrece un botón "Reintentar" que llama a `reset()` (vuelve a intentar renderizar el segmento).
- Reutiliza los componentes compartidos `Card`, `SubsectionHead`, `SubsectionTitle` y la clase `btn
  primary-btn`, para mantener el mismo lenguaje visual que el estado de error ya existente en
  `src/app/(sesion)/ordenes/[id]/page.tsx`.

### `src/app/global-error.tsx`

Cubre el único caso que `error.tsx` no puede capturar: un error en el propio `src/app/layout.tsx` (root
layout). Next.js exige que este archivo defina su propio `<html>`/`<body>`, porque reemplaza el layout raíz
completo (se pierde `NavbarLanding`, `Providers`, fuentes, etc.).

Por eso es deliberadamente autocontenido:
- No importa componentes compartidos ni depende de `Providers`/fuentes — podrían ser parte de lo que falló.
- Usa estilos inline en vez de clases de Tailwind/`globals.css`, ya que ese CSS se carga hoy de forma
  transitiva a través de otros componentes (ver nota abajo) que este archivo no renderiza.
- Mismo criterio que `error.tsx`: solo `digest` + botón "Reintentar", detalle completo solo en consola.

## Qué NO se expone al usuario

En ambos archivos, lo único visible en el navegador es:
- Un mensaje genérico en español ("Algo salió mal", "Ocurrió un error inesperado...").
- El `digest` del error, si Next.js lo generó (string opaco, no revela nada del código fuente).
- Un botón para reintentar.

`error.message` y el stack trace nunca se renderizan — solo van a `console.error`, que en producción no
llega al cliente.

## Nota: carga de `globals.css`

`src/app/layout.tsx` tiene el import de `./globals.css` comentado; el CSS global termina cargándose de forma
indirecta porque `src/shared/components/subsection-row.tsx` lo importa (`import '../../app/globals.css'`) y
ese componente se usa en páginas reales. Esto es preexistente y no se tocó como parte de este cambio, pero es
la razón por la que `error.tsx` (que sí se renderiza dentro del layout normal, junto a `NavbarLanding`) puede
confiar en las clases de Tailwind/`globals.css`, mientras que `global-error.tsx` (que reemplaza el layout
completo) no puede y usa estilos inline.

## Extensión futura (opcional)

Un `error.tsx` en un segmento anidado (por ejemplo `src/app/(sesion)/consulta/error.tsx` u
`src/app/(sesion)/ordenes/error.tsx`) reemplazaría solo el contenido de esa sección, manteniendo visible el `layout.tsx`
propio de esa sección (navbar/stepper). Antes de mover `consulta/*` y `ordenes/*` a `(sesion)`, un error en
esas rutas caía directo al `error.tsx` genérico de raíz, perdiendo ese contexto visual (hoy ya lo cubre el
`error.tsx` de `(sesion)`, ver abajo). No es necesario por seguridad — el boundary de raíz ya cierra el hallazgo
de ZAP — pero podría agregarse más adelante como mejora de UX si alguna sección lo justifica.

**Ya implementado para `(sesion)`**: `src/app/(sesion)/error.tsx` es el primer caso real de este patrón.
`src/app/(sesion)/layout.tsx` (compartido por `/panel`, `/perfil`, `/consulta/*` y `/ordenes/[id]`)
renderiza `SesionShell` (sidebar `NavbarSesion` a la izquierda, acoplable, más `<main>{children}</main>`
con el padding correspondiente); `/panel` y `/perfil` son Server Components `async` que hacen `await
PanelService.getSummary()` / `ProfileService.getProfile()` sin `try/catch`, así que cualquier falla de esas
llamadas (ej. el backend caído, o los 404 que se vieron mientras `/user/me` y `/panel/resumen` corrían contra
un proceso de dev server desactualizado — ver `nutricionista-virtual-back/doc/technical-debt.md`) se propaga
como un `throw`. Sin un `error.tsx` propio en `(sesion)`, ese throw lo capturaba el `error.tsx` de raíz, que
reemplaza *todo* `{children}` del layout raíz — incluyendo `(sesion)/layout.tsx` completo, sidebar y todo, no
solo el contenido de la página que falló. Con `src/app/(sesion)/error.tsx` (mismo diseño que el `error.tsx`
raíz: `'use client'`, solo loguea `error.digest` en consola, botón "Reintentar" vía `reset()`), el boundary
más cercano pasa a ser este, que vive en la misma carpeta que `(sesion)/layout.tsx` — por la regla de Next.js
de que un `error.tsx` no reemplaza el `layout.tsx` de su propio segmento, el sidebar y el `<main>` quedan
visibles y solo se reemplaza el contenido de la página fallida. Como `consulta/*` y `ordenes/*` ahora viven
dentro de `(sesion)`, este mismo `error.tsx` también las cubre (un error en un paso del flujo o en
`/ordenes/[id]` mantiene el sidebar visible); un `error.tsx` propio por sección sigue siendo opcional.

## Verificación

- `tsc --noEmit` sin errores tras agregar ambos archivos.
- No se pudo correr `npm run lint` (`next lint`) para validar este cambio: falla con
  `Invalid project directory provided, no such directory: .../lint`, un problema preexistente de
  configuración del proyecto no relacionado con este cambio.
- Pendiente: volver a correr el escaneo ZAP contra `/testimonios` (idealmente también contra
  `npm run build && npm run start`, no solo `npm run dev`) para confirmar que la alerta ya no aparece.
