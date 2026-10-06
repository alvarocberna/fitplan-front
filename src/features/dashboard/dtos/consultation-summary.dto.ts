// Espejo de ConsultationSummaryDto en el backend (GET /me/consultations)
// (nutricionista-virtual-back/src/modules/clinical/dto/consultation-summary.dto.ts).

// 'payment_rejected': el último intento de pago fue rechazado; se puede reintentar igual que 'awaiting_payment'.
export type ConsultationPlanStatus = 'awaiting_payment' | 'payment_rejected' | 'generating' | 'ready' | 'error';

export interface ConsultationPlanSummaryDto {
    planName: string;
    goal: string;
    dietRegimen: string;
    calorieIntake: number;
    proteinIntake: number;
    carbohydrateIntake: number;
    lipidIntake: number;
}

export interface ConsultationSummaryDto {
    consultationId: string;
    consultationNumber: number;
    consultationDate: string; // ISO
    mainGoal: string | null;
    // null solo si la consulta no tiene orden asociada.
    planStatus: ConsultationPlanStatus | null;
    orderId: string | null;
    plan: ConsultationPlanSummaryDto | null;
}
