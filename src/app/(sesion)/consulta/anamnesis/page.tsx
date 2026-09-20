'use client'
//react
import { useEffect } from 'react'
//shared
import { Card, useConsultation } from '@/shared'
import { syncProfileAction } from '@/shared/auth/profile.actions'
//features
import { ChatAnamnesis } from '@/features'
//app
// import '../../globals.css'

export default function AnamnesisPage() {
    const { personalInfo, isHydrated, setPersonalInfo } = useConsultation()

    // Si el contexto local (localStorage) no tiene personalInfo pero el perfil del backend ya
    // está completo (ej. otro dispositivo, o se saltó informacion-personal desde consulta/inicio),
    // lo trae del backend para que evaluacion-fisica/generar-orden no se bloqueen más adelante.
    useEffect(() => {
        if (!isHydrated || personalInfo) return
        let cancelled = false

        syncProfileAction().then((result) => {
            if (cancelled || !result.ok || !result.data.profileComplete) return
            const profile = result.data
            setPersonalInfo({
                rut: profile.rut ? Number(profile.rut) : null,
                dvRut: profile.rutCheckDigit,
                firstName: profile.firstName,
                middleName: profile.middleName,
                paternalLastName: profile.paternalLastName,
                maternalLastName: profile.maternalLastName,
                gender: profile.gender,
                // No persistido por usuario (es por consulta, no por perfil) — ver doc/auth-pending.md.
                athlete: false,
                email: profile.email,
                dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
            })
        })

        return () => { cancelled = true }
    }, [isHydrated, personalInfo, setPersonalInfo])

    return (
        <div className='w-full py-4'>
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
