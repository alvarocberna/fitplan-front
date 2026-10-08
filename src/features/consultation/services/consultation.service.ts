//features - consulta
import {
    createOrderAction,
    startPaymentAction,
    simulatePaymentAction,
    simulatePaymentRejectionAction,
    sendAnamnesisTurnAction,
    getOrderStatusAction,
    evaluateGoalFeasibilityAction,
} from './consultation.actions'
//shared
import { unwrap } from '@/shared/api/unwrap'
import { CompleteConsultationDto } from "../dtos/consultation.dto";
import { InputChatDto, OutputChatDto } from "../dtos/anamnesis-chat.dto";
import { OrderStatusDto, StartPaymentDto } from "../dtos/order.dto";
import { GoalFeasibilityDto, GoalFeasibilityRequestDto } from "../dtos/goal-feasibility.dto";

export class ConsultationService{

    //crea la orden de cobro (paymentStatus=PENDING) ANTES de generar el plan
    public static async createOrder(completeConsultation: CompleteConsultationDto): Promise<{ orderId: string }> {
        return unwrap(await createOrderAction(completeConsultation))
    }

    //inicia el pago en Webpay (/pago/[orderId]): devuelve la URL del formulario y el token a enviarle
    public static async startPayment(orderId: string): Promise<StartPaymentDto> {
        return unwrap(await startPaymentAction(orderId))
    }

    //pago simulado (solo desarrollo y pruebas): marca la orden como pagada sin pasar por Webpay
    public static async simulatePayment(orderId: string): Promise<{ status: string }> {
        return unwrap(await simulatePaymentAction(orderId))
    }

    //pasarela simulada: el pago fue rechazado (la orden queda reintentable hasta que expire)
    public static async simulatePaymentRejection(orderId: string): Promise<{ status: string }> {
        return unwrap(await simulatePaymentRejectionAction(orderId))
    }

    public static async sendAnamnesisTurn( data: InputChatDto ): Promise<OutputChatDto> {
        return unwrap(await sendAnamnesisTurnAction(data))
    }

    public static async getOrderStatus(orderId: string): Promise<OrderStatusDto> {
        return unwrap(await getOrderStatusAction(orderId))
    }

    //al terminar la evaluación física: ¿el objetivo es alcanzable según el estado nutricional?
    public static async evaluateGoalFeasibility(data: GoalFeasibilityRequestDto): Promise<GoalFeasibilityDto> {
        return unwrap(await evaluateGoalFeasibilityAction(data))
    }

}
