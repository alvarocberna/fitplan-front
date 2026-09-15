'use client'
//next
import { useParams } from 'next/navigation'
//react
import { useEffect, useRef, useState } from 'react'
//shared
import { Card, PdfViewer, SubsectionHead, SubsectionTitle, useConsultation } from '@/shared'
//features
import { ConsultationService, OrderStatusDto } from '@/features'

const POLLING_INTERVAL_MS = 4000
// a partir de este tiempo sin terminar, se muestra un mensaje de "esto está tardando más de lo normal"
const DELAY_THRESHOLD_MS = 45_000

type ViewState = 'loading' | 'generating' | 'completed' | 'error'

export default function OrderPage() {
    const { id: orderId } = useParams<{ id: string }>()
    const { setNutritionPlan } = useConsultation()

    const [viewState, setViewState] = useState<ViewState>('loading')
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isDelayed, setIsDelayed] = useState(false)

    //referencia para calcular cuánto tiempo lleva generando, sin re-crear el intervalo en cada render
    const startRef = useRef(Date.now())

    useEffect(() => {
        // variable local (no un ref) a propósito: cada invocación de este efecto necesita su
        // propia bandera. Con un ref compartido, el doble montaje de Strict Mode en desarrollo
        // (mount -> cleanup -> mount) deja `stopped` en `true` para siempre desde el primer
        // cleanup, y el polling del segundo montaje real nunca vuelve a ejecutarse.
        let cancelled = false

        const checkStatus = async () => {
            if (cancelled) return
            try {
                const data: OrderStatusDto = await ConsultationService.getOrderStatus(orderId)
                if (cancelled) return

                if (data.generationStatus === 'completado' && data.pdfUrl) {
                    cancelled = true
                    setPdfUrl(data.pdfUrl)
                    if (data.planJson) setNutritionPlan(data.planJson)
                    setViewState('completed')
                    return
                }

                if (data.generationStatus === 'error') {
                    cancelled = true
                    setViewState('error')
                    return
                }

                //'no_iniciado' (aún no llega la confirmación de pago) o 'generando'
                setViewState('generating')
                if (Date.now() - startRef.current > DELAY_THRESHOLD_MS) setIsDelayed(true)
            } catch {
                //error de red/servidor puntual: se ignora y se reintenta en el próximo tick,
                //el estado de pago del usuario no se ve afectado por esto
                if (Date.now() - startRef.current > DELAY_THRESHOLD_MS) setIsDelayed(true)
            }
        }

        checkStatus()
        const intervalId = setInterval(checkStatus, POLLING_INTERVAL_MS)
        return () => {
            cancelled = true
            clearInterval(intervalId)
        }
    }, [orderId])

    return (
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto">
                <Card>
                    {(viewState === 'loading' || viewState === 'generating') && (
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                            <span className="text-gray-600 font-medium">
                                Estamos generando tu plan nutricional...
                            </span>
                            {isDelayed && (
                                <p className="text-sm text-gray-500 text-center max-w-sm">
                                    Esto está tardando más de lo normal. Tu pago quedó registrado, no es necesario
                                    que hagas nada más: puedes dejar esta página abierta o volver más tarde con el
                                    mismo enlace.
                                </p>
                            )}
                        </div>
                    )}

                    {viewState === 'completed' && pdfUrl && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="¡Tu plan nutricional está listo!" />
                            <div className="w-full py-8">
                                <PdfViewer url={pdfUrl} />
                            </div>
                        </SubsectionHead>
                    )}

                    {viewState === 'error' && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="Tu pago está a salvo" />
                            <p className="text-zinc-900 text-md">
                                Tuvimos un problema generando tu plan nutricional. Tu pago quedó registrado
                                correctamente y nuestro equipo ya fue notificado para resolverlo: no es necesario que
                                vuelvas a pagar. Te contactaremos por correo apenas esté listo.
                            </p>
                        </SubsectionHead>
                    )}
                </Card>
            </div>
        </div>
    )
}
