// Armado de las series del gráfico de evolución (MeasurementsChart), separado del componente para
// poder testearlo sin renderizar nivo.

import { MeasurementSummaryDto } from './dtos/measurement.dto'
import type { MyLatestPlanProjectionDto, MyPlanProjectionValuesDto } from '../panel/dtos/my-plan.dto'
import { BMI_COLOR, BODY_FAT_COLOR, MUSCLE_MASS_COLOR, WEIGHT_COLOR } from './colors'

export type ChartMetric = 'weight' | 'bmi' | 'bfKg' | 'mmKg'

// Métricas del gráfico, en el orden de la leyenda. `projectionKey` es el campo de la proyección que
// actúa como meta de esa métrica.
export const CHART_METRICS: {
    metric: ChartMetric
    label: string
    unit: string
    color: string
    projectionKey: keyof Pick<MyPlanProjectionValuesDto, 'weight' | 'bmi' | 'bfKg' | 'mmKg'>
}[] = [
    { metric: 'weight', label: 'Peso', unit: 'kg', color: WEIGHT_COLOR, projectionKey: 'weight' },
    { metric: 'bmi', label: 'IMC', unit: '', color: BMI_COLOR, projectionKey: 'bmi' },
    { metric: 'bfKg', label: 'Grasa corporal', unit: 'kg', color: BODY_FAT_COLOR, projectionKey: 'bfKg' },
    { metric: 'mmKg', label: 'Masa muscular', unit: 'kg', color: MUSCLE_MASS_COLOR, projectionKey: 'mmKg' },
]

export interface ChartPoint {
    x: Date
    y: number
}

export interface ChartSeries {
    // `<métrica>` para los valores medidos, `<métrica>-meta` para el tramo hacia la proyección.
    id: string
    metric: ChartMetric
    label: string
    unit: string
    color: string
    // true en las series meta (tramo del último valor medido a la proyección del plan).
    goal: boolean
    data: ChartPoint[]
}

// 'YYYY-MM-DD' (fecha local) de una fecha ISO: el día en que el usuario ve la medición.
function localDayKey(iso: string): string {
    const date = new Date(iso)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

// 'YYYY-MM-DD' -> Date a medianoche local (new Date('YYYY-MM-DD') la tomaría en UTC y podría
// correrla un día).
export function parseDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

// Mediciones tomadas entre el inicio y el término del plan, ambos días incluidos.
export function measurementsInPlanRange(
    measurements: MeasurementSummaryDto[],
    plan: Pick<MyLatestPlanProjectionDto, 'startDate' | 'endDate'>,
): MeasurementSummaryDto[] {
    return measurements.filter(({ measuredAt }) => {
        const day = localDayKey(measuredAt)
        return day >= plan.startDate && day <= plan.endDate
    })
}

// Una serie por métrica con los valores medidos (en orden cronológico, sin los null: una medición
// básica no corta la línea de grasa o músculo) y, si hay proyección, una serie meta que une el último
// valor medido con el proyectado al final del plan. Las series sin puntos se omiten.
export function buildChartSeries(
    measurements: MeasurementSummaryDto[],
    projection: MyPlanProjectionValuesDto | null = null,
): ChartSeries[] {
    const sorted = [...measurements].sort(
        (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
    )

    return CHART_METRICS.flatMap(({ metric, label, unit, color, projectionKey }) => {
        const base = { metric, label, unit, color }
        const measured: ChartPoint[] = sorted
            .filter((measurement) => measurement[metric] != null)
            .map((measurement) => ({ x: new Date(measurement.measuredAt), y: measurement[metric] as number }))

        const series: ChartSeries[] = []
        if (measured.length > 0) {
            series.push({ ...base, id: metric, goal: false, data: measured })
        }

        const target = projection?.[projectionKey]
        if (projection && target != null) {
            const last = measured.at(-1)
            const goal = { x: parseDateOnly(projection.projectedEndDate), y: target }
            series.push({ ...base, id: `${metric}-meta`, goal: true, data: last ? [last, goal] : [goal] })
        }
        return series
    })
}

// Escala Y del gráfico en múltiplos de `step` (10 por defecto): mínimo y máximo redondeados hacia afuera y
// los valores intermedios, que son las líneas horizontales de la grilla y las marcas del eje. Si todos
// los valores caen en el mismo múltiplo, se amplía un paso para que la escala no quede plana.
export function yScaleTicks(series: ChartSeries[], step = 10): { min: number; max: number; ticks: number[] } | null {
    const values = series.flatMap(({ data }) => data.map(({ y }) => y))
    if (values.length === 0) return null
    const min = Math.floor(Math.min(...values) / step) * step
    let max = Math.ceil(Math.max(...values) / step) * step
    if (max === min) max = min + step
    const ticks: number[] = []
    for (let tick = min; tick <= max; tick += step) ticks.push(tick)
    return { min, max, ticks }
}

export interface LatestMetricValue {
    metric: ChartMetric
    label: string
    unit: string
    color: string
    value: number | null
}

// "Resumen actual": el último valor registrado de cada métrica (de la medición más reciente que lo tiene;
// grasa y músculo solo existen en las bioimpedancias), o null si ninguna medición lo tiene.
export function latestMetricValues(measurements: MeasurementSummaryDto[]): LatestMetricValue[] {
    const newestFirst = [...measurements].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
    )
    return CHART_METRICS.map(({ metric, label, unit, color }) => ({
        metric,
        label,
        unit,
        color,
        value: newestFirst.find((measurement) => measurement[metric] != null)?.[metric] ?? null,
    }))
}
