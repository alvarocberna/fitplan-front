//icons
import { CalendarDaysIcon, ClipboardDocumentListIcon, FireIcon, FlagIcon } from '@heroicons/react/24/outline'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
//features - dashboard
import { MacrosDto, MyPlanDetailDto } from '../dtos/my-plan.dto'
import { INTAKE_FIELDS, NO_DATA, formatDateOnly, planDurationLabel } from '../format'
import { ICON_CIRCLE_STYLE, MACRO_ICONS, type IntakeKey } from '../plan-icons'
import { DIVIDER, MACRO_COLUMN_CLASSES } from '../plan-dividers'
import { CardTitle } from './card-title.component'

interface PlanOverviewCardProps {
    // null: sin plan; la card muestra "—" en todo.
    plan: MyPlanDetailDto | null
    // Título interno (con ícono), p. ej. "Información plan" en /inicio; el detalle del plan no lo usa.
    title?: string
}

// Card con los datos de un plan: objetivo, régimen y duración con íconos (arriba) y, tras una línea, los 4
// macronutrientes (ícono, valor, unidad y nombre). La usan el detalle del plan (/planes/[orderId]) y /inicio.
export function PlanOverviewCard({ plan, title }: PlanOverviewCardProps) {
    const overview = planOverviewOf(plan)

    return (
        <InfoCard label="Datos del plan">
            {title && <CardTitle icon={ClipboardDocumentListIcon} title={title} />}

            {/* sin gap: el espacio entre columnas lo da el padding de cada una, con el separador al medio */}
            <dl className="grid grid-cols-3">
                <Stat label="Objetivo" value={overview.goal ?? NO_DATA} icon={FlagIcon} className="pr-4" />
                <Stat
                    label="Régimen"
                    value={overview.dietRegimen ?? NO_DATA}
                    icon={FireIcon}
                    className={`px-4 ${DIVIDER}`}
                />
                <Stat
                    label="Duración"
                    value={overview.duration ?? NO_DATA}
                    detail={overview.range ?? undefined}
                    icon={CalendarDaysIcon}
                    className={`pl-4 ${DIVIDER}`}
                />
            </dl>

            <hr className="my-2 border-zinc-200" />

            {/* macronutrientes: sin gap horizontal, igual que arriba; el separador va al medio del padding */}
            <dl aria-label="Macronutrientes" className="grid grid-cols-2 sm:grid-cols-4 gap-y-4">
                {INTAKE_FIELDS.map(({ key, label, unit }, index) => (
                    <MacroStat
                        key={key}
                        label={label}
                        value={overview.intake?.[key] ?? null}
                        unit={unit}
                        icon={MACRO_ICONS[key]}
                        className={MACRO_COLUMN_CLASSES[index]}
                    />
                ))}
            </dl>
        </InfoCard>
    )
}

// Macros vacíos: con ellos MacroDistributionCard muestra su estado "Sin información de macronutrientes".
export const NO_MACROS: MacrosDto = { calories: 0, protein: 0, carbohydrate: 0, fat: 0 }

// Macronutrientes del plan para MacroDistributionCard: la ingesta del personalizado o el resumen del
// estándar (si tiene todos los valores). null sin plan o sin datos.
export function planMacrosOf(plan: MyPlanDetailDto | null): MacrosDto | null {
    if (!plan) return null
    if (plan.generated) return plan.generated.intake
    const summary = plan.predefined?.summary
    if (
        summary?.calorieIntake == null ||
        summary.proteinIntake == null ||
        summary.carbohydrateIntake == null ||
        summary.lipidIntake == null
    ) {
        return null
    }
    return {
        calories: summary.calorieIntake,
        protein: summary.proteinIntake,
        carbohydrate: summary.carbohydrateIntake,
        fat: summary.lipidIntake,
    }
}

interface PlanOverview {
    goal: string | null
    dietRegimen: string | null
    duration: string | null
    range: string | null
    intake: Record<IntakeKey, number | null> | null
}

