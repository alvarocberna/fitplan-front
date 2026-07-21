//shared
import {GeneralCont, TitleSubSec, HeadSubSec, Card, BodySubSec} from '@/shared'
//feature
import {FormUserInfo} from '@/features'
//local
// import '../../globals.css'

export default function NuevoPaciente(){
    return(
        // <div className="w-full min-h-screen flex flex-col items-center justify-center text-center py-24">
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto" >
                <Card widthInner='80%'>
                    <HeadSubSec>
                        <TitleSubSec title="Información personal"/>
                    </HeadSubSec>
                    <BodySubSec>
                        <FormUserInfo/>
                    </BodySubSec>
                </Card>
            </div>
        </div>
    )
}