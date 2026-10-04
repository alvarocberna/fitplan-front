import { NextResponse } from 'next/server'
import { deleteSession } from '@/shared/auth/session'

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
    return NextResponse.redirect(new URL('/', request.url))
  }

  await deleteSession()

  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  if (!domain || !clientId) {
    // La sesión local ya se borró: aunque no se pueda cerrar la de Cognito, el usuario vuelve al home.
    console.error('Logout de Cognito omitido: faltan las variables de entorno COGNITO_DOMAIN o COGNITO_CLIENT_ID')
    return NextResponse.redirect(new URL('/', request.url))
  }

  const logoutUrl = new URL('/logout', domain)
  logoutUrl.searchParams.set('client_id', clientId)
  logoutUrl.searchParams.set('logout_uri', new URL('/', request.url).toString())

  return NextResponse.redirect(logoutUrl)
}
