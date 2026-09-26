import { NutritionPlanDto } from '../../nutrition-plan/dtos/nutrition-plan.dto';

// Espejo de los enums del backend (enums nativos de Postgres, ver back/src/domain/entities/enums.ts).
export const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
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

// Ítem del listado de órdenes con plan generado del usuario autenticado (GET /ordenes).
export interface OrderSummaryDto {
    orderId: string
    creationDate: string
    // URL firmada (corta duración) para DESCARGAR el PDF: el backend la firma con
    // Content-Disposition: attachment, por lo que no sirve para incrustarla en un <iframe>.
    pdfUrl: string
    // URL firmada (corta duración) de la miniatura WebP de la página 1 del plan; null si el plan no
    // tiene miniatura (generado antes de esta función, o falló su rasterización).
    thumbnailUrl: string | null
}
