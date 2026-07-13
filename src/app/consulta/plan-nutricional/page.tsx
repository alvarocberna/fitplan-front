'use client'
//next
import dynamic from 'next/dynamic'
//shared
import { GeneralCont, TitleSec, Card } from '@/shared'
//features
import { useConsulta } from '@/shared'
//app
import '../../globals.css'

// @react-pdf/renderer solo puede correr en el navegador, por eso el botón de descarga
// se carga con ssr:false en vez de importarlo directo desde '@/features'.
const DescargarPlanPdf = dynamic(
    () => import('@/features/plan-nutricional/components/descargar-plan-pdf').then(m => m.DescargarPlanPdf),
    { ssr: false, loading: () => <span className="text-sm text-gray-400 ">Cargando botón de descarga...</span> }
)

export default function PlanNutricionalPage(){
    const { planNutricional } = useConsulta();

    return(
        <GeneralCont>
            {/* <TitleSec title="Plan Nutricional"/> */}
            {planNutricional && (
                <div className='w-[60%] mx-auto'>
                    <Card>
                        <div className="w-[40%] m-auto mb-4 py-16 flex justify-end">
                            <DescargarPlanPdf plan={planNutricional} />
                        </div>
                    </Card>
                </div>
            )}
            {/* <pre className="w-[90%] m-auto whitespace-pre-wrap break-words">
                {JSON.stringify(planNutricional, null, 2)}
            </pre> */}
        </GeneralCont>
    )
}
