//features
import { PanelSummary, ConsultationsList, PlansList, PanelService, ConsultationService } from '@/features'

export default async function PanelPage() {
    const [summary, consultations, orders] = await Promise.all([
        PanelService.getSummary(),
        PanelService.getConsultations(),
        ConsultationService.getOrders(),
    ])

    return (
        <div className="max-w-3xl mx-auto px-4">
            <div className="w-full flex flex-col gap-6">
                <PanelSummary summary={summary} />
                <ConsultationsList consultations={consultations} />
                <PlansList orders={orders} />
            </div>
        </div>
    )
}
