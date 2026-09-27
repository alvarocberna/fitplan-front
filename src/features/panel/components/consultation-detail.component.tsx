//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { ConsultationDetailDto, ConsultationMeasurementDto } from '../dtos/consultation-detail.dto'
import { NO_DATA, formatDate, bmiClassificationLabel } from '../format'
import { PlanStatusBadge } from './plan-status-badge.component'
import { IntakeSummary } from './intake-summary.component'

interface ConsultationDetailProps {
    consultation: ConsultationDetailDto
}

const LEVEL_LABELS: Record<NonNullable<ConsultationMeasurementDto['level']>, string> = {
    BASIC: 'Básica',
    ISAK_1: 'ISAK 1',
    BIOIMPEDANCE: 'Bioimpedancia',
}

// Detalle de solo lectura de una consulta (GET /me/consultations/:id, HU-CLI-02): objetivos,
// mediciones tomadas en la consulta y resumen del plan. Sin acciones de edición.
export function ConsultationDetail({ consultation }: ConsultationDetailProps) {
    const { consultationNumber, consultationDate, goals, planStatus, orderId, measurements, plan } = consultation

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Link href="/panel" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                    ← Volver al panel
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-zinc-900">Consulta N°{consultationNumber}</h1>
                    <PlanStatusBadge status={planStatus} />
                </div>
                <p className="text-zinc-500">{formatDate(consultationDate)}</p>
            </div>

            <Card widthInner="80%" variant="solid">
                <SubsectionHead>
                    <SubsectionTitle title="Objetivos" />
                </SubsectionHead>
                <SubsectionBody>
                    {goals.mainGoal || goals.secondaryGoals.length > 0 ? (
                        <div className="w-full flex flex-col gap-2 text-left text-zinc-700">
                            <p>
                                <span className="text-zinc-500">Objetivo principal: </span>
                                {goals.mainGoal ?? NO_DATA}
                            </p>
                            {goals.secondaryGoals.length > 0 && (
                                <div>
                                    <p className="text-zinc-500">Objetivos secundarios:</p>
                                    <ul className="list-disc pl-6">
                                        {goals.secondaryGoals.map((goal) => (
                                            <li key={goal}>{goal}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center">Sin objetivos registrados.</p>
                    )}
                </SubsectionBody>
            </Card>

            <Card widthInner="80%" variant="solid">
                <SubsectionHead>
                    <SubsectionTitle title="Mediciones" />
                </SubsectionHead>
                <SubsectionBody>
                    {measurements.length > 0 ? (
                        <div className="w-full flex flex-col gap-4">
                            {measurements.map((measurement) => (
                                <MeasurementRows key={measurement.measurementId} measurement={measurement} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center">No se registraron mediciones en esta consulta.</p>
                    )}
                </SubsectionBody>
            </Card>

            <Card widthInner="80%" variant="solid">
                <SubsectionHead>
                    <SubsectionTitle title="Plan nutricional" />
                </SubsectionHead>
                <SubsectionBody>
                    <PlanSection planStatus={planStatus} orderId={orderId} plan={plan} />
                </SubsectionBody>
            </Card>
        </div>
    )
}

function MeasurementRows({ measurement }: { measurement: ConsultationMeasurementDto }) {
    const { basic, results } = measurement
    const bmi =
        results?.bmi != null
            ? [results.bmi.toFixed(1), results.bmiClassification && `(${bmiClassificationLabel(results.bmiClassification)})`]
                  .filter(Boolean)
                  .join(' ')
            : NO_DATA

    const rows: { label: string; value: string }[] = [
        { label: 'Fecha', value: formatDate(measurement.measuredAt) },
        { label: 'Nivel', value: measurement.level ? LEVEL_LABELS[measurement.level] : NO_DATA },
        { label: 'Peso', value: basic ? `${basic.weight} kg` : NO_DATA },
        { label: 'Talla', value: basic ? `${basic.height} cm` : NO_DATA },
        ...(basic?.sittingHeight != null ? [{ label: 'Talla sentado', value: `${basic.sittingHeight} cm` }] : []),
        ...(basic?.armSpan != null ? [{ label: 'Envergadura', value: `${basic.armSpan} cm` }] : []),
        { label: 'IMC', value: bmi },
        { label: '% grasa', value: results?.bfPercentage != null ? `${results.bfPercentage} %` : NO_DATA },
    ]

    return (
        <dl
            aria-label={`Medición N°${measurement.measurementNumber}`}
            className="w-full flex flex-col divide-y divide-zinc-200"
        >
            {rows.map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="text-sm text-zinc-500">{label}</dt>
                    <dd className="text-zinc-900 font-medium text-right">{value}</dd>
                </div>
            ))}
        </dl>
    )
}

function PlanSection({
    planStatus,
    orderId,
    plan,
}: Pick<ConsultationDetailDto, 'planStatus' | 'orderId' | 'plan'>) {
    if (orderId && planStatus === 'awaiting_payment') {
        return (
            <div className="w-full flex flex-col items-center gap-3">
                <p className="text-zinc-500 text-center">Aún no has pagado esta consulta.</p>
                <Link href={`/pago/${orderId}`} className="btn primary-btn h-10! px-6 no-underline">
                    Pagar consulta
                </Link>
            </div>
        )
    }

    if (plan) {
        return (
            <div className="w-full flex flex-col gap-2 text-left text-zinc-700">
                <p>
                    <span className="text-zinc-500">Plan: </span>
                    {plan.planName}
                </p>
                <p>
                    <span className="text-zinc-500">Objetivo: </span>
                    {plan.goal}
                </p>
                <p>
                    <span className="text-zinc-500">Régimen: </span>
                    {plan.dietRegimen}
                </p>
                <IntakeSummary plan={plan} />
                {plan.pdfUrl ? (
                    // el backend firma la URL como attachment (Content-Disposition), que es lo que
                    // realmente fuerza la descarga: `download` solo se ignora en cross-origin
                    <a
                        href={plan.pdfUrl}
                        download
                        className="btn primary-btn h-10! self-start px-6 mt-2 no-underline"
                    >
                        Descargar plan
                    </a>
                ) : (
                    <p className="text-sm text-zinc-500 mt-2">El PDF del plan todavía no está disponible.</p>
                )}
            </div>
        )
    }

    const message =
        planStatus === 'generating'
            ? 'Tu plan se está generando.'
            : planStatus === 'error'
              ? 'Hubo un error al generar tu plan.'
              : 'Esta consulta no tiene un plan asociado.'

    return (
        <div className="w-full flex flex-col items-center gap-3">
            <p className="text-zinc-500 text-center">{message}</p>
            {orderId && (planStatus === 'generating' || planStatus === 'error') && (
                <Link href={`/ordenes/${orderId}`} className="text-sm text-zinc-600 hover:text-zinc-900 underline">
                    Ver estado del plan
                </Link>
            )}
        </div>
    )
}
