//features - measurements
import {
    getMyMeasurementsAction,
    getMyMeasurementAction,
    recordMeasurementAction,
    updateMeasurementAction,
} from './measurements.actions'
//shared
import { unwrap, unwrapOrNull } from '@/shared/api/unwrap'
import {
    MeasurementDetailDto,
    MeasurementSummaryDto,
    RecordMeasurementDto,
    UpdateMeasurementDto,
} from '../dtos/measurement.dto'

export class MeasurementsService {

    //mediciones del historial del usuario (de consulta y registradas por él), más reciente primero
    public static async getMeasurements(): Promise<MeasurementSummaryDto[]> {
        return unwrap(await getMyMeasurementsAction())
    }

    // null si la medición no existe o no es del usuario (el backend responde 404 en ambos casos).
    public static async getMeasurement(measurementId: string): Promise<MeasurementDetailDto | null> {
        return unwrapOrNull(await getMyMeasurementAction(measurementId))
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
