import { NutritionPlanDto } from '../../nutrition-plan/dtos/nutrition-plan.dto';

export type PaymentStatus = 'pendiente' | 'pagado';
export type GenerationStatus = 'no_iniciado' | 'generando' | 'completado' | 'error';

export interface OrderStatusDto {
    paymentStatus: PaymentStatus
    generationStatus: GenerationStatus
    planJson: NutritionPlanDto | null
    // URL firmada (corta duración) del PDF ya almacenado en S3; null hasta que el plan termine de generarse.
    pdfUrl: string | null
}

// Ítem del listado de órdenes con plan generado del usuario autenticado (GET /ordenes).
export interface OrderSummaryDto {
    orderId: string
    creationDate: string
    pdfUrl: string
}
