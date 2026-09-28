# Seguridad

## Content-Security-Policy basada en nonces (`src/proxy.ts`)

El CSP del proyecto se migró de `'unsafe-inline'` en `script-src` a un esquema basado en nonces, como parte de
la corrección de hallazgos de un escaneo OWASP ZAP.

El header `Content-Security-Policy` ya no se arma en `next.config.ts`: se genera por request en
`src/proxy.ts`, porque el nonce debe ser distinto en cada respuesta. `proxy.ts` es el file convention que
Next.js 16 usa en reemplazo de `middleware.ts` (la función exportada se llama `proxy` en vez de
`middleware`; ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).

En cada request, `src/proxy.ts`:
- Genera un nonce aleatorio (`crypto.randomUUID()` en base64).
- Arma el header CSP completo, con el nonce embebido en `script-src` como `'nonce-...' 'strict-dynamic'`
  (más `'unsafe-eval'` solo en desarrollo), y lo setea tanto en los request headers (como `x-nonce`, por si
  algún Server Component necesita leerlo vía `headers()` para pasarlo a un `<Script nonce={...}>`) como en los
  response headers.
- Usa un `matcher` que excluye `api`, `_next/static`, `_next/image`, `favicon.ico` y las requests de
  prefetch de `next/link`.
- Define ahí las URLs necesarias para `img-src` / `connect-src`: `apiCMSUrl` (`NEXT_PUBLIC_BACKEND_CMS_URL`),
  `apiNuviUrl` (`NEXT_PUBLIC_BACKEND_URL`) y el bucket S3 (`https://web-core-storage.s3.us-east-1.amazonaws.com`).
- `plansS3Bucket` apunta al bucket privado donde el backend almacena los PDFs de los planes nutricionales y sus
  miniaturas (`https://nutricionista-virtual-planes-pdfs.s3.us-east-1.amazonaws.com`) y va en `img-src`:
  `/panel/planes/[orderId]` y `/ordenes/[id]` muestran la miniatura del plan (`PlanPreviewCard`) con un `<img>` a una URL
  firmada de ese bucket. No hace falta `connect-src` (ni CORS del bucket): la miniatura y la descarga del PDF
  son una carga de `<img>` y una navegación de `<a>`, no un `fetch`.
- `frame-src` es solo `'self' blob:` (este último lo usa `/dev/preview-pdf`). El bucket de planes estuvo en
  `frame-src` mientras `/ordenes/[id]` y `/panel` incrustaban el PDF con un `<iframe>` (`PdfViewer`); se quitó
  al reemplazar el visor por la miniatura + botón de descarga. Si algún día vuelve a incrustarse el PDF,
  habría que volver a añadirlo ahí. Cubierto por `src/proxy.test.ts` ("Content-Security-Policy").

Next.js detecta automáticamente el nonce en el header CSP de la respuesta y lo aplica solo a los scripts que
el propio framework inyecta (bundles, `__NEXT_DATA__`, scripts de streaming/RSC). El proyecto no tiene
`<script>` manuales, así que no fue necesario tocar `layout.tsx`.

**Implicancia**: por el uso de nonces, todas las páginas deben renderizarse de forma dinámica — no hay
ISR ni generación estática con nonces. Esto es una limitación propia de Next.js, documentada en su guía de CSP.

## `next.config.ts`: solo headers estáticos

`next.config.ts` ya no arma el CSP. Su función `headers()` solo deja los headers que no dependen del
request: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, y
`Strict-Transport-Security` (solo en producción).

## CSP igual en dev y prod para las directivas sin fallback

El CSP ahora es igual entre dev y prod en las directivas que no tienen fallback a `default-src`
(`base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`), y agrega `object-src 'none'` también en
dev (antes solo estaba en producción). Esto corrige un segundo hallazgo de ZAP ("CSP: Failure to Define
Directive with No Fallback") que solo afectaba al CSP del entorno de desarrollo.

## Verificación

Se probó build de producción, `tsc --noEmit`, y manualmente en `npm run dev`, confirmando que el header CSP
trae el nonce, que los scripts inyectados por Next.js llevan el nonce correcto, y que la hidratación funciona
(probado en `/` y `/consulta/informacion-personal`) sin violaciones de CSP en consola.
