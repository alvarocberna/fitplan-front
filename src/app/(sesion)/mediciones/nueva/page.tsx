//next
import Link from 'next/link'
//shared
import { Card } from '@/shared'
//features
import { MeasurementForm } from '@/features'

export default function NewMeasurementPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 flex flex-col gap-4">
            <Link href="/mediciones" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                ← Volver a mis mediciones
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">Registrar medición</h1>
            {/* solid: sobre el fondo celeste de la sesión los inputs no se distinguen */}
            <Card variant="solid" widthInner="85%">
                <MeasurementForm />
            </Card>
        </div>
    )
}
