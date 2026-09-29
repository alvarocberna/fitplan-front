//next
import Link from 'next/link'
//icons
import { DocumentTextIcon } from '@heroicons/react/24/outline'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import {
    MacrosDto,
    MyGeneratedPlanDetailDto,
    MyPlanDetailDto,
    MyPlanMealTimeDto,
    MyPlanSupplementDto,
    MyPlanSportsRecommendationDto,
} from '../dtos/my-plan.dto'
import { MEAL_TIME_LABELS, NO_DATA, PORTION_GROUP_LABELS, formatDate } from '../format'
import { PlanOverviewCard } from './plan-overview-card.component'
import { PlanTypeBadge } from './plan-type-badge.component'

interface PlanDetailProps {
    plan: MyPlanDetailDto
}

// Detalle de solo lectura de un plan del usuario (GET /me/plans/:orderId, HU-PLN-05). Encabezado en dos
// columnas: a la izquierda (60 %) título, fecha de compra y PlanOverviewCard (objetivo, régimen, duración y
// macronutrientes); a la derecha (40 %) la card del PDF (miniatura + descarga). Debajo, la
// información guardada del plan (personalizado: requerimientos vs ingesta, tiempos de comida,
// suplementación y recomendaciones deportivas; estándar: descripción).
export function PlanDetail({ plan }: PlanDetailProps) {
    const { type, name, purchasedAt, pdfUrl, thumbnailUrl, generated, predefined } = plan

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-full md:w-[60%] flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Link href="/planes" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                            ← Volver a mis planes
                        </Link>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-zinc-900">{name}</h1>
                            <PlanTypeBadge type={type} />
                        </div>
                        <p className="text-zinc-500">Comprado el {formatDate(purchasedAt)}</p>
                    </div>

                    <PlanOverviewCard plan={plan} />
                </div>

                <div className="w-full md:w-[40%]">
                    <PlanFileCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} />
                </div>
            </div>

            {type === 'PREDEFINED' && predefined && (
                <Section title="Descripción">
                    <p className="w-full text-left text-zinc-700">{predefined.description}</p>
                </Section>
            )}

            {type === 'GENERATED' &&
                (generated ? (
                    <GeneratedPlanSections plan={generated} />
                ) : (
                    <Section title="Detalle del plan">
                        <p className="text-zinc-500 text-center">
                            El detalle de este plan no está disponible. Puedes descargar el PDF completo.
                        </p>
                    </Section>
                ))}
        </div>
    )
}

// Card del PDF en dos mitades iguales: miniatura de la página 1 a la izquierda (su alto sigue la proporción
// A4) y a la derecha "Plan nutricional", "PDF" y el botón de descarga. La descarga la fuerza el
// Content-Disposition de la URL firmada (el atributo `download` se ignora en cross-origin). Misma miniatura
// que PlanPreviewCard (shared), que sigue usándose en /ordenes/[id].
function PlanFileCard({ pdfUrl, thumbnailUrl }: { pdfUrl: string; thumbnailUrl: string | null }) {
    return (
        <section
            aria-label="Archivo del plan"
            className="w-full bg-white border border-white rounded-[12px] shadow-lg p-5 grid grid-cols-2 gap-4"
        >
            <div className="w-full aspect-[210/297] rounded-[8px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
                {thumbnailUrl ? (
                    // <img> plano y no next/image: la URL firmada cambia en cada request y el optimizador
                    // de Next la proxiaría/cachearía (contenido privado del usuario).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailUrl}
                        alt="Vista previa de tu plan nutricional"
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-zinc-400 p-2 text-center">
                        <DocumentTextIcon className="w-8 h-8" aria-hidden="true" />
                        <p className="text-[11px]">Vista previa no disponible</p>
                    </div>
                )}
            </div>
            {/* título, formato y botón alineados arriba, a la altura del borde superior de la miniatura */}
            <div className="min-w-0 flex flex-col gap-4 self-start">
                <div className="flex flex-col gap-1">
                    <p className="font-semibold text-zinc-900">Plan nutricional</p>
                    <p className="text-sm text-zinc-500">PDF</p>
                </div>
                <a
                    href={pdfUrl}
                    download
                    aria-label="Descargar plan nutricional"
                    // h-10! (important): .primary-btn de globals.css fija height:100% sin @layer
                    className="btn primary-btn h-10! w-full no-underline"
                >
                    Descargar plan
                </a>
            </div>
        </section>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title={title} />
            </SubsectionHead>
            <SubsectionBody>{children}</SubsectionBody>
        </Card>
    )
}

