// Armado de las series del gráfico de evolución (MeasurementsChart), separado del componente para
// poder testearlo sin renderizar nivo.

import { MeasurementSummaryDto } from './dtos/measurement.dto'
import type { MyLatestPlanProjectionDto, MyPlanProjectionValuesDto } from '../panel/dtos/my-plan.dto'
import { BMI_COLOR, BODY_FAT_COLOR, MUSCLE_MASS_COLOR } from './colors'

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
    { metric: 'weight', label: 'Peso', unit: 'kg', color: '#2563eb', projectionKey: 'weight' },
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
    // true en las series meta: se dibujan punteadas.
    dashed: boolean
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
            series.push({ ...base, id: metric, dashed: false, data: measured })
        }

        const target = projection?.[projectionKey]
        if (projection && target != null) {
            const last = measured.at(-1)
            const goal = { x: parseDateOnly(projection.projectedEndDate), y: target }
            series.push({ ...base, id: `${metric}-meta`, dashed: true, data: last ? [last, goal] : [goal] })
        }
        return series
    })
}
