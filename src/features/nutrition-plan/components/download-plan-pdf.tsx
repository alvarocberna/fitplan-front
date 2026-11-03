'use client'
import { PDFDownloadLink } from '@react-pdf/renderer'
//features - plan nutricional
import { NutritionPlanDto } from '../dtos/nutrition-plan.dto'
import { NutritionPlanDocument } from '../pdf/nutrition-plan.document'

// Este componente se importa siempre con next/dynamic({ ssr: false }) desde la página
// que lo usa, porque @react-pdf/renderer solo puede generar el PDF en el cliente.
export function DownloadPlanPdf({ plan }: { plan: NutritionPlanDto }) {
    return (
        <PDFDownloadLink
            document={<NutritionPlanDocument plan={plan} />}
            fileName={`plan-nutricional-${plan.personalInfo.name}-${plan.personalInfo.lastName}.pdf`}
            className="primary-btn inline-block text-center no-underline"
        >
            {({ loading }) => (loading ? 'Preparando PDF...' : 'Descargar PDF')}
        </PDFDownloadLink>
    )
}
