'use client'
//next
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
//react
import { useEffect, useRef, useState } from 'react'
//shared
import { Card, HeadSubSec, TitleSubSec } from '@/shared'
//features
import { ConsultaService, EstadoOrdenDto, PlanNutricionalDto } from '@/features'

// @react-pdf/renderer solo puede correr en el navegador (igual que en /consulta/plan-nutricional)
const DescargarPlanPdf = dynamic(
    () => import('@/features/plan-nutricional/components/descargar-plan-pdf').then(m => m.DescargarPlanPdf),
    { ssr: false, loading: () => <span className="text-sm text-gray-400">Cargando botón de descarga...</span> }
)

const INTERVALO_POLLING_MS = 4000
// a partir de este tiempo sin terminar, se muestra un mensaje de "esto está tardando más de lo normal"
const UMBRAL_DEMORA_MS = 45_000

type EstadoVista = 'cargando' | 'generando' | 'completado' | 'error'

export default function OrdenPage() {
    const { id: ordenId } = useParams<{ id: string }>()

    const [estadoVista, setEstadoVista] = useState<EstadoVista>('cargando')
    const [plan, setPlan] = useState<PlanNutricionalDto | null>(null)
    const [demora, setDemora] = useState(false)

    //referencias para controlar el polling sin re-crear el intervalo en cada render
    const inicioRef = useRef(Date.now())
    const detenidoRef = useRef(false)

    useEffect(() => {
        const consultarEstado = async () => {
            if (detenidoRef.current) return
            try {
                const data: EstadoOrdenDto = await ConsultaService.obtenerEstadoOrden(ordenId)

                if (data.estado_generacion === 'completado' && data.plan_json) {
                    detenidoRef.current = true
                    setPlan(data.plan_json)
                    setEstadoVista('completado')
                    return
                }

                if (data.estado_generacion === 'error') {
                    detenidoRef.current = true
                    setEstadoVista('error')
                    return
                }

                //'no_iniciado' (aún no llega la confirmación de pago) o 'generando'
                setEstadoVista('generando')
                if (Date.now() - inicioRef.current > UMBRAL_DEMORA_MS) setDemora(true)
            } catch {
                //error de red/servidor puntual: se ignora y se reintenta en el próximo tick,
                //el estado de pago del usuario no se ve afectado por esto
                if (Date.now() - inicioRef.current > UMBRAL_DEMORA_MS) setDemora(true)
            }
        }

        consultarEstado()
        const intervalId = setInterval(consultarEstado, INTERVALO_POLLING_MS)
        return () => {
            detenidoRef.current = true
            clearInterval(intervalId)
        }
    }, [ordenId])

    return (
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto">
                <Card>
                    {(estadoVista === 'cargando' || estadoVista === 'generando') && (
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
                            <span className="text-gray-600 font-medium">
                                Estamos generando tu plan nutricional...
                            </span>
                            {demora && (
                                <p className="text-sm text-gray-500 text-center max-w-sm">
                                    Esto está tardando más de lo normal. Tu pago quedó registrado, no es necesario
                                    que hagas nada más: puedes dejar esta página abierta o volver más tarde con el
                                    mismo enlace.
                                </p>
                            )}
                        </div>
                    )}

                    {estadoVista === 'completado' && plan && (
                        <HeadSubSec>
                            <TitleSubSec mb={2} title="¡Tu plan nutricional está listo!" />
                            <div className="w-[40%] m-auto mb-4 py-8 flex justify-end">
                                <DescargarPlanPdf plan={plan} />
                            </div>
                        </HeadSubSec>
                    )}

                    {estadoVista === 'error' && (
                        <HeadSubSec>
                            <TitleSubSec mb={2} title="Tu pago está a salvo" />
                            <p className="text-zinc-900 text-md">
                                Tuvimos un problema generando tu plan nutricional. Tu pago quedó registrado
                                correctamente y nuestro equipo ya fue notificado para resolverlo: no es necesario que
                                vuelvas a pagar. Te contactaremos por correo apenas esté listo.
                            </p>
                        </HeadSubSec>
                    )}
                </Card>
            </div>
        </div>
    )
}
