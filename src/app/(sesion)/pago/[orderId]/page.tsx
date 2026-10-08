'use client'
//next
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
//react
import { Suspense, useEffect, useState } from 'react'
//features
import { ConsultationService, PaymentStatus } from '@/features'
//shared
import { usePlanSelection, isNotFoundError, isSessionRequiredError, notifyError } from '@/shared'

// Pago de una orden con Webpay Plus (Transbank). "Pagar con Webpay" inicia la transacción en el backend
// y envía al navegador al formulario de Webpay; al terminar, Webpay devuelve al usuario a
// /api/webpay/return, que confirma el pago y redirige de vuelta acá: esta página lee el estado real de
// la orden y sigue (pagada) o deja reintentar (rechazada o anulada).
// Con NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION=true (desarrollo y pruebas) aparecen además "Simular pago"
// y "Simular rechazo", que marcan la orden sin pasar por Webpay.
const SIMULATION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION === 'true'

// Avisos de ?resultado=, que agrega /api/webpay/return cuando el estado de la orden no basta para
// explicar qué pasó. Solo se muestran los valores de esta lista.
const RESULT_NOTICES: Record<string, string> = {
    anulado: 'Anulaste el pago en Webpay. No se realizó ningún cobro; puedes intentarlo nuevamente.',
    no_cobrado: 'No pudimos aplicar tu pago a esta orden, por lo que no confirmamos el cobro.',
    revision:
        'Recibimos tu pago, pero no pudimos asociarlo a esta orden. Lo estamos revisando y te contactaremos para resolverlo.',
}

// Webpay recibe el token por un formulario POST (no es una llamada al backend: es la navegación del
// usuario hacia el sitio de Transbank).
function submitToWebpay(url: string, token: string) {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'token_ws'
    input.value = token
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
}

export default function PaymentPage() {
    //useSearchParams exige un límite Suspense en páginas que pueden prerenderizarse
    return (
        <Suspense fallback={null}>
            <Payment />
        </Suspense>
    )
}

