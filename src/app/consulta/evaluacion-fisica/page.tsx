//shared
import {GeneralCont, TitleSec} from '@/shared'
//features
import {FormMediciones} from '@/features';
//app
import '../../globals.css'

export default function EvaluacionFisicaPage(){
    return(
        <GeneralCont>
            <div className='w-[60%] mx-auto'>
                <FormMediciones/>
            </div>
        </GeneralCont>
    )
}
