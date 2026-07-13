'use client'
//react-pdf
import { PDFViewer } from '@react-pdf/renderer'
//features - plan nutricional
import { PlanNutricionalDocument } from '@/features/plan-nutricional/pdf/plan-nutricional.document'
import { planNutricionalMock } from '@/features/plan-nutricional/dtos/plan-nutricional.mock'

// Vista previa en vivo del PDF del plan nutricional, usando datos mockeados
// en vez del plan real. Permite ver e iterar el estilo del PDF sin tener que
// llenar el formulario ni el chat de la consulta cada vez.
// Este componente se importa siempre con next/dynamic({ ssr: false }) desde la página
// que lo usa, porque @react-pdf/renderer solo puede renderizar en el cliente.
export function PreviewPdf() {
    return (
        <PDFViewer style={{ width: '100%', height: '100vh', border: 'none' }}>
            <PlanNutricionalDocument plan={planNutricionalMock} />
        </PDFViewer>
    )
}
