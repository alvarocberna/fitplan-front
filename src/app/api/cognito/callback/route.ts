import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authorizationCodeGrant, fetchUserInfo } from 'openid-client'
import { getCognitoConfig } from '@/shared/auth/cognito-config'
import { createSession } from '@/shared/auth/session'

const POST_LOGIN_REDIRECT = '/consulta/inicio'
const LOGIN_ERROR_REDIRECT = '/consulta/login?error=callback_failed'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const state = cookieStore.get('cognito_state')?.value
  const nonce = cookieStore.get('cognito_nonce')?.value

  cookieStore.delete('cognito_state')
  cookieStore.delete('cognito_nonce')

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

    const userInfo = await fetchUserInfo(config, tokens.access_token, sub)

    await createSession({
      userInfo,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresAt: Date.now() + (tokens.expiresIn() ?? 3600) * 1000,
    })
  } catch (err) {
    console.error('Error en el callback de Cognito:', err)
    return NextResponse.redirect(new URL(LOGIN_ERROR_REDIRECT, request.url))
  }

  return NextResponse.redirect(new URL(POST_LOGIN_REDIRECT, request.url))
}
