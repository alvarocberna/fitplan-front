//features
import { MyPlansList, DashboardService } from '@/features'

import { withSession } from '@/shared/auth/with-session'

export default async function PlanesPage() {
    const plans = await withSession(() => DashboardService.getPlans())

    return (
        <div className="w-[90%] mx-auto">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4 text-left">Mis planes nutricionales</h1>
            <MyPlansList plans={plans} />
        </div>
    )
}
