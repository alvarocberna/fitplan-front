'use server'

export interface ClientErrorReport {
  // dónde se atrapó: 'app' | 'sesion' | 'global' (qué error.tsx)
  boundary: string
  digest?: string
  message?: string
  stack?: string
  path?: string
}

const MAX_FIELD_LENGTH = 4000

function clip(value: unknown, max = MAX_FIELD_LENGTH): string | undefined {
  if (typeof value !== 'string' || !value) return undefined
  return value.length > max ? `${value.slice(0, max)}…` : value
}

// Deja en el log del servidor de Next un error que atrapó un error.tsx en el navegador. Sin esto, un
// error de render en el cliente solo quedaba en la consola del usuario. El `digest` es el mismo que
// se le muestra como "Referencia" y el que Next imprime junto al error original en el servidor.
// Los campos vienen del navegador: se acotan en tamaño y solo se registran, nunca se interpretan.
export async function reportClientErrorAction(report: ClientErrorReport): Promise<void> {
  console.error(
    '[client error]',
    JSON.stringify({
      boundary: clip(report.boundary, 20),
      digest: clip(report.digest, 100),
      path: clip(report.path, 500),
      message: clip(report.message),
      stack: clip(report.stack),
    }),
  )
}
