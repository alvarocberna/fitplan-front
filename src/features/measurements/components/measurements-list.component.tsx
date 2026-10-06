//next
import Link from 'next/link'
//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCalendarDays, faChevronRight, faDroplet, faGaugeHigh, faWeightScale } from '@fortawesome/free-solid-svg-icons'
//features - measurements
import { MeasurementSummaryDto } from '../dtos/measurement.dto'
import { levelLabel } from '../labels'
import { BMI_COLOR, BODY_FAT_COLOR, WEIGHT_COLOR } from '../colors'
//features - dashboard
import { NO_DATA, formatDate } from '../../dashboard/format'
import { ICON_CIRCLE_STYLE } from '../../dashboard/plan-icons'

interface MeasurementsListProps {
    measurements: MeasurementSummaryDto[]
}

// Mediciones del historial clínico en /mediciones (GET /me/measurements, HU-CLI-03), de consulta y
// registradas por el usuario, más reciente primero. Arriba, un card con el título y "Registrar medición";
// debajo, un card por medición (sin card contenedor) que abre su detalle (/mediciones/[id], HU-CLI-04).
export function MeasurementsList({ measurements }: MeasurementsListProps) {
    return (
        <div className="w-full flex flex-col gap-4">
            {/* card compacto (mismo aspecto que Card variant="solid", sin su padding de sección) */}
            <div className="w-full bg-white border border-white rounded-[12px] shadow-lg px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-zinc-900">Mis mediciones</h2>
                <Link
                    href="/mediciones/nueva"
                    // w-auto!/h-10!: .primary-btn fija width/height al 100% sin @layer
                    className="btn primary-btn h-10! w-auto! px-6 no-underline"
                >
                    Registrar medición
                </Link>
            </div>

            {measurements.length > 0 ? (
                <ul className="w-full flex flex-col gap-4">
                    {measurements.map((measurement) => (
                        <MeasurementCard key={measurement.measurementId} measurement={measurement} />
                    ))}
                </ul>
            ) : (
                <p className="text-zinc-500 text-center py-8">
                    Todavía no tienes mediciones. Registra la primera para seguir tu progreso.
                </p>
            )}
        </div>
    )
}

// Fondo del ícono de una métrica: tinte claro de su color (el mismo de su línea en el gráfico).
function tintStyle(color: string) {
    return { backgroundColor: `color-mix(in srgb, ${color} 15%, white)`, color }
}

// Card de una medición en 6 columnas: calendario; fecha y tipo; peso, IMC y % de grasa (cada una con
// ícono a la izquierda y nombre + valor a la derecha); y una flecha que indica que abre el detalle (todo el
// card es el enlace). En móvil, las métricas pasan a una fila propia.
function MeasurementCard({ measurement }: { measurement: MeasurementSummaryDto }) {
    const { measurementId, measurementNumber, measuredAt, level, weight, bmi, bfPercentage } = measurement

    const metrics: { key: string; label: string; value: string; icon: IconDefinition; color: string }[] = [
        { key: 'weight', label: 'Peso', value: weight != null ? `${weight} kg` : NO_DATA, icon: faWeightScale, color: WEIGHT_COLOR },
        { key: 'bmi', label: 'IMC', value: bmi != null ? bmi.toFixed(1) : NO_DATA, icon: faGaugeHigh, color: BMI_COLOR },
        {
            key: 'bodyFat',
            label: '% grasa corporal',
            value: bfPercentage != null ? `${bfPercentage} %` : NO_DATA,
            icon: faDroplet,
            color: BODY_FAT_COLOR,
        },
    ]

    return (
        <li
            aria-label={`Medición N°${measurementNumber}`}
            className="group relative w-full bg-white border border-white rounded-[12px] shadow-lg p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] items-center gap-4 text-left hover:shadow-xl transition-shadow"
        >
            {/* "stretched link": todo el card es clickeable sin anidar enlaces */}
            <Link
                href={`/mediciones/${measurementId}`}
                aria-label={`Ver medición N°${measurementNumber}`}
                className="absolute inset-0 rounded-[12px]"
            />

            <span aria-hidden="true" className="h-12 w-12 rounded-full flex items-center justify-center" style={ICON_CIRCLE_STYLE}>
                <FontAwesomeIcon icon={faCalendarDays} className="h-5 w-5" />
            </span>

            <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-semibold text-zinc-900">{formatDate(measuredAt)}</p>
                <p className="text-sm text-zinc-500">{levelLabel(level)}</p>
            </div>

            {/* en móvil, las 3 métricas ocupan una fila propia bajo la fecha */}
            <dl className="col-span-3 row-start-2 md:col-span-3 md:row-start-auto grid grid-cols-3 gap-4">
                {metrics.map(({ key, label, value, icon, color }) => (
                    // el <dt> usa `contents` para que el ícono (dentro del dt, así el grupo sigue siendo un
                    // <dt>/<dd> válido) ocupe la 1.ª columna y nombre y valor la 2.ª
                    <div key={key} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 items-center min-w-0">
                        <dt className="contents">
                            <span
                                aria-hidden="true"
                                className="row-span-2 h-9 w-9 rounded-full flex items-center justify-center"
                                style={tintStyle(color)}
                            >
                                <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                            </span>
                            <span className="col-start-2 text-xs text-zinc-500">{label}</span>
                        </dt>
                        <dd className="col-start-2 text-sm font-semibold text-zinc-900">{value}</dd>
                    </div>
                ))}
            </dl>

            {/* solo indica que el card abre el detalle: el enlace es todo el card (stretched link) */}
            <span
                aria-hidden="true"
                className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto justify-self-end text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition"
            >
                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
            </span>
        </li>
    )
}
