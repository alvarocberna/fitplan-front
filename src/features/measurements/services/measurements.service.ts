//features - measurements
import {
    getMyMeasurementsAction,
    getMyMeasurementAction,
    recordMeasurementAction,
    updateMeasurementAction,
    type ActionResult,
} from './measurements.actions'
import {
    MeasurementDetailDto,
    MeasurementSummaryDto,
    RecordMeasurementDto,
    UpdateMeasurementDto,
} from '../dtos/measurement.dto'

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw new Error(result.message)
    return result.data
}

export class MeasurementsService {

    //mediciones del historial del usuario (de consulta y registradas por él), más reciente primero
    public static async getMeasurements(): Promise<MeasurementSummaryDto[]> {
        return unwrap(await getMyMeasurementsAction())
    }

    // null si la medición no existe o no es del usuario (el backend responde 404 en ambos casos).
    public static async getMeasurement(measurementId: string): Promise<MeasurementDetailDto | null> {
        const result = await getMyMeasurementAction(measurementId)
        if (!result.ok && result.status === 404) return null
        return unwrap(result)
    }

    public static async recordMeasurement(data: RecordMeasurementDto): Promise<MeasurementDetailDto> {
        return unwrap(await recordMeasurementAction(data))
    }

    public static async updateMeasurement(
        measurementId: string,
        data: UpdateMeasurementDto,
    ): Promise<MeasurementDetailDto> {
        return unwrap(await updateMeasurementAction(measurementId, data))
    }

}
