
import { apiFetch } from "../../../shared/api/client"
import { ConsultaCompletaDto } from "../dtos/consulta-completa.dto";
import { InputChatDto, OutputChatDto } from "../dtos/anamnesis-chat.dto";
import { PlanNutricionalDto } from "../dtos/plan-nutricional.dto";

export class ConsultaService{

    public static async enviarTurnoAnamnesis(
        data: InputChatDto
    ): Promise<OutputChatDto> {
        return apiFetch<OutputChatDto>('anamnesis/chat', 'POST', data)
    }

    public static async procesarConsulta(data: ConsultaCompletaDto): Promise<PlanNutricionalDto>{
        return apiFetch<PlanNutricionalDto>('consulta/procesar', 'POST', data)
    }

}