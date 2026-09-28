//next
import { notFound } from 'next/navigation'
//features
import { PlanDetail, PanelService } from '@/features'

export default async function PlanDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params
    const plan = await PanelService.getPlan(orderId)
    //inexistente, ajeno o no listo: el backend responde 404 en todos los casos
    if (!plan) notFound()

    return (
        <div className="max-w-3xl mx-auto px-4">
            <PlanDetail plan={plan} />
        </div>
    )
}
