//features
import { MyPlansList, PanelService } from '@/features'

export default async function PlanesPage() {
    const plans = await PanelService.getPlans()

    return (
        <div className="w-[90%] mx-auto">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4 text-left">Mis planes nutricionales</h1>
            <MyPlansList plans={plans} />
        </div>
    )
}
