'use client'
//shared
import { ProfessionalCont, TitleSec } from '@/shared'
//features
import { ChatAnamnesis } from '@/features'
//app
import '../../globals.css'

export default function AnamnesisPage() {
    return (
        <ProfessionalCont>
            <TitleSec title="Anamnesis"/>
            <ChatAnamnesis/>
        </ProfessionalCont>
    )
}
