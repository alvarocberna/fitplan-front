'use server'

import { apiFetch } from '@/shared/api/client'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { CompleteConsultationDto } from '../dtos/consultation.dto'
import { InputChatDto, OutputChatDto } from '../dtos/anamnesis-chat.dto'
import { OrderStatusDto } from '../dtos/order.dto'

export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string }

async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

export async function createOrderAction(
  completeConsultation: CompleteConsultationDto,
): Promise<ActionResult<{ orderId: string }>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<{ orderId: string }>('ordenes/crear', 'POST', completeConsultation, accessToken)
  })
}

export async function simulatePaymentAction(orderId: string): Promise<ActionResult<{ status: string }>> {
  return runAction(() => apiFetch<{ status: string }>(`webhooks/ordenes/${orderId}/simular-pago`, 'POST'))
}

export async function sendAnamnesisTurnAction(data: InputChatDto): Promise<ActionResult<OutputChatDto>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<OutputChatDto>('consulta/chat', 'POST', data, accessToken)
  })
}

export async function getOrderStatusAction(orderId: string): Promise<ActionResult<OrderStatusDto>> {
  return runAction(() => apiFetch<OrderStatusDto>(`ordenes/obtener-estado/${orderId}`, 'GET'))
}
