//features - consulta
import {
    createOrderAction,
    simulatePaymentAction,
    sendAnamnesisTurnAction,
    getOrderStatusAction,
    type ActionResult,
} from './consultation.actions'
import { CompleteConsultationDto } from "../dtos/consultation.dto";
import { InputChatDto, OutputChatDto } from "../dtos/anamnesis-chat.dto";
import { OrderStatusDto } from "../dtos/order.dto";

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw new Error(result.message)
    return result.data
}

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

    public static async sendAnamnesisTurn( data: InputChatDto ): Promise<OutputChatDto> {
        return unwrap(await sendAnamnesisTurnAction(data))
    }

    public static async getOrderStatus(orderId: string): Promise<OrderStatusDto> {
        return unwrap(await getOrderStatusAction(orderId))
    }

}
