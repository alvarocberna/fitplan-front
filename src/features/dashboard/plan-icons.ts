// Íconos y estilo de ícono compartidos por las vistas de planes (detalle /planes/[orderId] y lista
// /planes).

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
    faCapsules,
    faCircleCheck,
    faClock,
    faDrumstickBite,
    faDumbbell,
    faFlagCheckered,
    faHourglassStart,
    faLightbulb,
    faPersonRunning,
    faStopwatch,
    faDroplet,
    faFire,
    faPills,
    faPrescriptionBottleMedical,
    faTriangleExclamation,
    faUtensils,
    faWheatAwn,
} from '@fortawesome/free-solid-svg-icons'
import { INTAKE_FIELDS } from './format'
import type { MacrosDto } from './dtos/my-plan.dto'

export type IntakeKey = (typeof INTAKE_FIELDS)[number]['key']

// Fondo del ícono: tinte claro del color primario, con el ícono en el primario.
export const ICON_CIRCLE_STYLE = {
    backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, white)',
    color: 'var(--color-primary)',
}

export const MACRO_ICONS: Record<IntakeKey, IconDefinition> = {
    calorieIntake: faFire,
    proteinIntake: faDrumstickBite,
    carbohydrateIntake: faWheatAwn,
    lipidIntake: faDroplet,
}

// Los mismos íconos, por clave de MacrosDto (aporte de un tiempo de comida o de un suplemento).
export const MACROS_DTO_ICONS: Record<keyof MacrosDto, IconDefinition> = {
    calories: faFire,
    protein: faDrumstickBite,
    carbohydrate: faWheatAwn,
    fat: faDroplet,
}

// Ícono que representa un plan nutricional (comida).
export const PLAN_ICON: IconDefinition = faUtensils

// Título de la sección de suplementación y de cada suplemento.
export const SUPPLEMENTS_ICON: IconDefinition = faCapsules
export const SUPPLEMENT_ICON: IconDefinition = faPills
// Datos de cada suplemento: dosis, toma, efectos y consideraciones.
export const DOSE_ICON: IconDefinition = faPrescriptionBottleMedical
export const INTAKE_TIME_ICON: IconDefinition = faClock
export const EFFECTS_ICON: IconDefinition = faCircleCheck
export const CONSIDERATIONS_ICON: IconDefinition = faTriangleExclamation

// Recomendaciones deportivas: título de la sección, cada sesión, su estrategia y los tres momentos.
export const SPORTS_ICON: IconDefinition = faPersonRunning
export const SPORTS_SESSION_ICON: IconDefinition = faDumbbell
export const STRATEGY_ICON: IconDefinition = faLightbulb
export const PRE_ACTIVITY_ICON: IconDefinition = faHourglassStart
export const DURING_ACTIVITY_ICON: IconDefinition = faStopwatch
export const POST_ACTIVITY_ICON: IconDefinition = faFlagCheckered
