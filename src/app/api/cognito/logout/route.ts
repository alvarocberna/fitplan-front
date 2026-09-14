import { NextResponse } from 'next/server'
import { deleteSession } from '@/shared/auth/session'

export async function GET(request: Request) {
  await deleteSession()

  const domain = process.env.COGNITO_DOMAIN
  const clientId = process.env.COGNITO_CLIENT_ID
  if (!domain || !clientId) {
    throw new Error('Faltan las variables de entorno COGNITO_DOMAIN o COGNITO_CLIENT_ID')
  }

  const logoutUrl = new URL('/logout', domain)
  logoutUrl.searchParams.set('client_id', clientId)
  logoutUrl.searchParams.set('logout_uri', new URL('/', request.url).toString())

  return NextResponse.redirect(logoutUrl)
}
