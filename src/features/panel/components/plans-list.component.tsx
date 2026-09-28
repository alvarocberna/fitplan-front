//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { MyPlanSummaryDto } from '../dtos/my-plan.dto'
import { NO_DATA, formatDate } from '../format'
import { IntakeSummary } from './intake-summary.component'
import { PlanTypeBadge } from './plan-type-badge.component'

interface PlansListProps {
    plans: MyPlanSummaryDto[]
}

// Tarjeta 3 del panel: planes pagados y listos del usuario (GET /me/plans, HU-PLN-04), del más nuevo
// al más antiguo. Cada fila resume el plan y ofrece ver su detalle (/panel/planes/[orderId],
// HU-PLN-05) o descargar el PDF.
export function PlansList({ plans }: PlansListProps) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title="Mis planes nutricionales" />
            </SubsectionHead>
            <SubsectionBody>
                {plans.length > 0 ? (
                    <ul className="w-full flex flex-col gap-4">
                        {plans.map((plan) => (
                            <PlanRow key={plan.orderId} plan={plan} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-zinc-500 text-center">
                        Todavía no tienes ningún plan nutricional generado.
                    </p>
                )}
            </SubsectionBody>
        </Card>
    )
}

function PlanRow({ plan }: { plan: MyPlanSummaryDto }) {
    const { orderId, type, name, purchasedAt, pdfUrl, summary } = plan

    return (
        <li
            aria-label={name}
            className="w-full border border-zinc-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 text-left"
        >
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900">{name}</p>
                    <PlanTypeBadge type={type} />
                </div>
                <div className="flex flex-col gap-1 text-sm text-zinc-700">
                    <p>
                        <span className="text-zinc-500">Fecha: </span>
                        {formatDate(purchasedAt)}
                    </p>
                    <p>
                        <span className="text-zinc-500">Régimen: </span>
                        {summary?.dietRegimen ?? NO_DATA}
                    </p>
                    {summary ? (
                        <IntakeSummary plan={summary} />
                    ) : (
                        <p>
                            <span className="text-zinc-500">Calorías y macros: </span>
                            {NO_DATA}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 shrink-0">
                <Link
                    href={`/panel/planes/${orderId}`}
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
