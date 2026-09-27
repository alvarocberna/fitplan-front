//features - panel
import {
    getPanelSummaryAction,
    getMyConsultationsAction,
    getMyConsultationAction,
    type ActionResult,
} from './panel.actions'
import { PanelSummaryDto } from '../dtos/panel-summary.dto'
import { ConsultationSummaryDto } from '../dtos/consultation-summary.dto'
import { ConsultationDetailDto } from '../dtos/consultation-detail.dto'

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw new Error(result.message)
    return result.data
}

export class PanelService {

    public static async getSummary(): Promise<PanelSummaryDto> {
        return unwrap(await getPanelSummaryAction())
    }

    public static async getConsultations(): Promise<ConsultationSummaryDto[]> {
        return unwrap(await getMyConsultationsAction())
    }

    // null si la consulta no existe o no es del usuario (el backend responde 404 en ambos casos).
    public static async getConsultation(consultationId: string): Promise<ConsultationDetailDto | null> {
        const result = await getMyConsultationAction(consultationId)
        if (!result.ok && result.status === 404) return null
        return unwrap(result)
    }

}
