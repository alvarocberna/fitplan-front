import { NutritionPlanDto } from '../../nutrition-plan/dtos/nutrition-plan.dto';

export type PaymentStatus = 'pendiente' | 'pagado';
export type GenerationStatus = 'no_iniciado' | 'generando' | 'completado' | 'error';

export interface OrderStatusDto {
    paymentStatus: PaymentStatus
    generationStatus: GenerationStatus
    planJson: NutritionPlanDto | null
}
