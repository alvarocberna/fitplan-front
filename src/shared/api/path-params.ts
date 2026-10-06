const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Lo lanza uuidParam ante un identificador con forma inválida. Lleva el `name`/`status` de un ApiError
// 404 para que runAction lo devuelva como "no encontrado" (los servicios lo convierten en null →
// notFound()), igual que si el backend hubiera respondido 404.
export class InvalidPathParamError extends Error {
    readonly status = 404
    readonly code = 'NOT_FOUND'
    constructor() {
        super('No encontramos lo que buscas.')
        this.name = 'ApiError'
    }
}

// Los argumentos de una Server Action llegan del navegador y no son confiables, aunque TypeScript diga
// `string`. Un id se interpola en la ruta del backend: sin validar, un valor como `../me/plans` haría
// que la llamada (con el token del usuario) apuntara a otro endpoint. Solo se acepta un UUID.
export function uuidParam(value: unknown): string {
    if (typeof value !== 'string' || !UUID.test(value)) throw new InvalidPathParamError()
    return encodeURIComponent(value)
}
