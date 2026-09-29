//next
import { notFound } from 'next/navigation'
//features
import { PlanDetail, DashboardService } from '@/features'

export default async function PlanDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params
    const plan = await DashboardService.getPlan(orderId)
    //inexistente, ajeno o no listo: el backend responde 404 en todos los casos
    if (!plan) notFound()

    return (
        <div className="w-[90%] mx-auto">
            <PlanDetail plan={plan} />
        </div>
    )
}
