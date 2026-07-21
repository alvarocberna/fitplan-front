//shared
import {Card, HeadSubSec, TitleSubSec} from '@/shared'
//features
import {GenerarPlanNutricional} from '@/features';
//app
// import '../../globals.css'

export default function FinalizarConsultaPage(){
    return(
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto" >
                <Card>
                    <HeadSubSec>
                        <TitleSubSec mb={2} title="¡Finalizado!"/>
                        <p className="text-zinc-900 text-md">
                        Solo falta el pago
                        </p>
                    </HeadSubSec>
                    <GenerarPlanNutricional/>
                </Card>
            </div>
        </div>
    )
}
