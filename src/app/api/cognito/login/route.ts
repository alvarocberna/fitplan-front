import { NextResponse } from 'next/server'
import { buildAuthorizationUrl, randomState, randomNonce } from 'openid-client'
import { getCognitoConfig } from '@/shared/auth/cognito-config'
import { RETURN_TO_COOKIE, sanitizeReturnTo } from '@/shared/auth/return-to'

const ALLOWED_SCREEN_HINTS = new Set(['signup'])
const ALLOWED_IDENTITY_PROVIDERS = new Set(['Google'])

const LOGIN_UNAVAILABLE_REDIRECT = '/login?error=login_unavailable'

export async function GET(request: Request) {
  // Los error.tsx no cubren route handlers: sin este manejo, una configuración faltante o un Cognito
  // caído (el discovery de getCognitoConfig) le mostraría al usuario un 500 crudo.
  const redirectUri = process.env.COGNITO_REDIRECT_URI
  let config: Awaited<ReturnType<typeof getCognitoConfig>>
  try {
    if (!redirectUri) throw new Error('Falta la variable de entorno COGNITO_REDIRECT_URI')
    config = await getCognitoConfig()
  } catch (err) {
    console.error('No se pudo iniciar el login con Cognito:', err)
    return NextResponse.redirect(new URL(LOGIN_UNAVAILABLE_REDIRECT, request.url))
  }
  const state = randomState()
  const nonce = randomNonce()

  const authParams: Record<string, string> = {
    redirect_uri: redirectUri as string, // validado arriba
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

  // La Hosted UI de este user pool ignora screen_hint=signup en /oauth2/authorize y
  // siempre resuelve a /login — para llegar al formulario de registro hay que apuntar
  // directo a /signup en el dominio de Cognito.
  if (authParams.screen_hint === 'signup') {
    authUrl.pathname = '/signup'
    authUrl.searchParams.delete('screen_hint')
  }

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

  // Destino al que volver tras el login (solo rutas de la lista permitida, ver return-to.ts).
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get('return_to'))
  if (returnTo) {
    response.cookies.set(RETURN_TO_COOKIE, returnTo, cookieOptions)
  } else {
    // sin destino pedido: descarta uno viejo de un intento abandonado, para que este login no lo herede
    response.cookies.delete(RETURN_TO_COOKIE)
  }

  return response
}
