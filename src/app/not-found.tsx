//next
import Link from 'next/link'

// 404 global: una URL que no corresponde a ninguna ruta, o un notFound() fuera del área de sesión
// (p. ej. un artículo inexistente). Las páginas de detalle de (sesion) tienen su propio not-found.tsx.
export default function NotFound() {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-2xl font-bold text-zinc-900">Página no encontrada</h1>
            <p className="text-zinc-500">La página que buscas no existe o ya no está disponible.</p>
            <Link href="/" className="btn primary-btn h-10! px-6 no-underline">
                Volver al inicio
            </Link>
        </div>
    )
}
