'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from './tokens'
import { getSession } from './session'

export interface PerfilStatus {
  profileComplete: boolean
  firstName: string | null
  middleName: string | null
  paternalLastName: string | null
  maternalLastName: string | null
  gender: string | null
  dateOfBirth: string | null
  athlete: boolean
  email: string | null
  rut: string | null
  rutCheckDigit: string | null
}

// Idempotente: asegura que exista AuthIdentity + User (esqueleto la primera vez) para la sesión
// actual, y devuelve el estado del perfil. El email sale de la sesión de Cognito, nunca de un
// formulario — así el perfil queda siempre consistente con la cuenta con la que se inició sesión.
export async function syncProfileAction(): Promise<ActionResult<PerfilStatus>> {
  return runAction(async () => {
    const { userInfo } = await getSession()
    const email = String(userInfo?.email ?? '')
    const accessToken = await getValidAccessToken()
    return apiFetch<PerfilStatus>('auth/perfil', 'POST', { email }, accessToken)
  })
}

export interface UpdateProfileInput {
  firstName: string
  paternalLastName: string
  gender: string
  dateOfBirth: string // ISO
  athlete?: boolean
}

export async function updateProfileAction(
  data: UpdateProfileInput,
): Promise<ActionResult<PerfilStatus>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<PerfilStatus>('auth/perfil', 'PATCH', data, accessToken)
  })
}
