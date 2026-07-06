'use client'
//shared
import { GeneralCont, Card } from '@/shared'
//features
import { ChatAnamnesis } from '@/features'
//app
import '../../globals.css'

export default function AnamnesisPage() {
    return (
        <GeneralCont>
            <div className='w-[60%] mx-auto'>
            <Card>
                <div className='py-8'>
                    <ChatAnamnesis/>
                </div>
            </Card>

            </div>
        </GeneralCont>
    )
}
