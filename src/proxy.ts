import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasValidSession, SESSION_COOKIE } from "@/shared/auth/session";
import { isSesionRoute, isSessionGatedPrefix } from "@/shared/auth/sesion-routes";

const apiCMSUrl =
  process.env.NEXT_PUBLIC_BACKEND_CMS_URL || "http://localhost:3001";
const s3Bucket = "https://web-core-storage.s3.us-east-1.amazonaws.com";
// Bucket privado donde el backend almacena los PDFs de los planes nutricionales y sus miniaturas
// (ver StorageService en nutricionista-virtual-back). Se accede solo con URLs firmadas: las
// miniaturas <img> de /inicio y /ordenes/[id] (img-src). Las descargas del PDF son navegaciones de
// un <a>, no las restringe el CSP, y el PDF ya no se incrusta en un <iframe> (no va en frame-src).
const plansS3Bucket =
  "https://nutricionista-virtual-planes-pdfs.s3.us-east-1.amazonaws.com";

// Formulario de pago de Webpay (Transbank): /pago/[orderId] envía al navegador ahí con un formulario
// POST, así que debe estar en form-action. Por defecto, los ambientes de integración y producción de
// Transbank; WEBPAY_FORM_ORIGINS (orígenes separados por espacio) lo reemplaza, p. ej. en los e2e, que
// usan un Webpay falso.
const webpayFormOrigins =
  process.env.WEBPAY_FORM_ORIGINS ||
  "https://webpay3gint.transbank.cl https://webpay3g.transbank.cl";

// Rutas bajo /consulta/* que deben quedar accesibles sin sesión: solo /consulta (vacía, sin uso).
// /consulta/inicio ahora requiere sesión igual que el resto — sin ella, el proxy redirige a /login
// antes de que la página se renderice. El login vive en /login (fuera de /consulta/*, así que no
// necesita estar acá para no crear un loop de redirects). Cualquier otra ruta que empiece con
// "/consulta/" queda protegida por defecto, incluidas las que se agreguen a futuro.
// El resto del flujo (/pago/* y /ordenes/*) y el área de usuario (/inicio, /planes, /mediciones, /perfil) exigen sesión
// por completo: ver isSessionGatedPrefix / isSesionRoute en sesion-routes.ts.
const PUBLIC_CONSULTA_PATHS = new Set(["/consulta"]);

function requiresSession(pathname: string): boolean {
  return (
    (pathname.startsWith("/consulta/") && !PUBLIC_CONSULTA_PATHS.has(pathname)) ||
    isSessionGatedPrefix(pathname) ||
    isSesionRoute(pathname)
  );
}

// El CSP se genera por request (con nonce) en el proxy en vez de en
// next.config.ts porque el nonce debe ser único por respuesta.
export async function proxy(request: NextRequest) {
  if (requiresSession(request.nextUrl.pathname)) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    const isAuthenticated = sessionCookie ? await hasValidSession(sessionCookie) : false;

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${apiCMSUrl} ${s3Bucket} ${plansS3Bucket};
    font-src 'self';
    connect-src 'self' ${apiCMSUrl};
    frame-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
    form-action 'self' ${webpayFormOrigins};
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
