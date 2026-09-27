//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { ConsultationSummaryDto } from '../dtos/consultation-summary.dto'
import { formatDate } from '../format'
import { PlanStatusBadge } from './plan-status-badge.component'
import { IntakeSummary } from './intake-summary.component'

interface ConsultationsListProps {
    consultations: ConsultationSummaryDto[]
}

// Tarjeta 2 del panel: historial de consultas, más reciente primero (GET /me/consultations,
// HU-CLI-01). Cada ítem abre su detalle (/panel/consultas/[id], HU-CLI-02); las no pagadas
// ofrecen además retomar el pago.
export function ConsultationsList({ consultations }: ConsultationsListProps) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title="Mis consultas" />
            </SubsectionHead>
            <SubsectionBody>
                {consultations.length > 0 ? (
                    <ul className="w-full flex flex-col gap-4">
                        {consultations.map((consultation) => (
                            <ConsultationItem key={consultation.consultationId} consultation={consultation} />
                        ))}
                    </ul>
                ) : (
                    <div className="w-full flex flex-col items-center gap-3">
                        <p className="text-zinc-500 text-center">Todavía no tienes consultas nutricionales.</p>
                        <Link href="/consulta/inicio" className="btn primary-btn h-10! px-6 no-underline">
                            Iniciar una consulta
                        </Link>
                    </div>
                )}
            </SubsectionBody>
        </Card>
    )
}

function ConsultationItem({ consultation }: { consultation: ConsultationSummaryDto }) {
    const { consultationId, consultationNumber, consultationDate, mainGoal, planStatus, orderId, plan } = consultation

    return (
        <li
            aria-label={`Consulta N°${consultationNumber}`}
            className="relative w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3 text-left hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
        >
            {/* "stretched link": todo el ítem es clickeable sin anidar enlaces */}
            <Link
                href={`/panel/consultas/${consultationId}`}
                aria-label={`Ver consulta N°${consultationNumber}`}
                className="absolute inset-0 rounded-2xl"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="font-semibold text-zinc-900">Consulta N°{consultationNumber}</p>
                    <p className="text-sm text-zinc-500">{formatDate(consultationDate)}</p>
                </div>
                <PlanStatusBadge status={planStatus} />
            </div>

            {/* objetivo, régimen y macros en un solo bloque: mismo espaciado y estilo etiqueta/valor */}
            <div className="flex flex-col gap-1 text-sm text-zinc-700">
                <p>
                    <span className="text-zinc-500">Objetivo: </span>
                    {mainGoal ?? 'Sin objetivo registrado'}
                </p>
                {plan && (
                    <>
                        <p>
                            <span className="text-zinc-500">Régimen: </span>
                            {plan.dietRegimen}
                        </p>
                        <IntakeSummary plan={plan} />
                    </>
                )}
            </div>

            {orderId && planStatus === 'awaiting_payment' && (
                <Link
                    href={`/pago/${orderId}`}
                    className="btn primary-btn h-10! relative z-10 self-start px-6 no-underline"
                >
                    Pagar consulta
                </Link>
            )}
        </li>
    )
}
