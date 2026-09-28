//features
import { PlansList, PanelService } from '@/features'

export default async function PlanesPage() {
    const plans = await PanelService.getPlans()

    return (
        <div className="max-w-4xl mx-auto px-4">
            <PlansList plans={plans} />
        </div>
    )
}