function Payment() {
    const { orderId } = useParams<{ orderId: string }>()
    const router = useRouter()
    const searchParams = useSearchParams()
    //?tipo=predefinido lo agrega el carro (/carrito): ese plan ya viene hecho, no hay generación que esperar
    const isPredefined = searchParams.get('tipo') === 'predefinido'
    const resultNotice = RESULT_NOTICES[searchParams.get('resultado') ?? ''] ?? null
    const { clearCart } = usePlanSelection()
    const [isPaying, setIsPaying] = useState(false)
    //'payable' también cubre el caso de no poder leer el estado: el backend valida igual al pagar
    const [orderState, setOrderState] = useState<'payable' | 'rejected' | 'expired' | 'not_found'>('payable')

    const goToPaidOrder = () => {
        if (isPredefined) {
            //el plan predefinido queda listo al confirmarse el pago: se vacía el carro y se lo muestra en /inicio
            clearCart()
            router.push('/inicio')
        } else {
            //el plan personalizado se genera después del pago: /ordenes/[id] espera (polling) a que esté listo
            router.push(`/ordenes/${orderId}`)
        }
    }

    //devuelve el estado de pago de la orden, 'not_found' si no existe o no es del usuario, o null si no
    //se pudo leer (error puntual: se trata como pagable, el backend valida igual al pagar). Una sesión
    //vencida lleva a iniciar sesión.
    const readPaymentStatus = async (): Promise<PaymentStatus | 'not_found' | null> => {
        try {
            return (await ConsultationService.getOrderStatus(orderId)).paymentStatus
        } catch (error) {
            if (isNotFoundError(error)) return 'not_found'
            if (isSessionRequiredError(error)) notifyError(error, '')
            return null
        }
    }

    //tras un pago/rechazo fallido: si la orden venció, dejó de existir o ya estaba pagada se muestra eso;
    //si no, el error
    const handlePaymentError = async (error: unknown) => {
        const paymentStatus = await readPaymentStatus()
        if (paymentStatus === PaymentStatus.EXPIRED) setOrderState('expired')
        else if (paymentStatus === 'not_found') setOrderState('not_found')
        else if (paymentStatus === PaymentStatus.PAID) goToPaidOrder()
        else notifyError(error, 'Error al procesar el pago')
    }

    //al entrar (también al volver de Webpay): una orden expirada no se puede pagar, una rechazada se
    //puede reintentar y una pagada no se vuelve a cobrar
    useEffect(() => {
        let cancelled = false
        readPaymentStatus().then((paymentStatus) => {
            if (cancelled) return
            if (paymentStatus === PaymentStatus.EXPIRED) setOrderState('expired')
            else if (paymentStatus === 'not_found') setOrderState('not_found')
            else if (paymentStatus === PaymentStatus.REJECTED) setOrderState('rejected')
            else if (paymentStatus === PaymentStatus.PAID) goToPaidOrder()
        })
        return () => {
            cancelled = true
        }
    }, [orderId])

    const onPay = async () => {
        setIsPaying(true)
        try {
            const { url, token } = await ConsultationService.startPayment(orderId)
            //el navegador sale hacia Webpay: el botón queda deshabilitado hasta que cambie la página
            submitToWebpay(url, token)
        } catch (error) {
            //el backend no inicia el pago de una orden cuyo plazo venció mientras esta página estaba abierta
            await handlePaymentError(error)
            setIsPaying(false)
        }
    }

    const onSimulatePayment = async () => {
        setIsPaying(true)
        try {
            await ConsultationService.simulatePayment(orderId)
            goToPaidOrder()
        } catch (error) {
            await handlePaymentError(error)
            setIsPaying(false)
        }
    }

    const onSimulateRejection = async () => {
        setIsPaying(true)
        try {
            await ConsultationService.simulatePaymentRejection(orderId)
            setOrderState('rejected')
        } catch (error) {
            await handlePaymentError(error)
        }
        setIsPaying(false)
    }

    if (orderState === 'not_found') {
        return (
            <div className="w-full flex justify-center px-6 py-4">
                <div className="w-full max-w-md border border-zinc-300 rounded-2xl p-8 flex flex-col gap-6 text-left">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-800">Orden no encontrada</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            La orden que intentas pagar no existe o no está disponible para tu cuenta.
                        </p>
                    </div>
                    <Link
                        href="/inicio"
                        className="w-full py-2.5 rounded-full text-white text-center font-semibold hover:opacity-90 transition-opacity no-underline"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        )
    }

    if (orderState === 'expired') {
        return (
            <div className="w-full flex justify-center px-6 py-4">
                <div className="w-full max-w-md border border-zinc-300 rounded-2xl p-8 flex flex-col gap-6 text-left">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-800">Esta orden expiró</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Pasaron más de 24 horas sin que se completara el pago, por lo que la orden ya no está
                            disponible.
                        </p>
                    </div>
                    {resultNotice && (
                        <p role="alert" className="text-sm text-amber-900 bg-amber-100 rounded-lg px-3 py-2">
                            {resultNotice}
                        </p>
                    )}
                    <Link
                        href={isPredefined ? '/planes-estandar' : '/consulta/anamnesis'}
                        className="w-full py-2.5 rounded-full text-white text-center font-semibold hover:opacity-90 transition-opacity no-underline"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                        {isPredefined ? 'Ver planes' : 'Iniciar una nueva consulta'}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full flex justify-center px-6 py-4">
            <div className="w-full max-w-md border border-zinc-300 rounded-2xl p-8 flex flex-col gap-6 text-left">
                <div>
                    <h1 className="text-xl font-bold text-zinc-800">Pago de tu orden</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Te llevaremos a Webpay para pagar con tarjeta de débito, crédito o prepago. Al terminar
                        volverás a esta página.
                    </p>
                </div>

                {orderState === 'rejected' && (
                    <p role="alert" className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2">
                        Tu pago fue rechazado. Puedes intentarlo nuevamente.
                    </p>
                )}

                {resultNotice && (
                    <p role="alert" className="text-sm text-amber-900 bg-amber-100 rounded-lg px-3 py-2">
                        {resultNotice}
                    </p>
                )}

                <button
                    type="button"
                    onClick={onPay}
                    disabled={isPaying}
                    className="w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    {isPaying ? 'Procesando...' : 'Pagar con Webpay'}
                </button>

                {/* solo en desarrollo y pruebas: marcan la orden sin pasar por Webpay */}
                {SIMULATION_ENABLED && (
                    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
                        <p className="text-xs text-zinc-500">Pago simulado (solo desarrollo)</p>
                        <button
                            type="button"
                            onClick={onSimulatePayment}
                            disabled={isPaying}
                            className="w-full py-2.5 rounded-full border border-zinc-300 text-zinc-600 font-semibold hover:bg-zinc-50 transition-colors disabled:opacity-60"
                        >
                            Simular pago
                        </button>
                        <button
                            type="button"
                            onClick={onSimulateRejection}
                            disabled={isPaying}
                            className="w-full py-2.5 rounded-full border border-zinc-300 text-zinc-600 font-semibold hover:bg-zinc-50 transition-colors disabled:opacity-60"
                        >
                            Simular rechazo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
