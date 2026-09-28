//features
import { MeasurementsList, MeasurementsService } from '@/features'

export default async function MedicionesPage() {
    const measurements = await MeasurementsService.getMeasurements()

    return (
        <div className="max-w-4xl mx-auto px-4">
            <MeasurementsList measurements={measurements} />
        </div>
    )
}
