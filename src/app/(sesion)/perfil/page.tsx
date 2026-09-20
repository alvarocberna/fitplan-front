//shared
import { Card, SubsectionHead, SubsectionTitle, SubsectionBody } from '@/shared'
//features
import { ProfileForm, ProfileService } from '@/features'

export default async function PerfilPage() {
    const profile = await ProfileService.getProfile()

    return (
        <div className="max-w-2xl flex flex-col mx-auto px-4">
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
