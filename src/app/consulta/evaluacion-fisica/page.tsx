//shared
import {ProfessionalCont, TitleSec} from '@/shared'
//features
import {FormMediciones} from '@/features';
//app
import '../../globals.css'

export default function EvaluacionFisicaPage(){
    return(
        <ProfessionalCont>
            <TitleSec title="Evaluación Física"/>
            <FormMediciones/>
        </ProfessionalCont>
    )
}
