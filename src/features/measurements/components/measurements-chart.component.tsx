'use client'

//react
import { useMemo, useState } from 'react'
//nivo
import { ResponsiveLine, type LineCustomSvgLayerProps } from '@nivo/line'
//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features - measurements
import { MeasurementSummaryDto } from '../dtos/measurement.dto'
import { levelLabel, originLabel } from '../labels'
import { buildChartSeries, measurementsInPlanRange, parseDateOnly, type ChartSeries } from '../chart-series'
//features - panel
import type { MyLatestPlanProjectionDto } from '../../panel/dtos/my-plan.dto'
import { formatDate } from '../../panel/format'

type ChartMode = 'plan' | 'all'

interface MeasurementsChartProps {
    measurements: MeasurementSummaryDto[]
    // Último plan con período (GET /me/plans/latest/projection); null si no hay.
    latestPlan: MyLatestPlanProjectionDto | null
}

// Tarjeta del gráfico de evolución (peso, IMC, grasa y masa muscular en kg). Dos modos:
// - "Plan actual": solo las mediciones dentro del período del último plan, más la proyección del plan
//   como meta (tramo punteado hasta la fecha de término).
// - "Todas": todas las mediciones, cada una con una casilla para incluirla o quitarla del gráfico.
export function MeasurementsChart({ measurements, latestPlan }: MeasurementsChartProps) {
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
        <Card widthInner="80%" variant="solid">
            <SubsectionHead>
                <SubsectionTitle title="Evolución" />
            </SubsectionHead>
            <SubsectionBody>
                <div className="w-full flex flex-col gap-4">
                    <div role="group" aria-label="Modo del gráfico" className="flex flex-wrap gap-2 self-center">
                        <ModeButton active={mode === 'plan'} disabled={!latestPlan} onClick={() => setMode('plan')}>
                            Plan actual
                        </ModeButton>
                        <ModeButton active={mode === 'all'} onClick={() => setMode('all')}>
                            Todas las mediciones
                        </ModeButton>
                    </div>

                    {mode === 'plan' && latestPlan && (
                        <p className="text-sm text-zinc-500 text-center">
                            {latestPlan.planName} · {formatDate(parseDateOnly(latestPlan.startDate).toISOString())} al{' '}
                            {formatDate(parseDateOnly(latestPlan.endDate).toISOString())}
                        </p>
                    )}

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

// Reemplaza la capa 'lines' de nivo para dibujar punteadas las series meta.
function DashedAwareLines({ series, lineGenerator }: LineCustomSvgLayerProps<ChartSeries>) {
    return (
        <g>
            {series.map(({ id, data, color, dashed }) => (
                <path
                    key={id}
                    d={lineGenerator(data.map(({ position }) => position)) ?? undefined}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={dashed ? '6 6' : undefined}
                />
            ))}
        </g>
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

function EvolutionLine({ series }: { series: ChartSeries[] }) {
    return (
        <ResponsiveLine<ChartSeries>
            data={series}
            margin={{ top: 16, right: 24, bottom: 40, left: 48 }}
            xScale={{ type: 'time', format: 'native', precision: 'day' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            axisBottom={{ format: '%d/%m', tickValues: 5 }}
            axisLeft={{ tickValues: 6 }}
            colors={{ datum: 'color' }}
            {...POINT_PROPS}
            enableGridX={false}
            useMesh
            layers={['grid', 'markers', 'axes', DashedAwareLines, 'points', 'mesh']}
            tooltip={({ point }) => {
                const current = series.find(({ id }) => id === point.seriesId)
                const date = point.data.x instanceof Date ? point.data.x.toISOString() : String(point.data.x)
                return (
                    <div className="bg-white border border-zinc-200 rounded-lg shadow px-3 py-2 text-xs text-zinc-700">
                        <p className="font-semibold" style={{ color: point.seriesColor }}>
                            {current?.label}
                            {current?.dashed ? ' (meta)' : ''}
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

// Leyenda HTML (una entrada por métrica presente) + aclaración del tramo punteado si hay metas.
function ChartLegend({ series }: { series: ChartSeries[] }) {
    // una métrica puede tener serie medida y serie meta: se lista una sola vez
    const entries = series.filter(({ metric }, index) => series.findIndex((s) => s.metric === metric) === index)
    const hasGoal = series.some(({ dashed }) => dashed)

    return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-600">
            {entries.map(({ metric, label, unit, color }) => (
                <li key={metric} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                    {unit ? ` (${unit})` : ''}
                </li>
            ))}
            {hasGoal && (
                <li className="flex items-center gap-1.5">
                    <span className="inline-block w-5 border-t-2 border-dashed border-zinc-500" />
                    Meta del plan
                </li>
            )}
        </ul>
    )
}