function GeneratedPlanSections({ plan }: { plan: MyGeneratedPlanDetailDto }) {
    return (
        <>
            {plan.mealTimes.length > 0 && (
                <Section title="Resumen del plan">
                    {/* tiempo, hora y porciones de cada tiempo de comida, uno debajo del otro */}
                    <ul className="w-full flex flex-col gap-4">
                        {plan.mealTimes.map((mealTime, index) => (
                            <MealTimeSummary key={`${mealTime.time}-${index}`} mealTime={mealTime} />
                        ))}
                    </ul>
                </Section>
            )}

            {/* La card "Tiempos de comida" (detalle con macros, ejemplos, equivalencias y comentarios, ver
                MealTime) está oculta por ahora. */}

            {plan.supplements.length > 0 && (
                <Section title="Suplementación">
                    <div className="w-full flex flex-col gap-4">
                        {plan.supplements.map((supplement) => (
                            <Supplement key={supplement.supplement} supplement={supplement} />
                        ))}
                    </div>
                </Section>
            )}

            {plan.sportsRecommendations.length > 0 && (
                <Section title="Recomendaciones deportivas">
                    <div className="w-full flex flex-col gap-4">
                        {plan.sportsRecommendations.map((recommendation, index) => (
                            <SportsRecommendation key={index} recommendation={recommendation} />
                        ))}
                    </div>
                </Section>
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

// Sub-card de "Resumen del plan": a la izquierda el tiempo de comida y debajo su hora; a la derecha las
// porciones de cada grupo con valor.
function MealTimeSummary({ mealTime }: { mealTime: MyPlanMealTimeDto }) {
    const label = MEAL_TIME_LABELS[mealTime.time] ?? mealTime.time
    const groups = portionGroupsOf(mealTime)

    return (
        <li
            aria-label={`Resumen de ${label}`}
            className="border border-zinc-200 rounded-2xl p-4 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 text-left text-sm"
        >
            <div className="flex flex-col gap-1">
                <p className="font-semibold text-zinc-900">{label}</p>
                <p className="text-zinc-500">{mealTime.hour ?? NO_DATA}</p>
            </div>
            {groups.length > 0 ? (
                <ul className="flex flex-col gap-1 text-zinc-700">
                    {groups.map((group) => (
                        <li key={group} className="flex justify-between gap-2">
                            <span>{PORTION_GROUP_LABELS[group]}</span>
                            <span className="font-semibold text-zinc-900">{mealTime.portions[group]}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-zinc-500">Sin porciones registradas</p>
            )}
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

function Supplement({ supplement }: { supplement: MyPlanSupplementDto }) {
    return (
        <section
            aria-label={supplement.supplement}
            className="w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-2 text-left text-sm text-zinc-700"
        >
            <h3 className="font-semibold text-zinc-900">{supplement.supplement}</h3>
            {/* `requirement` no trae unidad (g o mg según el suplemento): la dosis ya la incluye en el texto */}
            <p>
                <span className="text-zinc-500">Dosis: </span>
                {supplement.doseInstructions ?? NO_DATA}
            </p>
            <p>
                <span className="text-zinc-500">Toma: </span>
                {supplement.intakeInstructions ?? NO_DATA}
            </p>
            <p>{macrosLine(supplement.intake)}</p>
            <NoteList title="Efectos:" notes={supplement.effects} />
            <NoteList title="Consideraciones:" notes={supplement.considerations} />
        </section>
    )
}

const SPORTS_FIELDS: { key: keyof MyPlanSportsRecommendationDto; label: string }[] = [
    { key: 'strategy', label: 'Estrategia' },
    { key: 'preActivity', label: 'Antes de la actividad' },
    { key: 'duringActivity', label: 'Durante la actividad' },
    { key: 'postActivity', label: 'Después de la actividad' },
]

function SportsRecommendation({ recommendation }: { recommendation: MyPlanSportsRecommendationDto }) {
    return (
        <section className="w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-2 text-left text-sm text-zinc-700">
            <h3 className="font-semibold text-zinc-900">{recommendation.session ?? 'Sesión deportiva'}</h3>
            {SPORTS_FIELDS.filter(({ key }) => recommendation[key]).map(({ key, label }) => (
                <p key={key}>
                    <span className="text-zinc-500">{label}: </span>
                    {recommendation[key]}
                </p>
            ))}
        </section>
    )
}
