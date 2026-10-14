import 'server-only'
import { cookies } from 'next/headers'
import { EncryptJWT, jwtDecrypt, errors as joseErrors, type JWTPayload } from 'jose'
import { START_CONSULTATION_LOGIN_HREF, START_CONSULTATION_PATH } from './return-to'

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

// Largo mínimo del secreto del que se deriva la clave de cifrado de la cookie.
const MIN_SECRET_LENGTH = 32

// La cookie va CIFRADA (JWE, A256GCM), no solo firmada: lleva el access y el refresh token de
// Cognito, que con un JWT firmado quedarían legibles en base64 para cualquiera que vea la cookie
// (logs de un proxy, el propio equipo del usuario). La clave de 256 bits se deriva de SESSION_SECRET
// con SHA-256. Un secreto corto se rechaza en producción; en desarrollo solo se avisa.
async function getSecretKey(): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('Falta la variable de entorno SESSION_SECRET')
  if (secret.length < MIN_SECRET_LENGTH) {
    const message = `SESSION_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres`
    if (process.env.NODE_ENV === 'production') throw new Error(message)
    warnShortSecretOnce(message)
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return new Uint8Array(digest)
}

let shortSecretWarned = false
function warnShortSecretOnce(message: string) {
  if (shortSecretWarned) return
  shortSecretWarned = true
  console.warn(`${message} (en producción la aplicación no arranca con un secreto corto)`)
}

async function encrypt(payload: SessionPayload) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .encrypt(await getSecretKey())
}

// Devuelve el payload si la cookie se descifra y está vigente, 'expired' si la única razón del
// fallo fue que venció (para distinguirlo en getSession), o null para cualquier otro fallo
// (cookie manipulada o corrupta, cifrada con otra clave, algoritmo no permitido). A256GCM es cifrado
// autenticado: un token alterado no se descifra, así que nunca llega a evaluarse su expiración.
async function decrypt(token: string): Promise<SessionPayload | 'expired' | null> {
  // Fuera del try a propósito: si falta SESSION_SECRET es un error de configuración y debe verse
  // (lanza), no convertirse en "no hay sesión" y redirigir a todo el mundo a /login en silencio.
  const secretKey = await getSecretKey()
  try {
    const { payload } = await jwtDecrypt<SessionPayload>(token, secretKey, {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
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
// directo a login en vez de a /consulta/inicio, con return_to=/consulta/inicio para que el callback
// respete la intención de empezar una consulta (sin él, el login es "solo entrar": /inicio o completar
// datos personales). /consulta/inicio mantiene su propia verificación (llega igual por navegación
// directa/bookmark), esto solo evita el salto extra por esos botones.
export async function getStartConsultationHref(): Promise<string> {
  const { isAuthenticated } = await getSession()
  return isAuthenticated ? START_CONSULTATION_PATH : START_CONSULTATION_LOGIN_HREF
}
