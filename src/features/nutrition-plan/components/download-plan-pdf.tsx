'use client'
//react
import { useRef } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
//features - plan nutricional
import { NutritionPlanDto } from '../dtos/nutrition-plan.dto'
import { NutritionPlanDocument } from '../pdf/nutrition-plan.document'

// Este componente se importa siempre con next/dynamic({ ssr: false }) desde la página
// que lo usa, porque @react-pdf/renderer solo puede generar el PDF en el cliente.
export function DownloadPlanPdf({ plan }: { plan: NutritionPlanDto }) {
    // Cada vez que `document` recibe un elemento nuevo (p. ej. porque el padre se
    // vuelve a renderizar), PDFDownloadLink descarta el PDF anterior y regenera todo
    // desde cero. Estos refs cuentan esas regeneraciones y miden cuánto demora cada una,
    // usando las transiciones de `loading` que expone el render-prop.
    const attemptsRef = useRef(0)
    const startRef = useRef<number | null>(null)
    const previousLoadingRef = useRef(false)

    return (
        <PDFDownloadLink
            document={<NutritionPlanDocument plan={plan} />}
            fileName={`plan-nutricional-${plan.personalInfo.name}-${plan.personalInfo.lastName}.pdf`}
            className="primary-btn inline-block text-center no-underline"
        >
            {({ loading }) => {
                if (loading && !previousLoadingRef.current) {
                    attemptsRef.current += 1
                    startRef.current = performance.now()
                    console.log(`[DownloadPlanPdf] Generación #${attemptsRef.current} iniciada`)
                } else if (!loading && previousLoadingRef.current && startRef.current !== null) {
                    const durationMs = performance.now() - startRef.current
                    console.log(`[DownloadPlanPdf] Generación #${attemptsRef.current} finalizada en ${durationMs.toFixed(0)} ms`)
                }
                previousLoadingRef.current = loading
                return loading ? 'Preparando PDF...' : 'Descargar PDF'
            }}
        </PDFDownloadLink>
    )
}
