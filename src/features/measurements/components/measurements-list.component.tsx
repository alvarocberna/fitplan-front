//next
import Link from 'next/link'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - measurements
import { MeasurementSummaryDto } from '../dtos/measurement.dto'
import { levelLabel, originLabel } from '../labels'
import { NO_DATA, formatDate } from '../../panel/format'

interface MeasurementsListProps {
    measurements: MeasurementSummaryDto[]
}

// Card de /mediciones: mediciones del historial clínico (GET /me/measurements, HU-CLI-03), de
// consulta y registradas por el usuario, más reciente primero. Cada fila abre su detalle
// (/mediciones/[id], HU-CLI-04). El gráfico de evolución es MeasurementsChart.
export function MeasurementsList({ measurements }: MeasurementsListProps) {
    return (
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title="Mis mediciones" />
            </SubsectionHead>
            <SubsectionBody>
                <div className="w-full flex flex-col gap-4">
                    <Link
                        href="/mediciones/nueva"
                        // w-auto!/h-10!: .primary-btn fija width/height al 100% sin @layer
                        className="btn primary-btn h-10! w-auto! self-end px-6 no-underline"
                    >
                        Registrar medición
                    </Link>

                    {measurements.length > 0 ? (
                        <ul className="w-full flex flex-col gap-4">
                            {measurements.map((measurement) => (
                                <MeasurementRow key={measurement.measurementId} measurement={measurement} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500 text-center">
                            Todavía no tienes mediciones. Registra la primera para seguir tu progreso.
                        </p>
                    )}
                </div>
            </SubsectionBody>
        </Card>
    )
}

function MeasurementRow({ measurement }: { measurement: MeasurementSummaryDto }) {
    const { measurementId, measurementNumber, measuredAt, level, origin, consultationNumber, weight, bmi, bfPercentage } =
        measurement

    const values: { label: string; value: string }[] = [
        { label: 'Peso', value: weight != null ? `${weight} kg` : NO_DATA },
        { label: 'IMC', value: bmi != null ? bmi.toFixed(1) : NO_DATA },
        { label: '% grasa', value: bfPercentage != null ? `${bfPercentage} %` : NO_DATA },
    ]

    return (
        <li
            aria-label={`Medición N°${measurementNumber}`}
            className="relative w-full border border-zinc-200 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
        >
            {/* "stretched link": toda la fila es clickeable sin anidar enlaces */}
            <Link
                href={`/mediciones/${measurementId}`}
                aria-label={`Ver medición N°${measurementNumber}`}
                className="absolute inset-0 rounded-2xl"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="font-semibold text-zinc-900">{formatDate(measuredAt)}</p>
                    <p className="text-sm text-zinc-500">
                        {levelLabel(level)} · {originLabel(origin, consultationNumber)}
                    </p>
                </div>
            </div>

            <p className="text-sm text-zinc-700">
                {values.map(({ label, value }, index) => (
                    <span key={label}>
                        {index > 0 && <span className="text-zinc-500"> · </span>}
                        <span className="text-zinc-500">{label}: </span>
                        {value}
                    </span>
                ))}
            </p>
        </li>
    )
}
