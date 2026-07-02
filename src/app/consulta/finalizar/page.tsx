//shared
import {ProfessionalCont, TitleSec} from '@/shared'
//features
import {GenerarPlanNutricional} from '@/features';
//app
import '../../globals.css'

export default function FinalizarConsultaPage(){
    return(
        <ProfessionalCont>
            <TitleSec title="Finalizar Consulta"/>
            <GenerarPlanNutricional/>
        </ProfessionalCont>
    )
}
