//features
import { MeasurementsChart, MeasurementsList, MeasurementsService, PanelService } from '@/features'

export default async function MedicionesPage() {
    const [measurements, latestPlan] = await Promise.all([
        MeasurementsService.getMeasurements(),
        PanelService.getLatestPlanProjection(),
    ])

    return (
        <div className="w-[90%] mx-auto">
            <div className="w-full flex flex-col gap-6">
                <MeasurementsChart measurements={measurements} latestPlan={latestPlan} />
                <MeasurementsList measurements={measurements} />
            </div>
        </div>
    )
}
