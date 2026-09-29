//features
import { MeasurementsChart, MeasurementsList, MeasurementsService, DashboardService } from '@/features'

export default async function MedicionesPage() {
    const [measurements, latestPlan] = await Promise.all([
        MeasurementsService.getMeasurements(),
        DashboardService.getLatestPlanProjection(),
    ])

    return (
        <div className="w-[90%] mx-auto">
            <div className="w-full flex flex-col gap-6">
                <div className="w-full flex flex-col gap-4">
                    <h1 className="text-2xl font-bold text-zinc-900 text-left">Evolución de tus mediciones</h1>
                    <MeasurementsChart measurements={measurements} latestPlan={latestPlan} />
                </div>
                <MeasurementsList measurements={measurements} />
            </div>
        </div>
    )
}
