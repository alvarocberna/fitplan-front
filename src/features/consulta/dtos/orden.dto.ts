import { PlanNutricionalDto } from '../../plan-nutricional/dtos/plan-nutricional.dto';

export type EstadoPago = 'pendiente' | 'pagado';
export type EstadoGeneracion = 'no_iniciado' | 'generando' | 'completado' | 'error';

export interface EstadoOrdenDto {
    estado_pago: EstadoPago
    estado_generacion: EstadoGeneracion
    plan_json: PlanNutricionalDto | null
}
