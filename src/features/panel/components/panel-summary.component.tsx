//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - panel
import { PanelSummaryDto } from '../dtos/panel-summary.dto'
import { NO_DATA, INTAKE_FIELDS, formatDate, bmiClassificationLabel } from '../format'

interface PanelSummaryProps {
    summary: PanelSummaryDto
}

// Tarjeta 1 del panel: resumen de la situación actual (GET /me/summary, HU-IDN-06).
export function PanelSummary({ summary }: PanelSummaryProps) {
    const plan = summary.nutritionalPlan
    const measurement = summary.lastMeasurement

    const fullName =
        [summary.firstName, summary.middleName, summary.paternalLastName, summary.maternalLastName]
            .filter(Boolean)
            .join(' ') || 'Sin datos'

    const bmi =
        measurement?.bmi != null
            ? [
                  measurement.bmi.toFixed(1),
                  measurement.bmiClassification && `(${bmiClassificationLabel(measurement.bmiClassification)})`,
              ]
                  .filter(Boolean)
                  .join(' ')
            : NO_DATA

    // Una fila por campo, en el orden en que se muestran.
    const infoRows: { label: string; value: string }[] = [
        { label: 'Nombre completo', value: fullName },
        { label: 'Edad', value: summary.age?.toString() ?? NO_DATA },
        {
            label: 'Fecha última consulta',
            value: summary.lastConsultationDate ? formatDate(summary.lastConsultationDate) : NO_DATA,
        },
        { label: 'Objetivo', value: summary.goal ?? 'Aún no definido' },
        { label: 'Régimen', value: plan?.dietRegimen ?? NO_DATA },
        ...INTAKE_FIELDS.map(({ key, label, unit }) => ({
            label,
            value: plan ? `${plan[key]} ${unit}` : NO_DATA,
        })),
        { label: 'Fecha última medición', value: measurement ? formatDate(measurement.measuredAt) : NO_DATA },
        { label: 'Peso', value: measurement?.weight != null ? `${measurement.weight} kg` : NO_DATA },
        { label: 'IMC', value: bmi },
        {
            label: '% grasa',
            value: measurement?.bfPercentage != null ? `${measurement.bfPercentage} %` : NO_DATA,
        },
    ]

    const isEmpty = !summary.lastConsultationDate && !measurement

    return (
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
                {isEmpty && (
                    <div className="w-full flex flex-col items-center gap-3 mt-6">
                        <p className="text-zinc-500 text-center">
                            Aún no tienes consultas ni mediciones registradas.
                        </p>
                        <Link href="/consulta/inicio" className="btn primary-btn h-10! px-6 no-underline">
                            Iniciar una consulta
                        </Link>
                    </div>
                )}
            </SubsectionBody>
        </Card>
    )
}
