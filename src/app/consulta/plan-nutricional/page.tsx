'use client'
//next
import dynamic from 'next/dynamic'
//shared
import { GeneralContainer, SectionTitle, Card } from '@/shared'
//features
import { useConsultation } from '@/shared'
//app
// import '../../globals.css'

// @react-pdf/renderer solo puede correr en el navegador, por eso el botón de descarga
// se carga con ssr:false en vez de importarlo directo desde '@/features'.
const DownloadPlanPdf = dynamic(
    () => import('@/features/nutrition-plan/components/download-plan-pdf').then(m => m.DownloadPlanPdf),
    { ssr: false, loading: () => <span className="text-sm text-gray-400 ">Cargando botón de descarga...</span> }
)

export default function NutritionPlanPage(){
    const { nutritionPlan } = useConsultation();

    return(
        <div className='w-full min-h-screen py-24'>
            {nutritionPlan && (
                <div className="max-w-2xl flex flex-col mx-auto" >
                    <Card>
                        <div className="w-[40%] m-auto mb-4 py-16 flex justify-end">
                            <DownloadPlanPdf plan={nutritionPlan} />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
