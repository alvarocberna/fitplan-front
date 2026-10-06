import type { ActionResult } from './action-result'

// Error de una Server Action fallida, relanzado por los servicios (`XxxService`) para que los
// componentes usen try/catch normal. Conserva `status`/`code`/`requestId` del ActionResult, así quien
// lo atrapa puede distinguir un 404 de una sesión vencida o de un fallo de red.
export class ActionError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly code?: string,
        public readonly requestId?: string,
    ) {
        super(message)
        this.name = 'ActionError'
    }
}

// La acción falló por no haber una sesión válida: la UI pide iniciar sesión en vez de mostrar un error.
export class SessionRequiredError extends ActionError {
    constructor(message: string, requestId?: string) {
        super(message, 401, 'unauthenticated', requestId)
        this.name = 'SessionRequiredError'
    }
}

export function isSessionRequiredError(error: unknown): error is SessionRequiredError {
    // por nombre además de instanceof: sobrevive a que el módulo se cargue dos veces (server/client)
    return error instanceof SessionRequiredError || (error instanceof Error && error.name === 'SessionRequiredError')
}

export function isNotFoundError(error: unknown): boolean {
    return error instanceof Error && (error as { status?: unknown }).status === 404
}

function toError<T>(result: Extract<ActionResult<T>, { ok: false }>): ActionError {
    if (result.code === 'unauthenticated') return new SessionRequiredError(result.message, result.requestId)
    return new ActionError(result.message, result.status, result.code, result.requestId)
}

// Devuelve el dato de un ActionResult exitoso, o lanza ActionError / SessionRequiredError.
export function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw toError(result)
    return result.data
}

// Como unwrap, pero un 404 del backend (inexistente o ajeno) es un resultado válido: devuelve null.
export function unwrapOrNull<T>(result: ActionResult<T>): T | null {
    if (!result.ok && result.status === 404) return null
    return unwrap(result)
}
