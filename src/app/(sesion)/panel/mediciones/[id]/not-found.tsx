//next
import Link from 'next/link'

export default function MeasurementNotFound() {
    return (
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-4 py-12 text-center">
            <h1 className="text-2xl font-bold text-zinc-900">Medición no encontrada</h1>
            <p className="text-zinc-500">La medición que buscas no existe o no está disponible.</p>
            <Link href="/panel" className="btn primary-btn h-10! px-6 no-underline">
                Volver al panel
            </Link>
        </div>
    )
}
