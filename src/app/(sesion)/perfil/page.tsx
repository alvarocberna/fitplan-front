//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features
import { ProfileForm, ProfileService } from '@/features'

export default async function PerfilPage() {
    const profile = await ProfileService.getProfile()

    return (
        <div className="w-[90%] flex flex-col mx-auto">
            <Card widthInner="80%" variant="solid">
                <SubsectionHead>
                    <SubsectionTitle title="Mi perfil" />
                </SubsectionHead>
                <SubsectionBody>
                    <ProfileForm profile={profile} />
                </SubsectionBody>
            </Card>
        </div>
    )
}
