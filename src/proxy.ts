import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const apiCMSUrl =
  process.env.NEXT_PUBLIC_BACKEND_CMS_URL || "http://localhost:3001";
const apiNuviUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const s3Bucket = "https://web-core-storage.s3.us-east-1.amazonaws.com";

// El CSP se genera por request (con nonce) en el proxy en vez de en
// next.config.ts porque el nonce debe ser único por respuesta.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${apiCMSUrl} ${s3Bucket};
    font-src 'self';
    connect-src 'self' ${apiNuviUrl} ${apiCMSUrl};
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
