//features
import { PanelSummary, PanelService, ConsultationService } from '@/features'

export default async function PanelPage() {
    const [summary, orders] = await Promise.all([
        PanelService.getSummary(),
        ConsultationService.getOrders(),
    ])

    return (
        <div className="max-w-3xl mx-auto px-4">
            <PanelSummary summary={summary} orders={orders} />
        </div>
    )
}
