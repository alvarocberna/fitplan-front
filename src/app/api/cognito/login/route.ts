import { NextResponse } from 'next/server'
import { buildAuthorizationUrl, randomState, randomNonce } from 'openid-client'
import { getCognitoConfig } from '@/shared/auth/cognito-config'

const ALLOWED_SCREEN_HINTS = new Set(['signup'])
const ALLOWED_IDENTITY_PROVIDERS = new Set(['Google'])

export async function GET(request: Request) {
  const redirectUri = process.env.COGNITO_REDIRECT_URI
  if (!redirectUri) {
    throw new Error('Falta la variable de entorno COGNITO_REDIRECT_URI')
  }

  const config = await getCognitoConfig()
  const state = randomState()
  const nonce = randomNonce()

  const authParams: Record<string, string> = {
    redirect_uri: redirectUri,
    scope: 'email openid phone',
    state,
    nonce,
  }

  const requestUrl = new URL(request.url)

  const screenHint = requestUrl.searchParams.get('screen_hint')
  if (screenHint && ALLOWED_SCREEN_HINTS.has(screenHint)) {
    authParams.screen_hint = screenHint
  }

  // Salta directo al consentimiento del proveedor federado (evita la pantalla nativa de la
  // Hosted UI) — Cognito soporta este parámetro en /oauth2/authorize una vez que el IdP está
  // habilitado en el App Client.
  const identityProvider = requestUrl.searchParams.get('identity_provider')
  if (identityProvider && ALLOWED_IDENTITY_PROVIDERS.has(identityProvider)) {
    authParams.identity_provider = identityProvider
  }

  const authUrl = buildAuthorizationUrl(config, authParams)

  const response = NextResponse.redirect(authUrl)

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 10, // solo debe sobrevivir la ida y vuelta a Cognito
  }
  response.cookies.set('cognito_state', state, cookieOptions)
  response.cookies.set('cognito_nonce', nonce, cookieOptions)

  return response
}
