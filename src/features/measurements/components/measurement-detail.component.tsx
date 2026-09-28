//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - measurements
import { MeasurementDetailDto, MeasurementResultDto } from '../dtos/measurement.dto'
import {
    INDICATOR_LABELS,
    METHOD_LABELS,
    RAW_FIELDS,
    RAW_SECTION_TITLES,
    levelLabel,
    originLabel,
} from '../labels'
import { formatDate, bmiClassificationLabel } from '../../panel/format'

interface MeasurementDetailProps {
    measurement: MeasurementDetailDto
}

// Detalle de solo lectura de una medición (GET /me/measurements/:id, HU-CLI-04): valores
// registrados por sección y resultados guardados. La interpretación por rangos (con su gráfico)
// llega con las fórmulas de measurement_results.
export function MeasurementDetail({ measurement }: MeasurementDetailProps) {
    const { measurementId, measurementNumber, measuredAt, level, origin, consultationId, consultationNumber, editable, raw, results } =
        measurement
    const sections = (Object.keys(RAW_FIELDS) as (keyof typeof RAW_FIELDS)[]).filter((section) => raw[section])

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Link href="/panel" className="self-start text-sm text-zinc-600 hover:text-zinc-900 underline">
                    ← Volver al panel
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-zinc-900">Medición N°{measurementNumber}</h1>
                    {editable && (
                        <Link
                            href={`/panel/mediciones/${measurementId}/editar`}
                            className="btn secondary-btn h-10! px-6 no-underline"
                        >
                            Editar medición
                        </Link>
                    )}
                </div>
                <p className="text-zinc-500">
                    {formatDate(measuredAt)} · {levelLabel(level)} ·{' '}
                    {consultationId ? (
                        <Link href={`/panel/consultas/${consultationId}`} className="underline hover:text-zinc-900">
                            {originLabel(origin, consultationNumber)}
                        </Link>
                    ) : (
                        originLabel(origin, consultationNumber)
                    )}
                </p>
            </div>

            {sections.map((section) => (
                <Section key={section} title={RAW_SECTION_TITLES[section]}>
                    <dl className="w-full flex flex-col divide-y divide-zinc-200">
                        {Object.entries(RAW_FIELDS[section])
                            .filter(([field]) => raw[section]![field] != null)
                            .map(([field, { label, unit }]) => (
                                <div key={field} className="flex items-baseline justify-between gap-4 py-2">
                                    <dt className="text-sm text-zinc-500">{label}</dt>
                                    <dd className="text-zinc-900 font-medium text-right">{`${raw[section]![field]} ${unit}`}</dd>
                                </div>
                            ))}
                    </dl>
                </Section>
            ))}

            <Section title="Resultados">
                {results.length > 0 ? (
                    <dl className="w-full flex flex-col divide-y divide-zinc-200">
                        {results.map((result) => (
                            <ResultRow key={result.indicator} result={result} />
                        ))}
                    </dl>
                ) : (
                    <p className="text-zinc-500 text-center">
                        Los resultados interpretados estarán disponibles próximamente.
                    </p>
                )}
            </Section>
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

function ResultRow({ result }: { result: MeasurementResultDto }) {
    const label = INDICATOR_LABELS[result.indicator] ?? result.indicator
    const value = [result.value, result.unit].filter((part) => part != null).join(' ')
    const details = [
        result.classification && bmiClassificationLabel(result.classification),
        result.method && (METHOD_LABELS[result.method] ?? result.method),
    ].filter(Boolean)

    return (
        <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="text-zinc-900 font-medium text-right">
                {value}
                {details.length > 0 && <span className="text-zinc-500 font-normal"> ({details.join(' · ')})</span>}
            </dd>
        </div>
    )
}
