//next
import Link from 'next/link'
//features
import { MeasurementForm } from '@/features'

export default function NewMeasurementPage() {
    return (
        <div className="max-w-xl mx-auto px-4 flex flex-col gap-4">
            <Link href="/panel" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                ← Volver al panel
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">Registrar medición</h1>
            <MeasurementForm />
        </div>
    )
}
