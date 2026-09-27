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
        <div className="max-w-3xl mx-auto px-4">
            <ConsultationDetail consultation={consultation} />
        </div>
    )
}
