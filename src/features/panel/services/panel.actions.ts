'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { PanelSummaryDto } from '../dtos/panel-summary.dto'

export type { ActionResult }

export async function getPanelSummaryAction(): Promise<ActionResult<PanelSummaryDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<PanelSummaryDto>('panel/resumen', 'GET', undefined, accessToken)
    })
}
