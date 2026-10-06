//features - dashboard
import { MyPlanType } from '../dtos/my-plan.dto'

const TYPE_BADGE: Record<MyPlanType, { label: string; className: string }> = {
    GENERATED: { label: 'Personalizado', className: 'bg-emerald-100 text-emerald-800' },
    PREDEFINED: { label: 'Estándar', className: 'bg-zinc-100 text-zinc-700' },
}

// Tipo del plan: personalizado (generado a partir de una consulta) o estándar (catálogo).
export function PlanTypeBadge({ type }: { type: MyPlanType }) {
    const badge = TYPE_BADGE[type]
    return (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
    )
}
