'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { PredefinedProductDto } from '../dtos/predefined-product.dto'

export type { ActionResult }

//ficha pública de la versión (precio y miniatura): no requiere sesión
export async function getPredefinedProductAction(code: string): Promise<ActionResult<PredefinedProductDto>> {
  return runAction(() => apiFetch<PredefinedProductDto>(`productos/predefinidos/${encodeURIComponent(code)}`))
}

//crea la orden (pendiente de pago) del plan predefinido. El backend toma el precio del producto: solo se envía el code
export async function createPredefinedOrderAction(code: string): Promise<ActionResult<{ orderId: string }>> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { ok: false, message: 'Inicia sesión para continuar con el pago', code: 'unauthenticated' }
  }
  return runAction(() => apiFetch<{ orderId: string }>('ordenes/crear-predefinido', 'POST', { code }, accessToken))
}
