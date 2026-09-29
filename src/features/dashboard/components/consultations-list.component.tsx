//next
import Link from 'next/link'
//features - dashboard
import { ConsultationSummaryDto } from '../dtos/consultation-summary.dto'
import { NO_DATA, formatDate } from '../format'
import { ICON_CIRCLE_STYLE } from '../plan-icons'
import { DIVIDER_MD } from '../plan-dividers'
import { MacrosRow } from './macros-row.component'
import { PlanStatusBadge } from './plan-status-badge.component'

interface ConsultationsListProps {
    consultations: ConsultationSummaryDto[]
}

// "Mis consultas" de inicio: historial de consultas, más reciente primero (GET /me/consultations,
// HU-CLI-01), con la misma estructura de card que MyPlansList (/planes): fecha y número de la consulta;
// "Consulta nutricional" + estado, objetivo, régimen y macronutrientes del plan; y "Ver detalle"
// (/inicio/consultas/[id], HU-CLI-02), que cubre todo el card. Las no pagadas ofrecen además retomar el pago.
export function ConsultationsList({ consultations }: ConsultationsListProps) {
    return (
        <section aria-label="Mis consultas" className="w-full flex flex-col gap-4">
            <h2 className="text-xl font-bold text-zinc-900 text-left">Mis consultas</h2>
            {consultations.length > 0 ? (
                <ul className="w-full flex flex-col gap-4">
                    {consultations.map((consultation) => (
                        <ConsultationCard key={consultation.consultationId} consultation={consultation} />
                    ))}
                </ul>
            ) : (
                <div className="w-full flex flex-col items-center gap-3 py-6">
                    <p className="text-zinc-500 text-center">Todavía no tienes consultas nutricionales.</p>
                    <Link href="/consulta/inicio" className="btn primary-btn h-10! px-6 no-underline">
                        Iniciar una consulta
                    </Link>
                </div>
            )}
        </section>
    )
}

function ConsultationCard({ consultation }: { consultation: ConsultationSummaryDto }) {
    const { consultationId, consultationNumber, consultationDate, mainGoal, planStatus, orderId, plan } = consultation

    return (
        <li
            aria-label={`Consulta N°${consultationNumber}`}
            className="relative w-full bg-white border border-white rounded-[12px] shadow-lg p-4 grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] gap-4 text-left hover:shadow-xl transition-shadow"
        >
            {/* "stretched link" a nivel del card (no dentro de la col. 3: su `md:relative` lo encerraría): todo el
                card abre el detalle */}
            <Link
                href={`/inicio/consultas/${consultationId}`}
                aria-label={`Ver consulta N°${consultationNumber}`}
                className="absolute inset-0 rounded-[12px]"
            />

            {/* col. 1: fecha y número de la consulta, en el lugar del ícono de MyPlansList */}
            <div className="rounded-xl px-3 py-2 flex flex-col items-center justify-center self-start text-center" style={ICON_CIRCLE_STYLE}>
                <p className="text-sm font-semibold">{formatDate(consultationDate)}</p>
                <p className="text-xs text-zinc-600">Consulta N°{consultationNumber}</p>
            </div>

            {/* col. 2: título, objetivo, régimen y macronutrientes */}
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900">Consulta nutricional</p>
                    <PlanStatusBadge status={planStatus} />
                </div>
                <p className="text-sm text-zinc-700">
                    <span className="text-zinc-500">Objetivo: </span>
                    {mainGoal ?? 'Sin objetivo registrado'}
                </p>
                <p className="text-sm text-zinc-700">
                    <span className="text-zinc-500">Régimen: </span>
                    {plan?.dietRegimen ?? NO_DATA}
                </p>

                <hr className="my-2 border-zinc-200" />

                <MacrosRow values={plan} />
            </div>

            {/* col. 3: desde md, separada por una línea vertical, estirada al alto del card. Su `md:relative`
                (para la línea) la pinta sobre el enlace del card: `pointer-events-none` deja pasar el clic */}
            <div
                className={`col-span-2 md:col-span-1 flex flex-row md:flex-col md:justify-center gap-2 md:self-stretch md:pl-4 pointer-events-none ${DIVIDER_MD}`}
            >
                {/* solo visual: el clic lo recibe el enlace que cubre el card */}
                <span aria-hidden="true" className="btn primary-btn h-10! px-6">
                    Ver detalle
                </span>
                {orderId && planStatus === 'awaiting_payment' && (
                    // por encima del enlace que cubre el card
                    <Link href={`/pago/${orderId}`} className="btn secondary-btn h-10! relative z-10 pointer-events-auto px-6 no-underline">
                        Pagar consulta
                    </Link>
                )}
            </div>
        </li>
    )
}
