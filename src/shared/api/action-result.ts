'use server'

export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string }

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
