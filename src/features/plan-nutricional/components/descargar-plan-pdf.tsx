'use client'
//react
import { PDFDownloadLink } from '@react-pdf/renderer'
//features - plan nutricional
import { PlanNutricionalDto } from '../dtos/plan-nutricional.dto'
import { PlanNutricionalDocument } from '../pdf/plan-nutricional.document'

// Este componente se importa siempre con next/dynamic({ ssr: false }) desde la página
// que lo usa, porque @react-pdf/renderer solo puede generar el PDF en el cliente.
export function DescargarPlanPdf({ plan }: { plan: PlanNutricionalDto }) {
    return (
        <PDFDownloadLink
            document={<PlanNutricionalDocument plan={plan} />}
            fileName={`plan-nutricional-${plan.informacion_personal.nombre}-${plan.informacion_personal.apellido}.pdf`}
            className="primary-btn inline-block text-center no-underline"
        >
            {({ loading }) => (loading ? 'Preparando PDF...' : 'Descargar PDF')}
        </PDFDownloadLink>
    )
}
