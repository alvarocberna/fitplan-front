// Destino al que volver tras iniciar sesión (p. ej. /carrito, desde el modal de registro al pagar, o
// /consulta/inicio, desde los botones "Iniciar Consulta": la intención es empezar una consulta, no solo entrar).
// Viaja en una cookie httpOnly de vida corta durante la ida y vuelta a Cognito (`/api/cognito/login`
// la escribe, `/api/cognito/callback` la consume). Solo se aceptan rutas de esta lista fija: cualquier
// otro valor se descarta para que nadie pueda usar el login como redirección abierta.
export const RETURN_TO_COOKIE = 'post_login_return_to'

export const START_CONSULTATION_PATH = '/consulta/inicio'

// Login iniciado para empezar una consulta: /login reenvía el return_to a las opciones de Cognito.
export const START_CONSULTATION_LOGIN_HREF = `/login?return_to=${encodeURIComponent(START_CONSULTATION_PATH)}`

const ALLOWED_RETURN_TO = new Set(['/carrito', START_CONSULTATION_PATH])

export function sanitizeReturnTo(value: string | null | undefined): string | null {
  return value && ALLOWED_RETURN_TO.has(value) ? value : null
}
