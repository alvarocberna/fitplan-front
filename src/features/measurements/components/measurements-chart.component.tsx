'use client'

//react
import { useMemo, useState } from 'react'
//nivo
import { ResponsiveLine } from '@nivo/line'
//icons
import { CalendarDaysIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline'
//shared
import { Card, SubsectionBody } from '@/shared'
//features - measurements
import { MeasurementSummaryDto } from '../dtos/measurement.dto'
import { levelLabel, originLabel } from '../labels'
import {
    buildChartSeries,
    latestMetricValues,
    measurementsInPlanRange,
    parseDateOnly,
    yScaleTicks,
    type ChartSeries,
} from '../chart-series'
//features - panel
import type { MyLatestPlanProjectionDto } from '../../panel/dtos/my-plan.dto'
import { formatDate } from '../../panel/format'
import { CardTitle } from '../../panel/components/card-title.component'

type ChartMode = 'plan' | 'all'

interface MeasurementsChartProps {
    measurements: MeasurementSummaryDto[]
    // Último plan con período (GET /me/plans/latest/projection); null si no hay.
    latestPlan: MyLatestPlanProjectionDto | null
    // Título interno (con ícono), p. ej. "Evolución" en /panel; /mediciones pone su propio título fuera de la card.
    title?: string
}

// Tarjeta del gráfico de evolución (peso, IMC, grasa y masa muscular en kg), sin título (lo pone la
// página). Dos modos:
// - "Plan actual": solo las mediciones dentro del período del último plan, más la proyección del plan
//   como meta (tramo hasta la fecha de término). El rango del plan va a la izquierda de los botones.
// - "Todas": todas las mediciones, cada una con una casilla para incluirla o quitarla del gráfico.
export function MeasurementsChart({ measurements, latestPlan, title }: MeasurementsChartProps) {
    const [mode, setMode] = useState<ChartMode>(latestPlan ? 'plan' : 'all')
    const [unselected, setUnselected] = useState<Set<string>>(() => new Set())

    const series = useMemo(() => {
        if (mode === 'plan' && latestPlan) {
            return buildChartSeries(measurementsInPlanRange(measurements, latestPlan), latestPlan.projection)
        }
        return buildChartSeries(measurements.filter(({ measurementId }) => !unselected.has(measurementId)))
    }, [mode, latestPlan, measurements, unselected])

    function toggleMeasurement(measurementId: string) {
        setUnselected((current) => {
            const next = new Set(current)
            if (next.has(measurementId)) next.delete(measurementId)
            else next.add(measurementId)
            return next
        })
    }

    const emptyMessage =
        mode === 'plan'
            ? 'No hay mediciones ni proyección en el período del plan.'
            : measurements.length === 0
              ? 'Todavía no tienes mediciones para graficar.'
              : 'Selecciona al menos una medición.'

    return (
        <Card widthInner="96%" variant="solid">
            <SubsectionBody>
                {title && (
                    <div className="w-full mb-4">
                        <CardTitle icon={PresentationChartLineIcon} title={title} />
                    </div>
                )}
                {/* dos columnas paralelas (apiladas en móvil): a la izquierda rango del plan + modos, gráfico y
                    casillas; a la derecha "Resumen actual" */}
                <div className="w-full flex flex-col md:flex-row gap-6">
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        {/* rango del plan a la izquierda (solo en "Plan actual") y modos a la derecha */}
                        <div className="w-full flex flex-wrap items-center justify-between gap-2">
                            {mode === 'plan' && latestPlan && (
                                <p className="flex items-center gap-2 text-sm text-zinc-500 text-left">
                                    <span
                                        aria-hidden="true"
                                        className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center"
                                        style={ICON_CIRCLE_STYLE}
                                    >
                                        <CalendarDaysIcon className="h-4 w-4" />
                                    </span>
                                    <span className="sr-only">Período del plan {latestPlan.planName}:</span>
                                    <span>
                                        {formatDate(parseDateOnly(latestPlan.startDate).toISOString())} al{' '}
                                        {formatDate(parseDateOnly(latestPlan.endDate).toISOString())}
                                    </span>
                                </p>
                            )}
                            <div role="group" aria-label="Modo del gráfico" className="flex flex-wrap gap-2 ml-auto">
                                <ModeButton active={mode === 'plan'} disabled={!latestPlan} onClick={() => setMode('plan')}>
                                    Plan actual
                                </ModeButton>
                                <ModeButton active={mode === 'all'} onClick={() => setMode('all')}>
                                    Todas las mediciones
                                </ModeButton>
                            </div>
                        </div>

                        {series.length > 0 ? (
                            <>
                                <div className="w-full h-80" data-testid="measurements-chart">
                                    <EvolutionLine series={series} />
                                </div>
                                <ChartLegend series={series} />
                            </>
                        ) : (
                            <p className="text-zinc-500 text-center py-8">{emptyMessage}</p>
                        )}

                        {mode === 'all' && measurements.length > 0 && (
                            <fieldset className="flex flex-col gap-2">
                                <legend className="text-sm font-semibold text-zinc-700 mb-2">Mediciones en el gráfico</legend>
                                {measurements.map(({ measurementId, measurementNumber, measuredAt, level, origin, consultationNumber }) => (
                                    <label
                                        key={measurementId}
                                        className="flex items-center gap-3 text-sm text-zinc-700 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-zinc-900"
                                            checked={!unselected.has(measurementId)}
                                            onChange={() => toggleMeasurement(measurementId)}
                                            aria-label={`Incluir medición N°${measurementNumber}`}
                                        />
                                        <span>
                                            <span className="font-medium text-zinc-900">{formatDate(measuredAt)}</span>
                                            <span className="text-zinc-500">
                                                {' '}
                                                · {levelLabel(level)} · {originLabel(origin, consultationNumber)}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </fieldset>
                        )}
                    </div>
                    <CurrentSummary measurements={measurements} />
                </div>
            </SubsectionBody>
        </Card>
    )
}

function ModeButton({
    active,
    disabled = false,
    onClick,
    children,
}: {
    active: boolean
    disabled?: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500'
            }`}
        >
            {children}
        </button>
    )
}

// Un punto por medición, relleno con el color de la serie y borde blanco. En nivo 0.99 el relleno se
// resuelve con { series, point } ('series.color') pero el borde recibe el punto mismo: un punto blanco
// con borde { from: 'series.color' } (o el antiguo 'serieColor') queda sin borde, invisible sobre el
// fondo. Exportado para el test que renderiza nivo de verdad (measurements-chart-points.test.tsx).
export const POINT_PROPS = {
    pointSize: 10,
    pointColor: { from: 'series.color' },
    pointBorderWidth: 2,
    pointBorderColor: '#ffffff',
} as const

// Margen del área de trazado. El izquierdo solo reserva lugar para las etiquetas del eje Y (hasta 3 cifras).
const CHART_MARGIN = { top: 16, right: 24, bottom: 40, left: 40 }

// Etiqueta del eje Y alineada al borde izquierdo del gráfico (nivo las alinea a la derecha, pegadas al
// eje): así el gráfico empieza en el mismo eje vertical que el ícono del calendario y la leyenda.
// (solo las props que usa del tick de @nivo/axes, que llega como dependencia de @nivo/line)
function LeftAlignedTick({ y, value, theme }: { y: number; value: unknown; theme: { text: React.CSSProperties } }) {
    return (
        <g transform={`translate(0,${y})`}>
            <text x={-CHART_MARGIN.left} dominantBaseline="central" textAnchor="start" style={theme.text}>
                {String(value)}
            </text>
        </g>
    )
}

function EvolutionLine({ series }: { series: ChartSeries[] }) {
    // una línea horizontal (y una marca del eje) cada 10 unidades, con la escala redondeada a esos múltiplos
    const scale = yScaleTicks(series)
    return (
        <ResponsiveLine<ChartSeries>
            data={series}
            margin={CHART_MARGIN}
            xScale={{ type: 'time', format: 'native', precision: 'day' }}
            yScale={{ type: 'linear', min: scale?.min ?? 'auto', max: scale?.max ?? 'auto' }}
            axisBottom={{ format: '%d/%m', tickValues: 5 }}
            axisLeft={{ tickValues: scale?.ticks ?? 6, renderTick: LeftAlignedTick }}
            gridYValues={scale?.ticks}
            colors={{ datum: 'color' }}
            {...POINT_PROPS}
            enableGridX={false}
            useMesh
            layers={['grid', 'markers', 'axes', 'lines', 'points', 'mesh']}
            tooltip={({ point }) => {
                const current = series.find(({ id }) => id === point.seriesId)
                const date = point.data.x instanceof Date ? point.data.x.toISOString() : String(point.data.x)
                return (
                    <div className="bg-white border border-zinc-200 rounded-lg shadow px-3 py-2 text-xs text-zinc-700">
                        <p className="font-semibold" style={{ color: point.seriesColor }}>
                            {current?.label}
                            {current?.goal ? ' (meta)' : ''}
                        </p>
                        <p>
                            {formatDate(date)}: {point.data.y as number} {current?.unit}
                        </p>
                    </div>
                )
            }}
        />
    )
}

// Leyenda HTML: una entrada por métrica presente. Las metas usan el mismo color y trazo continuo que su
// métrica; el tooltip las marca como "(meta)".
function ChartLegend({ series }: { series: ChartSeries[] }) {
    // una métrica puede tener serie medida y serie meta: se lista una sola vez
    const entries = series.filter(({ metric }, index) => series.findIndex((s) => s.metric === metric) === index)

    return (
        <ul className="flex flex-wrap justify-start gap-x-8 gap-y-2 text-xs text-zinc-600">
            {entries.map(({ metric, label, unit, color }) => (
                <li key={metric} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                    {unit ? ` (${unit})` : ''}
                </li>
            ))}
        </ul>
    )
}

// Tinte claro del color primario con el ícono en el primario (mismo estilo que los íconos de los planes).
const ICON_CIRCLE_STYLE = {
    backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, white)',
    color: 'var(--color-primary)',
}

// "Resumen actual": el último valor registrado de peso, IMC, grasa y masa muscular (independiente del modo
// y de las casillas), cada uno con el punto del color de su línea. Columna aparte, con el fondo del círculo
// del calendario.
function CurrentSummary({ measurements }: { measurements: MeasurementSummaryDto[] }) {
    return (
        <section
            aria-label="Resumen actual"
            className="w-full md:w-60 shrink-0 md:self-start rounded-2xl p-5 flex flex-col gap-3"
            // mismo fondo que el círculo del ícono de calendario
            style={{ backgroundColor: ICON_CIRCLE_STYLE.backgroundColor }}
        >
            <h2 className="text-base font-semibold text-zinc-900">Resumen actual</h2>
            <dl className="flex flex-col divide-y divide-white">
                {latestMetricValues(measurements).map(({ metric, label, unit, color, value }) => (
                    <div key={metric} className="flex items-center justify-between gap-3 py-2">
                        <dt className="flex items-center gap-2 text-sm text-zinc-500">
                            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                        </dt>
                        <dd className="text-sm font-semibold text-zinc-900">
                            {value != null ? `${value}${unit ? ` ${unit}` : ''}` : '—'}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
