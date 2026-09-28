//features - panel
import {
    getPanelSummaryAction,
    getMyConsultationsAction,
    getMyConsultationAction,
    getMyPlansAction,
    getMyPlanAction,
    type ActionResult,
} from './panel.actions'
import { PanelSummaryDto } from '../dtos/panel-summary.dto'
import { ConsultationSummaryDto } from '../dtos/consultation-summary.dto'
import { ConsultationDetailDto } from '../dtos/consultation-detail.dto'
import { MyPlanDetailDto, MyPlanSummaryDto } from '../dtos/my-plan.dto'

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

    //planes pagados y listos del usuario (estándar y personalizados), del más nuevo al más antiguo
    public static async getPlans(): Promise<MyPlanSummaryDto[]> {
        return unwrap(await getMyPlansAction())
    }

    // null si el plan no existe, no es del usuario o no está listo (el backend responde 404).
    public static async getPlan(orderId: string): Promise<MyPlanDetailDto | null> {
        const result = await getMyPlanAction(orderId)
        if (!result.ok && result.status === 404) return null
        return unwrap(result)
    }

}
