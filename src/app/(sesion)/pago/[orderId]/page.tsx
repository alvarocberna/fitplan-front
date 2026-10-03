'use client'
//next
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
//react
import { Suspense, useEffect, useState } from 'react'
//toast
import { toast } from 'react-toastify'
//features
import { ConsultationService, PaymentStatus } from '@/features'
//shared
import { usePlanSelection } from '@/shared'

// Pasarela de pago SIMULADA: no procesa ningún pago real, solo da la sensación de un checkout
// mientras no exista una integración con un proveedor real (Mercado Pago, Flow, Stripe, etc.).
// Al integrar uno real, esta página se reemplaza por la redirección al checkout de ese proveedor,
// y el botón "Pagar" de acá deja de existir (la confirmación llegaría por su webhook real).
// "Simular rechazo" reproduce un pago rechazado: la orden queda reintentable hasta que expire (24 h).
export default function SimulatedPaymentPage() {
    //useSearchParams exige un límite Suspense en páginas que pueden prerenderizarse
    return (
        <Suspense fallback={null}>
            <SimulatedPayment />
        </Suspense>
    )
}

function SimulatedPayment() {
    const { orderId } = useParams<{ orderId: string }>()
    const router = useRouter()
    //?tipo=predefinido lo agrega el carro (/carrito): ese plan ya viene hecho, no hay generación que esperar
    const isPredefined = useSearchParams().get('tipo') === 'predefinido'
    const { clearCart } = usePlanSelection()
    const [isPaying, setIsPaying] = useState(false)
    //'payable' también cubre el caso de no poder leer el estado: el backend valida igual al pagar
    const [orderState, setOrderState] = useState<'payable' | 'rejected' | 'expired'>('payable')

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

    //devuelve el estado de pago de la orden, o null si no se pudo leer
    const readPaymentStatus = async (): Promise<PaymentStatus | null> => {
        try {
            return (await ConsultationService.getOrderStatus(orderId)).paymentStatus
        } catch {
            return null
        }
    }

    //al entrar: una orden expirada no se puede pagar, una rechazada se puede reintentar y una pagada
    //no se vuelve a cobrar
    useEffect(() => {
        let cancelled = false
        readPaymentStatus().then((paymentStatus) => {
            if (cancelled) return
            if (paymentStatus === PaymentStatus.EXPIRED) setOrderState('expired')
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
            //dispara la misma lógica que ejecutaría el webhook real de la pasarela
            await ConsultationService.simulatePayment(orderId)
            goToPaidOrder()
        } catch (error: any) {
            //el backend rechaza el pago de una orden cuyo plazo venció mientras esta página estaba abierta
            if ((await readPaymentStatus()) === PaymentStatus.EXPIRED) {
                setOrderState('expired')
            } else {
                toast.error(error.message || 'Error al procesar el pago')
            }
            setIsPaying(false)
        }
    }

    const onReject = async () => {
        setIsPaying(true)
        try {
            await ConsultationService.simulatePaymentRejection(orderId)
            setOrderState('rejected')
        } catch (error: any) {
            if ((await readPaymentStatus()) === PaymentStatus.EXPIRED) {
                setOrderState('expired')
            } else {
                toast.error(error.message || 'Error al procesar el pago')
            }
        }
        setIsPaying(false)
    }

    if (orderState === 'expired') {
        return (
            <div className="w-full flex justify-center px-6 py-4">
                <div className="w-full max-w-md border border-zinc-300 rounded-2xl p-8 flex flex-col gap-6 text-left">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-800">Esta orden expiró</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Pasaron más de 24 horas sin que se completara el pago, por lo que la orden ya no está
                            disponible. No se realizó ningún cobro.
                        </p>
                    </div>
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
                    <h1 className="text-xl font-bold text-zinc-800">Pasarela de pago</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Checkout simulado — acá se integrará un proveedor de pago real.
                    </p>
                </div>

                {orderState === 'rejected' && (
                    <p role="alert" className="text-sm text-red-800 bg-red-100 rounded-lg px-3 py-2">
                        Tu pago fue rechazado. Puedes intentarlo nuevamente.
                    </p>
                )}

                {/* campos decorativos: no son funcionales, solo dan la sensación de un checkout real */}
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs text-zinc-500">Número de tarjeta</label>
                        <input
                            disabled
                            placeholder="4242 4242 4242 4242"
                            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-400 mt-1"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500">Vencimiento</label>
                            <input
                                disabled
                                placeholder="12/29"
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-400 mt-1"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500">CVV</label>
                            <input
                                disabled
                                placeholder="123"
                                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-400 mt-1"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onPay}
                    disabled={isPaying}
                    className="w-full py-2.5 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    {isPaying ? 'Procesando pago...' : 'Pagar'}
                </button>

                {/* solo existe en la pasarela simulada: reproduce un pago rechazado */}
                <button
                    type="button"
                    onClick={onReject}
                    disabled={isPaying}
                    className="w-full py-2.5 rounded-full border border-zinc-300 text-zinc-600 font-semibold hover:bg-zinc-50 transition-colors disabled:opacity-60"
                >
                    Simular rechazo
                </button>
            </div>
        </div>
    )
}
