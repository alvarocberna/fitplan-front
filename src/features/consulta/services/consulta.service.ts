//shared
import { apiFetch } from "../../../shared/api/client"
//features - consulta
import { ConsultaCompletaDto } from "../dtos/consulta-completa.dto";
import { InputChatDto, OutputChatDto } from "../dtos/anamnesis-chat.dto";
//features - plan nutricional
import { PlanNutricionalDto } from "../../plan-nutricional/dtos/plan-nutricional.dto";

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