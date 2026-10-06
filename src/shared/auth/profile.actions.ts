'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from './tokens'

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
// actual, y devuelve el estado del perfil. No se envía ningún email: el backend se lo pregunta a
// Cognito con el access token, para que nadie pueda ligar su identidad al correo de otra persona.
export async function syncProfileAction(): Promise<ActionResult<PerfilStatus>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<PerfilStatus>('me/sync', 'POST', undefined, accessToken)
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
    return apiFetch<PerfilStatus>('me', 'PATCH', data, accessToken)
  })
}
