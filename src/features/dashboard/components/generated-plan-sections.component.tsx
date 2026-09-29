//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//features - dashboard
import {
    MacrosDto,
    MyGeneratedPlanDetailDto,
    MyPlanMealTimeDto,
    MyPlanSupplementDto,
    MyPlanSportsRecommendationDto,
} from '../dtos/my-plan.dto'
import { MEAL_TIME_LABELS, NO_DATA, PORTION_GROUP_LABELS } from '../format'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
    CONSIDERATIONS_ICON,
    DOSE_ICON,
    EFFECTS_ICON,
    ICON_CIRCLE_STYLE,
    INTAKE_TIME_ICON,
    MACROS_DTO_ICONS,
    PLAN_ICON,
    DURING_ACTIVITY_ICON,
    POST_ACTIVITY_ICON,
    PRE_ACTIVITY_ICON,
    SPORTS_ICON,
    SPORTS_SESSION_ICON,
    STRATEGY_ICON,
    SUPPLEMENTS_ICON,
    SUPPLEMENT_ICON,
} from '../plan-icons'
import { DIVIDER_SM, MACRO_COLUMN_CLASSES } from '../plan-dividers'
import { DetailSection } from './detail-section.component'

// Secciones con el detalle guardado de un plan personalizado: resumen por tiempo de comida (hora y porciones),
// suplementación y recomendaciones deportivas; las vacías no se muestran. La usan el detalle del plan
// (/planes/[orderId]) y el de la consulta (/inicio/consultas/[id]).
export function GeneratedPlanSections({ plan }: { plan: MyGeneratedPlanDetailDto }) {
    return (
        <>
            {plan.mealTimes.length > 0 && (
                <DetailSection title="Resumen Plan Nutricional" icon={PLAN_ICON}>
                    {/* card de títulos y, debajo, un card por tiempo de comida con las mismas 3 columnas */}
                    <div className="w-full flex flex-col gap-4">
                        <MealTimeSummaryHeader />
                        <ul className="w-full flex flex-col gap-4">
                            {plan.mealTimes.map((mealTime, index) => (
                                <MealTimeSummary key={`${mealTime.time}-${index}`} mealTime={mealTime} />
                            ))}
                        </ul>
                    </div>
                </DetailSection>
            )}

            {/* La card "Tiempos de comida" (detalle con macros, ejemplos, equivalencias y comentarios, ver
                MealTime) está oculta por ahora. */}

            {plan.supplements.length > 0 && (
                <DetailSection title="Suplementación" icon={SUPPLEMENTS_ICON}>
                    <div className="w-full flex flex-col gap-4">
                        {plan.supplements.map((supplement) => (
                            <Supplement key={supplement.supplement} supplement={supplement} />
                        ))}
                    </div>
                </DetailSection>
            )}

            {plan.sportsRecommendations.length > 0 && (
                <DetailSection title="Recomendaciones deportivas" icon={SPORTS_ICON}>
                    <div className="w-full flex flex-col gap-4">
                        {plan.sportsRecommendations.map((recommendation, index) => (
                            <SportsRecommendation key={index} recommendation={recommendation} />
                        ))}
                    </div>
                </DetailSection>
            )}
        </>
    )
}

const MACRO_ROWS: { key: keyof MacrosDto; label: string; unit: string }[] = [
    { key: 'calories', label: 'Calorías', unit: 'kcal' },
    { key: 'protein', label: 'Proteínas', unit: 'g' },
    { key: 'carbohydrate', label: 'Carbohidratos', unit: 'g' },
    { key: 'fat', label: 'Lípidos', unit: 'g' },
]

type PortionGroup = keyof MyPlanMealTimeDto['portions']

// Grupos de alimentos (de cereal a sugar, en ese orden) con porciones en el tiempo de comida.
function portionGroupsOf(mealTime: MyPlanMealTimeDto): PortionGroup[] {
    return (Object.keys(PORTION_GROUP_LABELS) as PortionGroup[]).filter((group) => mealTime.portions[group] != null)
}

