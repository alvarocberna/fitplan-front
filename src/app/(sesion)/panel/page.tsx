//features
import { PanelSummary, ConsultationsList, PlansList, PanelService } from '@/features'

export default async function PanelPage() {
    const [summary, consultations, plans] = await Promise.all([
        PanelService.getSummary(),
        PanelService.getConsultations(),
        PanelService.getPlans(),
    ])

    return (
        <div className="w-[90%] mx-auto">
            <div className="w-full flex flex-col gap-6">
                <PanelSummary summary={summary} />
                <ConsultationsList consultations={consultations} />
                <PlansList plans={plans} />
            </div>
        </div>
    )
}
