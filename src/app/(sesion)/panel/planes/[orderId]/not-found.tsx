//next
import Link from 'next/link'

export default function PlanNotFound() {
    return (
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-4 py-12 text-center">
            <h1 className="text-2xl font-bold text-zinc-900">Plan no encontrado</h1>
            <p className="text-zinc-500">El plan que buscas no existe o no está disponible.</p>
            <Link href="/panel" className="btn primary-btn h-10! px-6 no-underline">
                Volver al panel
            </Link>
        </div>
    )
}
