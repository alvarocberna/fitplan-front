'use client'
//next
import Link from 'next/link'
import { useParams } from 'next/navigation'
//react
import { useEffect, useRef, useState } from 'react'
//shared
import { Card, PlanFileCard, SubsectionHead, SubsectionTitle, useConsultation, isNotFoundError, isSessionRequiredError, notifyError } from '@/shared'
//features
import { ConsultationService, GenerationStatus, OrderStatusDto, PaymentStatus, PlanGenerationProgress, clearGenerationStart, getGenerationStart } from '@/features'

const POLLING_INTERVAL_MS = 4000
// a partir de este tiempo sin terminar, se avisa que está tardando más de lo habitual. La generación
// suele tomar 2-3 minutos (es lo que anuncia PlanGenerationProgress), así que el aviso va después.
const DELAY_THRESHOLD_MS = 4 * 60_000
// consultas fallidas seguidas tras las que se deja de insistir y se le ofrece al usuario reintentar
const MAX_CONSECUTIVE_FAILURES = 5

type ViewState =
    | 'loading'
    | 'generating'
    | 'completed'
    | 'error'
    | 'payment_rejected'
    | 'expired'
    | 'not_found'
    | 'unreachable'

export default function OrderPage() {
    const { id: orderId } = useParams<{ id: string }>()
    const { setNutritionPlan } = useConsultation()

    const [viewState, setViewState] = useState<ViewState>('loading')
    // URLs firmadas del plan ya generado (descarga del PDF y miniatura de la página 1)
    const [plan, setPlan] = useState<{ pdfUrl: string; thumbnailUrl: string | null } | null>(null)
    const [isDelayed, setIsDelayed] = useState(false)
    // desde cuándo se cuenta el avance simulado de la generación (sobrevive a una recarga de la página)
    const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null)
    // se incrementa con "Reintentar" para volver a arrancar el polling tras varios fallos seguidos
    const [pollingRun, setPollingRun] = useState(0)

    //referencia para calcular cuánto tiempo lleva generando, sin re-crear el intervalo en cada render
    const startRef = useRef<number | null>(null)

    useEffect(() => {
        startRef.current ??= Date.now()
        // variable local (no un ref) a propósito: cada invocación de este efecto necesita su
        // propia bandera. Con un ref compartido, el doble montaje de Strict Mode en desarrollo
        // (mount -> cleanup -> mount) deja `stopped` en `true` para siempre desde el primer
        // cleanup, y el polling del segundo montaje real nunca vuelve a ejecutarse.
        let cancelled = false
        let consecutiveFailures = 0

        const checkStatus = async () => {
            if (cancelled) return
            try {
                const data: OrderStatusDto = await ConsultationService.getOrderStatus(orderId)
                if (cancelled) return
                consecutiveFailures = 0

                if (data.generationStatus === GenerationStatus.COMPLETED && data.pdfUrl) {
                    cancelled = true
                    clearGenerationStart(orderId)
                    setPlan({ pdfUrl: data.pdfUrl, thumbnailUrl: data.thumbnailUrl ?? null })
                    if (data.planJson) setNutritionPlan(data.planJson)
                    setViewState('completed')
                    return
                }

                if (data.generationStatus === GenerationStatus.ERROR) {
                    cancelled = true
                    clearGenerationStart(orderId)
                    setViewState('error')
                    return
                }

                //la orden venció sin pagarse: no hay nada que esperar
                if (data.paymentStatus === PaymentStatus.EXPIRED) {
                    cancelled = true
                    clearGenerationStart(orderId)
                    setViewState('expired')
                    return
                }

                //el pago fue rechazado: se puede reintentar desde la pasarela
                if (data.paymentStatus === PaymentStatus.REJECTED) {
                    cancelled = true
                    clearGenerationStart(orderId)
                    setViewState('payment_rejected')
                    return
                }

                //NOT_STARTED (aún no llega la confirmación de pago) o GENERATING
                const startedAt = getGenerationStart(orderId)
                startRef.current = startedAt
                setGenerationStartedAt(startedAt)
                setViewState('generating')
                if (Date.now() - startedAt > DELAY_THRESHOLD_MS) setIsDelayed(true)
            } catch (error) {
                if (cancelled) return

                //la orden no existe o no es del usuario: seguir consultando no va a cambiar la respuesta
                if (isNotFoundError(error)) {
                    cancelled = true
                    setViewState('not_found')
                    return
                }

                //la sesión venció: se lo lleva a iniciar sesión (puede volver después con el mismo enlace)
                if (isSessionRequiredError(error)) {
                    cancelled = true
                    notifyError(error, '')
                    return
                }

                //error de red/servidor puntual: se reintenta en el próximo tick; el estado de pago del
                //usuario no se ve afectado por esto. Si se repite, se deja de insistir.
                consecutiveFailures++
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    cancelled = true
                    setViewState('unreachable')
                    return
                }
                if (Date.now() - (startRef.current ?? Date.now()) > DELAY_THRESHOLD_MS) setIsDelayed(true)
            }
        }

        checkStatus()
        const intervalId = setInterval(checkStatus, POLLING_INTERVAL_MS)
        return () => {
            cancelled = true
            clearInterval(intervalId)
        }
        // setNutritionPlan cambia en cada render del provider: incluirlo reiniciaría el polling; lee su estado por un ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, pollingRun])

    const onRetry = () => {
        setViewState('loading')
        setPollingRun((run) => run + 1)
    }

    return (
        <div className='w-full py-4'>
            <div className="max-w-2xl flex flex-col mx-auto">
                <Card>
                    {(viewState === 'loading' || viewState === 'generating') && (
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                            {/* la primera consulta del estado dura un instante: spinner. Una vez que se sabe
                                que el plan se está generando, la barra de avance (simulado) */}
                            {viewState === 'generating' && generationStartedAt !== null ? (
                                <PlanGenerationProgress startedAt={generationStartedAt} />
                            ) : (
                                <>
                                    <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                                    <span className="text-gray-600 font-medium">
                                        Estamos generando tu plan nutricional...
                                    </span>
                                </>
                            )}
                            {isDelayed && (
                                <p className="text-sm text-gray-500 text-center max-w-sm">
                                    Está tardando un poco más de lo habitual. Tu pago quedó registrado, no es
                                    necesario que hagas nada más: puedes dejar esta página abierta o volver más
                                    tarde con el mismo enlace.
                                </p>
                            )}
                        </div>
                    )}

                    {viewState === 'completed' && plan && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="¡Tu plan nutricional está listo!" />
                            <div className="w-full py-8">
                                <PlanFileCard pdfUrl={plan.pdfUrl} thumbnailUrl={plan.thumbnailUrl} />
                            </div>
                        </SubsectionHead>
                    )}

                    {viewState === 'payment_rejected' && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="Tu pago fue rechazado" />
                            <p className="text-zinc-900 text-md">
                                No se realizó ningún cobro. Puedes intentar el pago nuevamente mientras la orden
                                siga vigente (24 horas desde que la creaste).
                            </p>
                            <div className="pt-6">
                                <Link href={`/pago/${orderId}`} className="btn primary-btn h-10! px-6 no-underline">
                                    Reintentar pago
                                </Link>
                            </div>
                        </SubsectionHead>
                    )}

                    {viewState === 'expired' && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="Esta orden expiró" />
                            <p className="text-zinc-900 text-md">
                                Pasaron más de 24 horas sin que se completara el pago, por lo que la orden ya no
                                está disponible. No se realizó ningún cobro.
                            </p>
                            <div className="pt-6">
                                <Link href="/consulta/anamnesis" className="btn primary-btn h-10! px-6 no-underline">
                                    Iniciar una nueva consulta
                                </Link>
                            </div>
                        </SubsectionHead>
                    )}

                    {viewState === 'not_found' && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="Orden no encontrada" />
                            <p className="text-zinc-900 text-md">
                                La orden que buscas no existe o no está disponible para tu cuenta.
                            </p>
                            <div className="pt-6">
                                <Link href="/inicio" className="btn primary-btn h-10! px-6 no-underline">
                                    Volver al inicio
                                </Link>
                            </div>
                        </SubsectionHead>
                    )}

                    {viewState === 'unreachable' && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="No pudimos consultar el estado de tu orden" />
                            <p role="alert" className="text-zinc-900 text-md">
                                Tenemos problemas para comunicarnos con el servidor. Si ya pagaste, tu pago quedó
                                registrado y tu plan se sigue generando: no es necesario que vuelvas a pagar.
                            </p>
                            <div className="pt-6">
                                <button type="button" onClick={onRetry} className="btn primary-btn h-10! px-6">
                                    Reintentar
                                </button>
                            </div>
                        </SubsectionHead>
                    )}

                    {viewState === 'error' && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="Tu pago está a salvo" />
                            <p className="text-zinc-900 text-md">
                                Tuvimos un problema generando tu plan nutricional. Tu pago quedó registrado
                                correctamente: no es necesario que vuelvas a pagar. Estamos trabajando para
                                resolverlo; cuando esté listo lo verás en tu inicio y te llegará por correo. Si
                                necesitas ayuda, contáctanos indicando el número de tu orden.
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Orden: <span className="font-mono">{orderId}</span>
                            </p>
                        </SubsectionHead>
                    )}
                </Card>
            </div>
        </div>
    )
}
