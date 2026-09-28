//features - panel
import { NO_DATA } from '../format'
import { IntakeSummary } from './intake-summary.component'

interface NutritionalPlanSummaryProps {
    // Se omite cuando el nombre ya se muestra en otro lado (p. ej. el encabezado del detalle del plan).
    planName?: string
    goal: string | null
    dietRegimen: string | null
    intake: {
        calorieIntake: number | null
        proteinIntake: number | null
        carbohydrateIntake: number | null
        lipidIntake: number | null
    } | null
}

// Resumen de un plan nutricional (nombre, objetivo, régimen, calorías y macros), de solo lectura.
// Lo usa el detalle de una consulta (/panel/consultas/[id]); el detalle de un plan (/planes/[orderId]) muestra
// estos datos en su propio encabezado.
export function NutritionalPlanSummary({ planName, goal, dietRegimen, intake }: NutritionalPlanSummaryProps) {
    return (
        <div className="w-full flex flex-col gap-2 text-left text-zinc-700">
            {planName && (
                <p>
                    <span className="text-zinc-500">Plan: </span>
                    {planName}
                </p>
            )}
            <p>
                <span className="text-zinc-500">Objetivo: </span>
                {goal ?? NO_DATA}
            </p>
            <p>
                <span className="text-zinc-500">Régimen: </span>
                {dietRegimen ?? NO_DATA}
            </p>
            {intake ? (
                <IntakeSummary plan={intake} />
            ) : (
                <p>
                    <span className="text-zinc-500">Calorías y macros: </span>
                    {NO_DATA}
                </p>
            )}
        </div>
    )
}
