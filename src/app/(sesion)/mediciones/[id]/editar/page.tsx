//next
import Link from 'next/link'
import { notFound } from 'next/navigation'
//shared
import { Card } from '@/shared'
//features
import { MeasurementForm, MeasurementsService } from '@/features'

import { withSession } from '@/shared/auth/with-session'

export default async function EditMeasurementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const measurement = await withSession(() => MeasurementsService.getMeasurement(id))
    if (!measurement) notFound()

    return (
        <div className="w-[90%] mx-auto flex flex-col gap-4">
            <Link href={`/mediciones/${id}`} className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                ← Volver a la medición
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">Editar medición N°{measurement.measurementNumber}</h1>
            {/* solid: sobre el fondo celeste de la sesión los inputs no se distinguen */}
            <Card variant="solid" widthInner="85%">
                <MeasurementForm measurement={measurement} />
            </Card>
        </div>
    )
}
