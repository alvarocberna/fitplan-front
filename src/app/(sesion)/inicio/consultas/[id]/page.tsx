//next
import { notFound } from 'next/navigation'
//features
import { ConsultationDetail, DashboardService, MeasurementsService } from '@/features'

import { withSession } from '@/shared/auth/with-session'

export default async function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const consultation = await withSession(() => DashboardService.getConsultation(id))
    //inexistente o ajena: el backend responde 404 en ambos casos
    if (!consultation) notFound()

    // el detalle del plan y de cada medición salen de sus propios endpoints (los mismos de /planes/[orderId]
    // y /mediciones/[id]); una medición que ya no se encuentra (404) simplemente no se muestra
    const [plan, measurements] = await withSession(() =>
        Promise.all([
            consultation.plan ? DashboardService.getPlan(consultation.plan.orderId) : null,
            Promise.all(consultation.measurements.map(({ measurementId }) => MeasurementsService.getMeasurement(measurementId))),
        ]),
    )

    return (
        <div className="w-[90%] mx-auto">
            <ConsultationDetail
                consultation={consultation}
                plan={plan}
                measurements={measurements.filter((measurement) => measurement !== null)}
            />
        </div>
    )
}
