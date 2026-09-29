//next
import Link from 'next/link'
//shared
import { PlanFileCard } from '@/shared'
//features - dashboard
import { MyPlanDetailDto } from '../dtos/my-plan.dto'
import { formatDate } from '../format'
import { PlanOverviewCard } from './plan-overview-card.component'
import { PlanTypeBadge } from './plan-type-badge.component'
import { DetailSection } from './detail-section.component'
import { GeneratedPlanSections } from './generated-plan-sections.component'

interface PlanDetailProps {
    plan: MyPlanDetailDto
}

// Detalle de solo lectura de un plan del usuario (GET /me/plans/:orderId, HU-PLN-05). "← Volver a mis planes"
// en su propia fila y, debajo, el encabezado en dos columnas: a la izquierda (60 %) título, fecha de compra y PlanOverviewCard (objetivo, régimen, duración y
// macronutrientes); a la derecha (40 %) la card del PDF (miniatura + descarga). Debajo, la
// información guardada del plan (personalizado: requerimientos vs ingesta, tiempos de comida,
// suplementación y recomendaciones deportivas; estándar: descripción).
export function PlanDetail({ plan }: PlanDetailProps) {
    const { type, name, purchasedAt, pdfUrl, thumbnailUrl, generated, predefined } = plan

    return (
        <div className="w-full flex flex-col gap-6">
            {/* fila propia: las dos columnas del encabezado (y la card del PDF) empiezan debajo */}
            <Link href="/planes" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                ← Volver a mis planes
            </Link>

            <div className="w-full flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-full md:w-[60%] flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-zinc-900">{name}</h1>
                            <PlanTypeBadge type={type} />
                        </div>
                        <p className="text-zinc-500">Comprado el {formatDate(purchasedAt)}</p>
                    </div>

                    <PlanOverviewCard plan={plan} />
                </div>

                <div className="w-full md:w-[40%]">
                    <PlanFileCard pdfUrl={pdfUrl} thumbnailUrl={thumbnailUrl} />
                </div>
            </div>

            {type === 'PREDEFINED' && predefined && (
                <DetailSection title="Descripción">
                    <p className="w-full text-left text-zinc-700">{predefined.description}</p>
                </DetailSection>
            )}

            {type === 'GENERATED' &&
                (generated ? (
                    <GeneratedPlanSections plan={generated} />
                ) : (
                    <DetailSection title="Detalle del plan">
                        <p className="text-zinc-500 text-center">
                            El detalle de este plan no está disponible. Puedes descargar el PDF completo.
                        </p>
                    </DetailSection>
                ))}
        </div>
    )
}
