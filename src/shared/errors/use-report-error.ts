'use client'

import { useEffect } from 'react'
import { reportClientErrorAction } from './report-error.actions'

// Para los error.tsx: registra el error en la consola del navegador y lo reporta al servidor de Next
// (queda en sus logs, correlacionable por `digest`). El reporte es best-effort: si falla, se ignora.
export function useReportError(error: Error & { digest?: string }, boundary: 'app' | 'sesion' | 'global') {
    useEffect(() => {
        console.error(`[${boundary} error]`, error.digest ?? '(sin digest)', error)
        reportClientErrorAction({
            boundary,
            digest: error.digest,
            message: error.message,
            stack: error.stack,
            path: window.location.pathname,
        }).catch(() => {})
    }, [error, boundary])
}
