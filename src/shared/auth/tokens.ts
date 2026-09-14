import 'server-only'
import { refreshTokenGrant } from 'openid-client'
import { getCognitoConfig } from './cognito-config'
import { getRawSession, createSession } from './session'

// Devuelve un access_token vigente para llamar al backend, o null si no hay sesión o el
// refresh contra Cognito falla (ej. refresh_token revocado/expirado — el llamador simplemente no
// manda Authorization, como si nunca hubiera habido sesión).
export async function getValidAccessToken(): Promise<string | null> {
  const session = await getRawSession()
  if (!session) return null

  if (Date.now() < session.accessTokenExpiresAt) {
    return session.accessToken
  }

  if (!session.refreshToken) return null

  let refreshed: { accessToken: string; refreshToken: string; accessTokenExpiresAt: number }
  try {
    const config = await getCognitoConfig()
    const tokens = await refreshTokenGrant(config, session.refreshToken)
    refreshed = {
      accessToken: tokens.access_token,
      // Cognito no siempre rota el refresh_token; si no viene uno nuevo, se conserva el actual.
      refreshToken: tokens.refresh_token ?? session.refreshToken,
      accessTokenExpiresAt: Date.now() + (tokens.expiresIn() ?? 3600) * 1000,
    }
  } catch (err) {
    console.error('No se pudo refrescar el access_token de Cognito:', err)
    return null
  }

  // Persistir el token refrescado en la cookie solo funciona si esta llamada corre dentro de un
  // Server Action/Route Handler — si getValidAccessToken() se invocó desde el render de un Server
  // Component (ej. consulta/inicio, informacion-personal), Next.js no permite escribir cookies ahí
  // y createSession() lanza. Eso no debe invalidar el token que sí se obtuvo de Cognito: se usa
  // igual para esta respuesta, y se persistirá en la próxima llamada real desde una Server Action.
  try {
    await createSession({ userInfo: session.userInfo, ...refreshed })
  } catch (err) {
    console.warn('access_token refrescado pero no se pudo persistir la cookie en este contexto:', err)
  }

  return refreshed.accessToken
}
