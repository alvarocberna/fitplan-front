// Datos derivados del detalle de una medición (MeasurementDetail): escala de IMC, composición
// corporal para los gráficos y el resto de valores. Separado del componente para testearlo sin
// renderizar nivo.

import { MeasurementDetailDto, MeasurementResultDto } from './dtos/measurement.dto'
import { INDICATOR_LABELS, RAW_FIELDS, RAW_SECTION_TITLES } from './labels'
import { BODY_FAT_COLOR, BONE_MASS_COLOR, MUSCLE_MASS_COLOR, VISCERAL_FAT_COLOR } from './colors'

export function resultValue(results: MeasurementResultDto[], indicator: string): MeasurementResultDto | undefined {
    return results.find((result) => result.indicator === indicator)
}

// ---------------------------------------------------------------------------------------------
// IMC
// ---------------------------------------------------------------------------------------------

// Mismos cortes que classifyBmi del backend (domain/services/formulas/indexes/bmi.service.ts).
// `key` es la BmiClassification que guarda el backend.
export const BMI_SCALE_MIN = 15
export const BMI_SCALE_MAX = 45

export const BMI_RANGES = [
    { key: 'UNDERWEIGHT', label: 'Bajo peso', short: 'Bajo', from: BMI_SCALE_MIN, to: 18.5, color: '#38bdf8' },
    { key: 'NORMAL_WEIGHT', label: 'Normal', short: 'Normal', from: 18.5, to: 25, color: '#22c55e' },
    { key: 'OVERWEIGHT', label: 'Sobrepeso', short: 'Sobrep.', from: 25, to: 30, color: '#facc15' },
    { key: 'OBESITY_I', label: 'Obesidad I', short: 'Ob. I', from: 30, to: 35, color: '#fb923c' },
    { key: 'OBESITY_II', label: 'Obesidad II', short: 'Ob. II', from: 35, to: 40, color: '#f87171' },
    { key: 'OBESITY_III', label: 'Obesidad III', short: 'Ob. III', from: 40, to: BMI_SCALE_MAX, color: '#dc2626' },
] as const

