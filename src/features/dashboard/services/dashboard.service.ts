//features - dashboard
import {
    getDashboardSummaryAction,
    getMyConsultationsAction,
    getMyConsultationAction,
    getMyPlansAction,
    getMyPlanAction,
    getMyLatestPlanProjectionAction,
} from './dashboard.actions'
//shared
import { unwrap, unwrapOrNull } from '@/shared/api/unwrap'
import { DashboardSummaryDto } from '../dtos/dashboard-summary.dto'
import { ConsultationSummaryDto } from '../dtos/consultation-summary.dto'
import { ConsultationDetailDto } from '../dtos/consultation-detail.dto'
import { MyLatestPlanProjectionDto, MyPlanDetailDto, MyPlanSummaryDto } from '../dtos/my-plan.dto'

export class DashboardService {

    public static async getSummary(): Promise<DashboardSummaryDto> {
        return unwrap(await getDashboardSummaryAction())
    }

    public static async getConsultations(): Promise<ConsultationSummaryDto[]> {
        return unwrap(await getMyConsultationsAction())
    }

    // null si la consulta no existe o no es del usuario (el backend responde 404 en ambos casos).
    public static async getConsultation(consultationId: string): Promise<ConsultationDetailDto | null> {
        return unwrapOrNull(await getMyConsultationAction(consultationId))
    }

    //planes pagados y listos del usuario (estándar y personalizados), del más nuevo al más antiguo
    public static async getPlans(): Promise<MyPlanSummaryDto[]> {
        return unwrap(await getMyPlansAction())
    }

    // null si el plan no existe, no es del usuario o no está listo (el backend responde 404).
    public static async getPlan(orderId: string): Promise<MyPlanDetailDto | null> {
        return unwrapOrNull(await getMyPlanAction(orderId))
    }

    // período y proyección del último plan con fecha de término; null si no hay (el backend responde 404).
    public static async getLatestPlanProjection(): Promise<MyLatestPlanProjectionDto | null> {
        return unwrapOrNull(await getMyLatestPlanProjectionAction())
    }

}
