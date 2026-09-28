//next
import { notFound } from 'next/navigation'
//features
import { ConsultationDetail, PanelService } from '@/features'

export default async function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const consultation = await PanelService.getConsultation(id)
    //inexistente o ajena: el backend responde 404 en ambos casos
    if (!consultation) notFound()

    return (
        <div className="w-[90%] mx-auto">
            <ConsultationDetail consultation={consultation} />
        </div>
    )
}
