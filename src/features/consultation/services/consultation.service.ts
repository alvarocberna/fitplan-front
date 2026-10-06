//features - consulta
import {
    createOrderAction,
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
import { OrderStatusDto } from "../dtos/order.dto";
import { GoalFeasibilityDto, GoalFeasibilityRequestDto } from "../dtos/goal-feasibility.dto";

export class ConsultationService{

    //crea la orden de cobro (paymentStatus=PENDING) ANTES de generar el plan
    public static async createOrder(completeConsultation: CompleteConsultationDto): Promise<{ orderId: string }> {
        return unwrap(await createOrderAction(completeConsultation))
    }

    //llamado desde la pasarela de pago simulada (/pago/[orderId]). Golpea el mismo endpoint
    //que usaría el webhook real de una pasarela de pago una vez que se integre una.
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
