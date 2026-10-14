//next
import { redirect } from 'next/navigation'
//shared
import {GeneralContainer, SubsectionTitle, SubsectionHead, Card, SubsectionBody} from '@/shared'
import { syncProfileAction } from '@/shared/auth/profile.actions'
//feature
import {FormUserInfo} from '@/features'
//local
// import '../../globals.css'

//?destino=inicio: se llegó desde un login "solo entrar" con el perfil incompleto (ver el callback de
//Cognito); al guardar vuelve a /inicio en vez de seguir con la consulta. Lista cerrada de destinos.
const NEXT_HREF_BY_DESTINO: Record<string, string> = { inicio: '/inicio' }
const DEFAULT_NEXT_HREF = '/consulta/anamnesis'

export default async function NewPatient({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}){
    const { destino } = await searchParams
    const nextHref = (typeof destino === 'string' && NEXT_HREF_BY_DESTINO[destino]) || DEFAULT_NEXT_HREF
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
                        <FormUserInfo profile={profile} nextHref={nextHref}/>
                    </SubsectionBody>
                </Card>
            </div>
        </div>
    )
}
