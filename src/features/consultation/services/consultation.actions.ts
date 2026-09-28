'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { CompleteConsultationDto } from '../dtos/consultation.dto'
import { InputChatDto, OutputChatDto } from '../dtos/anamnesis-chat.dto'
import { OrderStatusDto } from '../dtos/order.dto'

export type { ActionResult }

export async function createOrderAction(
  completeConsultation: CompleteConsultationDto,
): Promise<ActionResult<{ orderId: string }>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<{ orderId: string }>('consultations', 'POST', completeConsultation, accessToken)
  })
}

export async function simulatePaymentAction(orderId: string): Promise<ActionResult<{ status: string }>> {
  return runAction(() => apiFetch<{ status: string }>(`dev/orders/${orderId}/simulate-payment`, 'POST'))
}

export async function sendAnamnesisTurnAction(data: InputChatDto): Promise<ActionResult<OutputChatDto>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<OutputChatDto>('consultations/chat', 'POST', data, accessToken)
  })
}

export async function getOrderStatusAction(orderId: string): Promise<ActionResult<OrderStatusDto>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<OrderStatusDto>(`orders/${orderId}/status`, 'GET', undefined, accessToken)
  })
}
