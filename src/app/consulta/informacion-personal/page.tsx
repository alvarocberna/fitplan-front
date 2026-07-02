//shared
import {ProfessionalCont, TitleSec, TitleSubSec, HeadSubSec, ContSubSec, BodySubSec} from '@/shared'
//feature
import {FormUserInfo} from '@/features'
//local
import '../../globals.css'

export default function NuevoPaciente(){
    return(
        <ProfessionalCont>
            <TitleSec title="Registro"/>
            <ContSubSec>
                <HeadSubSec>
                    <div className='w-[90%] m-auto'>
                        <TitleSubSec title="Nuevo Paciente"/>
                    </div>
                </HeadSubSec>
                <BodySubSec>
                    <FormUserInfo/>
                </BodySubSec>
                <div className='h-[40px]'></div>
            </ContSubSec>
        </ProfessionalCont>
    )
}