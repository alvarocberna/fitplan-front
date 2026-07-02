
import { apiFetch } from "../../../shared/api/client"
import { ConsultaCompletaDto } from "../dtos/consulta-completa.dto";
import { AnamnesisChat_RequestDto, AnamnesisChat_ResponseDto } from "../dtos/anamnesis-chat.dto";
import { PlanNutricionalDto } from "../dtos/plan-nutricional.dto";

export class ConsultaService{

    public static async enviarTurnoAnamnesis(
        data: AnamnesisChat_RequestDto
    ): Promise<AnamnesisChat_ResponseDto> {
        return apiFetch<AnamnesisChat_ResponseDto>('anamnesis/chat', 'POST', data)
    }

    public static async procesarConsulta(data: ConsultaCompletaDto): Promise<PlanNutricionalDto>{
        return apiFetch<PlanNutricionalDto>('consulta/procesar', 'POST', data)
    }

}