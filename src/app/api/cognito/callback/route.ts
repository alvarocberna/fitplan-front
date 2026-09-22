import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authorizationCodeGrant, fetchUserInfo, type UserInfoResponse } from 'openid-client'
import { getCognitoConfig } from '@/shared/auth/cognito-config'
import { RETURN_TO_COOKIE, sanitizeReturnTo } from '@/shared/auth/return-to'
import { createSession } from '@/shared/auth/session'
import { apiFetch } from '@/shared/api/client'
import type { PerfilStatus } from '@/shared/auth/profile.actions'

const POST_LOGIN_REDIRECT = '/consulta/inicio'
const PROFILE_COMPLETE_REDIRECT = '/panel'
const LOGIN_ERROR_REDIRECT = '/login?error=callback_failed'

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

    const tokens = await authorizationCodeGrant(config, new URL(request.url), {
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
    return NextResponse.redirect(new URL(LOGIN_ERROR_REDIRECT, request.url))
  }

  // El login ya fue exitoso acá (la sesión ya se creó): un fallo en este chequeo nunca debe
  // mandar a error, solo mantiene el destino de siempre (/consulta/inicio), que reintenta la
  // sincronización con su propia lógica de fallback.
  let postLoginRedirect: string = POST_LOGIN_REDIRECT
  try {
    const email = String(userInfo.email ?? '')
    const perfil = await apiFetch<PerfilStatus>('auth/perfil', 'POST', { email }, accessToken)
    if (perfil.profileComplete) {
      postLoginRedirect = PROFILE_COMPLETE_REDIRECT
    }
  } catch (err) {
    console.error('No se pudo confirmar el estado del perfil tras el login (se continúa a /consulta/inicio):', err)
  }

  // Si el login se inició para volver a un lugar concreto, ese destino manda sobre el por defecto (que
  // depende del estado del perfil). El chequeo de arriba igual se hizo: es el que crea la identidad
  // (auth/perfil) que necesita el backend para crear la orden.
  return NextResponse.redirect(new URL(returnTo ?? postLoginRedirect, request.url))
}
