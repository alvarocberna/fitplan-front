'use client'
//next
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
//react
import { useEffect, useRef, useState } from 'react'
//shared
import { Card, SubsectionHead, SubsectionTitle, useConsultation } from '@/shared'
//features
import { ConsultationService, OrderStatusDto, NutritionPlanDto } from '@/features'

// @react-pdf/renderer solo puede correr en el navegador (igual que en /consultation/nutrition-plan)
const DownloadPlanPdf = dynamic(
    () => import('@/features/nutrition-plan/components/download-plan-pdf').then(m => m.DownloadPlanPdf),
    { ssr: false, loading: () => <span className="text-sm text-gray-400">Cargando botón de descarga...</span> }
)

const POLLING_INTERVAL_MS = 4000
// a partir de este tiempo sin terminar, se muestra un mensaje de "esto está tardando más de lo normal"
const DELAY_THRESHOLD_MS = 45_000

type ViewState = 'loading' | 'generating' | 'completed' | 'error'

export default function OrderPage() {
    const { id: orderId } = useParams<{ id: string }>()
    const { setNutritionPlan } = useConsultation()

    const [viewState, setViewState] = useState<ViewState>('loading')
    const [plan, setPlan] = useState<NutritionPlanDto | null>(null)
    const [isDelayed, setIsDelayed] = useState(false)

    //referencias para controlar el polling sin re-crear el intervalo en cada render
    const startRef = useRef(Date.now())
    const stoppedRef = useRef(false)

    useEffect(() => {
        const checkStatus = async () => {
            if (stoppedRef.current) return
            try {
                const data: OrderStatusDto = await ConsultationService.getOrderStatus(orderId)

                if (data.generationStatus === 'completado' && data.planJson) {
                    stoppedRef.current = true
                    setPlan(data.planJson)
                    setNutritionPlan(data.planJson)
                    setViewState('completed')
                    return
                }

                if (data.generationStatus === 'error') {
                    stoppedRef.current = true
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
            stoppedRef.current = true
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

                    {viewState === 'completed' && plan && (
                        <SubsectionHead>
                            <SubsectionTitle mb={2} title="¡Tu plan nutricional está listo!" />
                            <div className="w-[40%] m-auto mb-4 py-8 flex justify-end">
                                <DownloadPlanPdf plan={plan} />
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
