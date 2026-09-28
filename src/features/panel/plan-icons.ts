// Íconos y estilo de ícono compartidos por las vistas de planes (detalle /planes/[orderId] y lista
// /planes).

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faDrumstickBite, faDroplet, faFire, faUtensils, faWheatAwn } from '@fortawesome/free-solid-svg-icons'
import { INTAKE_FIELDS } from './format'

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

// Ícono que representa un plan nutricional (comida).
export const PLAN_ICON: IconDefinition = faUtensils
