import { cookies } from 'next/headers'
import { authorizationCodeGrant, fetchUserInfo, type UserInfoResponse } from 'openid-client'
import { getCognitoConfig } from '@/shared/auth/cognito-config'
import { RETURN_TO_COOKIE, sanitizeReturnTo } from '@/shared/auth/return-to'
import { createSession, deleteSession } from '@/shared/auth/session'
import { apiFetch, ApiError } from '@/shared/api/client'
import { redirectToPath } from '@/shared/api/redirect-to-path'
import type { PerfilStatus } from '@/shared/auth/profile.actions'

const POST_LOGIN_REDIRECT = '/consulta/inicio'
const PROFILE_COMPLETE_REDIRECT = '/inicio'
const LOGIN_ERROR_REDIRECT = '/login?error=callback_failed'
const EMAIL_NOT_VERIFIED_REDIRECT = '/login?error=email_not_verified'

// URL de este callback tal como la conoce Cognito (COGNITO_REDIRECT_URI) con los parámetros que
// llegaron. openid-client deriva de ella el redirect_uri del intercambio del código, que debe ser
// idéntico al registrado; request.url no sirve porque detrás del hosting es interna (localhost).
function getCallbackUrl(request: Request): URL {
  const requestUrl = new URL(request.url)
  const redirectUri = process.env.COGNITO_REDIRECT_URI
  if (!redirectUri) return requestUrl
  const callbackUrl = new URL(redirectUri)
  callbackUrl.search = requestUrl.search
  return callbackUrl
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const state = cookieStore.get('cognito_state')?.value
  const nonce = cookieStore.get('cognito_nonce')?.value
  // Destino pedido por quien inició el login (p. ej. /carrito desde el modal de registro al pagar).
  const returnTo = sanitizeReturnTo(cookieStore.get(RETURN_TO_COOKIE)?.value)

  cookieStore.delete('cognito_state')
  cookieStore.delete('cognito_nonce')
  cookieStore.delete(RETURN_TO_COOKIE)

  // Declarados afuera del try para reusarlos en el chequeo de perfil de abajo, sin releer la
  // cookie de sesión recién escrita en este mismo request.
  let userInfo: UserInfoResponse
  let accessToken: string

  try {
    const config = await getCognitoConfig()

    const tokens = await authorizationCodeGrant(config, getCallbackUrl(request), {
      expectedState: state,
      expectedNonce: nonce,
    })

    const sub = tokens.claims()?.sub
    if (!sub) {
      throw new Error('El id_token no incluye el claim "sub"')
    }

    userInfo = await fetchUserInfo(config, tokens.access_token, sub)
    accessToken = tokens.access_token

    await createSession({
      userInfo,
      accessToken,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresAt: Date.now() + (tokens.expiresIn() ?? 3600) * 1000,
    })
  } catch (err) {
    console.error('Error en el callback de Cognito:', err)
    return redirectToPath(LOGIN_ERROR_REDIRECT)
  }

  // El login ya fue exitoso acá (la sesión ya se creó): un fallo en este chequeo nunca debe
  // mandar a error, solo mantiene el destino de siempre (/consulta/inicio), que reintenta la
  // sincronización con su propia lógica de fallback.
  let postLoginRedirect: string = POST_LOGIN_REDIRECT
  try {
    // sin body: el backend obtiene el email de Cognito con el access token
    const perfil = await apiFetch<PerfilStatus>('me/sync', 'POST', undefined, accessToken)
    if (perfil.profileComplete) {
      postLoginRedirect = PROFILE_COMPLETE_REDIRECT
    }
  } catch (err) {
    // Cuenta con el correo sin verificar: no puede usar la aplicación. Se descarta la sesión recién
    // creada y se le explica en /login, en vez de dejarla entrar a un flujo que fallará en cada paso.
    if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
      await deleteSession()
      return redirectToPath(EMAIL_NOT_VERIFIED_REDIRECT)
    }
    console.error('No se pudo confirmar el estado del perfil tras el login (se continúa a /consulta/inicio):', err)
  }

  // Si el login se inició para volver a un lugar concreto, ese destino manda sobre el por defecto (que
  // depende del estado del perfil). El chequeo de arriba igual se hizo: es el que crea la identidad
  // (me/sync) que necesita el backend para crear la orden.
  return redirectToPath(returnTo ?? postLoginRedirect)
}
