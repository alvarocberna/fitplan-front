//next
import Link from 'next/link'
import { notFound } from 'next/navigation'
//features
import { MeasurementForm, MeasurementsService } from '@/features'

export default async function EditMeasurementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const measurement = await MeasurementsService.getMeasurement(id)
    if (!measurement) notFound()

    return (
        <div className="max-w-xl mx-auto px-4 flex flex-col gap-4">
            <Link href={`/panel/mediciones/${id}`} className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                ← Volver a la medición
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">Editar medición N°{measurement.measurementNumber}</h1>
            <MeasurementForm measurement={measurement} />
        </div>
    )
}
