'use client'

import { toast } from 'react-toastify'
import { isSessionRequiredError } from '../api/unwrap'

export const SESSION_EXPIRED_LOGIN_URL = '/login?error=session_expired'

// Un error se lee más lento que una confirmación: dura más que el autoClose por defecto del contenedor.
const ERROR_TOAST_MS = 6000

// Punto único para avisar al usuario de un error atrapado en un Client Component:
// - sesión vencida (SessionRequiredError) -> lo lleva a iniciar sesión, con un aviso en /login;
// - cualquier otro -> toast con el mensaje del error (ya viene en español desde el backend o desde
//   apiFetch) o con `fallback` si no trae uno.
// Devuelve true si redirigió a login.
export function notifyError(error: unknown, fallback: string): boolean {
    if (isSessionRequiredError(error)) {
        // Se llama fuera de un componente y debe recargar la página completa, sin el estado de la sesión vencida.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(SESSION_EXPIRED_LOGIN_URL)
        return true
    }
    const message = error instanceof Error && error.message ? error.message : fallback
    toast.error(message, { autoClose: ERROR_TOAST_MS })
    return false
}