// Lo que muestra la card, igual para los dos tipos (sin plan, todo null): el personalizado lo toma del NutritionalPlan
// (con duración si tiene fechas), el estándar del resumen del producto (sin duración).
function planOverviewOf(plan: MyPlanDetailDto | null): PlanOverview {
    if (!plan) return { goal: null, dietRegimen: null, duration: null, range: null, intake: null }
    const { generated, predefined } = plan
    if (generated) {
        const duration = planDurationLabel(generated.startDate, generated.endDate)
        return {
            goal: generated.goal,
            dietRegimen: generated.dietRegimen,
            duration,
            range:
                duration && generated.startDate && generated.endDate
                    ? `${formatDateOnly(generated.startDate)} – ${formatDateOnly(generated.endDate)}`
                    : null,
            intake: {
                calorieIntake: generated.intake.calories,
                proteinIntake: generated.intake.protein,
                carbohydrateIntake: generated.intake.carbohydrate,
                lipidIntake: generated.intake.fat,
            },
        }
    }
    const summary = predefined?.summary ?? null
    return {
        goal: summary?.goal ?? null,
        dietRegimen: summary?.dietRegimen ?? null,
        duration: null,
        range: null,
        intake: summary,
    }
}

// Card compacta del encabezado: mismo aspecto que Card variant="solid", sin el padding ni el margen
// pensados para las secciones de ancho completo.
function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <section aria-label={label} className="w-full h-full bg-white border border-white rounded-[12px] shadow-lg p-5 flex flex-col gap-3">
            {children}
        </section>
    )
}

function Stat({
    label,
    value,
    detail,
    icon: Icon,
    className = '',
}: {
    label: string
    value: string
    detail?: string
    // Con ícono: círculo a la izquierda y título + valor a la derecha.
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
    className?: string
}) {
    if (!Icon) {
        return (
            <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
                <dd className="text-zinc-900 font-semibold break-words">{value}</dd>
                {detail && <dd className="text-xs text-zinc-500">{detail}</dd>}
            </div>
        )
    }

    // Grilla de 2 columnas: el <dt> usa `contents` para que el círculo (dentro del dt, así el grupo
    // sigue siendo un <dt>/<dd> válido) ocupe la 1.ª columna a lo alto de todas las filas, y la etiqueta y
    // los <dd> la 2.ª.
    return (
        <div className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 min-w-0 ${className}`}>
            <dt className="contents">
                <span
                    aria-hidden="true"
                    className="row-span-3 self-center h-10 w-10 rounded-full flex items-center justify-center"
                    style={ICON_CIRCLE_STYLE}
                >
                    <Icon className="h-5 w-5" />
                </span>
                <span className="col-start-2 text-xs uppercase tracking-wide text-zinc-500">{label}</span>
            </dt>
            <dd className="col-start-2 mt-1 text-zinc-900 font-semibold break-words">{value}</dd>
            {detail && <dd className="col-start-2 mt-1 text-xs text-zinc-500">{detail}</dd>}
        </div>
    )
}

// Un macronutriente en columna centrada: ícono, valor, unidad y nutriente. Para el lector de pantalla el
// nutriente sigue siendo el <dt> y valor y unidad los <dd>; el orden visual lo pone `order` (el <dt> usa
// `contents` para que su ícono y su etiqueta se ordenen como hijos de la columna). Sin dato: "—" y sin unidad.
function MacroStat({
    label,
    value,
    unit,
    icon,
    className = '',
}: {
    label: string
    value: number | null
    unit: string
    icon: IconDefinition
    className?: string
}) {
    return (
        <div className={`flex flex-col items-center gap-1 min-w-0 text-center ${className}`}>
            <dt className="contents">
                <span
                    aria-hidden="true"
                    className="order-1 mb-1 h-10 w-10 rounded-full flex items-center justify-center"
                    style={ICON_CIRCLE_STYLE}
                >
                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                </span>
                <span className="order-4 text-xs uppercase tracking-wide text-zinc-500">{label}</span>
            </dt>
            <dd className="order-2 text-xl font-bold text-zinc-900 leading-none">{value ?? NO_DATA}</dd>
            {value != null && <dd className="order-3 text-xs text-zinc-500">{unit}</dd>}
        </div>
    )
}
