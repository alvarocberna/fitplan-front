//shared
import {GeneralCont, TitleSec, TitleSubSec, HeadSubSec, Card, BodySubSec} from '@/shared'
//feature
import {FormUserInfo} from '@/features'
//local
import '../../globals.css'

export default function NuevoPaciente(){
    return(
        <GeneralCont>
            <div className='mx-auto w-[60%]'>
            <Card>
                <HeadSubSec>
                    <div className='w-[90%] m-auto'>
                        <TitleSubSec title="Información personal"/>
                    </div>
                </HeadSubSec>
                <BodySubSec>
                    <FormUserInfo/>
                </BodySubSec>
                <div className='h-[40px]'></div>
            </Card>
            </div>
        </GeneralCont>
    )
}