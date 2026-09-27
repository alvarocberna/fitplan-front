//features - panel
import { ConsultationPlanSummaryDto } from '../dtos/consultation-summary.dto'
import { INTAKE_FIELDS } from '../format'

// Calorías y macros del plan en una línea, con el mismo estilo etiqueta/valor que el resto de las
// filas ("Objetivo:", "Régimen:"): etiqueta en zinc-500, valor en el color del texto.
export function IntakeSummary({ plan }: { plan: ConsultationPlanSummaryDto }) {
    return (
        <p>
            {INTAKE_FIELDS.map(({ key, label, unit }, index) => (
                <span key={key}>
                    {index > 0 && <span className="text-zinc-500"> · </span>}
                    <span className="text-zinc-500">{label}: </span>
                    {plan[key]} {unit}
                </span>
            ))}
        </p>
    )
}
