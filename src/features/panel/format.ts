// Helpers de formato compartidos por las tarjetas del panel.

export const NO_DATA = '—'

// dd/mm/aaaa a partir de una fecha ISO.
export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

// Ingesta del plan (calorías y macros), en el orden en que se muestran.
export const INTAKE_FIELDS = [
    { key: 'calorieIntake', label: 'Calorías', unit: 'kcal' },
    { key: 'proteinIntake', label: 'Proteínas', unit: 'g' },
    { key: 'carbohydrateIntake', label: 'Carbohidratos', unit: 'g' },
    { key: 'lipidIntake', label: 'Lípidos', unit: 'g' },
] as const

// Clasificación del IMC tal como la guarda el backend (BmiClassification) -> texto.
const BMI_CLASSIFICATION_LABELS: Record<string, string> = {
    UNDERWEIGHT: 'Bajo peso',
    NORMAL_WEIGHT: 'Normal',
    OVERWEIGHT: 'Sobrepeso',
    OBESITY_I: 'Obesidad I',
    OBESITY_II: 'Obesidad II',
    OBESITY_III: 'Obesidad III',
}

export function bmiClassificationLabel(classification: string): string {
    return BMI_CLASSIFICATION_LABELS[classification] ?? classification
}

// Tiempo de comida (PlanMealTimeSlot del backend) -> texto.
export const MEAL_TIME_LABELS: Record<string, string> = {
    BREAKFAST: 'Desayuno',
    LUNCH: 'Almuerzo',
    AFTERNOON_TEA: 'Once',
    DINNER: 'Cena',
    SNACK: 'Colación',
}

// Grupo de alimentos (columna de plan_meal_time en el backend) -> texto, en el orden en que se muestran.
export const PORTION_GROUP_LABELS: Record<string, string> = {
    cereal: 'Cereales',
    freeConsumptionVegetable: 'Verduras de libre consumo',
    generalConsumptionVegetable: 'Verduras de consumo general',
    fruit: 'Frutas',
    highFatProtein: 'Proteínas altas en grasa',
    lowFatProtein: 'Proteínas bajas en grasa',
    highFatDairy: 'Lácteos altos en grasa',
    mediumFatDairy: 'Lácteos medios en grasa',
    lowFatDairy: 'Lácteos bajos en grasa',
    highProteinDairy: 'Lácteos altos en proteína',
    lipidRich: 'Alimentos ricos en lípidos',
    oil: 'Aceites',
    sugar: 'Azúcares',
}
