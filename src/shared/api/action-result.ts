'use server'

// Resultado de una Server Action: el error viaja como valor (no como throw) para que Next no reemplace
// su mensaje por uno genérico en producción.
// - `code`: 'unauthenticated' si la acción falló por no haber una sesión válida (la UI lleva a iniciar
//   sesión); si no, el código del contrato de error del backend (VALIDATION_ERROR, ORDER_EXPIRED,
//   NETWORK_ERROR, ...).
// - `status`: status HTTP del backend (0 si no hubo respuesta).
// - `requestId`: id de correlación con los logs del backend.
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string; status?: number; requestId?: string }

const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta nuevamente.'

// Estructural (y no `instanceof ApiError`) para no importar el cliente server-only desde este módulo,
// que también se referencia desde tests y tipos.
function isApiError(err: unknown): err is Error & { status: number; code?: string; requestId?: string } {
  return err instanceof Error && err.name === 'ApiError' && typeof (err as { status?: unknown }).status === 'number'
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    if (isApiError(err)) {
      // Lo que no es culpa del usuario (5xx, sin respuesta) queda en el log del servidor de Next con el
      // requestId, para cruzarlo con el log del backend.
      if (err.status >= 500 || err.status === 0) {
        console.error(`[action] backend ${err.status} ${err.code ?? ''} (requestId ${err.requestId ?? '-'}): ${err.message}`)
      }
      return {
        ok: false,
        message: err.message,
        status: err.status,
        // el backend responde 401 cuando no hay token o está vencido: es "no hay sesión"
        code: err.status === 401 ? 'unauthenticated' : err.code,
        ...(err.requestId && { requestId: err.requestId }),
      }
    }
    // Un error que no vino del backend es un bug nuestro: su mensaje no se le muestra al usuario.
    console.error('[action] error inesperado:', err)
    return { ok: false, message: UNEXPECTED_ERROR_MESSAGE }
  }
}
