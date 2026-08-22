//shared
import {GeneralContainer, SubsectionTitle, SubsectionHead, Card, SubsectionBody} from '@/shared'
//feature
import {FormUserInfo} from '@/features'
//local
// import '../../globals.css'

export default function NewPatient(){
    return(
        // <div className="w-full min-h-screen flex flex-col items-center justify-center text-center py-24">
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto" >
                <Card widthInner='80%'>
                    <SubsectionHead>
                        <SubsectionTitle title="Información personal"/>
                    </SubsectionHead>
                    <SubsectionBody>
                        <FormUserInfo/>
                    </SubsectionBody>
                </Card>
            </div>
        </div>
    )
}