// Claves de localStorage con datos del usuario: la consulta en curso (anamnesis, mediciones y plan:
// datos de salud) y la selección/carro de planes. Deben coincidir con STORAGE_KEY de
// shared/context/consultation.context.tsx y plan-selection.context.tsx.
const CLIENT_STATE_KEYS = ['consulta_context', 'plan_selection']

// Se llama al cerrar sesión: sin esto, los datos de salud de la consulta quedarían en el navegador
// para la siguiente persona que use el mismo equipo.
export function clearClientState(): void {
    try {
        for (const key of CLIENT_STATE_KEYS) localStorage.removeItem(key)
    } catch {
        // storage no disponible: no hay nada que borrar
    }
}
