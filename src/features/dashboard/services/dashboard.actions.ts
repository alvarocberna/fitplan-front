'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { DashboardSummaryDto } from '../dtos/dashboard-summary.dto'
import { ConsultationSummaryDto } from '../dtos/consultation-summary.dto'
import { ConsultationDetailDto } from '../dtos/consultation-detail.dto'
import { MyLatestPlanProjectionDto, MyPlanDetailDto, MyPlanSummaryDto } from '../dtos/my-plan.dto'

export type { ActionResult }

export async function getDashboardSummaryAction(): Promise<ActionResult<DashboardSummaryDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<DashboardSummaryDto>('me/summary', 'GET', undefined, accessToken)
    })
}

export async function getMyConsultationsAction(): Promise<ActionResult<ConsultationSummaryDto[]>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<ConsultationSummaryDto[]>('me/consultations', 'GET', undefined, accessToken)
    })
}

export async function getMyConsultationAction(consultationId: string): Promise<ActionResult<ConsultationDetailDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<ConsultationDetailDto>(
            `me/consultations/${encodeURIComponent(consultationId)}`,
            'GET',
            undefined,
            accessToken,
        )
    })
}

export async function getMyPlansAction(): Promise<ActionResult<MyPlanSummaryDto[]>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MyPlanSummaryDto[]>('me/plans', 'GET', undefined, accessToken)
    })
}

export async function getMyPlanAction(orderId: string): Promise<ActionResult<MyPlanDetailDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MyPlanDetailDto>(`me/plans/${encodeURIComponent(orderId)}`, 'GET', undefined, accessToken)
    })
}

export async function getMyLatestPlanProjectionAction(): Promise<ActionResult<MyLatestPlanProjectionDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MyLatestPlanProjectionDto>('me/plans/latest/projection', 'GET', undefined, accessToken)
    })
}
