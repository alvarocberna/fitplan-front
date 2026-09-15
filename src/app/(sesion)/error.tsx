'use client'

import { useEffect } from 'react'
import { Card, SubsectionHead, SubsectionTitle } from '@/shared'

// Boundary de error acotado a las rutas de sesión (/panel, /perfil, ...). Al vivir en la misma
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
    useEffect(() => {
        console.error('[app error]', error.digest ?? '(sin digest)', error)
    }, [error])

    return (
        <div className="max-w-2xl flex flex-col mx-auto px-4">
            <Card>
                <SubsectionHead>
                    <SubsectionTitle mb={2} title="Algo salió mal" />
                    <p className="text-zinc-900 text-md text-center">
                        Ocurrió un error inesperado. Ya fue registrado y estamos al tanto.
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
