// Selección del usuario para elegir la versión de un plan predefinido, y su código.
//
// Cada plan (plan-gimnasio-volumen, plan-gimnasio-definicion, ...) existe en 28 versiones: 7 rangos de
// peso × 2 sexos × 2 grupos de edad. El usuario no las ve: completa peso, talla, sexo y edad, y el
// sistema le muestra la versión que le corresponde. El código de esa versión es
// <plan>-<pesoMin>-<pesoMax>-<sexo>-<edad>, p. ej. 'plan-gimnasio-volumen-50-60-m-joven', y es el mismo
// que usa el backend (Product.code, y el nombre de los archivos en S3). El backend valida el formato y
// toma precio y archivos de la base de datos: este código solo identifica la versión, nunca es fuente
// de precio.
//
// La talla se captura pero no interviene en la elección de la versión.

export const PLAN_SLUGS = [
  'plan-gimnasio-volumen',
  'plan-gimnasio-definicion',
  'plan-running',
  'plan-deporte-cancha',
] as const

export type PlanSlug = (typeof PLAN_SLUGS)[number]

//el value es el segmento del código; el label es lo que ve el usuario ('50-60' cubre 50–59.9 kg)
export const WEIGHT_RANGES = [
  { value: '40-50', label: '40 - 49.9 kg' },
  { value: '50-60', label: '50 - 59.9 kg' },
  { value: '60-70', label: '60 - 69.9 kg' },
  { value: '70-80', label: '70 - 79.9 kg' },
  { value: '80-90', label: '80 - 89.9 kg' },
  { value: '90-100', label: '90 - 99.9 kg' },
  { value: '100-120', label: '100 - 120 kg' },
] as const

export const SEX_OPTIONS = [
  { value: 'm', label: 'Masculino' },
  { value: 'f', label: 'Femenino' },
] as const

//solo importa si es menor de 30 (joven) o no (adulto): 18-30 es la única opción "joven"
export const AGE_RANGES = [
  { value: '18-30', label: '18 - 30 años', group: 'joven' },
  { value: '30-40', label: '30 - 40 años', group: 'adulto' },
  { value: '40-50', label: '40 - 50 años', group: 'adulto' },
  { value: '50-60', label: '50 - 60 años', group: 'adulto' },
  { value: '60+', label: 'Más de 60 años', group: 'adulto' },
] as const

export type WeightRange = (typeof WEIGHT_RANGES)[number]['value']
export type Sex = (typeof SEX_OPTIONS)[number]['value']
export type AgeRange = (typeof AGE_RANGES)[number]['value']

export interface PlanSelection {
  weightRange: WeightRange | ''
  //en cm; se guarda como string para poder editar el input libremente
  heightCm: string
  sex: Sex | ''
  ageRange: AgeRange | ''
}

export const EMPTY_PLAN_SELECTION: PlanSelection = {
  weightRange: '',
  heightCm: '',
  sex: '',
  ageRange: '',
}

const MAX_HEIGHT_CM = 300

export function isPlanSlug(value: string): value is PlanSlug {
  return (PLAN_SLUGS as readonly string[]).includes(value)
}

//la talla acepta cualquier valor positivo en cm (con un tope que solo atrapa errores de tipeo)
export function isValidHeightCm(value: string): boolean {
  if (value.trim() === '') return false
  const height = Number(value)
  return Number.isFinite(height) && height > 0 && height <= MAX_HEIGHT_CM
}

export function isPlanSelectionComplete(selection: PlanSelection): boolean {
  return (
    selection.weightRange !== '' &&
    selection.sex !== '' &&
    selection.ageRange !== '' &&
    isValidHeightCm(selection.heightCm)
  )
}

export function getAgeGroup(ageRange: AgeRange): 'joven' | 'adulto' {
  return AGE_RANGES.find((range) => range.value === ageRange)!.group
}

//código de la versión del plan que corresponde a la selección, o null si el plan no existe o la
//selección está incompleta. Ej.: ('plan-gimnasio-volumen', 50-59.9 kg, masculino, 18-30) -> 'plan-gimnasio-volumen-50-60-m-joven'
export function buildPlanCode(slug: string, selection: PlanSelection): string | null {
  if (!isPlanSlug(slug) || !isPlanSelectionComplete(selection)) return null
  const { weightRange, sex, ageRange } = selection
  return `${slug}-${weightRange}-${sex}-${getAgeGroup(ageRange as AgeRange)}`
}
