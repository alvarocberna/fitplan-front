//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//features - dashboard
import { INTAKE_FIELDS, NO_DATA } from '../format'
import { ICON_CIRCLE_STYLE, MACRO_ICONS, type IntakeKey } from '../plan-icons'
import { MACRO_COLUMN_CLASSES } from '../plan-dividers'

interface MacrosRowProps {
    // calorías y macros (gramos); null o un valor null → "—"
    values: Partial<Record<IntakeKey, number | null>> | null
}

// Fila de los 4 macronutrientes de las listas de planes y consultas: cada uno con su ícono a la izquierda y
// nombre + valor a la derecha, separados por líneas verticales (2×2 en móvil, 4 en fila desde sm).
export function MacrosRow({ values }: MacrosRowProps) {
    return (
        <dl aria-label="Macronutrientes" className="grid grid-cols-2 sm:grid-cols-4 gap-y-3">
            {INTAKE_FIELDS.map(({ key, label, unit }, index) => (
                // el <dt> usa `contents` para que el ícono (dentro del dt, así el grupo sigue siendo un
                // <dt>/<dd> válido) ocupe la 1.ª columna y nombre y valor la 2.ª
                <div
                    key={key}
                    className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 items-center min-w-0 ${MACRO_COLUMN_CLASSES[index]}`}
                >
                    <dt className="contents">
                        <span
                            aria-hidden="true"
                            className="row-span-2 h-8 w-8 rounded-full flex items-center justify-center"
                            style={ICON_CIRCLE_STYLE}
                        >
                            <FontAwesomeIcon icon={MACRO_ICONS[key]} className="h-3.5 w-3.5" />
                        </span>
                        <span className="col-start-2 text-xs text-zinc-500">{label}</span>
                    </dt>
                    <dd className="col-start-2 text-sm font-semibold text-zinc-900">
                        {values?.[key] != null ? `${values[key]} ${unit}` : NO_DATA}
                    </dd>
                </div>
            ))}
        </dl>
    )
}
