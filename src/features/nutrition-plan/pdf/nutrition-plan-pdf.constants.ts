import { NutritionPlanDto, SupplementPrescription } from '../dtos/nutrition-plan.dto'

type MealTime = NutritionPlanDto['mealTimes'][number]
type MealTimeFoods = MealTime['foods']

// Keys de MealTimeFoods que representan grupos de alimentos.
// El orden de este arreglo define el orden en el que se listan los alimentos en el PDF.
// Para agregar o quitar una categoría de alimento del PDF, solo edita este arreglo.
export const FOOD_FIELDS: { key: keyof MealTimeFoods; label: string }[] = [
    { key: 'cereals', label: 'Cereales' },
    { key: 'freeConsumptionVegetables', label: 'Verdura de libre consumo' },
    { key: 'generalConsumptionVegetables', label: 'Verdura de consumo general' },
    { key: 'fruits', label: 'Fruta' },
    { key: 'highFatProteins', label: 'Proteína alta en grasa' },
    { key: 'lowFatProteins', label: 'Proteína baja en grasa' },
    { key: 'highFatDairy', label: 'Lácteo alto en grasa' },
    { key: 'mediumFatDairy', label: 'Lácteo medio en grasa' },
    { key: 'lowFatDairy', label: 'Lácteo bajo en grasa' },
    { key: 'highProteinDairy', label: 'Lácteo alto en proteína' },
    { key: 'highLipidFoods', label: 'Rico en lípidos' },
    { key: 'oils', label: 'Aceite' },
    { key: 'sugars', label: 'Azúcar' },
]

// Devuelve solo los grupos de alimentos que vienen con datos (no null) para un tiempo de comida dado.
export function getFoods(mealTime: MealTime): { label: string; portion: string; equivalence: string }[] {
    return FOOD_FIELDS
        .filter(({ key }) => !!mealTime.foods[key])
        .map(({ key, label }) => {
            const food = mealTime.foods[key]!
            return { label, portion: food.portion, equivalence: food.equivalence }
        })
}

// Suma el aporte nutricional de todos los suplementos (para la fila resumen de la página 2).
export function sumSupplementsIntake(supplements: SupplementPrescription[]): { calories: number; protein: number; carbohydrate: number; fat: number } {
    return supplements.reduce(
        (total, s) => ({
            calories: total.calories + s.intake.calories,
            protein: total.protein + s.intake.protein,
            carbohydrate: total.carbohydrate + s.intake.carbohydrate,
            fat: total.fat + s.intake.fat,
        }),
        { calories: 0, protein: 0, carbohydrate: 0, fat: 0 }
    )
}

// "desayuno" -> "Desayuno"
export function capitalize(text: string): string {
    if (!text) return text
    return text.charAt(0).toUpperCase() + text.slice(1)
}
