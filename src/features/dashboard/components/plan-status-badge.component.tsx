//features - dashboard
import { ConsultationPlanStatus } from '../dtos/consultation-summary.dto'

// Solo los estados que requieren atención llevan tag: un plan listo no se marca.
const STATUS_BADGE: Partial<Record<ConsultationPlanStatus, { label: string; className: string }>> = {
    awaiting_payment: { label: 'Por pagar', className: 'bg-amber-100 text-amber-800' },
    payment_rejected: { label: 'Pago rechazado', className: 'bg-red-100 text-red-800' },
    generating: { label: 'Generando', className: 'bg-sky-100 text-sky-800' },
    error: { label: 'Error', className: 'bg-red-100 text-red-800' },
}

export function PlanStatusBadge({ status }: { status: ConsultationPlanStatus | null }) {
    const badge = status ? STATUS_BADGE[status] : undefined
    if (!badge) return null
    return (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
    )
}
