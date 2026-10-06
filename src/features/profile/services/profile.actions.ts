'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { UserProfileDto, UpdateUserProfileDto } from '../dtos/user-profile.dto'

export type { ActionResult }

export async function getUserProfileAction(): Promise<ActionResult<UserProfileDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<UserProfileDto>('me', 'GET', undefined, accessToken)
    })
}

export async function updateUserProfileAction(
    data: UpdateUserProfileDto,
): Promise<ActionResult<UserProfileDto>> {
    return runAction(async () => {
        const accessToken = await getValidAccessToken()
        return apiFetch<UserProfileDto>('me', 'PATCH', data, accessToken)
    })
}
