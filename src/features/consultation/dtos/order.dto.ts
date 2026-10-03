import { NutritionPlanDto } from '../../nutrition-plan/dtos/nutrition-plan.dto';

// Espejo de los enums del backend (enums nativos de Postgres, ver back/src/domain/entities/enums.ts).
// REJECTED: el último intento de pago fue rechazado (se puede reintentar). EXPIRED: venció el plazo
// de pago (24 h) sin pagarse; la orden ya no se puede pagar.
export const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const GenerationStatus = {
    NOT_STARTED: 'NOT_STARTED',
    GENERATING: 'GENERATING',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR',
} as const;
export type GenerationStatus = (typeof GenerationStatus)[keyof typeof GenerationStatus];

export interface OrderStatusDto {
    paymentStatus: PaymentStatus
    // hasta cuándo se puede pagar la orden (ISO); null en órdenes antiguas sin plazo
    expirationDate: string | null
    generationStatus: GenerationStatus
    planJson: NutritionPlanDto | null
    // URL firmada (corta duración) para DESCARGAR el PDF ya almacenado en S3 (el backend la firma con
    // Content-Disposition: attachment, por lo que no sirve para un <iframe>); null hasta que el plan
    // termine de generarse.
    pdfUrl: string | null
    // URL firmada (corta duración) de la miniatura WebP de la página 1 del plan; null si aún no hay
    // plan o si el plan no tiene miniatura (falló su rasterización, que es best-effort en el backend).
    thumbnailUrl: string | null
}
