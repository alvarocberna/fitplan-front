//features - panel
import { INTAKE_FIELDS, NO_DATA } from '../format'

type IntakeValues = Record<(typeof INTAKE_FIELDS)[number]['key'], number | null>

// Calorías y macros del plan en una línea, con el mismo estilo etiqueta/valor que el resto de las
// filas ("Objetivo:", "Régimen:"): etiqueta en zinc-500, valor en el color del texto. Un valor
// faltante (p. ej. plan estándar sin resumen cargado) se muestra como "—".
export function IntakeSummary({ plan }: { plan: IntakeValues }) {
    return (
        <p>
            {INTAKE_FIELDS.map(({ key, label, unit }, index) => (
                <span key={key}>
                    {index > 0 && <span className="text-zinc-500"> · </span>}
                    <span className="text-zinc-500">{label}: </span>
                    {plan[key] != null ? `${plan[key]} ${unit}` : NO_DATA}
                </span>
            ))}
        </p>
    )
}
