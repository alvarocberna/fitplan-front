'use client'

import { useEffect } from 'react'

// Único caso que src/app/error.tsx no cubre: un throw en el propio root
// layout. Next.js exige que este archivo defina <html>/<body> porque
// reemplaza el layout completo, así que va deliberadamente sin depender de
// componentes/estilos compartidos (son parte de lo que pudo haber fallado).
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[global error]', error.digest ?? '(sin digest)', error)
    }, [error])

    return (
        <html lang="es">
            <body style={{ margin: 0 }}>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        fontFamily: 'sans-serif',
                    }}
                >
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#18181b' }}>
                        Algo salió mal
                    </h1>
                    <p style={{ color: '#3f3f46', maxWidth: '32rem' }}>
                        Ocurrió un error inesperado. Ya fue registrado y estamos al tanto.
                    </p>
                    {error.digest && (
                        <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
                            Referencia: <span style={{ fontFamily: 'monospace' }}>{error.digest}</span>
                        </p>
                    )}
                    <button
                        onClick={() => reset()}
                        style={{
                            marginTop: '12px',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#10b968',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            </body>
        </html>
    )
}
