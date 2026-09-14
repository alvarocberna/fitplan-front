import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasValidSession, SESSION_COOKIE } from "@/shared/auth/session";

const apiCMSUrl =
  process.env.NEXT_PUBLIC_BACKEND_CMS_URL || "http://localhost:3001";
const s3Bucket = "https://web-core-storage.s3.us-east-1.amazonaws.com";

// Rutas bajo /consulta/* que deben quedar accesibles sin sesión: la landing pre-login, el login
// en sí (para no crear un loop de redirects) y /consulta (vacía, sin uso). Cualquier otra ruta
// que empiece con "/consulta/" queda protegida por defecto, incluidas las que se agreguen a futuro.
const PUBLIC_CONSULTA_PATHS = new Set(["/consulta", "/consulta/inicio", "/consulta/login"]);

function requiresSession(pathname: string): boolean {
  return pathname.startsWith("/consulta/") && !PUBLIC_CONSULTA_PATHS.has(pathname);
}

// El CSP se genera por request (con nonce) en el proxy en vez de en
// next.config.ts porque el nonce debe ser único por respuesta.
export async function proxy(request: NextRequest) {
  if (requiresSession(request.nextUrl.pathname)) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    const isAuthenticated = sessionCookie ? await hasValidSession(sessionCookie) : false;

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/consulta/login", request.url));
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${apiCMSUrl} ${s3Bucket};
    font-src 'self';
    connect-src 'self' ${apiCMSUrl};
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none';
    form-action 'self';
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
