import type { NextConfig } from "next";

const apiCMSUrl =
  process.env.NEXT_PUBLIC_BACKEND_CMS_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  /* config options here */

  // Evita que Next.js agregue el header "X-Powered-By: Next.js" a las respuestas
  poweredByHeader: false,

  // 🔥 REWRITE PARA PROXY A NEST
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiCMSUrl}/:path*`,
      },
    ];
  },

  // Deshabilitar source maps en producción para evitar exposición de código fuente
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      //de donde se puede aceptar imagenes
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "web-core-storage.s3.us-east-1.amazonaws.com",
      },
    ],
  },

  async headers() {
    // El Content-Security-Policy se genera por request (con nonce) en
    // src/proxy.ts, no aquí, porque el nonce debe cambiar en cada respuesta.
    const isProd = process.env.NODE_ENV === "production";

    const securityHeaders: { key: string; value: string }[] = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
    ];

    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;