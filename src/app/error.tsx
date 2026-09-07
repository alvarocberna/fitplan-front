'use client'

import { useEffect } from 'react'
import { Card, SubsectionHead, SubsectionTitle } from '@/shared'

// Boundary de error genérico: evita que un throw no controlado en cualquier
// ruta (o sus componentes servidor) llegue al cliente con stack trace/rutas
// de archivo. El detalle completo se loguea solo en consola/servidor; al
// usuario se le muestra únicamente `digest`, el id que Next.js genera para
// correlacionar con los logs.
export default function Error({
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
        <div className="w-full min-h-screen py-24">
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
        </div>
    )
}
