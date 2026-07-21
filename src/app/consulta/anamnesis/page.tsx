'use client'
//shared
import { Card } from '@/shared'
//features
import { ChatAnamnesis } from '@/features'
//app
// import '../../globals.css'

export default function AnamnesisPage() {
    return (
        <div className='w-full min-h-screen py-24'>
            <div className="max-w-2xl flex flex-col mx-auto" >
            <Card>
                <div className='py-8'>
                    <ChatAnamnesis/>
                </div>
            </Card>

            </div>
        </div>
    )
}