// Grupo de alimentos con sus porciones en una sola línea: "Cereales 1 porción", "Cereales 2 porciones".
function portionLabel(group: string, portions: number): string {
    return `${group} ${portions} ${portions === 1 ? 'porción' : 'porciones'}`
}

// Columnas de "Resumen Plan Nutricional", compartidas por el card de títulos y los de cada tiempo de comida:
// tiempo | alimentos | aporte nutricional.
const MEAL_TIME_COLUMNS = 'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,3fr)] gap-4'

// Card de títulos de "Resumen Plan Nutricional".
function MealTimeSummaryHeader() {
    return (
        <div
            className={`${MEAL_TIME_COLUMNS} border border-zinc-200 bg-zinc-50 rounded-2xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500`}
        >
            <span>Tiempo</span>
            <span>Alimentos</span>
            <span>Aporte nutricional</span>
        </div>
    )
}

// Sub-card de "Resumen Plan Nutricional" en 3 columnas: el tiempo de comida y debajo su hora; las porciones de cada
// grupo con valor; y el aporte nutricional del tiempo (calorías, proteínas, carbohidratos y lípidos, en 2×2).
function MealTimeSummary({ mealTime }: { mealTime: MyPlanMealTimeDto }) {
    const label = MEAL_TIME_LABELS[mealTime.time] ?? mealTime.time
    const groups = portionGroupsOf(mealTime)

    return (
        <li aria-label={`Resumen de ${label}`} className={`${MEAL_TIME_COLUMNS} border border-zinc-200 rounded-2xl p-4 text-left text-sm`}>
            <div className="flex flex-col gap-1">
                <p className="font-semibold text-zinc-900">{label}</p>
                <p className="text-zinc-500">{mealTime.hour ?? NO_DATA}</p>
            </div>
            {groups.length > 0 ? (
                <ul className="flex flex-col gap-1 text-zinc-700">
                    {groups.map((group) => (
                        <li key={group}>{portionLabel(PORTION_GROUP_LABELS[group], mealTime.portions[group]!)}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-zinc-500">Sin porciones registradas</p>
            )}
            <dl aria-label={`Aporte nutricional de ${label}`} className="grid grid-cols-2 gap-x-4 gap-y-2 self-start">
                {MACRO_ROWS.map(({ key, label: macroLabel, unit }) => (
                    <div key={key} className="flex flex-col">
                        <dt className="text-xs text-zinc-500">{macroLabel}</dt>
                        <dd className="font-semibold text-zinc-900">
                            {mealTime.intake[key]} <span className="text-xs font-normal text-zinc-500">{unit}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        </li>
    )
}

function macrosLine(macros: MacrosDto): string {
    return MACRO_ROWS.map(({ key, label, unit }) => `${label}: ${macros[key]} ${unit}`).join(' · ')
}

function NoteList({ title, notes }: { title: string; notes: string[] }) {
    if (notes.length === 0) return null
    return (
        <div>
            <p className="text-zinc-500">{title}</p>
            <ul className="list-disc pl-6">
                {notes.map((note) => (
                    <li key={note}>{note}</li>
                ))}
            </ul>
        </div>
    )
}

function MealTime({ mealTime }: { mealTime: MyPlanMealTimeDto }) {
    const label = MEAL_TIME_LABELS[mealTime.time] ?? mealTime.time
    const portions = portionGroupsOf(mealTime)

    return (
        <section
            aria-label={label}
            className="w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-2 text-left text-sm text-zinc-700"
        >
            <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-semibold text-zinc-900">{label}</h3>
                {mealTime.hour && <span className="text-zinc-500">{mealTime.hour}</span>}
            </div>
            <p>{macrosLine(mealTime.intake)}</p>
            {portions.length > 0 && (
                <div>
                    <p className="text-zinc-500">Porciones:</p>
                    <ul className="list-disc pl-6">
                        {portions.map((group) => (
                            <li key={group}>
                                {PORTION_GROUP_LABELS[group]}: {mealTime.portions[group]}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <NoteList title="Ejemplos:" notes={mealTime.examples} />
            <NoteList title="Equivalencias:" notes={mealTime.equivalences} />
            <NoteList title="Comentarios:" notes={mealTime.comments} />
        </section>
    )
}

// Card de un suplemento: nombre con ícono; Dosis (1/4) y Toma (3/4) en una fila; aporte nutricional en un card
// interno de 4 columnas; y Efectos y Consideraciones en 2 columnas.
function Supplement({ supplement }: { supplement: MyPlanSupplementDto }) {
    const name = supplement.supplement

    return (
        <section
            aria-label={name}
            className="w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-4 text-left text-sm text-zinc-700"
        >
            <div className="flex items-center gap-3">
                <IconCircle icon={SUPPLEMENT_ICON} />
                <h3 className="font-semibold text-zinc-900">{name}</h3>
            </div>

            {/* `requirement` no trae unidad (g o mg según el suplemento): la dosis ya la incluye en el texto */}
            <dl className="grid grid-cols-4 gap-4">
                <LabeledValue label="Dosis" icon={DOSE_ICON} className="col-span-1">
                    {supplement.doseInstructions ?? NO_DATA}
                </LabeledValue>
                <LabeledValue label="Toma" icon={INTAKE_TIME_ICON} className="col-span-3">
                    {supplement.intakeInstructions ?? NO_DATA}
                </LabeledValue>
            </dl>

            {/* sin borde; líneas verticales entre macronutrientes (las mismas columnas que PlanOverviewCard) */}
            <dl
                aria-label={`Aporte nutricional de ${name}`}
                className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 rounded-xl bg-zinc-50 p-3"
            >
                {MACRO_ROWS.map(({ key, label, unit }, index) => (
                    <IconStat key={key} icon={MACROS_DTO_ICONS[key]} label={label} className={MACRO_COLUMN_CLASSES[index]}>
                        <span className="font-semibold text-zinc-900">
                            {supplement.intake[key]} <span className="text-xs font-normal text-zinc-500">{unit}</span>
                        </span>
                    </IconStat>
                ))}
            </dl>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NoteColumn title="Efectos" icon={EFFECTS_ICON} notes={supplement.effects} />
                <NoteColumn title="Consideraciones" icon={CONSIDERATIONS_ICON} notes={supplement.considerations} />
            </div>
        </section>
    )
}

// Ícono en un círculo con el tinte del color primario (mismo estilo que PlanOverviewCard): nombre del suplemento.
function IconCircle({ icon }: { icon: IconDefinition }) {
    return (
        <span
            aria-hidden="true"
            className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
            style={ICON_CIRCLE_STYLE}
        >
            <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
    )
}

// Ícono solo, sin círculo de fondo, en el color primario: datos de cada suplemento.
function PlainIcon({ icon }: { icon: IconDefinition }) {
    return (
        <FontAwesomeIcon
            aria-hidden="true"
            icon={icon}
            className="h-4 w-4 shrink-0"
            style={{ color: 'var(--color-primary)' }}
        />
    )
}

// Dato con ícono a la izquierda y, a su derecha, el título arriba y el valor debajo (Dosis, Toma y cada
// macronutriente de un suplemento). El <dt> usa `contents` para que el ícono (dentro del dt, así el grupo
// sigue siendo un <dt>/<dd> válido) ocupe la 1.ª columna a lo alto de las dos filas.
function IconStat({
    icon,
    label,
    alignTop = false,
    className = '',
    children,
}: {
    icon: IconDefinition
    label: string
    // Ícono arriba (a la altura del título) en vez de centrado: para valores de varias líneas.
    alignTop?: boolean
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 ${alignTop ? 'items-start' : 'items-center'} min-w-0 ${className}`}>
            <dt className="contents">
                <span className="row-span-2 flex">
                    <PlainIcon icon={icon} />
                </span>
                <span className="col-start-2 text-xs text-zinc-500">{label}</span>
            </dt>
            <dd className="col-start-2 min-w-0 break-words">{children}</dd>
        </div>
    )
}

// Dosis y Toma de un suplemento.
function LabeledValue({
    label,
    icon,
    className = '',
    children,
}: {
    label: string
    icon: IconDefinition
    className?: string
    children: React.ReactNode
}) {
    return (
        <IconStat icon={icon} label={label} className={className}>
            <span className="text-xs text-zinc-900">{children}</span>
        </IconStat>
    )
}

// Columna de notas de un suplemento (efectos o consideraciones) con ícono a la izquierda del título; "—" sin notas.
function NoteColumn({ title, icon, notes }: { title: string; icon: IconDefinition; notes: string[] }) {
    return (
        <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3">
                <PlainIcon icon={icon} />
                <p className="text-xs font-semibold text-zinc-500">{title}</p>
            </div>
            {/* pl-7 = ancho del ícono (h-4 w-4) + gap-3: la viñeta (list-inside) queda en el mismo eje que el título */}
            {notes.length > 0 ? (
                <ul className="list-disc list-inside pl-7 text-xs text-zinc-900">
                    {notes.map((note) => (
                        <li key={note}>{note}</li>
                    ))}
                </ul>
            ) : (
                <p className="pl-7 text-xs text-zinc-900">{NO_DATA}</p>
            )}
        </div>
    )
}

// Los tres momentos de una sesión, en columnas separadas por líneas verticales (apiladas en móvil).
const ACTIVITY_MOMENTS: { key: 'preActivity' | 'duringActivity' | 'postActivity'; label: string; icon: IconDefinition; className: string }[] = [
    { key: 'preActivity', label: 'Antes de la actividad', icon: PRE_ACTIVITY_ICON, className: 'sm:pr-4' },
    { key: 'duringActivity', label: 'Durante la actividad', icon: DURING_ACTIVITY_ICON, className: `sm:px-4 ${DIVIDER_SM}` },
    { key: 'postActivity', label: 'Después de la actividad', icon: POST_ACTIVITY_ICON, className: `sm:pl-4 ${DIVIDER_SM}` },
]

// Card de una sesión deportiva, con el mismo lenguaje que Supplement: nombre con ícono en círculo; la estrategia
// destacada en un card interno; y antes / durante / después de la actividad en 3 columnas con ícono (las que no
// tienen dato muestran "—"; si ninguna tiene, la fila no se muestra).
function SportsRecommendation({ recommendation }: { recommendation: MyPlanSportsRecommendationDto }) {
    const session = recommendation.session ?? 'Sesión deportiva'
    const hasMoments = ACTIVITY_MOMENTS.some(({ key }) => recommendation[key])

    return (
        <section
            aria-label={session}
            className="w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-4 text-left text-sm text-zinc-700"
        >
            <div className="flex items-center gap-3">
                <IconCircle icon={SPORTS_SESSION_ICON} />
                <h3 className="font-semibold text-zinc-900">{session}</h3>
            </div>

            {recommendation.strategy && (
                <dl className="rounded-xl bg-zinc-50 p-3">
                    <IconStat icon={STRATEGY_ICON} label="Estrategia" alignTop>
                        <span className="text-xs text-zinc-900">{recommendation.strategy}</span>
                    </IconStat>
                </dl>
            )}

            {hasMoments && (
                <dl aria-label={`Momentos de ${session}`} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0">
                    {ACTIVITY_MOMENTS.map(({ key, label, icon, className }) => (
                        <IconStat key={key} icon={icon} label={label} alignTop className={className}>
                            <span className="text-xs text-zinc-900">{recommendation[key] ?? NO_DATA}</span>
                        </IconStat>
                    ))}
                </dl>
            )}
        </section>
    )
}
