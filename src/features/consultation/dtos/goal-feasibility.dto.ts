import { GoalsDto } from './consultation.dto'

// Espejo de nutricionista-virtual-back/src/modules/consultation/dto/goal-feasibility.dto.ts
// (POST /api/v1/consultations/goal-feasibility, CU-CON-03).

export interface GoalFeasibilityRequestDto {
    goals: GoalsDto | null
    measurements: {
        weight: number
        height: number
    }
}

export type ProjectionGoal = 'definicion' | 'mantencion' | 'volumen'

export interface GoalFeasibilityDto {
    feasible: boolean
    goal: ProjectionGoal
    // Mensaje para el paciente cuando el objetivo no es factible; null si lo es.
    message: string | null
}
