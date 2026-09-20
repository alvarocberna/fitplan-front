import { SignJWT } from 'jose';

// Debe coincidir con E2E_ACCESS_TOKEN del backend falso: es lo que los Server Actions mandan como
// `Authorization: Bearer ...` y lo que el backend falso valida.
export const E2E_ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? 'e2e-access-token';
export const E2E_USER_EMAIL = 'ana@test.com';

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

// Fabrica la cookie `session` que en producción emite /api/cognito/callback (ver
// src/shared/auth/session.ts): un JWT HS256 firmado con SESSION_SECRET. Sin ella, src/proxy.ts
// redirige a /login en /consulta/*, /pago/*, /ordenes/*, /panel y /perfil. `accessTokenExpiresAt`
// va lejos en el futuro para que getValidAccessToken() nunca intente refrescar contra Cognito.
export async function createSessionCookieValue(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Falta SESSION_SECRET (definida en .env.test)');

  return new SignJWT({
    userInfo: { email: E2E_USER_EMAIL, name: 'Ana Pérez' },
    accessToken: E2E_ACCESS_TOKEN,
    refreshToken: null,
    accessTokenExpiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));
}
