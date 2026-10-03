//features
import {
    PersonalInfoCard,
    PlanOverviewCard,
    MacroDistributionCard,
    MeasurementsChart,
    ConsultationsList,
    DashboardService,
    MeasurementsService,
    planMacrosOf,
    NO_MACROS,
} from '@/features'

import { withSession } from '@/shared/auth/with-session'

export default async function DashboardPage() {
    //sesión vencida -> /login (withSession); cualquier otro fallo -> error.tsx de (sesion)
    const { summary, consultations, measurements, latestPlanProjection, lastPlan } = await withSession(async () => {
        const [summary, consultations, plans, measurements, latestPlanProjection] = await Promise.all([
            DashboardService.getSummary(),
            DashboardService.getConsultations(),
            DashboardService.getPlans(),
            MeasurementsService.getMeasurements(),
            DashboardService.getLatestPlanProjection(),
        ])
        // último plan (la lista viene del más nuevo al más antiguo), con el mismo detalle que /planes/[orderId]
        const lastPlan = plans[0] ? await DashboardService.getPlan(plans[0].orderId) : null
        return { summary, consultations, measurements, latestPlanProjection, lastPlan }
    })

    return (
        <div className="w-[90%] mx-auto">
            <div className="w-full flex flex-col gap-6">
                <PersonalInfoCard summary={summary} />
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <PlanOverviewCard plan={lastPlan} title="Información plan" />
                    <MacroDistributionCard macros={planMacrosOf(lastPlan) ?? NO_MACROS} />
                </div>
                <MeasurementsChart measurements={measurements} latestPlan={latestPlanProjection} title="Evolución" />
                <ConsultationsList consultations={consultations} />
            </div>
        </div>
    )
}
