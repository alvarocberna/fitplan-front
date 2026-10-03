'use client'

import { Card, SubsectionHead, SubsectionTitle } from '@/shared'
import { useReportError } from '@/shared/errors/use-report-error'

// Boundary de error acotado a las rutas de sesión (/inicio, /perfil, ...). Al vivir en la misma
// carpeta que (sesion)/layout.tsx, Next.js preserva ese layout (y su <NavbarSesion/>) cuando una
// página hija falla — a diferencia del error.tsx raíz, que solo preserva el layout raíz y se
// llevaría puesto el sidebar de sesión si fuera el único boundary disponible.
export default function SesionError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useReportError(error, 'sesion')

    return (
        <div className="max-w-2xl flex flex-col mx-auto px-4">
            <Card>
                <SubsectionHead>
                    <SubsectionTitle mb={2} title="Algo salió mal" />
                    <p className="text-zinc-900 text-md text-center">
                        Ocurrió un error inesperado. Intenta nuevamente; si el problema persiste, contáctanos
                        {error.digest ? ' indicando la referencia.' : '.'}
                    </p>
                    {error.digest && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Referencia: <span className="font-mono">{error.digest}</span>
                        </p>
                    )}
                    <button onClick={() => reset()} className="btn primary-btn text-sm mt-6">
                        Reintentar
                    </button>
                </SubsectionHead>
            </Card>
        </div>
    )
}
