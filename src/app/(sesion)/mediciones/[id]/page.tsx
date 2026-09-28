//next
import { notFound } from 'next/navigation'
//features
import { MeasurementDetail, MeasurementsService } from '@/features'

export default async function MeasurementDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const measurement = await MeasurementsService.getMeasurement(id)
    //inexistente o ajena: el backend responde 404 en ambos casos
    if (!measurement) notFound()

    return (
        <div className="w-[90%] mx-auto">
            <MeasurementDetail measurement={measurement} />
        </div>
    )
}
