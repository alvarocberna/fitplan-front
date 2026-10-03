//next
import { redirect } from 'next/navigation'
//shared
import {GeneralContainer, SubsectionTitle, SubsectionHead, Card, SubsectionBody} from '@/shared'
import { syncProfileAction } from '@/shared/auth/profile.actions'
//feature
import {FormUserInfo} from '@/features'
//local
// import '../../globals.css'

export default async function NewPatient(){
    const result = await syncProfileAction()
    //sesión vencida: no tiene sentido mostrar un formulario que no se va a poder guardar
    if (!result.ok && result.code === 'unauthenticated') redirect('/login?error=session_expired')
    const profile = result.ok ? result.data : null

    return(
        // <div className="w-full min-h-screen flex flex-col items-center justify-center text-center py-24">
        <div className='w-full py-4'>
            <div className="max-w-2xl flex flex-col mx-auto" >
                <Card widthInner='80%' variant='solid'>
                    <SubsectionHead>
                        <SubsectionTitle title="Información personal"/>
                    </SubsectionHead>
                    <SubsectionBody>
                        <FormUserInfo profile={profile}/>
                    </SubsectionBody>
                </Card>
            </div>
        </div>
    )
}
