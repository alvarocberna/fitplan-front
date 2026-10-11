import { NextResponse } from 'next/server'
import { deleteSession } from '@/shared/auth/session'
import { redirectToPath } from '@/shared/api/redirect-to-path'

// Solo cierra la sesión ante una navegación que el propio usuario inició en este sitio. Con los
// headers Fetch Metadata del navegador se descartan: (a) un enlace o una imagen en otro sitio que
// apunte acá (cierre de sesión forzado, CSRF) y (b) cualquier fetch/prefetch en segundo plano.
function isUserNavigationFromThisSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  const mode = request.headers.get('sec-fetch-mode')
  // navegadores sin Fetch Metadata no mandan los headers: se deja pasar
  if (site && site !== 'same-origin' && site !== 'none') return false
  if (mode && mode !== 'navigate') return false
  return true
}

export async function GET(request: Request) {
  if (!isUserNavigationFromThisSite(request)) {
    return redirectToPath('/')
  }

  await deleteSession()

  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  if (!domain || !clientId) {
    // La sesión local ya se borró: aunque no se pueda cerrar la de Cognito, el usuario vuelve al home.
    console.error('Logout de Cognito omitido: faltan las variables de entorno COGNITO_DOMAIN o COGNITO_CLIENT_ID')
    return redirectToPath('/')
  }

  const logoutUrl = new URL('/logout', domain)
  logoutUrl.searchParams.set('client_id', clientId)
  // El destino tras cerrar sesión debe ser la URL pública del sitio (registrada en el App Client). Sale
  // de COGNITO_REDIRECT_URI y no de request.url, que detrás del hosting es interna (localhost).
  const siteUrl = process.env.COGNITO_REDIRECT_URI || request.url
  logoutUrl.searchParams.set('logout_uri', new URL('/', siteUrl).toString())

  return NextResponse.redirect(logoutUrl)
}
