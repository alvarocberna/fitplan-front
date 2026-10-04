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
// Tope de reportes por minuto y por proceso. Pasado el tope se descartan en silencio.
const MAX_REPORTS_PER_MINUTE = 30

let windowStart = 0
let reportsInWindow = 0

function allowReport(now = Date.now()): boolean {
  if (now - windowStart >= 60_000) {
    windowStart = now
    reportsInWindow = 0
  }
  reportsInWindow += 1
  return reportsInWindow <= MAX_REPORTS_PER_MINUTE
}

function clip(value: unknown, max = MAX_FIELD_LENGTH): string | undefined {
  if (typeof value !== 'string' || !value) return undefined
  return value.length > max ? `${value.slice(0, max)}…` : value
}

// Deja en el log del servidor de Next un error que atrapó un error.tsx en el navegador. Sin esto, un
// error de render en el cliente solo quedaba en la consola del usuario. El `digest` es el mismo que
// se le muestra como "Referencia" y el que Next imprime junto al error original en el servidor.
// Los campos vienen del navegador: se acotan en tamaño y solo se registran, nunca se interpretan.
export async function reportClientErrorAction(report: ClientErrorReport): Promise<void> {
  // Es una acción pública (la puede invocar cualquiera sin sesión): se limita para que no sirva para
  // inundar los logs.
  if (!allowReport()) return
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
