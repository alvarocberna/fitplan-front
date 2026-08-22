//shared
import { apiFetch } from "../../../shared/api/client"
//features - consulta
import { CompleteConsultationDto } from "../dtos/consultation.dto";
import { InputChatDto, OutputChatDto } from "../dtos/anamnesis-chat.dto";
import { OrderStatusDto } from "../dtos/order.dto";

export class ConsultationService{

    //crea la orden de cobro (paymentStatus='pendiente') ANTES de generar el plan
    public static async createOrder(completeConsultation: CompleteConsultationDto): Promise<{ orderId: string }> {
        return apiFetch<{ orderId: string }>('ordenes/crear', 'POST', completeConsultation )
    }

    //llamado desde la pasarela de pago simulada (/payment/[orderId]). Golpea el mismo endpoint
    //que usaría el webhook real de una pasarela de pago una vez que se integre una.
    public static async simulatePayment(orderId: string): Promise<{ status: string }> {
        return apiFetch<{ status: string }>(`webhooks/ordenes/${orderId}/simular-pago`, 'POST')
    }

    public static async sendAnamnesisTurn( data: InputChatDto ): Promise<OutputChatDto> {
        return apiFetch<OutputChatDto>('consulta/chat', 'POST', data)
    }

    public static async getOrderStatus(orderId: string): Promise<OrderStatusDto> {
        return apiFetch<OrderStatusDto>(`ordenes/obtener-estado/${orderId}`, 'GET')
    }

}