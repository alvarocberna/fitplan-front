//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - measurements
import { MeasurementDetailDto } from '../dtos/measurement.dto'
import { METHOD_LABELS, levelLabel, originLabel } from '../labels'
import {
    bodyCompositionBars,
    bodyCompositionPie,
    bodyCompositionRows,
    otherItems,
    resultValue,
} from '../measurement-detail-data'
import { BmiScale } from './bmi-scale.component'
import { BodyCompositionCharts } from './body-composition-charts.component'
import { NO_DATA, formatDate, bmiClassificationLabel } from '../../dashboard/format'

interface MeasurementDetailProps {
    measurement: MeasurementDetailDto
    // Dentro de otra página (detalle de consulta): encabezado compacto — "Medición N°X", enlace a
    // /mediciones/[id] y "fecha · nivel" — sin "Volver", sin "Editar" y sin el enlace de origen a la consulta.
    embedded?: boolean
}

// Detalle de solo lectura de una medición (GET /me/measurements/:id, HU-CLI-04). Datos y resultados
// van juntos, por tema: "Peso e IMC" (con la escala del IMC), "Composición corporal" (barras en kg y
// torta en %, solo si la medición tiene componentes) y "Otras mediciones" (pliegues, perímetros,
// diámetros e índices, solo si hay). Se usa en /mediciones/[id] y, con `embedded`, en /inicio/consultas/[id].
export function MeasurementDetail({ measurement, embedded = false }: MeasurementDetailProps) {
    const { measurementId, measurementNumber, measuredAt, level, origin, consultationId, consultationNumber, editable, raw, results } =
        measurement

    const weight = raw.basic?.weight
    const height = raw.basic?.height
    const bmi = resultValue(results, 'BMI')
    const compositionRows = bodyCompositionRows(results)
    const others = otherItems(measurement)

    return (
        <div className="w-full flex flex-col gap-6">
            {embedded ? (
                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-xl font-semibold text-zinc-900">Medición N°{measurementNumber}</h2>
                        <Link
                            href={`/mediciones/${measurementId}`}
                            className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                        >
                            Ver medición
                        </Link>
                    </div>
                    <p className="text-zinc-500">
                        {formatDate(measuredAt)} · {levelLabel(level)}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <Link href="/mediciones" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                        ← Volver a mis mediciones
                    </Link>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h1 className="text-2xl font-bold text-zinc-900">Medición N°{measurementNumber}</h1>
                        {editable && (
                            <Link
                                href={`/mediciones/${measurementId}/editar`}
                                className="btn secondary-btn h-10! px-6 no-underline"
                            >
                                Editar medición
                            </Link>
                        )}
                    </div>
                    <p className="text-zinc-500">
                        {formatDate(measuredAt)} · {levelLabel(level)} ·{' '}
                        {consultationId ? (
                            <Link href={`/inicio/consultas/${consultationId}`} className="underline hover:text-zinc-900">
                                {originLabel(origin, consultationNumber)}
                            </Link>
                        ) : (
                            originLabel(origin, consultationNumber)
                        )}
                    </p>
                </div>
            )}

            <Section title="Peso e IMC">
                <div className="w-full flex flex-col gap-6">
                    <dl className="grid grid-cols-3 gap-3">
                        <Stat label="Peso" value={weight != null ? `${weight} kg` : NO_DATA} />
                        <Stat label="Talla" value={height != null ? `${height} cm` : NO_DATA} />
                        <Stat
                            label="IMC"
                            value={bmi ? String(bmi.value) : NO_DATA}
                            detail={bmi?.classification ? bmiClassificationLabel(bmi.classification) : undefined}
                        />
                    </dl>
                    {bmi ? (
                        <BmiScale bmi={bmi.value} classification={bmi.classification} />
                    ) : (
                        <p className="text-zinc-500 text-center">
                            Los resultados interpretados estarán disponibles próximamente.
                        </p>
                    )}
                </div>
            </Section>

            {compositionRows.length > 0 && (
                <Section title="Composición corporal">
                    <div className="w-full flex flex-col gap-6">
                        <BodyCompositionCharts bars={bodyCompositionBars(results)} slices={bodyCompositionPie(results)} />
                        <dl className="w-full flex flex-col divide-y divide-zinc-200">
                            {compositionRows.map(({ component, label, kg, percentage, method }) => (
                                <Row
                                    key={component}
                                    label={label}
                                    value={[kg != null && `${kg} kg`, percentage != null && `${percentage} %`].filter(Boolean).join(' · ')}
                                    detail={method ? (METHOD_LABELS[method] ?? method) : undefined}
                                />
                            ))}
                        </dl>
                    </div>
                </Section>
            )}

            {others.length > 0 && (
                <Section title="Otras mediciones">
                    <div className="w-full flex flex-col gap-4">
                        {others.map(({ title, rows }) => (
                            <div key={title} className="flex flex-col gap-1">
                                <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
                                <dl className="w-full flex flex-col divide-y divide-zinc-200">
                                    {rows.map(({ key, label, value }) => (
                                        <Row key={key} label={label} value={value} />
                                    ))}
                                </dl>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title={title} />
            </SubsectionHead>
            <SubsectionBody>{children}</SubsectionBody>
        </Card>
    )
}

// Dato destacado de "Peso e IMC".
function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
    return (
        <div className="flex flex-col items-center gap-1 rounded-xl bg-zinc-50 border border-zinc-200 py-3 px-2 text-center">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
            <dd className="text-xl font-semibold text-zinc-900">{value}</dd>
            {detail && <dd className="text-xs text-zinc-600">{detail}</dd>}
        </div>
    )
}

function Row({ label, value, detail }: { label: string; value: string; detail?: string }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="text-zinc-900 font-medium text-right">
                {value}
                {detail && <span className="text-zinc-500 font-normal"> ({detail})</span>}
            </dd>
        </div>
    )
}
