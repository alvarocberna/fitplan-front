//icons
import { UserIcon } from '@heroicons/react/24/outline'
//features - dashboard
import { DashboardSummaryDto } from '../dtos/dashboard-summary.dto'
import { NO_DATA } from '../format'
import { DIVIDER } from '../plan-dividers'
import { CardTitle } from './card-title.component'

interface PersonalInfoCardProps {
    summary: DashboardSummaryDto
}

// Card "Información personal" de /inicio (GET /me/summary, HU-IDN-06): ícono de usuario y título arriba;
// debajo, nombre completo y edad en la misma fila, separados por una línea vertical.
export function PersonalInfoCard({ summary }: PersonalInfoCardProps) {
    const fullName =
        [summary.firstName, summary.middleName, summary.paternalLastName, summary.maternalLastName]
            .filter(Boolean)
            .join(' ') || 'Sin datos'

    const rows = [
        { label: 'Nombre', value: fullName, className: 'pr-4' },
        { label: 'Edad', value: summary.age != null ? `${summary.age} años` : NO_DATA, className: `pl-4 ${DIVIDER}` },
    ]

    return (
        <section
            aria-label="Información personal"
            className="w-full bg-white border border-white rounded-[12px] shadow-lg p-5 flex flex-col gap-4"
        >
            <CardTitle icon={UserIcon} title="Información personal" />

            <dl className="grid grid-cols-2">
                {rows.map(({ label, value, className }) => (
                    <div key={label} className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
                        <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
                        <dd className="text-zinc-900 font-semibold break-words">{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
