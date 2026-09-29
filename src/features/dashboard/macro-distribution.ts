// Distribución de los macronutrientes de un plan en % de las calorías que aporta cada uno (convención
// nutricional: 4 kcal/g carbohidratos y proteínas, 9 kcal/g lípidos). La usa MacroDistributionCard.

import { MacrosDto } from './dtos/my-plan.dto'

export type DistributedMacro = 'carbohydrate' | 'protein' | 'fat'

export const MACRO_DISTRIBUTION: { key: DistributedMacro; label: string; color: string; kcalPerGram: number }[] = [
    { key: 'carbohydrate', label: 'Carbohidratos', color: '#16a34a', kcalPerGram: 4 }, // verde
    { key: 'protein', label: 'Proteínas', color: '#9333ea', kcalPerGram: 4 }, // púrpura
    { key: 'fat', label: 'Lípidos', color: '#eab308', kcalPerGram: 9 }, // amarillo
]

export interface MacroShare {
    key: DistributedMacro
    label: string
    color: string
    grams: number
    // % de las kcal de los tres macronutrientes, entero; los tres suman 100
    percentage: number
}

// % de cada macronutriente sobre la suma de sus kcal, redondeado con el método del resto mayor para que
// los tres sumen exactamente 100. Vacío si no aportan kcal (sin datos).
export function macroDistribution(macros: Pick<MacrosDto, DistributedMacro>): MacroShare[] {
    const kcal = MACRO_DISTRIBUTION.map(({ key, kcalPerGram }) => Math.max(0, macros[key] ?? 0) * kcalPerGram)
    const total = kcal.reduce((sum, value) => sum + value, 0)
    if (total <= 0) return []

    const exact = kcal.map((value) => (value / total) * 100)
    const percentages = exact.map(Math.floor)
    let missing = 100 - percentages.reduce((sum, value) => sum + value, 0)
    // reparte los puntos que faltan a los de mayor parte decimal
    const byRemainder = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
        .sort((a, b) => b.remainder - a.remainder)
    for (const { index } of byRemainder) {
        if (missing <= 0) break
        percentages[index] += 1
        missing -= 1
    }

    return MACRO_DISTRIBUTION.map(({ key, label, color }, index) => ({
        key,
        label,
        color,
        grams: macros[key],
        percentage: percentages[index],
    }))
}
