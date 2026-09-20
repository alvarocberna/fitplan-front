//shared
import { Card, PlanPreviewCard, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { PanelSummaryDto } from '../dtos/panel-summary.dto'
import { OrderSummaryDto } from '../../consultation/dtos/order.dto'

interface PanelSummaryProps {
    summary: PanelSummaryDto
    orders: OrderSummaryDto[]
}

const INTAKE_FIELDS: { key: keyof NonNullable<PanelSummaryDto['nutritionalPlan']>; label: string; unit: string }[] = [
    { key: 'calorieIntake', label: 'Calorías', unit: 'kcal' },
    { key: 'proteinIntake', label: 'Proteínas', unit: 'g' },
    { key: 'carbohydrateIntake', label: 'Carbohidratos', unit: 'g' },
    { key: 'lipidIntake', label: 'Lípidos', unit: 'g' },
]

export function PanelSummary({ summary, orders }: PanelSummaryProps) {
    return (
        <div className="w-full flex flex-col gap-6">
            <Card widthInner="80%">
                <SubsectionHead>
                    <SubsectionTitle title="Mi información" />
                </SubsectionHead>
                <SubsectionBody>
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-zinc-500">Nombre</p>
                            <p className="text-zinc-900 font-medium">
                                {[summary.firstName, summary.paternalLastName].filter(Boolean).join(' ') || 'Sin datos'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Edad</p>
                            <p className="text-zinc-900 font-medium">{summary.age ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Objetivo</p>
                            <p className="text-zinc-900 font-medium">{summary.goal ?? 'Aún no definido'}</p>
                        </div>
                    </div>
                </SubsectionBody>
            </Card>

            <Card widthInner="80%">
                <SubsectionHead>
                    <SubsectionTitle title="Último plan nutricional" />
                </SubsectionHead>
                <SubsectionBody>
                    {summary.nutritionalPlan ? (
                        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            {INTAKE_FIELDS.map(({ key, label, unit }) => (
                                <div key={key}>
                                    <p className="text-sm text-zinc-500">{label}</p>
                                    <p className="text-zinc-900 font-medium">
                                        {summary.nutritionalPlan![key]} {unit}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center">
                            Todavía no tienes un plan nutricional generado.
                        </p>
                    )}
                </SubsectionBody>
            </Card>

            <Card widthInner="80%">
                <SubsectionHead>
                    <SubsectionTitle title="Mis planes nutricionales" />
                </SubsectionHead>
                <SubsectionBody>
                    {orders.length > 0 ? (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
                            {orders.map((order) => (
                                <PlanPreviewCard
                                    key={order.orderId}
                                    pdfUrl={order.pdfUrl}
                                    thumbnailUrl={order.thumbnailUrl}
                                    creationDate={order.creationDate}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center">
                            Todavía no tienes ningún plan nutricional generado.
                        </p>
                    )}
                </SubsectionBody>
            </Card>
        </div>
    )
}
