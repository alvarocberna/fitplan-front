// Espejo de ConsultationDetailDto en el backend (GET /me/consultations/:consultationId)
// (nutricionista-virtual-back/src/modules/clinical/dto/consultation-detail.dto.ts).
import type { ConsultationPlanStatus, ConsultationPlanSummaryDto } from './consultation-summary.dto';

// Medición tomada en la consulta: datos básicos y resultados guardados (null si no se calcularon).
export interface ConsultationMeasurementDto {
    measurementId: string;
    measurementNumber: number;
    measuredAt: string; // ISO
    level: 'BASIC' | 'ISAK_1' | 'BIOIMPEDANCE' | null;
    basic: {
        weight: number;
        height: number;
        sittingHeight: number | null;
        armSpan: number | null;
    } | null;
    results: {
        bmi: number | null;
        bmiClassification: string | null;
        bfPercentage: number | null;
        bfClassification: string | null;
    } | null;
}

export interface ConsultationDetailDto {
    consultationId: string;
    consultationNumber: number;
    consultationDate: string; // ISO
    goals: { mainGoal: string | null; secondaryGoals: string[] };
    planStatus: ConsultationPlanStatus | null;
    orderId: string | null;
    measurements: ConsultationMeasurementDto[];
    // pdfUrl: URL firmada (corta duración) de descarga del PDF; null si la orden todavía no tiene PDF.
    plan: (ConsultationPlanSummaryDto & { orderId: string; pdfUrl: string | null }) | null;
}
