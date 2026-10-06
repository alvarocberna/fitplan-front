'use server'

import { apiFetch } from '@/shared/api/client'
import { runAction, type ActionResult } from '@/shared/api/action-result'
import { getValidAccessToken } from '@/shared/auth/tokens'
import { uuidParam } from '@/shared/api/path-params'
import { CompleteConsultationDto } from '../dtos/consultation.dto'
import { InputChatDto, OutputChatDto } from '../dtos/anamnesis-chat.dto'
import { OrderStatusDto } from '../dtos/order.dto'
import { GoalFeasibilityDto, GoalFeasibilityRequestDto } from '../dtos/goal-feasibility.dto'

export type { ActionResult }

export async function createOrderAction(
  completeConsultation: CompleteConsultationDto,
): Promise<ActionResult<{ orderId: string }>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<{ orderId: string }>('consultations', 'POST', completeConsultation, accessToken)
  })
}

// CU-CON-03: evalúa si el objetivo es alcanzable según el estado nutricional (al terminar la
// evaluación física, antes de generar la orden).
export async function evaluateGoalFeasibilityAction(
  data: GoalFeasibilityRequestDto,
): Promise<ActionResult<GoalFeasibilityDto>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<GoalFeasibilityDto>('consultations/goal-feasibility', 'POST', data, accessToken)
  })
}

// El backend exige la sesión del dueño de la orden (no se puede pagar la orden de otro).
export async function simulatePaymentAction(orderId: string): Promise<ActionResult<{ status: string }>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<{ status: string }>(`dev/orders/${uuidParam(orderId)}/simulate-payment`, 'POST', undefined, accessToken)
  })
}

// CU-BIL-04: simula que la pasarela rechazó el pago (la orden queda REJECTED y se puede reintentar).
export async function simulatePaymentRejectionAction(orderId: string): Promise<ActionResult<{ status: string }>> {
  return runAction(async () => {
    const accessToken = await getValidAccessToken()
    return apiFetch<{ status: string }>(`dev/orders/${uuidParam(orderId)}/simulate-payment-rejection`, 'POST', undefined, accessToken)
  })
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
    return apiFetch<OrderStatusDto>(`orders/${uuidParam(orderId)}/status`, 'GET', undefined, accessToken)
  })
}
