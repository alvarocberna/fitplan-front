//next
import Link from 'next/link'
//shared
import { PlanFileCard } from '@/shared'
//features - dashboard
import { ConsultationDetailDto } from '../dtos/consultation-detail.dto'
import { MyPlanDetailDto } from '../dtos/my-plan.dto'
import { formatDate } from '../format'
import { PlanStatusBadge } from './plan-status-badge.component'
import { NO_MACROS, PlanOverviewCard, planMacrosOf } from './plan-overview-card.component'
import { MacroDistributionCard } from './macro-distribution-card.component'
import { DetailSection } from './detail-section.component'
import { GeneratedPlanSections } from './generated-plan-sections.component'
//features - measurements
import { MeasurementDetailDto } from '../../measurements/dtos/measurement.dto'
import { MeasurementDetail } from '../../measurements/components/measurement-detail.component'

interface ConsultationDetailProps {
    consultation: ConsultationDetailDto
    // Detalle del plan de la consulta (GET /me/plans/:orderId); null si todavía no está listo.
    plan: MyPlanDetailDto | null
    // Detalle de cada medición tomada en la consulta (GET /me/measurements/:id).
    measurements: MeasurementDetailDto[]
}

// Detalle de solo lectura de una consulta (GET /me/consultations/:id, HU-CLI-02), armado con las mismas
// cards que /inicio, /planes/[orderId] y /mediciones/[id]: datos del plan (ancho completo); PDF y
// distribución de macronutrientes (50/50); el detalle del plan personalizado; y las mediciones de la
// consulta. Sin plan listo, un aviso con su estado (por pagar, generando o con error).
export function ConsultationDetail({ consultation, plan, measurements }: ConsultationDetailProps) {
    const { consultationNumber, consultationDate, planStatus, orderId } = consultation

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Link href="/inicio" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                    ← Volver al inicio
                </Link>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-zinc-900">Consulta N°{consultationNumber}</h1>
                    <PlanStatusBadge status={planStatus} />
                </div>
                <p className="text-zinc-500">{formatDate(consultationDate)}</p>
            </div>

            {plan ? (
                <>
                    <PlanOverviewCard plan={plan} />
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        <PlanFileCard pdfUrl={plan.pdfUrl} thumbnailUrl={plan.thumbnailUrl} />
                        <MacroDistributionCard macros={planMacrosOf(plan) ?? NO_MACROS} />
                    </div>
                    {plan.generated ? (
                        <GeneratedPlanSections plan={plan.generated} />
                    ) : (
                        <DetailSection title="Detalle del plan">
                            <p className="text-zinc-500 text-center">
                                El detalle de este plan no está disponible. Puedes descargar el PDF completo.
                            </p>
                        </DetailSection>
                    )}
                </>
            ) : (
                <DetailSection title="Plan nutricional">
                    <PlanStatusNotice planStatus={planStatus} orderId={orderId} />
                </DetailSection>
            )}

            <section aria-label="Mediciones" className="w-full flex flex-col gap-6">
                <h2 className="text-xl font-bold text-zinc-900">Mediciones</h2>
                {measurements.length > 0 ? (
                    measurements.map((measurement) => (
                        <MeasurementDetail key={measurement.measurementId} measurement={measurement} embedded />
                    ))
                ) : (
                    <p className="text-zinc-500">No se registraron mediciones en esta consulta.</p>
                )}
            </section>
        </div>
    )
}

// Consulta sin plan listo: pagar si falta el pago; si no, el estado de la generación.
function PlanStatusNotice({ planStatus, orderId }: Pick<ConsultationDetailDto, 'planStatus' | 'orderId'>) {
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
