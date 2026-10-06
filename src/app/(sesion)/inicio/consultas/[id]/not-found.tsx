//next
import Link from 'next/link'

export default function ConsultationNotFound() {
    return (
        <div className="w-[90%] mx-auto flex flex-col items-center gap-4 py-12 text-center">
            <h1 className="text-2xl font-bold text-zinc-900">Consulta no encontrada</h1>
            <p className="text-zinc-500">La consulta que buscas no existe o no está disponible.</p>
            <Link href="/inicio" className="btn primary-btn h-10! px-6 no-underline">
                Volver al inicio
            </Link>
        </div>
    )
}
