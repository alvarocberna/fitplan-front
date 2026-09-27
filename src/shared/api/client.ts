import 'server-only'

// Versión de la API del backend: todas sus rutas cuelgan de /api/v1 (setGlobalPrefix en main.ts).
export const API_PREFIX = 'api/v1'

// Error de una respuesta no-2xx del backend: conserva el status HTTP para que quien llama pueda
// distinguir, p. ej., un 404 (recurso inexistente o ajeno) de un error genérico.
export class ApiError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message)
        this.name = 'ApiError'
    }
}

export async function apiFetch<T>(
    endpoint: string,
    method?: string,
    data?: any,
    accessToken?: string | null,
): Promise<T>{

    const url = process.env.BACKEND_URL

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

    const res = await fetch(`${url}/${API_PREFIX}/${endpoint}`, {
        method: method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    })

    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch {
            errorData = { message: `Error HTTP ${res.status}: ${res.statusText}` };
        }
        throw new ApiError(errorData?.message || errorData?.error || `Error HTTP ${res.status}`, res.status);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
