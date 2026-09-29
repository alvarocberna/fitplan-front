//next
import Link from 'next/link'
//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//features - panel
import { MyPlanSummaryDto } from '../dtos/my-plan.dto'
import { NO_DATA, formatDate } from '../format'
import { ICON_CIRCLE_STYLE, PLAN_ICON } from '../plan-icons'
import { DIVIDER_MD } from '../plan-dividers'
import { MacrosRow } from './macros-row.component'
import { PlanTypeBadge } from './plan-type-badge.component'

interface MyPlansListProps {
    plans: MyPlanSummaryDto[]
}

// Lista de planes de la página /planes (GET /me/plans, HU-PLN-04), del más nuevo al más antiguo. Cada plan
// es un card de 3 columnas: ícono, información (título, fecha, régimen y macros con íconos) y los botones
// "Ver plan" (/planes/[orderId], HU-PLN-05) y "Descargar plan". El primero (el último plan) lleva una
// pestaña decorativa del color primario. Los cards van directo sobre el fondo de la página, sin card
// contenedor; el título lo pone la página.
export function MyPlansList({ plans }: MyPlansListProps) {
    if (plans.length === 0) {
        return <p className="text-zinc-500 text-center py-8">Todavía no tienes ningún plan nutricional generado.</p>
    }

    return (
        <ul className="w-full flex flex-col gap-4">
            {plans.map((plan, index) => (
                <PlanCard key={plan.orderId} plan={plan} latest={index === 0} />
            ))}
        </ul>
    )
}

function PlanCard({ plan, latest }: { plan: MyPlanSummaryDto; latest: boolean }) {
    const { orderId, type, name, purchasedAt, pdfUrl, summary } = plan

    return (
        <li
            aria-label={name}
            className="relative overflow-hidden w-full bg-white border border-white rounded-[12px] shadow-lg p-4 pl-6 grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] gap-4 text-left"
        >
            {latest && (
                <span
                    aria-hidden="true"
                    data-testid="latest-plan-tab"
                    className="absolute left-0 inset-y-0 w-1.5"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                />
            )}

            <span
                aria-hidden="true"
                className="h-14 w-14 rounded-xl flex items-center justify-center self-start"
                style={ICON_CIRCLE_STYLE}
            >
                <FontAwesomeIcon icon={PLAN_ICON} className="h-6 w-6" />
            </span>

            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900">{name}</p>
                    <PlanTypeBadge type={type} />
                </div>
                <p className="text-sm text-zinc-500">Comprado el {formatDate(purchasedAt)}</p>
                <p className="text-sm text-zinc-700">
                    <span className="text-zinc-500">Régimen: </span>
                    {summary?.dietRegimen ?? NO_DATA}
                </p>

                <hr className="my-2 border-zinc-200" />

                <MacrosRow values={summary} />
            </div>

            {/* desde md, separada de la información por una línea vertical; se estira al alto del card para que
                la línea lo acompañe, con los botones centrados */}
            <div
                className={`col-span-2 md:col-span-1 flex flex-row md:flex-col md:justify-center gap-2 md:self-stretch md:pl-4 ${DIVIDER_MD}`}
            >
                <Link
                    href={`/planes/${orderId}`}
                    aria-label={`Ver plan ${name}`}
                    className="btn primary-btn h-10! px-6 no-underline"
                >
                    Ver plan
                </Link>
                {/* el backend firma la URL como attachment (Content-Disposition), que es lo que
                    realmente fuerza la descarga: `download` solo se ignora en cross-origin */}
                <a
                    href={pdfUrl}
                    download
                    aria-label={`Descargar plan ${name}`}
                    className="btn secondary-btn h-10! px-6 no-underline"
                >
                    Descargar plan
                </a>
            </div>
        </li>
    )
}
