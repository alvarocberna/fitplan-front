//shared
import { apiFetch } from "../../../shared/api/client"
//features - consulta
import { ConsultaCompletaDto } from "../dtos/consulta-completa.dto";
import { InputChatDto, OutputChatDto } from "../dtos/anamnesis-chat.dto";
import { EstadoOrdenDto } from "../dtos/orden.dto";
//features - plan nutricional
import { PlanNutricionalDto } from "../../plan-nutricional/dtos/plan-nutricional.dto";

export class ConsultaService{

    //crea la orden de cobro (estado_pago='pendiente') ANTES de generar el plan 
    public static async crearOrden(consultaCompleta: ConsultaCompletaDto): Promise<{ orden_id: string }> {
        return apiFetch<{ orden_id: string }>('ordenes/crear', 'POST', consultaCompleta )
    }
    
    //llamado desde la pasarela de pago simulada (/pago/[ordenId]). Golpea el mismo endpoint
    //que usaría el webhook real de una pasarela de pago una vez que se integre una.
    public static async simularPago(ordenId: string): Promise<{ estado: string }> {
        return apiFetch<{ estado: string }>(`webhooks/ordenes/${ordenId}/simular-pago`, 'POST')
    }

    public static async enviarTurnoAnamnesis( data: InputChatDto ): Promise<OutputChatDto> {
        return apiFetch<OutputChatDto>('consulta/chat', 'POST', data)
    }

    public static async obtenerEstadoOrden(ordenId: string): Promise<EstadoOrdenDto> {
        return apiFetch<EstadoOrdenDto>(`ordenes/obtener-estado/${ordenId}`, 'GET')
    }

}