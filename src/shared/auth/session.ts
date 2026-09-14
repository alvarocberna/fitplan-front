import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, errors as joseErrors, type JWTPayload } from 'jose'

export const SESSION_COOKIE = 'session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 días

export interface SessionPayload extends JWTPayload {
  userInfo: Record<string, unknown>
  accessToken: string
  refreshToken: string | null
  accessTokenExpiresAt: number
}

export interface SessionData {
  userInfo: Record<string, unknown>
  accessToken: string
  refreshToken: string | null
  accessTokenExpiresAt: number
}

export type SessionStatus = 'authenticated' | 'expired' | 'anonymous'

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('Falta la variable de entorno SESSION_SECRET')
  return new TextEncoder().encode(secret)
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

// Devuelve el payload si el JWT es válido, 'expired' si la única razón del fallo fue que
// venció (para distinguirlo en getSession), o null para cualquier otro fallo de
// verificación (firma inválida, formato corrupto, algoritmo no permitido). jose valida la
// firma antes que las claims, así que un token manipulado/corrupto nunca cae en JWTExpired.
async function decrypt(token: string): Promise<SessionPayload | 'expired' | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    return payload
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      return 'expired'
    }
    return null
  }
}

// Verificación optimista para src/proxy.ts: solo necesita saber si el token alcanza para dejar
// pasar la request, sin distinguir "expiró" de "nunca hubo sesión" (esa distinción es para la UI
// vía getSession()). Reusa decrypt() para no duplicar la lógica de jose acá ni en proxy.ts.
export async function hasValidSession(token: string): Promise<boolean> {
  const result = await decrypt(token)
  return typeof result === 'object' && result !== null && Boolean(result.userInfo)
}

export async function createSession(data: SessionData) {
  const session = await encrypt(data as SessionPayload)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// Lectura cruda para uso interno de tokens.ts (refresh silencioso del access_token) — no para
// UI. getSession() sigue siendo la API pública para componentes, sin exponer tokens.
export async function getRawSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionCookie) return null

  const result = await decrypt(sessionCookie)
  if (typeof result !== 'object' || result === null) return null

  return result
}

export async function getSession(): Promise<{
  isAuthenticated: boolean
  status: SessionStatus
  userInfo: Record<string, unknown> | null
}> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionCookie) {
    return { isAuthenticated: false, status: 'anonymous', userInfo: null }
  }

  const result = await decrypt(sessionCookie)

  if (result === 'expired') {
    return { isAuthenticated: false, status: 'expired', userInfo: null }
  }

  if (!result?.userInfo) {
    // Firma inválida, cookie corrupta/manipulada, etc.: se trata igual que "nunca inició
    // sesión" (no hubo una sesión válida que venciera).
    return { isAuthenticated: false, status: 'anonymous', userInfo: null }
  }

  return { isAuthenticated: true, status: 'authenticated', userInfo: result.userInfo }
}

// Usado por los botones "Iniciar Consulta" del sitio (navbar, hero): sin sesión (o expirada) van
// directo a login en vez de a /consulta/inicio. /consulta/inicio mantiene su propia verificación
// (llega igual por navegación directa/bookmark), esto solo evita el salto extra por esos botones.
export async function getStartConsultationHref(): Promise<string> {
  const { isAuthenticated } = await getSession()
  return isAuthenticated ? '/consulta/inicio' : '/login'
}
