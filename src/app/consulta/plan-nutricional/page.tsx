'use client'
//next
import dynamic from 'next/dynamic'
//shared
import { ProfessionalCont, TitleSec } from '@/shared'
//features
import { useConsulta } from '@/features'
//app
import '../../globals.css'

// @react-pdf/renderer solo puede correr en el navegador, por eso el botón de descarga
// se carga con ssr:false en vez de importarlo directo desde '@/features'.
const DescargarPlanPdf = dynamic(
    () => import('@/features/consulta/components/descargar-plan-pdf').then(m => m.DescargarPlanPdf),
    { ssr: false, loading: () => <span className="text-sm text-gray-400">Cargando botón de descarga...</span> }
)

export default function PlanNutricionalPage(){
    const { planNutricional } = useConsulta();

    return(
        <ProfessionalCont>
            <TitleSec title="Plan Nutricional"/>
            {planNutricional && (
                <div className="w-[90%] m-auto mb-4 flex justify-end">
                    <DescargarPlanPdf plan={planNutricional} />
                </div>
            )}
            <pre className="w-[90%] m-auto whitespace-pre-wrap break-words">
                {JSON.stringify(planNutricional, null, 2)}
            </pre>
        </ProfessionalCont>
    )
}
