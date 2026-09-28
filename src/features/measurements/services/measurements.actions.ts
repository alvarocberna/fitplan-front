'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import {
    MeasurementDetailDto,
    MeasurementSummaryDto,
    RecordMeasurementDto,
    UpdateMeasurementDto,
} from '../dtos/measurement.dto'

export type { ActionResult }

export async function getMyMeasurementsAction(): Promise<ActionResult<MeasurementSummaryDto[]>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MeasurementSummaryDto[]>('me/measurements', 'GET', undefined, accessToken)
    })
}

export async function getMyMeasurementAction(measurementId: string): Promise<ActionResult<MeasurementDetailDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MeasurementDetailDto>(
            `me/measurements/${encodeURIComponent(measurementId)}`,
            'GET',
            undefined,
            accessToken,
        )
    })
}

export async function recordMeasurementAction(data: RecordMeasurementDto): Promise<ActionResult<MeasurementDetailDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MeasurementDetailDto>('me/measurements', 'POST', data, accessToken)
    })
}

export async function updateMeasurementAction(
    measurementId: string,
    data: UpdateMeasurementDto,
): Promise<ActionResult<MeasurementDetailDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<MeasurementDetailDto>(
            `me/measurements/${encodeURIComponent(measurementId)}`,
            'PATCH',
            data,
            accessToken,
        )
    })
}
