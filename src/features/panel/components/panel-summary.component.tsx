//shared
import { Card, PlanPreviewCard, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { PanelSummaryDto } from '../dtos/panel-summary.dto'
import { OrderSummaryDto } from '../../consultation/dtos/order.dto'

interface PanelSummaryProps {
    summary: PanelSummaryDto
    orders: OrderSummaryDto[]
}

const INTAKE_FIELDS: {
    key: Exclude<keyof NonNullable<PanelSummaryDto['nutritionalPlan']>, 'dietRegimen'>
    label: string
    unit: string
}[] = [
    { key: 'calorieIntake', label: 'Calorías', unit: 'kcal' },
    { key: 'proteinIntake', label: 'Proteínas', unit: 'g' },
    { key: 'carbohydrateIntake', label: 'Carbohidratos', unit: 'g' },
    { key: 'lipidIntake', label: 'Lípidos', unit: 'g' },
]

const NO_DATA = '—'

export function PanelSummary({ summary, orders }: PanelSummaryProps) {
    const plan = summary.nutritionalPlan

    const fullName =
        [summary.firstName, summary.middleName, summary.paternalLastName, summary.maternalLastName]
            .filter(Boolean)
            .join(' ') || 'Sin datos'
    const lastConsultation = summary.lastConsultationDate
        ? new Date(summary.lastConsultationDate).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : NO_DATA

    // Una fila por campo, en el orden en que se muestran.
    const infoRows: { label: string; value: string }[] = [
        { label: 'Nombre completo', value: fullName },
        { label: 'Edad', value: summary.age?.toString() ?? NO_DATA },
        { label: 'Fecha última consulta', value: lastConsultation },
        { label: 'Objetivo', value: summary.goal ?? 'Aún no definido' },
        { label: 'Régimen', value: plan?.dietRegimen ?? NO_DATA },
        ...INTAKE_FIELDS.map(({ key, label, unit }) => ({
            label,
            value: plan ? `${plan[key]} ${unit}` : NO_DATA,
        })),
    ]

    return (
        <div className="w-full flex flex-col gap-6">
            <Card widthInner="80%" variant="solid">
                <SubsectionHead>
                    <SubsectionTitle title="Mi información" />
                </SubsectionHead>
                <SubsectionBody>
                    <dl className="w-full flex flex-col divide-y divide-zinc-200">
                        {infoRows.map(({ label, value }) => (
                            <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                                <dt className="text-sm text-zinc-500">{label}</dt>
                                <dd className="text-zinc-900 font-medium text-right">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </SubsectionBody>
            </Card>

            <Card widthInner="80%" variant="solid">
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
