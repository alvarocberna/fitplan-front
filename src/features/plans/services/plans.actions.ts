'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { PredefinedProductDto } from '../dtos/predefined-product.dto'
import { PlanPreviewDto } from '../dtos/plan-preview.dto'
import { PersonalizedProductDto } from '../dtos/personalized-product.dto'

export type { ActionResult }

//ficha pública de la versión (precio y miniatura): no requiere sesión
export async function getPredefinedProductAction(code: string): Promise<ActionResult<PredefinedProductDto>> {
  return runAction(() => apiFetch<PredefinedProductDto>(`plans/standard/${encodeURIComponent(code)}`))
}

//ficha pública del plan personalizado (precio de la consulta): no requiere sesión
export async function getPersonalizedProductAction(): Promise<ActionResult<PersonalizedProductDto>> {
  return runAction(() => apiFetch<PersonalizedProductDto>('plans/personalized'))
}

//las (hasta) 4 fichas de vista previa (una por familia) para el carrusel del home: no requiere sesión
export async function getPlanPreviewsAction(): Promise<ActionResult<PlanPreviewDto[]>> {
  return runAction(() => apiFetch<PlanPreviewDto[]>('plans/standard/previews'))
}

//crea la orden (pendiente de pago) del plan predefinido. El backend toma el precio del producto: solo viaja el code (en la ruta)
export async function createPredefinedOrderAction(code: string): Promise<ActionResult<{ orderId: string }>> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { ok: false, message: 'Inicia sesión para continuar con el pago', code: 'unauthenticated', status: 401 }
  }
  return runAction(() => apiFetch<{ orderId: string }>(`plans/standard/${encodeURIComponent(code)}/purchase`, 'POST', undefined, accessToken))
}
