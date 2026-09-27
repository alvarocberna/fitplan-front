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
