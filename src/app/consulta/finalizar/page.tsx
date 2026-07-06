//shared
import {GeneralCont, Card} from '@/shared'
//features
import {GenerarPlanNutricional} from '@/features';
//app
import '../../globals.css'

export default function FinalizarConsultaPage(){
    return(
        <GeneralCont>
            <div className='w-[60%] mx-auto'>
                <Card>
                    <div className='py-12'>
                        <p className="text-xl md:text-2xl font-semibold text-gray-900">
                            ¡Todo listo!
                        </p>
                        <p className="text-base md:text-lg text-gray-700">
                            Tu plan nutricoinal está listo, solo falta realizar el pago etc...
                        </p>  
                    <GenerarPlanNutricional/>
                    </div>
                </Card>
            </div>
        </GeneralCont>
    )
}
