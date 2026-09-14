import 'server-only'
import { refreshTokenGrant } from 'openid-client'
import { getCognitoConfig } from './cognito-config'
import { getRawSession, createSession } from './session'

// Devuelve un access_token vigente para llamar al backend, o null si no hay sesión o el
// refresh falla (ej. refresh_token revocado/expirado — el llamador simplemente no manda
// Authorization, como si nunca hubiera habido sesión).
export async function getValidAccessToken(): Promise<string | null> {
  const session = await getRawSession()
  if (!session) return null

  if (Date.now() < session.accessTokenExpiresAt) {
    return session.accessToken
  }

  if (!session.refreshToken) return null

  try {
    const config = await getCognitoConfig()
    const tokens = await refreshTokenGrant(config, session.refreshToken)
    const accessTokenExpiresAt = Date.now() + (tokens.expiresIn() ?? 3600) * 1000

    await createSession({
      userInfo: session.userInfo,
      accessToken: tokens.access_token,
      // Cognito no siempre rota el refresh_token; si no viene uno nuevo, se conserva el actual.
      refreshToken: tokens.refresh_token ?? session.refreshToken,
      accessTokenExpiresAt,
    })

    return tokens.access_token
  } catch (err) {
    console.error('No se pudo refrescar el access_token de Cognito:', err)
    return null
  }
}
