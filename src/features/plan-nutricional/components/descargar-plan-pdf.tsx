'use client'
//react
import { useRef } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
//features - plan nutricional
import { PlanNutricionalDto } from '../dtos/plan-nutricional.dto'
import { PlanNutricionalDocument } from '../pdf/plan-nutricional.document'

// Este componente se importa siempre con next/dynamic({ ssr: false }) desde la página
// que lo usa, porque @react-pdf/renderer solo puede generar el PDF en el cliente.
export function DescargarPlanPdf({ plan }: { plan: PlanNutricionalDto }) {
    // Cada vez que `document` recibe un elemento nuevo (p. ej. porque el padre se
    // vuelve a renderizar), PDFDownloadLink descarta el PDF anterior y regenera todo
    // desde cero. Estos refs cuentan esas regeneraciones y miden cuánto demora cada una,
    // usando las transiciones de `loading` que expone el render-prop.
    const intentosRef = useRef(0)
    const inicioRef = useRef<number | null>(null)
    const cargandoAnteriorRef = useRef(false)

    return (
        <PDFDownloadLink
            document={<PlanNutricionalDocument plan={plan} />}
            fileName={`plan-nutricional-${plan.informacion_personal.nombre}-${plan.informacion_personal.apellido}.pdf`}
            className="primary-btn inline-block text-center no-underline"
        >
            {({ loading }) => {
                if (loading && !cargandoAnteriorRef.current) {
                    intentosRef.current += 1
                    inicioRef.current = performance.now()
                    console.log(`[DescargarPlanPdf] Generación #${intentosRef.current} iniciada`)
                } else if (!loading && cargandoAnteriorRef.current && inicioRef.current !== null) {
                    const duracionMs = performance.now() - inicioRef.current
                    console.log(`[DescargarPlanPdf] Generación #${intentosRef.current} finalizada en ${duracionMs.toFixed(0)} ms`)
                }
                cargandoAnteriorRef.current = loading
                return loading ? 'Preparando PDF...' : 'Descargar PDF'
            }}
        </PDFDownloadLink>
    )
}
