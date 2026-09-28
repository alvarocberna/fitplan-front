//next
import Link from 'next/link'
//shared
import { Card, PlanPreviewCard, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
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
import { NutritionalPlanSummary } from './nutritional-plan-summary.component'
import { PlanTypeBadge } from './plan-type-badge.component'

interface PlanDetailProps {
    plan: MyPlanDetailDto
}

// Detalle de solo lectura de un plan del usuario (GET /me/plans/:orderId, HU-PLN-05): encabezado con
// miniatura y descarga del PDF, y la información del plan guardada en la base (personalizado:
// resumen, requerimientos vs ingesta, tiempos de comida, suplementación y recomendaciones
// deportivas; estándar: descripción y resumen del producto).
export function PlanDetail({ plan }: PlanDetailProps) {
    const { type, name, purchasedAt, pdfUrl, thumbnailUrl, generated, predefined } = plan

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="w-full flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1 flex flex-col gap-2">
                    <Link href="/panel" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                        ← Volver al panel
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-zinc-900">{name}</h1>
                        <PlanTypeBadge type={type} />
                    </div>
                    <p className="text-zinc-500">Comprado el {formatDate(purchasedAt)}</p>
                </div>
                <div className="w-full md:w-[220px] shrink-0">
                    <PlanPreviewCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} downloadLabel="Descargar plan" />
                </div>
            </div>

            {type === 'PREDEFINED' && predefined && (
                <>
                    <Section title="Descripción">
                        <p className="w-full text-left text-zinc-700">{predefined.description}</p>
                    </Section>
                    <Section title="Resumen">
                        <NutritionalPlanSummary
                            goal={predefined.summary?.goal ?? null}
                            dietRegimen={predefined.summary?.dietRegimen ?? null}
                            intake={predefined.summary}
                        />
                    </Section>
                </>
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
            <Section title="Resumen">
                <NutritionalPlanSummary
                    goal={plan.goal}
                    dietRegimen={plan.dietRegimen}
                    intake={{
                        calorieIntake: plan.intake.calories,
                        proteinIntake: plan.intake.protein,
                        carbohydrateIntake: plan.intake.carbohydrate,
                        lipidIntake: plan.intake.fat,
                    }}
                />
            </Section>

            <Section title="Requerimientos vs ingesta">
                <RequirementsTable requirements={plan.requirements} intake={plan.intake} />
            </Section>

            <Section title="Tiempos de comida">
                {plan.mealTimes.length > 0 ? (
                    <div className="w-full flex flex-col gap-4">
                        {plan.mealTimes.map((mealTime, index) => (
                            <MealTime key={`${mealTime.time}-${index}`} mealTime={mealTime} />
                        ))}
                    </div>
                ) : (
                    <p className="text-zinc-500 text-center">Este plan no tiene tiempos de comida registrados.</p>
                )}
            </Section>

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

function RequirementsTable({ requirements, intake }: { requirements: MacrosDto; intake: MacrosDto }) {
    return (
        <table className="w-full text-sm text-left">
            <thead>
                <tr className="text-zinc-500 border-b border-zinc-200">
                    <th className="py-2 font-medium"></th>
                    <th className="py-2 font-medium text-right">Requerimiento</th>
                    <th className="py-2 font-medium text-right">Ingesta del plan</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
                {MACRO_ROWS.map(({ key, label, unit }) => (
                    <tr key={key}>
                        <th scope="row" className="py-2 font-normal text-zinc-500">{label}</th>
                        <td className="py-2 text-right text-zinc-900">{`${requirements[key]} ${unit}`}</td>
                        <td className="py-2 text-right text-zinc-900">{`${intake[key]} ${unit}`}</td>
                    </tr>
                ))}
            </tbody>
        </table>
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
    const portions = Object.keys(PORTION_GROUP_LABELS).filter(
        (group) => mealTime.portions[group as keyof MyPlanMealTimeDto['portions']] != null,
    )

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
                                {PORTION_GROUP_LABELS[group]}:{' '}
                                {mealTime.portions[group as keyof MyPlanMealTimeDto['portions']]}
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
