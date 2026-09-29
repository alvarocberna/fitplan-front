//features
import {
    PersonalInfoCard,
    PlanOverviewCard,
    MacroDistributionCard,
    MeasurementsChart,
    ConsultationsList,
    PanelService,
    MeasurementsService,
    planMacrosOf,
} from '@/features'

// Sin datos de macronutrientes la dona muestra su estado vacío.
const NO_MACROS = { calories: 0, protein: 0, carbohydrate: 0, fat: 0 }

export default async function PanelPage() {
    const [summary, consultations, plans, measurements, latestPlanProjection] = await Promise.all([
        PanelService.getSummary(),
        PanelService.getConsultations(),
        PanelService.getPlans(),
        MeasurementsService.getMeasurements(),
        PanelService.getLatestPlanProjection(),
    ])
    // último plan (la lista viene del más nuevo al más antiguo), con el mismo detalle que /planes/[orderId]
    const lastPlan = plans[0] ? await PanelService.getPlan(plans[0].orderId) : null

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
