'use server'

// `code: 'unauthenticated'` indica que la acción falló porque no hay una sesión válida (en vez de un
// error genérico), para que la UI pueda pedir iniciar sesión en lugar de mostrar solo un mensaje.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string; code?: 'unauthenticated' }

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
