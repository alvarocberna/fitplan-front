import 'server-only'

// Versión de la API del backend: todas sus rutas cuelgan de /api/v1 (setGlobalPrefix en main.ts).
export const API_PREFIX = 'api/v1'

// Tope por llamada al backend. Holgado: el chat de anamnesis y la evaluación de factibilidad esperan
// al modelo de lenguaje (el backend corta la llamada al modelo a los 60 s).
const REQUEST_TIMEOUT_MS = 90_000

export const NETWORK_ERROR_MESSAGE = 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.'
export const GENERIC_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta nuevamente.'

// Cuerpo de error del backend (AllExceptionsFilter): { statusCode, code, message, errors?, requestId }.
interface ErrorBody {
    code?: unknown
    message?: unknown
    errors?: unknown
    requestId?: unknown
}

// Error de una llamada al backend. `status` es el HTTP status (0 si ni siquiera hubo respuesta),
// `code` el código estable del contrato de error (o NETWORK_ERROR / TIMEOUT), `requestId` el id de
// correlación para cruzar con los logs del backend y `errors` el detalle de una validación fallida.
// `message` siempre es un texto en español apto para mostrar al usuario.
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code?: string,
        public readonly requestId?: string,
        public readonly errors?: string[],
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

function defaultMessage(status: number): string {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.'
    if (status === 404) return 'No encontramos lo que buscas.'
    if (status >= 500) return 'El servicio no está disponible en este momento. Intenta nuevamente en unos minutos.'
    return GENERIC_ERROR_MESSAGE
}

async function toApiError(res: Response, requestId: string): Promise<ApiError> {
    let body: ErrorBody | null = null
    try {
        body = await res.json()
    } catch {
        // respuesta que no es JSON (p. ej. el HTML de un proxy): se usa el mensaje por defecto
    }
    // El backend siempre manda `message` como string; un arreglo (formato antiguo de validación) o
    // cualquier otra cosa no se muestra tal cual.
    const message = typeof body?.message === 'string' && body.message.trim() ? body.message : defaultMessage(res.status)
    return new ApiError(
        message,
        res.status,
        typeof body?.code === 'string' ? body.code : undefined,
        typeof body?.requestId === 'string' ? body.requestId : requestId,
        Array.isArray(body?.errors) ? body.errors.map(String) : undefined,
    )
}

export async function apiFetch<T>(
    endpoint: string,
    method?: string,
    data?: any,
    accessToken?: string | null,
): Promise<T>{

    const url = process.env.BACKEND_URL
    // id de correlación: viaja al backend, que lo devuelve en sus errores y lo deja en sus logs
    const requestId = crypto.randomUUID()

    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-request-id': requestId }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

    let res: Response
    try {
        res = await fetch(`${url}/${API_PREFIX}/${endpoint}`, {
            method: method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
    } catch (err) {
        // fetch solo rechaza cuando no hubo respuesta: backend caído, DNS, o el timeout de arriba
        const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
        console.error(`[api] ${method ?? 'GET'} ${endpoint} sin respuesta (requestId ${requestId}):`, err)
        throw new ApiError(
            isTimeout ? 'El servidor tardó demasiado en responder. Intenta nuevamente.' : NETWORK_ERROR_MESSAGE,
            0,
            isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
            requestId,
        )
    }

    if (!res.ok) {
        throw await toApiError(res, requestId)
    }

    if (res.status === 204) {
        return undefined as T;
    }

    try {
        return (await res.json()) as T
    } catch {
        console.error(`[api] ${method ?? 'GET'} ${endpoint} respondió ${res.status} con un cuerpo que no es JSON (requestId ${requestId})`)
        throw new ApiError(GENERIC_ERROR_MESSAGE, res.status, 'INVALID_RESPONSE', requestId)
    }
}
