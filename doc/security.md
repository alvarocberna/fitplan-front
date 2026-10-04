# Seguridad

La documentación de seguridad del frontend vive en la raíz del workspace:

- [`../../doc/security/frontend-security.md`](../../doc/security/frontend-security.md) — todos los controles de
  este repositorio: sesión y cookie cifrada, flujo OIDC, control de acceso a rutas, Server Actions, CSP con nonce,
  cabeceras, datos en el navegador, dependencias.
- [`../../doc/security/security.md`](../../doc/security/security.md) — matriz de vulnerabilidades y medidas de toda
  la aplicación.

Recordatorios al tocar este repositorio:

- La CSP se genera por request en `src/proxy.ts` (nonce + `strict-dynamic`). Para un origen nuevo de imágenes o
  de API se extiende la directiva correspondiente (y `images.remotePatterns` en `next.config.ts`); no se relaja
  la política. Por los nonces, todas las páginas se renderizan de forma dinámica.
- Las cabeceras estáticas están en `next.config.ts`.
- Una Server Action es un endpoint público: valida los ids con `uuidParam` (`src/shared/api/path-params.ts`) y no
  pongas `'use server'` en archivos de helpers.
