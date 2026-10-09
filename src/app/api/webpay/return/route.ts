import { NextResponse } from 'next/server'
import { apiFetch } from '@/shared/api/client'
import type { CommitWebpayPaymentDto, WebpayPaymentOutcome } from '@/features/consultation/dtos/order.dto'

// Retorno de Webpay: Transbank devuelve acá al navegador del usuario cuando termina (o abandona) el
// pago. Según el caso llega por GET o por POST, y con parámetros distintos:
//   - token_ws: el usuario llegó a pagar (aprobado o rechazado)
//   - TBK_TOKEN (+ TBK_ORDEN_COMPRA): anuló el pago en el formulario
//   - solo TBK_ORDEN_COMPRA: el formulario venció
// No se exige sesión: en un POST entre sitios la cookie `session` (SameSite=Lax) no viaja. El backend
// identifica el pago por el token y le pregunta el resultado a Transbank; acá solo se reenvían los
// parámetros y se redirige a la página de pago, que muestra el estado real de la orden.

const TOKEN = /^[A-Za-z0-9]{1,64}$/
const BUY_ORDER = /^[A-Za-z0-9]{1,26}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PAYMENT_ERROR_PATH = '/pago/error'

// Aviso que muestra /pago/[orderId] (?resultado=) cuando el estado de la orden no basta para explicarlo.
const RESULT_BY_OUTCOME: Partial<Record<WebpayPaymentOutcome, string>> = {
  cancelled: 'anulado',
  not_committed: 'no_cobrado',
  needs_review: 'revision',
}

type ReturnParams = { get(name: string): unknown }

function readParam(params: ReturnParams, name: string, pattern: RegExp): string | undefined {
  const value = params.get(name)
  return typeof value === 'string' && pattern.test(value) ? value : undefined
}

// 303: tras un POST de Webpay, el navegador debe seguir la redirección con GET.
function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303)
}

async function handleReturn(request: Request, params: ReturnParams) {
  const tokenWs = readParam(params, 'token_ws', TOKEN)
  const tbkToken = readParam(params, 'TBK_TOKEN', TOKEN)
  const tbkBuyOrder = readParam(params, 'TBK_ORDEN_COMPRA', BUY_ORDER)

  if (!tokenWs && !tbkToken && !tbkBuyOrder) return redirectTo(request, PAYMENT_ERROR_PATH)

  let commit: CommitWebpayPaymentDto
  try {
    commit = await apiFetch<CommitWebpayPaymentDto>('payments/webpay/commit', 'POST', {
      tokenWs,
      tbkToken,
      tbkBuyOrder,
    })
  } catch (err) {
    console.error('No se pudo confirmar el pago al volver de Webpay:', err)
    // Con token_ws el usuario sí pagó: la página de error ofrece reintentar la confirmación.
    const retry = tokenWs && !tbkToken ? `?token=${tokenWs}` : ''
    return redirectTo(request, `${PAYMENT_ERROR_PATH}${retry}`)
  }

  if (!UUID.test(commit.orderId)) return redirectTo(request, PAYMENT_ERROR_PATH)

  const query = new URLSearchParams()
  if (commit.productType === 'PREDEFINED') query.set('tipo', 'predefinido')
  const result = RESULT_BY_OUTCOME[commit.outcome]
  if (result) query.set('resultado', result)
  const suffix = query.size > 0 ? `?${query}` : ''
  return redirectTo(request, `/pago/${commit.orderId}${suffix}`)
}

export async function GET(request: Request) {
  return handleReturn(request, new URL(request.url).searchParams)
}

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    // cuerpo que no es un formulario: se trata como un retorno sin parámetros
    form = new FormData()
  }
  return handleReturn(request, form)
}
