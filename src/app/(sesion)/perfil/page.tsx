//icons
import { faUser } from '@fortawesome/free-solid-svg-icons'
//shared
import { Card, SubsectionHead, SubsectionBody } from '@/shared'
//features
import { IconSectionTitle, ProfileForm, ProfileService } from '@/features'

import { withSession } from '@/shared/auth/with-session'

export default async function PerfilPage() {
    const profile = await withSession(() => ProfileService.getProfile())

    return (
        <div className="w-[90%] flex flex-col mx-auto">
            {/* la card ocupa la mitad del ancho (todo en móvil), alineada a la izquierda */}
            <div className="w-full md:w-1/2">
                <Card widthInner="96%" variant="solid">
                    <SubsectionHead>
                        <IconSectionTitle icon={faUser} title="Mi perfil" />
                    </SubsectionHead>
                    <SubsectionBody>
                        <ProfileForm profile={profile} />
                    </SubsectionBody>
                </Card>
            </div>
        </div>
    )
}