// Posición (0-100 %) de un valor de IMC sobre la escala; los extremos se recortan.
export function bmiScalePercent(bmi: number): number {
    const percent = ((bmi - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100
    return Math.min(100, Math.max(0, percent))
}

// ---------------------------------------------------------------------------------------------
// Composición corporal
// ---------------------------------------------------------------------------------------------

export type BodyComponent = 'bodyFat' | 'muscleMass' | 'visceralFat' | 'boneMass'

// Colores de colors.ts, los mismos del gráfico de evolución (chart-series.ts).
export const BODY_COMPONENTS: {
    component: BodyComponent
    label: string
    color: string
    kgIndicator: string
    percentageIndicator: string
    // la grasa visceral ya es parte de la grasa corporal: sumarla en la torta la contaría dos veces
    inPie: boolean
}[] = [
    { component: 'bodyFat', label: 'Grasa corporal', color: BODY_FAT_COLOR, kgIndicator: 'BODY_FAT_KG', percentageIndicator: 'BODY_FAT_PERCENTAGE', inPie: true },
    { component: 'muscleMass', label: 'Masa muscular', color: MUSCLE_MASS_COLOR, kgIndicator: 'MUSCLE_MASS_KG', percentageIndicator: 'MUSCLE_MASS_PERCENTAGE', inPie: true },
    { component: 'visceralFat', label: 'Grasa visceral', color: VISCERAL_FAT_COLOR, kgIndicator: 'VISCERAL_FAT_KG', percentageIndicator: 'VISCERAL_FAT_PERCENTAGE', inPie: false },
    { component: 'boneMass', label: 'Masa ósea', color: BONE_MASS_COLOR, kgIndicator: 'BONE_MASS_KG', percentageIndicator: 'BONE_MASS_PERCENTAGE', inPie: true },
]

export const REST_COLOR = '#d4d4d8'

export interface BodyCompositionBar {
    component: BodyComponent
    label: string
    kg: number
    color: string
}

export interface BodyCompositionSlice {
    id: string
    label: string
    value: number
    color: string
}

// Una fila de la lista bajo los gráficos: kg y % de cada componente presente, con su método.
export interface BodyCompositionRow {
    component: BodyComponent
    label: string
    kg: number | null
    percentage: number | null
    method: string | null
}

function round1(value: number): number {
    return Math.round(value * 10) / 10
}

export function bodyCompositionBars(results: MeasurementResultDto[]): BodyCompositionBar[] {
    return BODY_COMPONENTS.flatMap(({ component, label, color, kgIndicator }) => {
        const kg = resultValue(results, kgIndicator)
        return kg ? [{ component, label, kg: kg.value, color }] : []
    })
}

// Grasa corporal, masa muscular y masa ósea en % del peso, más "Resto" (agua, órganos, ...) hasta
// completar el 100 %; sin resto si los componentes ya suman 100 o más.
export function bodyCompositionPie(results: MeasurementResultDto[]): BodyCompositionSlice[] {
    const slices = BODY_COMPONENTS.filter(({ inPie }) => inPie).flatMap(({ component, label, color, percentageIndicator }) => {
        const percentage = resultValue(results, percentageIndicator)
        return percentage ? [{ id: component, label, value: percentage.value, color }] : []
    })
    if (slices.length === 0) return []

    const rest = round1(100 - slices.reduce((sum, { value }) => sum + value, 0))
    return rest > 0 ? [...slices, { id: 'rest', label: 'Resto', value: rest, color: REST_COLOR }] : slices
}

export function bodyCompositionRows(results: MeasurementResultDto[]): BodyCompositionRow[] {
    return BODY_COMPONENTS.flatMap(({ component, label, kgIndicator, percentageIndicator }) => {
        const kg = resultValue(results, kgIndicator)
        const percentage = resultValue(results, percentageIndicator)
        if (!kg && !percentage) return []
        return [
            {
                component,
                label,
                kg: kg?.value ?? null,
                percentage: percentage?.value ?? null,
                method: kg?.method ?? percentage?.method ?? null,
            },
        ]
    })
}

export function hasBodyComposition(results: MeasurementResultDto[]): boolean {
    return bodyCompositionRows(results).length > 0
}

// ---------------------------------------------------------------------------------------------
// Otras mediciones
// ---------------------------------------------------------------------------------------------

export interface OtherItemsGroup {
    title: string
    rows: { key: string; label: string; value: string }[]
}

// Lo que no va en "Peso e IMC" ni en "Composición corporal": el resto de datos básicos (talla
// sentado, envergadura), pliegues, perímetros, diámetros e índices como el de masa magra o el
// somatotipo. Solo los grupos con algún valor.
const OTHER_INDICATORS = ['LBMI', 'ENDOMORPHY', 'MESOMORPHY', 'ECTOMORPHY']

export function otherItems({ raw, results }: Pick<MeasurementDetailDto, 'raw' | 'results'>): OtherItemsGroup[] {
    const groups: OtherItemsGroup[] = []

    for (const section of Object.keys(RAW_FIELDS) as (keyof typeof RAW_FIELDS)[]) {
        const values = raw[section]
        if (!values) continue
        const rows = Object.entries(RAW_FIELDS[section])
            .filter(([field]) => values[field] != null && !(section === 'basic' && (field === 'weight' || field === 'height')))
            .map(([field, { label, unit }]) => ({ key: `${section}.${field}`, label, value: `${values[field]} ${unit}` }))
        if (rows.length > 0) groups.push({ title: RAW_SECTION_TITLES[section], rows })
    }

    const indexRows = OTHER_INDICATORS.flatMap((indicator) => {
        const result = resultValue(results, indicator)
        if (!result) return []
        const value = [result.value, result.unit].filter((part) => part != null).join(' ')
        return [{ key: indicator, label: INDICATOR_LABELS[indicator] ?? indicator, value }]
    })
    if (indexRows.length > 0) groups.push({ title: 'Índices', rows: indexRows })

    return groups
}
